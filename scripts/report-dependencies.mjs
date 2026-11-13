import { readFileSync, appendFileSync } from 'node:fs';

const auditFile = process.argv[2] ?? 'dependency-audit.json';
let data;
try {
  data = JSON.parse(readFileSync(auditFile, 'utf8'));
} catch (error) {
  console.error('No fue posible leer el informe de npm audit:', error);
  process.exitCode = 2;
}

const levels = data?.metadata?.vulnerabilities;
const validLevels = levels && ['critical', 'high', 'moderate', 'low']
  .every((level) => Number.isInteger(levels[level]) && levels[level] >= 0);

if (!validLevels || data.error) {
  console.error('Auditoría inválida o incompleta; no se puede declarar ausencia de vulnerabilidades.');
  if (data?.error) console.error(JSON.stringify(data.error));
  process.exitCode = 2;
} else {
  const criticalOrHigh = levels.critical + levels.high;
  const summary = [
    '## Auditoría de dependencias de producción (npm)',
    'Avisos detectados, no equivalentes a explotación confirmada:',
    ...['critical', 'high', 'moderate', 'low'].map((level) => '- ' + level + ': ' + levels[level]),
    '',
    criticalOrHigh
      ? 'Acción requerida: evaluar y corregir ' + criticalOrHigh + ' aviso(s) de severidad alta o crítica.'
      : 'Sin avisos altos o críticos en esta ejecución.',
    'La auditoría del repositorio no confirma por sí sola la versión desplegada en producción.',
  ].join('\n') + '\n';
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  if (process.env.FAIL_ON_HIGH === 'true' && criticalOrHigh > 0) {
    console.error('Fallo de control: hay avisos altos o críticos de dependencias de producción.');
    process.exitCode = 1;
  }
}

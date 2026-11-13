import { readFileSync, appendFileSync } from 'node:fs';
import { formatProductionAudit } from './production-audit-report.mjs';

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
  const scope = process.env.AUDIT_SCOPE === 'all'
    ? 'todas las dependencias (incluye desarrollo)'
    : 'dependencias de producción';
  const summary = [
    '## Auditoría de ' + scope + ' (npm)',
    'Avisos detectados, no equivalentes a explotación confirmada:',
    ...['critical', 'high', 'moderate', 'low'].map((level) => '- ' + level + ': ' + levels[level]),
    '',
    criticalOrHigh
      ? 'Acción requerida: evaluar y corregir ' + criticalOrHigh + ' aviso(s) de severidad alta o crítica.'
      : 'Sin avisos altos o críticos en esta ejecución.',
    'La auditoría del repositorio no confirma por sí sola la versión desplegada en producción.',
  ].join('\n') + '\n';
  let detailed = '';
  if (process.env.AUDIT_SCOPE !== 'all') {
    try {
      detailed = '\n' + formatProductionAudit(data);
    } catch (error) {
      console.error('No fue posible detallar los paquetes de producción:', error);
      process.exitCode = 2;
    }
  }
  console.log(summary + detailed);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + detailed);
  if (process.env.FAIL_ON_HIGH === 'true' && criticalOrHigh > 0) {
    console.error('Fallo de control: hay avisos altos o críticos de dependencias de producción.');
    process.exitCode = 1;
  }
}

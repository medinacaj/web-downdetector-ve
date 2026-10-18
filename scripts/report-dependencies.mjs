import { readFileSync, appendFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('dependency-audit.json', 'utf8'));
const levels = data.metadata?.vulnerabilities || {};
const summary = [
  '## Auditoría de dependencias (npm)',
  'Severidades informadas por npm, sujetas a corroboración: ',
  ...['critical','high','moderate','low'].map(k => '- '+k+': '+(levels[k] ?? 'no informado')),
  '',
  'No confundir un aviso de dependencia con explotación confirmada.',
  'Revisar la versión afectada, ruta de uso real, aviso oficial y actualización compatible antes de cerrar el hallazgo.'
].join('\n')+'\n';
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);

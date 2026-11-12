import { readFileSync, appendFileSync } from 'node:fs';
import { formatProductionAudit } from './production-audit-report.mjs';

// Fail on malformed npm audit JSON. A failed audit command is NOT a clean bill
// of health; npm audit's vulnerability exit code is distinct from JSON errors.
const audit=JSON.parse(readFileSync('dependency-audit.json','utf8'));
const report=formatProductionAudit(audit);
console.log(report);
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);

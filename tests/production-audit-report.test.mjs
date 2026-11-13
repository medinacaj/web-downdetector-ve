import test from 'node:test';
import assert from 'node:assert/strict';
import {formatProductionAudit} from '../scripts/production-audit-report.mjs';

test('lists production advisories with severity, range, and suggested resolution',()=>{
 const report=formatProductionAudit({
  metadata:{vulnerabilities:{critical:1,high:1,moderate:0,low:0}},
  vulnerabilities:{
   indirect:{severity:'high',isDirect:false,range:'<2.1.0',via:['direct'],fixAvailable:true},
   direct:{severity:'critical',isDirect:true,range:'<=1.0.0',via:[{name:'advisory'}],fixAvailable:{name:'direct',version:'2.0.0'}}
  }
 });
 assert.match(report,/\*\*critical\*\*: 1/);
 assert.match(report,/\| direct \| critical \| Sí \| <=1.0.0 \| advisory \| direct@2.0.0 \|/);
 assert.match(report,/\| indirect \| high \| No \| <2.1.0 \| direct \| Disponible \(npm\) \|/);
 assert.ok(report.indexOf('| direct |')<report.indexOf('| indirect |'));
});

test('fails closed on incomplete audit JSON rather than calling it safe',()=>{
 assert.throws(()=>formatProductionAudit({error:{code:'ELOCKVERIFY'}}),/incompleto/);
 assert.throws(()=>formatProductionAudit(null),/incompleto/);
});

test('escapes Markdown injection in advisory fields',()=>{
 const report=formatProductionAudit({metadata:{vulnerabilities:{}},vulnerabilities:{
  'unsafe|pkg':{severity:'low',isDirect:true,range:'v1|v2',via:['a\nmalicious'],fixAvailable:false}
 }});
 assert.match(report,/unsafe pkg/);
 assert.doesNotMatch(report,/unsafe\|pkg|a\nmalicious/);
});

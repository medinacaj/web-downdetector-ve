// Ensayo HTTP local con autocannon opcional, base nueva de fixtures y limpieza de sus recursos.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const net = require('node:net');
const { spawn, spawnSync, execFileSync } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const { performance } = require('node:perf_hooks');
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { validateSourceURL, cleanupResources } = require('./smoke-migrations.cjs');

function percentile(values, percent) {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b) => a-b);
  return +sorted[Math.max(0, Math.ceil(sorted.length * percent / 100) - 1)].toFixed(2);
}
function summarize(values) {
  return { count: values.length, p50: percentile(values,50), p95: percentile(values,95), p99: percentile(values,99), max: values.length ? +values.reduce((max,value)=>Math.max(max,value),0).toFixed(2) : null };
}
function readNumber(file) { try { return Number(fs.readFileSync(file,'utf8').trim()); } catch { return null; } }
function processSample(pid) {
  try {
    const text = fs.readFileSync(`/proc/${pid}/stat`,'utf8');
    const parts = text.slice(text.lastIndexOf(')')+2).split(' ');
    return { ticks: Number(parts[11])+Number(parts[12]), rssBytes: Number(parts[21])*4096 };
  } catch { return null; }
}
async function freePort() {
  const listener=net.createServer();
  await new Promise((resolve,reject)=>{listener.once('error',reject);listener.listen(0,'127.0.0.1',resolve);});
  const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));return port;
}
function validBody(route, status, body) {
  try {
    if (status !== (route === '/api/reports' ? 201 : 200)) return false;
    if (!route.startsWith('/api/')) return body.includes('PulsoVE') && body.includes('<html');
    const result=JSON.parse(body);
    if (route === '/api/reports') return typeof result.data?.id === 'string';
    if (route.startsWith('/api/services/movistar/status')) return typeof result.data?.status === 'string';
    if (route.startsWith('/api/services')) return Array.isArray(result.data) && result.data.length > 0;
    if (route === '/api/statistics') return result.data?.totals?.services === 71;
    return Array.isArray(result.data) && result.data.length === 24;
  } catch { return false; }
}

async function main() {
  const source=validateSourceURL(process.env.DATABASE_URL || 'http://invalid');
  const soakSeconds=Number(process.env.LOAD_SOAK_SECONDS || 600);
  if (!Number.isInteger(soakSeconds) || soakSeconds < 60 || soakSeconds > 14400) throw new Error('LOAD_SOAK_SECONDS debe ser entero entre 60 y 14400.');
  const autocannon=require('autocannon');
  const runId=crypto.randomBytes(8).toString('hex');
  const out=path.join(process.cwd(),'.runtime','load-tests',runId);fs.mkdirSync(out,{recursive:true});
  process.once('exit',code=>{try{fs.writeFileSync(path.join(out,'exit.json'),JSON.stringify({code},null,2));}catch{/* No reemplazar el error original si falla el disco. */}});
  const adminUrl=new URL(source);adminUrl.pathname='/postgres';
  const target=`pulsove_load_${runId}_test`;
  const fixtureUrl=new URL(source);fixtureUrl.pathname='/'+target;
  const admin=postgres(adminUrl.href,{max:1,connect_timeout:5,connection:{statement_timeout:5000},onnotice:()=>{}});
  let fixture,server,created=false,active,failed=false,failure,stopReason,workerTimer,workerProcess,workerDone;
  let applicationLog='';let sequence=0;
  const phases=[];const resources=[];const progress=[];
  let currentPhase='setup';let monitorBusy=false;let workerRun;
  const started=Date.now();const clockTicks=Number(execFileSync('getconf',['CLK_TCK'],{encoding:'utf8'}).trim());
  let priorSample;let monitor;
  const stop=()=>{stopReason='operator_interrupted';active?.stop();};
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
  const artifact=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
    runId, sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
    startedAt:new Date(started).toISOString(),executionMeaning:'completed means finished, not passed',machine:{node:process.version,cpus:os.availableParallelism(),cpuMax:fs.readFileSync('/sys/fs/cgroup/cpu.max','utf8').trim(),memoryMax:readNumber('/sys/fs/cgroup/memory.max')},
    generator:{name:'autocannon',version:require('autocannon/package.json').version,pipelining:1,timeoutSec:10},
    dataset:{seedReports:20000,services:71,states:24}, limitations:['HTTP sin navegador/TLS/CDN/Turnstile/Redis','Generador, web y PostgreSQL comparten máquina','Pipelining 1; concurrencia es conexiones, no usuarios humanos','Nuevos reportantes ficticios; cuotas por identidad no se eluden en el código de aplicación'],
    phases,resources,progress,workerRun,status:failed?'failed':'running',
  },null,2));
  try {
    await admin`create database ${admin(target)}`;created=true;
    fixture=postgres(fixtureUrl.href,{max:1,connect_timeout:5,connection:{statement_timeout:5000},onnotice:()=>{}});
    await migrate(drizzle(fixture),{migrationsFolder:path.join(process.cwd(),'drizzle')});
    const childEnv={...process.env,DATABASE_URL:fixtureUrl.href,ANONYMIZATION_SALT:'LOAD_TEST_ONLY_NOT_FOR_REAL_TRAFFIC_12345678901234567890',ENABLE_TURNSTILE:'false',ENABLE_TECHNICAL_CHECKS:'false',REDIS_URL:'',TRUSTED_CLIENT_IP_HEADER:'',PUBLIC_INDEXABLE:'false',SITE_URL:''};
    const seed=spawnSync(process.execPath,[path.join(process.cwd(),'node_modules/tsx/dist/cli.mjs'),'scripts/seed.ts'],{env:childEnv,encoding:'utf8',timeout:60000});
    if(seed.status!==0)throw new Error('Falló la carga de catálogo ficticio.');
    await fixture`with svc as (
      select row_number() over(order by s.slug) rn, s.id,
       (select i.id from issue_types i where i.category_id=s.category_id or i.category_id is null order by (i.category_id is null),i.slug limit 1) issue_id from services s
     ), regions as(select row_number() over(order by code) rn,id from states)
     insert into reports(service_id,issue_type_id,state_id,anonymous_hash,ip_prefix_hash,confidence,created_at)
     select s.id,s.issue_id,r.id,lpad(to_hex(g),64,'0'),repeat('0',64),0.45,now()-(g % 21600)*interval '1 second'
     from generate_series(1,20000) g join svc s on s.rn=1+(g-1)%71 join regions r on r.rn=1+(g-1)%24`;
    await fixture`analyze`;
    const port=await freePort();const origin=`http://127.0.0.1:${port}`;
    assert.equal(new URL(origin).hostname,'127.0.0.1');
    server=spawn(process.execPath,[path.join(process.cwd(),'.next/standalone/server.js')],{env:{...childEnv,HOSTNAME:'127.0.0.1',PORT:String(port)},stdio:['ignore','pipe','pipe']});
    server.stdout.on('data',chunk=>{applicationLog=(applicationLog+chunk).slice(-262144);});
    server.stderr.on('data',chunk=>{applicationLog=(applicationLog+chunk).slice(-262144);});
    let ready=false;
    for(let i=0;i<40;i++){
      if(server.exitCode!==null||server.signalCode!==null)throw new Error('El servidor de carga terminó al iniciar.');
      try{if((await fetch(origin+'/api/health',{signal:AbortSignal.timeout(3000)})).status===200){ready=true;break;}}catch{/* esperar arranque */}
      await delay(250);
    }
    assert.ok(ready,'La instancia de producción local no está lista. Ejecutar npm run build.');
    monitor=setInterval(async()=>{
      if(monitorBusy)return;monitorBusy=true;
      try{
        const now=performance.now(),sample=processSample(server.pid);
        const activity=await fixture`select count(*)::int as connections,count(*) filter(where state='active')::int as active from pg_stat_activity where datname=${target}`;
        resources.push({time:new Date().toISOString(),phase:currentPhase,rssMiB:sample?+(sample.rssBytes/1048576).toFixed(2):null,cpuPercent:sample&&priorSample?+((sample.ticks-priorSample.ticks)/clockTicks/((now-priorSample.time)/1000)*100).toFixed(2):null,cgroupMiB:readNumber('/sys/fs/cgroup/memory.current')/1048576,db:activity[0]});
        if(sample)priorSample={...sample,time:now};
        if(resources.at(-1).cgroupMiB > 24576){stopReason='memory_limit';active?.stop();}
      }catch(error){progress.push({time:new Date().toISOString(),event:'monitor_error',message:error.message});}
      finally{monitorBusy=false;}
    },2000);
    const routes=['/','/servicios','/servicios?category=telecomunicaciones','/servicios/movistar','/api/services?limit=20','/api/services?q=movistar','/api/map?hours=24','/api/statistics','/api/services/movistar/status','/api/reports'];
    async function phase(name,connections,duration,rate){
      if(stopReason)throw new Error('Ensayo detenido: '+stopReason);
      currentPhase=name;const startedAt=Date.now(),startClock=performance.now(),cpu=process.cpuUsage();
      const before=Number((await fixture`select count(*) from reports`)[0].count);
      const routeMetrics=Object.fromEntries(routes.map(route=>[route,{statuses:{},mismatches:0,latencies:[]} ]));
      const latency=[];let intervalLatencies=[],intervalCount=0;const samples=[];
      const tick=setInterval(()=>{
        samples.push({elapsedSec:(performance.now()-startClock)/1000,responses:intervalCount,...summarize(intervalLatencies)});
        intervalLatencies=[];intervalCount=0;
        console.log(JSON.stringify({event:'load_progress',phase:name,elapsedSec:Math.round((performance.now()-startClock)/1000),connections}));
        artifact();
      },30000);
      console.log(JSON.stringify({event:'phase_start',name,connections,duration,rate:rate||null}));
      let result;
      try{
        result=await new Promise((resolve,reject)=>{
          active=autocannon({url:origin,connections,duration,pipelining:1,timeout:10,overallRate:rate,
            requests:routes.map(route=>({method:route==='/api/reports'?'POST':'GET',path:route,
              setupRequest(request,context){context.start=performance.now();if(route==='/api/reports'){
                request.headers={'Content-Type':'application/json'};request.body=JSON.stringify({serviceSlug:'movistar',issueTypeSlug:'lentitud',stateCode:'VE-M',deviceSeed:`load_${runId}_${++sequence}`,comment:'Prueba de carga: fixture ficticia.'});
              }return request;},
              onResponse(status,body,context){const metric=routeMetrics[route];metric.statuses[status]=(metric.statuses[status]||0)+1;const ms=performance.now()-context.start;metric.latencies.push(ms);if(!validBody(route,status,body))metric.mismatches++;}
            }))},(error,value)=>error?reject(error):resolve(value));
          active.on('response',(_client,_status,_bytes,ms)=>{latency.push(ms);intervalLatencies.push(ms);intervalCount++;});
        });
      }finally{clearInterval(tick);active=undefined;}
      const cpuUsed=process.cpuUsage(cpu);
      const row={name,connections,configuredDurationSec:duration,targetRps:rate||null,startedAt:new Date(startedAt).toISOString(),durationSec:result.duration,responses:result.requests.total,rps:result.requests.average,latencyMs:summarize(latency),correctedLatency:result.latency,errors:result.errors,timeouts:result.timeouts,non2xx:result.non2xx,statuses:result.statusCodeStats,generatorCpuPercent:(cpuUsed.user+cpuUsed.system)/1e6/result.duration*100,routeMetrics:Object.fromEntries(Object.entries(routeMetrics).map(([r,m])=>[r,{statuses:m.statuses,mismatches:m.mismatches,latencyMs:summarize(m.latencies)}])),samples,rowsBefore:before};
      await delay(2000);
      row.rowsAfter=Number((await fixture`select count(*) from reports`)[0].count);
      phases.push(row);fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(result,null,2));artifact();
      console.log(JSON.stringify({event:'phase_done',name,rps:row.rps,p95:row.latencyMs.p95,p99:row.latencyMs.p99,errors:row.errors,non2xx:row.non2xx}));
      assert.ok(server.exitCode===null&&server.signalCode===null,'El servidor terminó durante carga.');
      if(stopReason)throw new Error('Ensayo detenido: '+stopReason);
      return row;
    }
    const warmup=await phase('warmup',2,15);
    if(warmup.errors||warmup.non2xx||Object.values(warmup.routeMetrics).some(m=>m.mismatches))throw new Error('El calentamiento detectó un flujo inválido; diagnosticar antes de aumentar carga.');
    await phase('baseline',5,30);
    const load=await phase('load',20,60);
    for(const connections of [40,80,160,256]){
      const row=await phase('stress_'+connections,connections,30);
      if(row.errors || row.non2xx || Object.values(row.routeMetrics).some(m=>m.mismatches) || row.latencyMs.p95>5000){progress.push({event:'stress_stop',connections,reason:'Errores o p95 superior a 5s; no incrementar más.'});break;}
    }
    await phase('recovery_after_stress',5,20);
    await phase('spike',128,20);
    await phase('recovery_after_spike',5,30);
    const soakRate=Math.max(5,Math.min(50,Math.floor(load.rps*0.5)));
    workerTimer=setTimeout(()=>{
      const startedAt=new Date().toISOString();
      const worker=workerProcess=spawn(process.execPath,[path.join(process.cwd(),'node_modules/tsx/dist/cli.mjs'),'scripts/aggregate-cron.ts','--completed'],{env:childEnv,stdio:['ignore','ignore','pipe']});
      let stderr='';worker.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-8192);});
      workerRun={startedAt,status:'running'};
      const deadline=setTimeout(()=>worker.kill('SIGKILL'),60000);
      workerDone=new Promise(resolve=>worker.on('exit',(code,signal)=>{clearTimeout(deadline);workerRun={startedAt,endedAt:new Date().toISOString(),code,signal,stderr};progress.push({event:'worker_done',code});resolve();}));
    },soakSeconds*500);
    await phase('soak',20,soakSeconds,soakRate);clearTimeout(workerTimer);
    if(workerDone)await workerDone;
    await phase('final_recovery',5,20);
    const count=Number((await fixture`select count(*) from reports`)[0].count);
    const acknowledged=phases.reduce((sum,p)=>sum+(p.routeMetrics['/api/reports'].statuses[201]||0),0);
    assert.ok(count>=20000+acknowledged,'Faltan escrituras que devolvieron 201.');
    progress.push({event:'aggregate_count_checked',seed:20000,acknowledged,actual:count,individualIdsVerified:false});
    artifact();
    const data=JSON.parse(fs.readFileSync(path.join(out,'results.json')));data.status='completed';data.observations={errorPhases:phases.filter(p=>p.errors||p.non2xx||Object.values(p.routeMetrics).some(m=>m.mismatches)).map(p=>p.name),workerSucceeded:workerRun?workerRun.code===0:null,individualIdsVerified:false};data.endedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(data,null,2));
    console.log('RESULTS_DIRECTORY='+out);
  }catch(error){failed=true;failure=error;artifact();}
  finally{
    clearInterval(monitor);clearTimeout(workerTimer);active?.stop();
    const errors=await cleanupResources([
      async()=>{if(workerProcess&&workerProcess.exitCode===null&&workerProcess.signalCode===null){workerProcess.kill('SIGKILL');if(workerDone)await workerDone;}},
      async()=>{if(server&&server.exitCode===null){server.kill('SIGTERM');const stopped=await Promise.race([new Promise(resolve=>server.once('exit',()=>resolve(true))),delay(3000).then(()=>false)]);if(!stopped)server.kill('SIGKILL');}},
      async()=>{if(fixture)await fixture.end({timeout:2});},
      async()=>{if(created)await admin`drop database ${admin(target)} with(force)`;},
      ()=>admin.end({timeout:2}),
      async()=>fs.writeFileSync(path.join(out,'application.log'),applicationLog),
    ]);
    try{const data=JSON.parse(fs.readFileSync(path.join(out,'results.json')));data.cleanup={status:errors.length?'failed':'completed',errorCount:errors.length};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(data,null,2));}catch(error){errors.push(error);}
    process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
    if(failed)throw failure;
    if(errors.length)throw new AggregateError(errors,'No se completó la limpieza del ensayo.');
  }
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={percentile,validBody};

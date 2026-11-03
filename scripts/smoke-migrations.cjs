// Ensayo local: crea y elimina exclusivamente bases temporales de fixtures. No usar producción.
const {createRequire}=require('node:module');
const req=createRequire(require('node:path').join(process.cwd(),'package.json'));
const postgres=req('postgres');
const {drizzle}=req('drizzle-orm/postgres-js');
const {migrate}=req('drizzle-orm/postgres-js/migrator');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
function validateSourceURL(input){
 const source=new URL(input);
 if(source.search || source.hash) throw new Error('Usar una URL sin parametros ni fragmentos.');
 if(!['127.0.0.1','localhost'].includes(source.hostname) || !source.pathname.endsWith('_test') || !['postgres:','postgresql:'].includes(source.protocol)) throw new Error('Requiere URL local de pruebas.');
 return source;
}
async function cleanupResources(tasks){
 const errors=[];
 for(const task of tasks){try{await task();}catch(error){errors.push(error);}}
 return errors;
}
async function main(){
 const root=process.cwd();
 const source=validateSourceURL(process.env.DATABASE_URL || 'http://invalid');
 const adminUrl=new URL(source);adminUrl.pathname='/postgres';
 const urlFor=name=>{const u=new URL(source);u.pathname='/'+name;return u.href;};
 const admin=postgres(adminUrl.href,{max:1});
 const suffix=require('node:crypto').randomBytes(5).toString('hex');
 const clean=`pulsove_clean_${suffix}_test`,dirty=`pulsove_dirty_${suffix}_test`;
 const folder=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'pulsove-migration-old.'));fs.mkdirSync(path.join(folder,'meta'));
 const journal=JSON.parse(fs.readFileSync(path.join(root,'drizzle/meta/_journal.json')));journal.entries=journal.entries.slice(0,2);
 fs.writeFileSync(path.join(folder,'meta/_journal.json'),JSON.stringify(journal));
 for(const e of journal.entries)fs.copyFileSync(path.join(root,'drizzle',e.tag+'.sql'),path.join(folder,e.tag+'.sql'));
 const created=[];
 let operationFailed=false, operationError;
 try{
  for(const name of [clean,dirty]){await admin`create database ${admin(name)}`;created.push(name);}
  const c=postgres(urlFor(clean),{max:1,onnotice:()=>{}});
  try{await migrate(drizzle(c),{migrationsFolder:path.join(root,'drizzle')});
   assert.equal(Number((await c`select count(*) from pg_constraint where connamespace='public'::regnamespace and contype='c'`)[0].count),9);
   assert.equal(Number((await c`select count(*) from drizzle.__drizzle_migrations`)[0].count),JSON.parse(fs.readFileSync(path.join(root,'drizzle/meta/_journal.json'))).entries.length);
   console.log('Instalación vacía: tres migraciones y nueve CHECK verificados.');
  }finally{await c.end();}
  const d=postgres(urlFor(dirty),{max:1,onnotice:()=>{}});
  try{await migrate(drizzle(d),{migrationsFolder:folder});
   const category=(await d`insert into categories(slug,name) values ('fixture','fixture') returning id`)[0].id;
   const service=(await d`insert into services(slug,name,category_id) values ('fixture','fixture',${category}) returning id`)[0].id;
   await d`insert into baselines(service_id,weekday,hour) values (${service},0,0),(${service},0,0)`;
   await assert.rejects(migrate(drizzle(d),{migrationsFolder:path.join(root,'drizzle')}),e=>String(e.cause?.message||e.message).includes('duplicados'));
   assert.equal(Number((await d`select count(*) from baselines`)[0].count),2);
   assert.equal(Number((await d`select count(*) from drizzle.__drizzle_migrations`)[0].count),2);
   assert.ok((await d`select to_regclass('public.baselines_unique_bucket') as name`)[0].name);
   console.log('Preflight: duplicados rechazados, dos filas conservadas e historial/índice anterior intactos.');
  }finally{await d.end();}
 }catch(error){operationFailed=true;operationError=error;}
 finally{
  const errors=await cleanupResources([
   ...created.map(name=>()=>admin`drop database ${admin(name)}`),
   ()=>admin.end(),
   async()=>fs.rmSync(folder,{recursive:true,force:true}),
  ]);
  if(operationFailed)throw operationError;
  if(errors.length)throw new AggregateError(errors,'No se pudieron limpiar todos los recursos temporales; revisar las bases ficticias.');
 }
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={validateSourceURL,cleanupResources};

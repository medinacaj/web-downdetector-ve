import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';

let client: ReturnType<typeof postgres>;
let serviceId: string;
let stateId: string;
let issueTypeId: string;
const rollbackMarker = new Error('ROLLBACK_FIXTURE');
beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('Usar exclusivamente una base ficticia cuyo nombre termine en _test.');
  client = postgres(url, { max: 1 });
  serviceId = (await client`select id from services where slug='movistar'`)[0].id;
  stateId = (await client`select id from states where code='VE-M'`)[0].id;
  issueTypeId = (await client`select id from issue_types where slug='lentitud'`)[0].id;
});
afterAll(async () => { if (client) await client.end(); });

async function rollback(run: (tx: postgres.TransactionSql) => Promise<void>) {
  try {
    await client.begin(async tx => { await run(tx); throw rollbackMarker; });
  } catch (error) { if (error !== rollbackMarker) throw error; }
}

describe('integridad PostgreSQL (fixtures revertidas)', () => {
  it.each([-0.1, 1.1, NaN, Infinity])('rechaza confianza inválida de reporte %s', async confidence => {
    await rollback(async tx => {
      await expect(tx`insert into reports(service_id,issue_type_id,state_id,anonymous_hash,ip_prefix_hash,confidence)
        values (${serviceId},${issueTypeId},${stateId},'fixture','fixture',${confidence})`)
        .rejects.toMatchObject({ code: '23514' });
    });
  });
  it.each([-1, 7])('rechaza día de línea base %s', async weekday => {
    await rollback(async tx => {
      await expect(tx`insert into baselines(service_id,weekday,hour) values (${serviceId},${weekday},0)`)
        .rejects.toMatchObject({ code: '23514' });
    });
  });
  it('impide duplicar una línea base nacional con estado NULL', async () => {
    await rollback(async tx => {
      await tx`delete from baselines where service_id=${serviceId} and state_id is null and weekday=0 and hour=0`;
      await tx`insert into baselines(service_id,weekday,hour) values (${serviceId},0,0)`;
      await expect(tx`insert into baselines(service_id,weekday,hour) values (${serviceId},0,0)`)
        .rejects.toMatchObject({ code: '23505' });
    });
  });
  it('impide duplicar una ventana nacional', async () => {
    await rollback(async tx => {
      await tx`insert into aggregated_windows(service_id,window_start,window_end) values (${serviceId},'2099-01-01T00:00:00Z','2099-01-01T00:15:00Z')`;
      await expect(tx`insert into aggregated_windows(service_id,window_start,window_end) values (${serviceId},'2099-01-01T00:00:00Z','2099-01-01T00:15:00Z')`)
        .rejects.toMatchObject({ code: '23505' });
    });
  });
  it('rechaza ventanas invertidas', async () => {
    await rollback(async tx => {
      await expect(tx`insert into aggregated_windows(service_id,window_start,window_end) values (${serviceId},'2099-01-01T00:15:00Z','2099-01-01T00:00:00Z')`)
        .rejects.toMatchObject({ code: '23514' });
    });
  });
  it('rechaza más identidades únicas que reportes', async () => {
    await rollback(async tx => {
      await expect(tx`insert into aggregated_windows(service_id,window_start,window_end,total_reports,unique_reporters)
        values (${serviceId},'2099-01-02T00:00:00Z','2099-01-02T00:15:00Z',1,2)`)
        .rejects.toMatchObject({ code: '23514' });
    });
  });
  it('acepta valores límite válidos y estados distintos', async () => {
    await rollback(async tx => {
      await tx`insert into reports(service_id,issue_type_id,state_id,anonymous_hash,ip_prefix_hash,confidence)
        values (${serviceId},${issueTypeId},${stateId},'fixture','fixture',0),(${serviceId},${issueTypeId},${stateId},'fixture','fixture',1)`;
      await tx`insert into baselines(service_id,state_id,weekday,hour) values (${serviceId},${stateId},6,23)`;
    });
  });
});

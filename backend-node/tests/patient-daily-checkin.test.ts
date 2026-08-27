import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const patientId = '00000000-0000-4000-8000-000000000002';
const env: AppEnv = { NODE_ENV:'test',PORT:3000,HOST:'127.0.0.1',DATABASE_URL:'postgres://test',DB_POOL_MAX:2,DB_CONNECTION_TIMEOUT_MS:10000,DB_IDLE_TIMEOUT_MS:10000,FRONTEND_ORIGIN:'http://localhost:5173',SESSION_COOKIE_NAME:'nutri_session',SESSION_TTL_HOURS:6,PASSWORD_RESET_TTL_MINUTES:30,PATIENT_INVITATION_TTL_HOURS:24,APP_URL:'http://localhost:5173',SMTP_PORT:587,SMTP_SECURE:false,SMTP_FROM:'test@example.com' };

function database(role: 'PATIENT' | 'ADMIN' = 'PATIENT', calls: { sql:string; params:unknown[] }[] = []) {
  return { query: async (sql:string, params:unknown[] = []) => {
    if (sql.includes('FROM sessions s')) return { rows:[{ user_id:'00000000-0000-4000-8000-000000000001', role, patient_id:role === 'PATIENT' ? patientId : null }] };
    calls.push({ sql, params });
    if (sql.includes('INSERT INTO patient_daily_checkins')) return { rows:[{ id:'00000000-0000-4000-8000-000000000003', checkinDate:'2026-08-27', feeling:params[1], reason:params[2], updatedAt:new Date() }] };
    return { rows:[] };
  }, connect:async()=>{ throw new Error('not needed'); }, end:async()=>{} };
}

test('patient records or updates only their own daily check-in', async () => {
  const calls:{sql:string;params:unknown[]}[]=[];
  const app=await buildApp(env,database('PATIENT',calls) as never);
  const response=await app.inject({method:'PUT',url:'/api/portal/daily-checkin',cookies:{nutri_session:'token'},payload:{feeling:'ADJUSTMENTS',reason:'Faltou tempo'}});
  assert.equal(response.statusCode,200);
  const write=calls.find(call=>call.sql.includes('INSERT INTO patient_daily_checkins'))!;
  assert.deepEqual(write.params,[patientId,'ADJUSTMENTS','Faltou tempo']);
  assert.match(write.sql,/ON CONFLICT\(patient_id,checkin_date\)/);
  await app.close();
});

test('daily check-in validates feeling and optional reason length', async () => {
  const calls:{sql:string;params:unknown[]}[]=[];
  const app=await buildApp(env,database('PATIENT',calls) as never);
  const invalid=await app.inject({method:'PUT',url:'/api/portal/daily-checkin',cookies:{nutri_session:'token'},payload:{feeling:'GREAT'}});
  assert.equal(invalid.statusCode,400);
  assert.equal(calls.some(call=>call.sql.includes('INSERT INTO patient_daily_checkins')),false);
  await app.close();
});

test('administrator cannot record a patient daily check-in', async () => {
  const app=await buildApp(env,database('ADMIN') as never);
  const response=await app.inject({method:'PUT',url:'/api/portal/daily-checkin',cookies:{nutri_session:'token'},payload:{feeling:'EASY'}});
  assert.equal(response.statusCode,403);
  await app.close();
});


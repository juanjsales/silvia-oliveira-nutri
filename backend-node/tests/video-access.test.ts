import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const env: AppEnv = { NODE_ENV:'test', PORT:3000, HOST:'127.0.0.1', DATABASE_URL:'postgres://test', DB_POOL_MAX:2, DB_CONNECTION_TIMEOUT_MS:10000, DB_IDLE_TIMEOUT_MS:10000, FRONTEND_ORIGIN:'http://localhost:5173', SESSION_COOKIE_NAME:'nutri_session', SESSION_TTL_HOURS:6, PASSWORD_RESET_TTL_MINUTES:30, APP_URL:'http://localhost:5173', SMTP_PORT:587, SMTP_SECURE:false, SMTP_FROM:'test@example.com' };
const patientId = '00000000-0000-4000-8000-000000000002';
const appointmentId = '00000000-0000-4000-8000-000000000003';
const sessionId = '00000000-0000-4000-8000-000000000004';

function db(appointment: Record<string, unknown>) {
  return { query: async (sql: string) => {
    if (sql.includes('FROM sessions s')) return { rows:[{ user_id:'00000000-0000-4000-8000-000000000001', role:'PATIENT', patient_id:patientId }] };
    if (sql.includes('FROM appointments a')) return { rows:[appointment] };
    if (sql.includes('INSERT INTO teleconsultation_sessions')) return { rows:[{ sessionId, state:'WAITING_PROFESSIONAL', expiresAt:new Date(Date.now() + 3600000) }] };
    return { rows:[] };
  }, connect:async () => { throw new Error('unused'); }, end:async () => {} };
}

const inject = (app: any) => app.inject({ method:'POST', url:`/api/video/appointments/${appointmentId}/access`, cookies:{ nutri_session:'token' } });

test('video access rejects appointment owned by another patient', async () => {
  const now = new Date();
  const app = await buildApp(env, db({ patientId:'00000000-0000-4000-8000-000000000099', status:'CONFIRMED', startsAt:now, endsAt:new Date(now.getTime()+3600000), videoRoomToken:'secret' }) as never);
  assert.equal((await inject(app)).statusCode, 404);
  await app.close();
});

test('video access rejects patient outside appointment window', async () => {
  const old = new Date(Date.now()-4*3600000);
  const app = await buildApp(env, db({ patientId, status:'CONFIRMED', startsAt:old, endsAt:new Date(old.getTime()+3600000), videoRoomToken:'secret' }) as never);
  assert.equal((await inject(app)).statusCode, 403);
  await app.close();
});

test('patient waits until the nutritionist starts the appointment', async () => {
  const now = new Date();
  const app = await buildApp(env, db({ patientId, status:'CONFIRMED', startsAt:new Date(now.getTime()-60000), endsAt:new Date(now.getTime()+3600000), videoRoomToken:'secret' }) as never);
  const response = await inject(app);
  assert.equal(response.statusCode, 403);
  assert.match(response.json().error, /nutricionista iniciar/);
  await app.close();
});

test('access issues an opaque fragment token without leaking role, name or canonical room', async () => {
  const now = new Date();
  const app = await buildApp(env, db({ patientId, patientName:'Paciente', status:'CONFIRMED', encounterStatus:'IN_PROGRESS', startsAt:new Date(now.getTime()-60000), endsAt:new Date(now.getTime()+3600000), videoRoomToken:'secret' }) as never);
  const response = await inject(app);
  assert.equal(response.statusCode, 200);
  const data = response.json().data;
  assert.equal(data.sessionId, sessionId);
  assert.match(data.roomUrl, /^\/videocall\.html#sessionId=/);
  assert.ok(data.joinToken.length >= 32);
  assert.doesNotMatch(data.roomUrl, /secret|role=|name=/);
  await app.close();
});

test('access rotates stale session credentials before issuing a new join token', async () => {
  const statements:string[]=[];
  const now=new Date();
  const database={query:async(sql:string)=>{
    statements.push(sql);
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'PATIENT',patient_id:patientId}]};
    if(sql.includes('FROM appointments a'))return{rows:[{patientId,patientName:'Paciente',status:'CONFIRMED',encounterStatus:'IN_PROGRESS',startsAt:new Date(now.getTime()-60000),endsAt:new Date(now.getTime()+3600000),videoRoomToken:'secret'}]};
    if(sql.includes('INSERT INTO teleconsultation_sessions'))return{rows:[{sessionId,state:'WAITING_PROFESSIONAL',expiresAt:new Date(now.getTime()+3600000),roomRotated:true}]};
    return{rows:[]};
  },connect:async()=>{throw new Error('unused')},end:async()=>{}};
  const app=await buildApp(env,database as never);
  assert.equal((await inject(app)).statusCode,200);
  const deleteIndex=statements.findIndex(sql=>sql.includes('DELETE FROM teleconsultation_join_tokens WHERE session_id'));
  const insertIndex=statements.findIndex(sql=>sql.includes('INSERT INTO teleconsultation_join_tokens'));
  assert.ok(deleteIndex>=0&&insertIndex>deleteIndex,'credenciais antigas devem ser removidas antes do novo convite');
  assert.ok(statements.some(sql=>sql.includes('ended_at=CASE')&&sql.includes('GREATEST(teleconsultation_sessions.expires_at')));
  await app.close();
});

test('patient teleconsultation acknowledgement is scoped and persisted before joining', async()=>{
  let persisted=false;
  const database={query:async(sql:string)=>{
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'PATIENT',patient_id:patientId}]};
    if(sql.includes('SELECT patient_id FROM appointments'))return{rows:[{patient_id:patientId}]};
    if(sql.includes('INSERT INTO teleconsultation_consents'))persisted=true;
    return{rows:[]};
  },connect:async()=>{throw new Error('unused')},end:async()=>{}};
  const app=await buildApp(env,database as never);
  const response=await app.inject({method:'POST',url:`/api/video/appointments/${appointmentId}/consent`,cookies:{nutri_session:'token'},payload:{acknowledged:true}});
  assert.equal(response.statusCode,200);
  assert.equal(response.json().data.acknowledged,true);
  assert.equal(persisted,true);
  await app.close();
});

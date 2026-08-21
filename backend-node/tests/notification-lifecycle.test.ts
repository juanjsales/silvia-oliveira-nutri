import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const env:AppEnv={NODE_ENV:'test',PORT:3000,HOST:'127.0.0.1',DATABASE_URL:'postgres://test',DB_POOL_MAX:2,DB_CONNECTION_TIMEOUT_MS:10000,DB_IDLE_TIMEOUT_MS:10000,FRONTEND_ORIGIN:'http://localhost:5173',SESSION_COOKIE_NAME:'nutri_session',SESSION_TTL_HOURS:6,PASSWORD_RESET_TTL_MINUTES:30,APP_URL:'http://localhost:5173',SMTP_PORT:587,SMTP_SECURE:false,SMTP_FROM:'test@example.com'};
const notificationId='00000000-0000-4000-8000-000000000004';

test('notification migration adds lifecycle, deduplication and a professional inbox',async()=>{
  const sql=await readFile(new URL('../src/database/migrations/032_notification_lifecycle.sql',import.meta.url),'utf8');
  assert.match(sql,/status text NOT NULL DEFAULT 'ACTIVE'/);
  assert.match(sql,/patient_notifications_active_dedupe_idx/);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS professional_notifications/);
  assert.match(sql,/title='🎥 Teleconsulta iniciada pela nutricionista'/);
});

test('professional read and archive actions are persisted',async()=>{
  const statements:string[]=[];
  const db={query:async(sql:string)=>{
    statements.push(sql);
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]};
    if(sql.includes('RETURNING id'))return{rows:[{id:notificationId}]};
    return{rows:[]};
  },connect:async()=>{throw new Error('unused')},end:async()=>{}};
  const app=await buildApp(env,db as never);
  assert.equal((await app.inject({method:'PATCH',url:`/api/notifications/${notificationId}/read`,cookies:{nutri_session:'token'}})).statusCode,204);
  assert.equal((await app.inject({method:'PATCH',url:`/api/notifications/${notificationId}/archive`,cookies:{nutri_session:'token'}})).statusCode,204);
  assert.ok(statements.some(sql=>sql.includes("status='ARCHIVED'")));
  await app.close();
});

test('video end resolves its patient call notification',async()=>{
  let resolved=false;
  const db={query:async(sql:string)=>{
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]};
    if(sql.includes('UPDATE teleconsultation_sessions SET state'))return{rows:[{sessionId:notificationId}]};
    if(sql.includes('FROM teleconsultation_sessions WHERE id='))return{rows:[{sessionId:notificationId,patientId:'00000000-0000-4000-8000-000000000002',state:'ENDED',professionalPresent:false,patientPresent:false,lastActivityAt:new Date(),endedAt:new Date(),endReason:'COMPLETED',expiresAt:new Date()}]};
    if(sql.includes('UPDATE patient_notifications n SET'))resolved=true;
    return{rows:[]};
  },connect:async()=>{throw new Error('unused')},end:async()=>{}};
  const app=await buildApp(env,db as never);
  const response=await app.inject({method:'POST',url:`/api/video/sessions/${notificationId}/end`,cookies:{nutri_session:'token'},payload:{reason:'COMPLETED'}});
  assert.equal(response.statusCode,200);
  assert.equal(resolved,true);
  await app.close();
});

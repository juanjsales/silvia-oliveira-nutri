import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const env:AppEnv={NODE_ENV:'test',PORT:3000,HOST:'127.0.0.1',DATABASE_URL:'postgres://test',DB_POOL_MAX:2,DB_CONNECTION_TIMEOUT_MS:10000,DB_IDLE_TIMEOUT_MS:10000,FRONTEND_ORIGIN:'http://localhost:5173',SESSION_COOKIE_NAME:'nutri_session',SESSION_TTL_HOURS:6,PASSWORD_RESET_TTL_MINUTES:30,PATIENT_INVITATION_TTL_HOURS:24,APP_URL:'http://localhost:5173',SMTP_PORT:587,SMTP_SECURE:false,SMTP_FROM:'test@example.com'};
const patientId='00000000-0000-4000-8000-000000000002';
const otherPatientId='00000000-0000-4000-8000-000000000099';
const appointmentId='00000000-0000-4000-8000-000000000003';

function database(ownerId:string,state:unknown=null){
  return {query:async(sql:string)=>{
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'PATIENT',patient_id:patientId}]};
    if(sql.includes('FULL OUTER JOIN appointments'))return{rows:[{broadcastId:appointmentId,patientId:ownerId}]};
    if(sql.includes('SELECT state FROM video_broadcasts'))return{rows:state?[{state}]:[]};
    return{rows:[]};
  },connect:async()=>{throw new Error('unused')},end:async()=>{}};
}

const get=(app:any)=>app.inject({method:'GET',url:`/api/video/appointments/${appointmentId}/broadcast`,cookies:{nutri_session:'token'}});

test('patient cannot read another patient broadcast',async()=>{
  const app=await buildApp(env,database(otherPatientId,{activeTab:'metas'}) as never);
  const response=await get(app);
  assert.equal(response.statusCode,404);
  await app.close();
});

test('patient can read own persisted broadcast',async()=>{
  const state={activeTab:'metas',updatedAt:new Date().toISOString()};
  const app=await buildApp(env,database(patientId,state) as never);
  const response=await get(app);
  assert.equal(response.statusCode,200);
  assert.deepEqual(response.json().data,state);
  await app.close();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const patientId='00000000-0000-4000-8000-000000000002';
const appointmentId='00000000-0000-4000-8000-000000000004';
const env:AppEnv={NODE_ENV:'test',PORT:3000,HOST:'127.0.0.1',DATABASE_URL:'postgres://test',DB_POOL_MAX:2,DB_CONNECTION_TIMEOUT_MS:10000,DB_IDLE_TIMEOUT_MS:10000,FRONTEND_ORIGIN:'http://localhost:5173',SESSION_COOKIE_NAME:'nutri_session',SESSION_TTL_HOURS:6,PASSWORD_RESET_TTL_MINUTES:30,PATIENT_INVITATION_TTL_HOURS:24,APP_URL:'http://localhost:5173',SMTP_PORT:587,SMTP_SECURE:false,SMTP_FROM:'test@example.com'};

test('patient check-in is always written with the patient from the authenticated session',async()=>{
 let insertedPatient='';
 const db={query:async(sql:string,params?:unknown[])=>{if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'PATIENT',patient_id:patientId}]};if(sql.includes("FROM appointments WHERE id=$1")&&sql.includes("status IN('CONFIRMED','WAITING')"))return{rows:[{id:appointmentId}]};if(sql.includes('INSERT INTO preconsult_checkins')){insertedPatient=String(params?.[0]);return{rows:[{id:'00000000-0000-4000-8000-000000000003'}]}}return{rows:[]}},connect:async()=>{throw new Error('not needed')},end:async()=>{}};
 const app=await buildApp(env,db as never);
 const response=await app.inject({method:'POST',url:'/api/portal/checkins',cookies:{nutri_session:'token'},payload:{appointmentId,answers:{mainDifficulty:'Organização das refeições',adherence:7}}});
 assert.equal(response.statusCode,201);
 assert.equal(insertedPatient,patientId);
 await app.close();
});

test('patient cannot submit a check-in for an unavailable appointment',async()=>{
 let inserted=false;
 const db={query:async(sql:string)=>{if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'PATIENT',patient_id:patientId}]};if(sql.includes('INSERT INTO preconsult_checkins'))inserted=true;return{rows:[]}},connect:async()=>{throw new Error('not needed')},end:async()=>{}};
 const app=await buildApp(env,db as never);
 const response=await app.inject({method:'POST',url:'/api/portal/checkins',cookies:{nutri_session:'token'},payload:{appointmentId,answers:{mainDifficulty:'Organização das refeições',adherence:7}}});
 assert.equal(response.statusCode,409);
 assert.equal(inserted,false);
 await app.close();
});

test('a submitted check-in is immutable',async()=>{
 const db={query:async(sql:string)=>{if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'PATIENT',patient_id:patientId}]};if(sql.includes("FROM appointments WHERE id=$1")&&sql.includes("status IN('CONFIRMED','WAITING')"))return{rows:[{id:appointmentId}]};return{rows:[]}},connect:async()=>{throw new Error('not needed')},end:async()=>{}};
 const app=await buildApp(env,db as never);
 const response=await app.inject({method:'POST',url:'/api/portal/checkins',cookies:{nutri_session:'token'},payload:{appointmentId,answers:{mainDifficulty:'Organização das refeições',adherence:7}}});
 assert.equal(response.statusCode,409);
 assert.match(response.json().error,/já foi enviado/);
 await app.close();
});

test('administrator cannot submit a patient check-in',async()=>{
 const db={query:async(sql:string)=>sql.includes('FROM sessions s')?{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]}:{rows:[]},connect:async()=>{throw new Error('not needed')},end:async()=>{}};
 const app=await buildApp(env,db as never);
 const response=await app.inject({method:'POST',url:'/api/portal/checkins',cookies:{nutri_session:'token'},payload:{answers:{mainDifficulty:'Teste'}}});
 assert.equal(response.statusCode,403);
 await app.close();
});

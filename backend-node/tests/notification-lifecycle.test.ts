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

test('notification failure does not prevent resuming an active encounter',async()=>{
  const patientId='00000000-0000-4000-8000-000000000002';
  const encounterId='00000000-0000-4000-8000-000000000003';
  const db={query:async(sql:string)=>{
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]};
    if(sql.includes('FROM patients WHERE id='))return{rows:[{id:patientId}]};
    if(sql.includes("FROM clinical_encounters WHERE patient_id=$1 AND status='IN_PROGRESS'"))return{rows:[{id:encounterId}]};
    if(sql.includes('INSERT INTO patient_notifications')){
      const error=Object.assign(new Error('notification schema unavailable'),{code:'42703'});
      throw error;
    }
    return{rows:[]};
  },connect:async()=>{throw new Error('unused')},end:async()=>{}};
  const app=await buildApp(env,db as never);
  const response=await app.inject({method:'POST',url:'/api/encounters',cookies:{nutri_session:'token'},payload:{patientId}});
  assert.equal(response.statusCode,200);
  assert.deepEqual(response.json(),{data:{id:encounterId,resumed:true}});
  await app.close();
});

test('notification failure does not roll back a newly started encounter response',async()=>{
  const patientId='00000000-0000-4000-8000-000000000002';
  const encounterId='00000000-0000-4000-8000-000000000003';
  const db={query:async(sql:string)=>{
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]};
    if(sql.includes('FROM patients WHERE id='))return{rows:[{id:patientId}]};
    if(sql.includes("FROM clinical_encounters WHERE patient_id=$1 AND status='IN_PROGRESS'"))return{rows:[]};
    if(sql.includes('INSERT INTO clinical_encounters'))return{rows:[{id:encounterId}]};
    if(sql.includes('INSERT INTO patient_notifications'))throw Object.assign(new Error('notification unavailable'),{code:'42703'});
    return{rows:[]};
  },connect:async()=>{throw new Error('unused')},end:async()=>{}};
  const app=await buildApp(env,db as never);
  const response=await app.inject({method:'POST',url:'/api/encounters',cookies:{nutri_session:'token'},payload:{patientId}});
  assert.equal(response.statusCode,201);
  assert.deepEqual(response.json(),{data:{id:encounterId,resumed:false}});
  await app.close();
});

test('opening a completed appointment never reactivates it',async()=>{
  const patientId='00000000-0000-4000-8000-000000000002';
  const appointmentId='00000000-0000-4000-8000-000000000005';
  const encounterId='00000000-0000-4000-8000-000000000003';
  const statements:string[]=[];
  const db={query:async(sql:string)=>{
    statements.push(sql);
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]};
    if(sql.includes('FROM patients WHERE id='))return{rows:[{id:patientId}]};
    if(sql.includes('FROM appointments WHERE id='))return{rows:[{id:appointmentId}]};
    if(sql.includes('FROM clinical_encounters WHERE appointment_id='))return{rows:[{id:encounterId,status:'COMPLETED'}]};
    return{rows:[]};
  },connect:async()=>{throw new Error('unused')},end:async()=>{}};
  const app=await buildApp(env,db as never);
  const response=await app.inject({method:'POST',url:'/api/encounters',cookies:{nutri_session:'token'},payload:{patientId,appointmentId}});
  assert.equal(response.statusCode,200);
  assert.deepEqual(response.json(),{data:{id:encounterId,resumed:true}});
  assert.equal(statements.some(sql=>sql.includes("UPDATE appointments SET status='IN_PROGRESS'")),false);
  assert.equal(statements.some(sql=>sql.includes('INSERT INTO patient_notifications')),false);
  await app.close();
});

test('finalizing without email accepts an empty recipient from an older client',async()=>{
  const patientId='00000000-0000-4000-8000-000000000002';
  const encounterId='00000000-0000-4000-8000-000000000003';
  let committed=false;
  const client={query:async(sql:string)=>{
    if(sql.includes("UPDATE clinical_encounters SET status='COMPLETED'"))return{rows:[{appointment_id:null}]};
    if(sql==='COMMIT')committed=true;
    return{rows:[]};
  },release:()=>{}};
  const db={query:async(sql:string)=>{
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]};
    if(sql.includes('SELECT section_key FROM clinical_sections'))return{rows:[]};
    if(sql.includes('FROM clinical_encounters e JOIN patients'))return{rows:[{patientId,patientName:'Paciente Teste',patientEmail:null,appointmentId:null,startedAt:new Date('2026-08-21T12:00:00Z')}]};
    return{rows:[]};
  },connect:async()=>client,end:async()=>{}};
  const app=await buildApp(env,db as never);
  const response=await app.inject({method:'POST',url:`/api/encounters/${encounterId}/finalize`,cookies:{nutri_session:'token'},payload:{sendEmail:false,emailRecipient:'',force:true}});
  assert.equal(response.statusCode,200);
  assert.equal(response.json().data.status,'COMPLETED');
  assert.equal(committed,true);
  await app.close();
});

test('a notification schema failure does not prevent encounter completion',async()=>{
  const patientId='00000000-0000-4000-8000-000000000002';
  const encounterId='00000000-0000-4000-8000-000000000003';
  let recoveredNotificationSavepoint=false;
  let committed=false;
  const client={query:async(sql:string)=>{
    if(sql.includes("UPDATE clinical_encounters SET status='COMPLETED'"))return{rows:[{appointment_id:null}]};
    if(sql.includes('UPDATE patient_notifications'))throw Object.assign(new Error('old notification schema'),{code:'42703'});
    if(sql==='ROLLBACK TO SAVEPOINT finalize_notifications')recoveredNotificationSavepoint=true;
    if(sql==='COMMIT')committed=true;
    return{rows:[]};
  },release:()=>{}};
  const db={query:async(sql:string)=>{
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]};
    if(sql.includes('SELECT section_key FROM clinical_sections'))return{rows:[]};
    if(sql.includes('FROM clinical_encounters e JOIN patients'))return{rows:[{patientId,patientName:'Paciente Teste',patientEmail:null,appointmentId:null,startedAt:new Date('2026-08-21T12:00:00Z')}]};
    return{rows:[]};
  },connect:async()=>client,end:async()=>{}};
  const app=await buildApp(env,db as never);
  const response=await app.inject({method:'POST',url:`/api/encounters/${encounterId}/finalize`,cookies:{nutri_session:'token'},payload:{sendEmail:false,force:true}});
  assert.equal(response.statusCode,200);
  assert.equal(recoveredNotificationSavepoint,true);
  assert.equal(committed,true);
  await app.close();
});

test('a completed encounter can be reopened through an audited correction action',async()=>{
  const encounterId='00000000-0000-4000-8000-000000000003';
  let committed=false;
  let appointmentReopened=false;
  const client={query:async(sql:string)=>{
    if(sql.includes("SET status='IN_PROGRESS',completed_at=NULL"))return{rows:[{appointment_id:'00000000-0000-4000-8000-000000000005'}]};
    if(sql.includes("UPDATE appointments SET status='IN_PROGRESS'"))appointmentReopened=true;
    if(sql==='COMMIT')committed=true;
    return{rows:[]};
  },release:()=>{}};
  const db={query:async(sql:string)=>sql.includes('FROM sessions s')?{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]}:{rows:[]},connect:async()=>client,end:async()=>{}};
  const app=await buildApp(env,db as never);
  const response=await app.inject({method:'POST',url:`/api/encounters/${encounterId}/reopen`,cookies:{nutri_session:'token'}});
  assert.equal(response.statusCode,200);
  assert.equal(response.json().data.status,'IN_PROGRESS');
  assert.equal(appointmentReopened,true);
  assert.equal(committed,true);
  await app.close();
});

test('an appointment without a linked encounter can be discarded',async()=>{
  const appointmentId='00000000-0000-4000-8000-000000000005';
  let discarded=false;
  const db={query:async(sql:string)=>{
    if(sql.includes('FROM sessions s'))return{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]};
    if(sql.includes('SELECT status FROM clinical_encounters'))return{rows:[]};
    if(sql.includes('DELETE FROM appointments')){discarded=true;return{rows:[{patient_id:'00000000-0000-4000-8000-000000000002'}]}};
    return{rows:[]};
  },connect:async()=>{throw new Error('unused')},end:async()=>{}};
  const app=await buildApp(env,db as never);
  const response=await app.inject({method:'DELETE',url:`/api/appointments/${appointmentId}`,cookies:{nutri_session:'token'}});
  assert.equal(response.statusCode,204);
  assert.equal(discarded,true);
  await app.close();
});

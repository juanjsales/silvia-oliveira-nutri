import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { appointmentEmailKey, enqueueAppointmentEmail, processAppointmentEmail, processPendingAppointmentEmails } from '../src/shared/appointment-email-outbox.js';

const env: AppEnv = {NODE_ENV:'test',PORT:3000,HOST:'127.0.0.1',DATABASE_URL:'postgres://test',DB_POOL_MAX:2,DB_CONNECTION_TIMEOUT_MS:10000,DB_IDLE_TIMEOUT_MS:10000,FRONTEND_ORIGIN:'http://localhost:5173',SESSION_COOKIE_NAME:'nutri_session',SESSION_TTL_HOURS:6,PASSWORD_RESET_TTL_MINUTES:30,APP_URL:'http://localhost:5173',SMTP_PORT:587,SMTP_SECURE:false,SMTP_FROM:'test@example.com'};

test('deduplication key is stable per appointment event revision', () => {
  assert.equal(appointmentEmailKey('appointment','RESCHEDULED','revision'), appointmentEmailKey('appointment','RESCHEDULED','revision'));
  assert.notEqual(appointmentEmailKey('appointment','RESCHEDULED','revision'), appointmentEmailKey('appointment','RESCHEDULED','next'));
});

test('enqueue uses an atomic unique-key upsert and normalizes the recipient', async () => {
  let captured: {sql:string;params?:unknown[]} | undefined;
  const db = { query: async (sql:string,params?:unknown[]) => { captured=params?{sql,params}:{sql}; return {rows:[{id:'delivery',status:'PENDING'}]}; } };
  const delivery = await enqueueAppointmentEmail(db,{appointmentId:'appointment',eventType:'SCHEDULED',recipient:' PATIENT@EXAMPLE.COM ',payload:{name:'Patient'},deduplicationKey:'key'});
  assert.deepEqual(delivery,{id:'delivery',status:'PENDING'});
  assert.match(captured!.sql,/ON CONFLICT\(deduplication_key\)/);
  assert.match(captured!.sql,/lower\(trim\(\$3\)\)/);
});

test('a failed delivery is retained with backoff instead of being lost', async () => {
  const statements:string[]=[];
  const db = { query: async (sql:string) => {
    statements.push(sql);
    if(sql.includes("SET status='PROCESSING'")) return {rows:[{id:'delivery',appointmentId:'appointment',eventType:'SCHEDULED',recipient:'patient@example.com',payload:{name:'Patient',date:'2026-08-16',time:'09:00',type:'Consulta',durationMinutes:60},attempts:1,maxAttempts:5}]};
    if(sql.includes('SELECT smtp_host')) return {rows:[]};
    return {rows:[]};
  }};
  const errors:unknown[]=[];
  const result=await processAppointmentEmail({db:db as never,env,log:{error:details=>{errors.push(details)}}},'delivery');
  assert.deepEqual(result,{processed:true,sent:false});
  assert.equal(errors.length,1);
  assert.ok(statements.some(sql=>sql.includes("SET status='FAILED'")&&sql.includes('power(2,attempts)')));
});

test('pending worker also reclaims deliveries left processing after a crash', async () => {
  let selection='';
  const db={query:async(sql:string)=>{selection=sql;return{rows:[]}}};
  const result=await processPendingAppointmentEmails({db:db as never,env,log:{error:()=>{}}});
  assert.deepEqual(result,{scheduled:0,sent:0,failed:0});
  assert.match(selection,/status='PROCESSING'/);
  assert.match(selection,/15 minutes/);
});

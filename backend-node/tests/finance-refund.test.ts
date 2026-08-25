import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const env:AppEnv={NODE_ENV:'test',PORT:3000,HOST:'127.0.0.1',DATABASE_URL:'postgres://test',DB_POOL_MAX:2,DB_CONNECTION_TIMEOUT_MS:10000,DB_IDLE_TIMEOUT_MS:10000,FRONTEND_ORIGIN:'http://localhost:5173',SESSION_COOKIE_NAME:'nutri_session',SESSION_TTL_HOURS:6,PASSWORD_RESET_TTL_MINUTES:30,APP_URL:'http://localhost:5173',SMTP_PORT:587,SMTP_SECURE:false,SMTP_FROM:'test@example.com'};
const transactionId='00000000-0000-4000-8000-000000000003';

function database(status:string){
  let refunded=false;
  let committed=false;
  const client={query:async(sql:string)=>{
    if(sql.includes('SELECT status,patient_id,amount'))return{rows:[{status,patient_id:'00000000-0000-4000-8000-000000000002',amount:'250.00'}]};
    if(sql.includes("SET status='REFUNDED'"))refunded=true;
    if(sql==='COMMIT')committed=true;
    return{rows:[]};
  },release:()=>{}};
  return{db:{query:async(sql:string)=>sql.includes('FROM sessions s')?{rows:[{user_id:'00000000-0000-4000-8000-000000000001',role:'ADMIN',patient_id:null}]}:{rows:[]},connect:async()=>client,end:async()=>{}},state:()=>({refunded,committed})};
}

test('a paid transaction is refunded only through the audited endpoint',async()=>{
  const fixture=database('PAID');
  const app=await buildApp(env,fixture.db as never);
  const response=await app.inject({method:'POST',url:`/api/finance/${transactionId}/refund`,cookies:{nutri_session:'token'},payload:{reason:'Cancelamento acordado e valor integral devolvido.'}});
  assert.equal(response.statusCode,200);
  assert.equal(response.json().data.status,'REFUNDED');
  assert.deepEqual(fixture.state(),{refunded:true,committed:true});
  await app.close();
});

test('an open charge cannot be marked as refunded',async()=>{
  const fixture=database('PENDING');
  const app=await buildApp(env,fixture.db as never);
  const response=await app.inject({method:'POST',url:`/api/finance/${transactionId}/refund`,cookies:{nutri_session:'token'},payload:{reason:'Tentativa inválida de estorno.'}});
  assert.equal(response.statusCode,409);
  assert.deepEqual(fixture.state(),{refunded:false,committed:false});
  await app.close();
});

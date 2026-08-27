import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const env: AppEnv = {
  NODE_ENV:'test',PORT:3000,HOST:'127.0.0.1',DATABASE_URL:'postgres://test',DB_POOL_MAX:2,
  DB_CONNECTION_TIMEOUT_MS:10000,DB_IDLE_TIMEOUT_MS:10000,FRONTEND_ORIGIN:'http://localhost:5173',
  SESSION_COOKIE_NAME:'nutri_session',SESSION_TTL_HOURS:6,PASSWORD_RESET_TTL_MINUTES:30,
  PATIENT_INVITATION_TTL_HOURS:24,APP_URL:'http://localhost:5173',SMTP_PORT:587,SMTP_SECURE:false,
  SMTP_FROM:'test@example.com'
};
const inviteId='00000000-0000-4000-8000-000000000020';
const userId='00000000-0000-4000-8000-000000000021';
const roleId='00000000-0000-4000-8000-000000000022';
const inviterId='00000000-0000-4000-8000-000000000023';
const payload={token:'a'.repeat(43),password:'uma-senha-segura-123'};

function acceptanceDatabase(invite?: {status:string;expiresAt:Date;acceptedByUserId?:string|null}, userCreated=true) {
  const calls:{sql:string;params:unknown[]}[]=[];
  const client={
    query:async(sql:string,params:unknown[]=[])=>{
      calls.push({sql,params});
      if(sql.includes('FROM staff_invites si JOIN roles')) return {rows:invite?[{
        id:inviteId,email:'nutri@example.com',displayName:'Nutri Teste',roleId,roleCode:'NUTRITIONIST',
        status:invite.status,expiresAt:invite.expiresAt,acceptedByUserId:invite.acceptedByUserId??null,invitedBy:inviterId
      }]:[]};
      if(sql.includes('INSERT INTO users')) return {rows:userCreated?[{id:userId}]:[]};
      return {rows:[]};
    },
    release:()=>{}
  };
  return {calls,query:async()=>({rows:[]}),connect:async()=>client,end:async()=>{}};
}

test('acceptance fails closed: creates an inactive legacy identity and no session',async()=>{
  const db=acceptanceDatabase({status:'PENDING',expiresAt:new Date(Date.now()+60_000)});
  const app=await buildApp(env,db as never);
  const response=await app.inject({method:'POST',url:'/api/staff/invites/accept',payload});
  assert.equal(response.statusCode,201);
  assert.equal(response.json().data.status,'PENDING_ACTIVATION');
  const createUser=db.calls.find(call=>call.sql.includes('INSERT INTO users'))!;
  assert.match(createUser.sql,/VALUES\(\$1,\$2,'PATIENT',false\)/);
  assert.ok(db.calls.some(call=>call.sql.includes("VALUES($1,$2,'SUSPENDED'")));
  assert.ok(db.calls.some(call=>call.sql.includes('INSERT INTO user_roles')));
  assert.equal(db.calls.some(call=>call.sql.includes('INSERT INTO sessions')),false);
  assert.ok(db.calls.some(call=>call.sql.includes('INSERT INTO audit_logs')&&call.params.includes('STAFF_INVITE_ACCEPTED_PENDING_ACTIVATION')));
  assert.ok(db.calls.some(call=>call.sql==='COMMIT'));
  await app.close();
});

test('accepting an already accepted token is idempotent and never rewrites identity',async()=>{
  const db=acceptanceDatabase({status:'ACCEPTED',expiresAt:new Date(Date.now()-60_000),acceptedByUserId:userId});
  const app=await buildApp(env,db as never);
  const first=await app.inject({method:'POST',url:'/api/staff/invites/accept',payload});
  const second=await app.inject({method:'POST',url:'/api/staff/invites/accept',payload});
  assert.equal(first.statusCode,200);
  assert.equal(second.statusCode,200);
  assert.equal(first.json().data.userId,userId);
  assert.equal(db.calls.some(call=>call.sql.includes('INSERT INTO users')),false);
  assert.equal(db.calls.filter(call=>call.sql==='COMMIT').length,2);
  await app.close();
});

test('invalid, expired and conflicting invitations cannot provision an identity',async()=>{
  const invalidDb=acceptanceDatabase();
  const invalidApp=await buildApp(env,invalidDb as never);
  assert.equal((await invalidApp.inject({method:'POST',url:'/api/staff/invites/accept',payload})).statusCode,400);
  assert.ok(invalidDb.calls.some(call=>call.sql==='ROLLBACK'));
  await invalidApp.close();

  const expiredDb=acceptanceDatabase({status:'PENDING',expiresAt:new Date(Date.now()-60_000)});
  const expiredApp=await buildApp(env,expiredDb as never);
  assert.equal((await expiredApp.inject({method:'POST',url:'/api/staff/invites/accept',payload})).statusCode,410);
  assert.ok(expiredDb.calls.some(call=>call.sql.includes("status='EXPIRED'")));
  assert.equal(expiredDb.calls.some(call=>call.sql.includes('INSERT INTO users')),false);
  await expiredApp.close();

  const conflictDb=acceptanceDatabase({status:'PENDING',expiresAt:new Date(Date.now()+60_000)},false);
  const conflictApp=await buildApp(env,conflictDb as never);
  assert.equal((await conflictApp.inject({method:'POST',url:'/api/staff/invites/accept',payload})).statusCode,409);
  assert.ok(conflictDb.calls.some(call=>call.sql==='ROLLBACK'));
  assert.equal(conflictDb.calls.some(call=>call.sql.includes('INSERT INTO user_roles')),false);
  await conflictApp.close();
});

test('acceptance validates token and password before opening a transaction',async()=>{
  const db=acceptanceDatabase({status:'PENDING',expiresAt:new Date(Date.now()+60_000)});
  const app=await buildApp(env,db as never);
  assert.equal((await app.inject({method:'POST',url:'/api/staff/invites/accept',payload:{token:'short',password:'short'}})).statusCode,400);
  assert.equal(db.calls.length,0);
  await app.close();
});

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

const actorId = '00000000-0000-4000-8000-000000000001';
const inviteId = '00000000-0000-4000-8000-000000000020';

function database(role: 'ADMIN'|'PATIENT', options: { insert?: boolean; cancel?: boolean } = {}) {
  const calls: {sql:string;params:unknown[]}[] = [];
  return {
    calls,
    query: async (sql:string, params:unknown[] = []) => {
      calls.push({sql,params});
      if (sql.includes('FROM sessions s')) return {rows:[{session_id:inviteId,user_id:actorId,role,patient_id:null}]};
      if (sql.includes('FROM staff_profiles sp')) return {rows:[{id:actorId,email:'owner@example.com',roles:['CLINIC_OWNER']}]};
      if (sql.includes('FROM staff_invites si')) return {rows:[]};
      if (sql.includes('INSERT INTO staff_invites')) return {rows:options.insert === false ? [] : [{id:inviteId,email:params[0],displayName:params[1],roleCode:params[2],status:'PENDING',expiresAt:new Date(),createdAt:new Date()}]};
      if (sql.includes("UPDATE staff_invites SET status='CANCELLED'")) return {rows:options.cancel === false ? [] : [{id:inviteId}]};
      return {rows:[]};
    },
    connect:async()=>{throw new Error('not needed')},end:async()=>{}
  };
}

test('staff endpoints require authentication and staff:manage permission', async () => {
  const anonymous = database('ADMIN');
  anonymous.query = async (sql:string,params:unknown[]=[]) => {
    anonymous.calls.push({sql,params});
    if (sql.includes('FROM sessions s')) return {rows:[]};
    return {rows:[]};
  };
  const anonymousApp = await buildApp(env, anonymous as never);
  assert.equal((await anonymousApp.inject({method:'GET',url:'/api/staff'})).statusCode, 401);
  await anonymousApp.close();

  const patientApp = await buildApp(env, database('PATIENT') as never);
  assert.equal((await patientApp.inject({method:'GET',url:'/api/staff',cookies:{nutri_session:'token'}})).statusCode, 403);
  await patientApp.close();
});

test('legacy ADMIN can list staff without querying RBAC permissions', async () => {
  const db = database('ADMIN');
  const app = await buildApp(env, db as never);
  const response = await app.inject({method:'GET',url:'/api/staff',cookies:{nutri_session:'token'}});
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.members.length, 1);
  assert.equal(db.calls.some(call=>call.sql.includes('FROM user_roles ur') && call.sql.includes('p.code')), false);
  await app.close();
});

test('prepares a normalized expiring invite, audits it and never exposes its secret', async () => {
  const db = database('ADMIN');
  const app = await buildApp(env, db as never);
  const response = await app.inject({method:'POST',url:'/api/staff/invites',cookies:{nutri_session:'token'},payload:{
    email:'  Nutri@Example.COM ',displayName:'Nutri Teste',roleCode:'NUTRITIONIST',expiresInHours:24
  }});
  assert.equal(response.statusCode, 201);
  assert.equal(response.json().data.email, 'nutri@example.com');
  assert.equal(JSON.stringify(response.json()).includes('token'), false);
  const insert = db.calls.find(call=>call.sql.includes('INSERT INTO staff_invites'))!;
  assert.equal(insert.params[0], 'nutri@example.com');
  assert.match(String(insert.params[3]), /^[a-f0-9]{64}$/);
  const auditCall = db.calls.find(call=>call.sql.includes('INSERT INTO audit_logs') && call.params.includes('STAFF_INVITE_PREPARED'))!;
  assert.ok(auditCall);
  assert.equal(JSON.stringify(auditCall.params).includes('nutri@example.com'), false);
  await app.close();
});

test('invite validation rejects privileged roles and excessive expiration before writing', async () => {
  const db = database('ADMIN');
  const app = await buildApp(env, db as never);
  for (const payload of [
    {email:'owner@example.com',displayName:'Owner',roleCode:'CLINIC_OWNER',expiresInHours:24},
    {email:'nutri@example.com',displayName:'Nutri',roleCode:'NUTRITIONIST',expiresInHours:169},
  ]) {
    const response = await app.inject({method:'POST',url:'/api/staff/invites',cookies:{nutri_session:'token'},payload});
    assert.equal(response.statusCode, 400);
  }
  assert.equal(db.calls.some(call=>call.sql.includes('INSERT INTO staff_invites')), false);
  await app.close();
});

test('does not prepare an invite for an existing user and cancels only pending unexpired invites', async () => {
  const duplicateDb = database('ADMIN',{insert:false});
  const duplicateApp = await buildApp(env,duplicateDb as never);
  const duplicate = await duplicateApp.inject({method:'POST',url:'/api/staff/invites',cookies:{nutri_session:'token'},payload:{email:'used@example.com',displayName:'Used User',roleCode:'RECEPTIONIST'}});
  assert.equal(duplicate.statusCode,409);
  await duplicateApp.close();

  const db = database('ADMIN');
  const app = await buildApp(env,db as never);
  const cancelled = await app.inject({method:'DELETE',url:`/api/staff/invites/${inviteId}`,cookies:{nutri_session:'token'}});
  assert.equal(cancelled.statusCode,204);
  assert.ok(db.calls.some(call=>call.sql.includes('INSERT INTO audit_logs') && call.params.includes('STAFF_INVITE_CANCELLED')));
  await app.close();

  const missingApp = await buildApp(env,database('ADMIN',{cancel:false}) as never);
  assert.equal((await missingApp.inject({method:'DELETE',url:`/api/staff/invites/${inviteId}`,cookies:{nutri_session:'token'}})).statusCode,404);
  await missingApp.close();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const env: AppEnv = {
  NODE_ENV:'test', PORT:3000, HOST:'127.0.0.1', DATABASE_URL:'postgres://test', DB_POOL_MAX:2,
  DB_CONNECTION_TIMEOUT_MS:10000, DB_IDLE_TIMEOUT_MS:10000, FRONTEND_ORIGIN:'http://localhost:5173',
  SESSION_COOKIE_NAME:'nutri_session', SESSION_TTL_HOURS:6, PASSWORD_RESET_TTL_MINUTES:30,
  PATIENT_INVITATION_TTL_HOURS:24, APP_URL:'http://localhost:5173', SMTP_PORT:587,
  SMTP_SECURE:false, SMTP_FROM:'test@example.com'
};

type Role = 'ADMIN' | 'PATIENT';

function database(role: Role, options: { allowed?: boolean; missingSchema?: boolean } = {}) {
  let permissionQueries = 0;
  return {
    get permissionQueries() { return permissionQueries; },
    query: async (sql: string) => {
      if (sql.includes('FROM sessions s')) return { rows:[{
        session_id:'00000000-0000-4000-8000-000000000010',
        user_id:'00000000-0000-4000-8000-000000000001', role, patient_id:null
      }] };
      if (sql.includes('FROM user_roles ur')) {
        permissionQueries++;
        if (options.missingSchema) throw Object.assign(new Error('relation does not exist'), { code:'42P01' });
        return { rows:[{ allowed:options.allowed === true }] };
      }
      if (sql.includes('FROM clinic_settings')) return { rows:[{ clinicName:'Clínica Teste' }] };
      return { rows:[] };
    },
    connect: async () => { throw new Error('not needed'); },
    end: async () => {}
  };
}

test('legacy ADMIN manages settings without depending on RBAC tables', async () => {
  const db = database('ADMIN');
  const app = await buildApp(env, db as never);
  const response = await app.inject({ method:'GET', url:'/api/settings', cookies:{nutri_session:'token'} });
  assert.equal(response.statusCode, 200);
  assert.equal(db.permissionQueries, 0);
  await app.close();
});

test('PATIENT remains denied without querying professional permissions', async () => {
  const db = database('PATIENT', { allowed:true });
  const app = await buildApp(env, db as never);
  const response = await app.inject({ method:'GET', url:'/api/settings', cookies:{nutri_session:'token'} });
  assert.equal(response.statusCode, 403);
  assert.equal(db.permissionQueries, 0);
  await app.close();
});

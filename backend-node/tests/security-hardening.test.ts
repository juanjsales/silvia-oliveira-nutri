import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const env: AppEnv = {
  NODE_ENV: 'production', PORT: 3000, HOST: '127.0.0.1', DATABASE_URL: 'postgres://test',
  DB_POOL_MAX: 2, DB_CONNECTION_TIMEOUT_MS: 10000, DB_IDLE_TIMEOUT_MS: 10000,
  FRONTEND_ORIGIN: 'https://nutri.example', SESSION_COOKIE_NAME: 'nutri_session', SESSION_TTL_HOURS: 6,
  PASSWORD_RESET_TTL_MINUTES: 30, PATIENT_INVITATION_TTL_HOURS: 24, APP_URL: 'https://nutri.example', SMTP_PORT: 587,
  SMTP_SECURE: false, SMTP_FROM: 'test@example.com',
};

function database(role: 'ADMIN' | 'PATIENT' = 'ADMIN') {
  const queries: Array<{ sql: string; values?: unknown[] }> = [];
  const db = {
    query: async (sql: string, values?: unknown[]) => {
      queries.push(values ? { sql, values } : { sql });
      if (sql.includes('FROM sessions s')) return { rows: [{ session_id: '00000000-0000-4000-8000-000000000010', user_id: '00000000-0000-4000-8000-000000000001', role, patient_id: role === 'PATIENT' ? '00000000-0000-4000-8000-000000000002' : null }] };
      if (sql.includes('FROM audit_logs a')) return { rows: [] };
      return { rows: [] };
    },
    connect: async () => { throw new Error('not needed'); }, end: async () => {},
  };
  return { db, queries };
}

test('production rejects browser mutations from an untrusted origin', async () => {
  const { db } = database();
  const app = await buildApp(env, db as never);
  const response = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { origin: 'https://evil.example' }, cookies: { nutri_session: 'token' } });
  assert.equal(response.statusCode, 403);
  assert.equal(response.json().error, 'Origem da solicitação não autorizada.');
  await app.close();
});

test('canonical and explicitly configured legacy origins remain synchronized', async () => {
  const { db } = database();
  const app = await buildApp({ ...env, APP_URL: 'https://canonical.example', LEGACY_APP_ORIGINS: 'https://legacy.example' }, db as never);
  for (const origin of ['https://canonical.example', 'https://nutri.example', 'https://legacy.example']) {
    const response = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { origin }, cookies: { nutri_session: 'token' } });
    assert.notEqual(response.statusCode, 403, origin);
    assert.equal(response.headers['access-control-allow-origin'], origin);
  }
  await app.close();
});

test('sensitive API responses disable browser and intermediary caching', async () => {
  const { db } = database();
  const app = await buildApp(env, db as never);
  const response = await app.inject({ method: 'GET', url: '/api/auth/me', cookies: { nutri_session: 'token' } });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['cache-control'], 'no-store');
  await app.close();
});

test('audit history is restricted to administrators and is itself audited', async () => {
  const admin = database('ADMIN');
  const app = await buildApp(env, admin.db as never);
  const response = await app.inject({ method: 'GET', url: '/api/audit?limit=10', cookies: { nutri_session: 'token' } });
  assert.equal(response.statusCode, 200);
  assert.ok(admin.queries.some(item => item.sql.includes("INSERT INTO audit_logs") && item.values?.includes('AUDIT_LOG_VIEWED')));
  await app.close();

  const patient = database('PATIENT');
  const patientApp = await buildApp(env, patient.db as never);
  const denied = await patientApp.inject({ method: 'GET', url: '/api/audit', cookies: { nutri_session: 'token' } });
  assert.equal(denied.statusCode, 403);
  await patientApp.close();
});

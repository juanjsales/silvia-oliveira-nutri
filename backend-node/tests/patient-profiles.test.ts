import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const env: AppEnv = {
  NODE_ENV: 'test', PORT: 3000, HOST: '127.0.0.1', DATABASE_URL: 'postgres://test',
  DB_POOL_MAX: 2, DB_CONNECTION_TIMEOUT_MS: 10000, DB_IDLE_TIMEOUT_MS: 10000,
  FRONTEND_ORIGIN: 'http://localhost:5173', SESSION_COOKIE_NAME: 'nutri_session',
  SESSION_TTL_HOURS: 6, PASSWORD_RESET_TTL_MINUTES: 30, PATIENT_INVITATION_TTL_HOURS: 24, APP_URL: 'http://localhost:5173',
  SMTP_PORT: 587, SMTP_SECURE: false, SMTP_FROM: 'test@example.com'
};

const patientId = '00000000-0000-4000-8000-000000000002';

function database(onInsert?: (params: unknown[]) => void) {
  return {
    query: async (sql: string, params: unknown[] = []) => {
      if (sql.includes('FROM sessions s')) return { rows: [{ user_id: '00000000-0000-4000-8000-000000000001', role: 'ADMIN', patient_id: null }] };
      if (sql.includes('INSERT INTO patients')) { onInsert?.(params); return { rows: [{ id: patientId }] }; }
      return { rows: [] };
    },
    connect: async () => { throw new Error('not needed'); },
    end: async () => undefined
  };
}

test('patient profiles are persisted only from an explicit request', async () => {
  let inserted: unknown[] = [];
  const app = await buildApp(env, database(params => { inserted = params; }) as never);
  const response = await app.inject({
    method: 'POST', url: '/api/patients', cookies: { nutri_session: 'token' },
    payload: { name: 'maria silva', profiles: ['ADULT_WOMAN', 'PREGNANT'], profileNotes: 'Perfil informado durante o cadastro.' }
  });
  assert.equal(response.statusCode, 201);
  assert.deepEqual(inserted[6], ['ADULT_WOMAN', 'PREGNANT']);
  assert.equal(inserted[7], 'Perfil informado durante o cadastro.');
  await app.close();
});

test('patient profile is not inferred from name or birth date', async () => {
  let inserted: unknown[] = [];
  const app = await buildApp(env, database(params => { inserted = params; }) as never);
  const response = await app.inject({
    method: 'POST', url: '/api/patients', cookies: { nutri_session: 'token' },
    payload: { name: 'João Adulto', birthDate: '1990-01-01' }
  });
  assert.equal(response.statusCode, 201);
  assert.deepEqual(inserted[6], []);
  await app.close();
});

test('unknown patient profile is rejected', async () => {
  const app = await buildApp(env, database() as never);
  const response = await app.inject({
    method: 'POST', url: '/api/patients', cookies: { nutri_session: 'token' },
    payload: { name: 'Paciente Teste', profiles: ['INFERRED_SECRET_PROFILE'] }
  });
  assert.equal(response.statusCode, 400);
  await app.close();
});

test('patient profiles and notes are included in the LGPD export', async () => {
  const privacyRoutes = await readFile(new URL('../src/modules/privacy/routes.ts', import.meta.url), 'utf8');
  assert.match(privacyRoutes, /communication_preference,profiles,profile_notes,created_at/);
});

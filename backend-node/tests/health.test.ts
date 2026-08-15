import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { REQUIRED_SCHEMA_MIGRATION } from '../src/database/schema-version.js';

const env: AppEnv = {
  NODE_ENV: 'test', PORT: 3000, HOST: '127.0.0.1', DATABASE_URL: 'postgres://test',
  DB_POOL_MAX: 2, DB_CONNECTION_TIMEOUT_MS: 10000, DB_IDLE_TIMEOUT_MS: 10000,
  FRONTEND_ORIGIN: 'http://localhost:5173', SESSION_COOKIE_NAME: 'nutri_session',
  SESSION_TTL_HOURS: 6, PASSWORD_RESET_TTL_MINUTES: 30, APP_URL: 'http://localhost:5173',
  SMTP_PORT: 587, SMTP_SECURE: false, SMTP_FROM: 'test@example.com'
};

function database(schemaReady: boolean) {
  return {
    async query(sql: string) {
      if (sql.includes('FROM schema_migrations')) {
        return { rows: schemaReady ? [{ appliedAt: new Date() }] : [] };
      }
      return { rows: [{ '?column?': 1 }] };
    }
  };
}

test('health reports database and current schema as ready', async () => {
  const app = await buildApp(env, database(true) as never);
  const response = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, 'ok');
  assert.equal(response.json().schema.requiredMigration, REQUIRED_SCHEMA_MIGRATION);
  await app.close();
});

test('health blocks promotion when the required migration is missing', async () => {
  const app = await buildApp(env, database(false) as never);
  const response = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().status, 'degraded');
  assert.equal(response.json().database, 'connected');
  await app.close();
});

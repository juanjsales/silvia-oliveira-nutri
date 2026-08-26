import assert from 'node:assert/strict';
import test from 'node:test';
import { redactedEnvironmentSummary, validateProductionEnv } from './validate-production-env.mjs';

const valid = {
  DATABASE_URL: 'postgresql://user:password@db.example.com/app',
  FRONTEND_ORIGIN: 'https://app.example.com',
  APP_URL: 'https://app.example.com',
  SMTP_FROM: 'clinic@example.com',
  APP_ENCRYPTION_KEY: 'a'.repeat(32),
  CRON_SECRET: 'b'.repeat(32)
};

test('accepts the minimum production environment', () => {
  assert.deepEqual(validateProductionEnv(valid), []);
});

test('rejects insecure public URLs and short secrets', () => {
  const failures = validateProductionEnv({ ...valid, APP_URL: 'http://app.example.com', CRON_SECRET: 'short' });
  assert.ok(failures.some((failure) => failure.includes('APP_URL')));
  assert.ok(failures.some((failure) => failure.includes('CRON_SECRET')));
});

test('rejects a partial SMTP integration', () => {
  const failures = validateProductionEnv({ ...valid, SMTP_HOST: 'smtp.example.com' });
  assert.ok(failures.some((failure) => failure.includes('SMTP_HOST')));
});

test('accepts canonical and legacy HTTPS origins but rejects paths', () => {
  assert.deepEqual(validateProductionEnv({ ...valid, LEGACY_APP_ORIGINS: 'https://old.example.com,https://preview.example.com' }), []);
  const failures = validateProductionEnv({ ...valid, LEGACY_APP_ORIGINS: 'https://old.example.com/portal' });
  assert.ok(failures.some((failure) => failure.includes('LEGACY_APP_ORIGINS')));
});

test('diagnostics never contain secret values', () => {
  const summary = redactedEnvironmentSummary({ CRON_SECRET: 'do-not-print-this', DATABASE_URL: valid.DATABASE_URL });
  assert.equal(summary.join(' ').includes('do-not-print-this'), false);
  assert.equal(summary.join(' ').includes(valid.DATABASE_URL), false);
});

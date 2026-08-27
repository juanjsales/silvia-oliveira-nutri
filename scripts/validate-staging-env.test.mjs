import assert from 'node:assert/strict';
import test from 'node:test';
import { validateStagingEnvironment } from './validate-staging-env.mjs';

const policy = { product: { requiredEnvironmentMarker: 'staging', forbiddenIdentifiers: ['silviaoliveira.vercel.app', 'clinica-silvia'] } };
const valid = {
  DEPLOYMENT_ENVIRONMENT: 'staging', STAGING_INSTANCE_ID: 'product-staging',
  DATABASE_ENVIRONMENT_ID: 'product-staging-db',
  DATABASE_URL: 'postgresql://user:secret@db.product-staging.example/postgres',
  FRONTEND_ORIGIN: 'https://product-staging.vercel.app', APP_URL: 'https://product-staging.vercel.app'
};

test('aceita somente configuração explicitamente identificada como homologação', () => {
  assert.deepEqual(validateStagingEnvironment(valid, policy), []);
});

test('falha fechado quando marcadores obrigatórios estão ausentes', () => {
  const failures = validateStagingEnvironment({}, policy);
  assert.ok(failures.length >= 6);
});

test('bloqueia domínio canônico e proprietário da clínica em qualquer campo sensível', () => {
  const failures = validateStagingEnvironment({ ...valid, APP_URL: 'https://silviaoliveira.vercel.app', DATABASE_ENVIRONMENT_ID: 'clinica-silvia' }, policy);
  assert.ok(failures.some((failure) => failure.includes('silviaoliveira.vercel.app')));
  assert.ok(failures.some((failure) => failure.includes('clinica-silvia')));
});

test('bloqueia banco sem identidade não produtiva explícita', () => {
  const failures = validateStagingEnvironment({ ...valid, DATABASE_ENVIRONMENT_ID: 'tenant-primary' }, policy);
  assert.ok(failures.some((failure) => failure.includes('DATABASE_ENVIRONMENT_ID')));
});

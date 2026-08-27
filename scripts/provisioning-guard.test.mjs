import assert from 'node:assert/strict';
import test from 'node:test';
import { assertProvisioningAllowed, validateProvisioningRequest } from './provisioning-guard.mjs';

const policy = { product: { forbiddenIdentifiers: [
  'silviaoliveira.vercel.app', 'clinica-silvia', 'silvia-oliveira-nutri-v2', 'prj_real_clinic'
] } };
const env = {
  DEPLOYMENT_ENVIRONMENT: 'staging',
  PROTECTED_PRODUCTION_PROJECT_ID: 'prj_real_clinic',
  PROTECTED_PRODUCTION_DATABASE_ID: 'supabase_real_clinic'
};
const safe = {
  mode: 'mock', tenantSlug: 'clinica-demo-staging', domain: 'clinica-demo-staging.vercel.app',
  providerProjectId: 'prj_demo_staging', databaseId: 'supabase_demo_staging', executeExternalProvider: false
};

test('permite simulação isolada sem chamada externa', () => {
  assert.deepEqual(validateProvisioningRequest(safe, { env, policy }), []);
  assert.doesNotThrow(() => assertProvisioningAllowed(safe, { env, policy }));
});

test('falha fechado sem IDs protegidos conhecidos', () => {
  const failures = validateProvisioningRequest(safe, { env: { DEPLOYMENT_ENVIRONMENT: 'staging' }, policy });
  assert.ok(failures.some((item) => item.includes('PROTECTED_PRODUCTION_PROJECT_ID')));
  assert.ok(failures.some((item) => item.includes('PROTECTED_PRODUCTION_DATABASE_ID')));
});

test('recusa domínio, projeto e banco da clínica real inclusive no mock', () => {
  for (const mutation of [
    { domain: 'silviaoliveira.vercel.app' },
    { providerProjectId: 'prj_real_clinic' },
    { databaseId: 'supabase_real_clinic' }
  ]) {
    assert.ok(validateProvisioningRequest({ ...safe, ...mutation }, { env, policy }).some((item) => item.includes('Destino protegido')));
  }
});

test('modo mock nunca chama provider mesmo com flag global', () => {
  const failures = validateProvisioningRequest(
    { ...safe, executeExternalProvider: true },
    { env: { ...env, ALLOW_EXTERNAL_PROVIDER_PROVISIONING: 'true' }, policy }
  );
  assert.ok(failures.some((item) => item.includes('modo mock')));
});

test('staging exige opt-in explícito para executar provider externo', () => {
  const request = { ...safe, mode: 'staging', executeExternalProvider: true };
  assert.ok(validateProvisioningRequest(request, { env, policy }).some((item) => item.includes('ALLOW_EXTERNAL_PROVIDER_PROVISIONING')));
  assert.deepEqual(validateProvisioningRequest(request, {
    env: { ...env, ALLOW_EXTERNAL_PROVIDER_PROVISIONING: 'true' }, policy
  }), []);
});

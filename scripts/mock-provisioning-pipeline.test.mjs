import assert from 'node:assert/strict';
import test from 'node:test';
import { createMockAdapter, MemoryProvisioningStore, MOCK_PHASES, runMockProvisioning } from './mock-provisioning-pipeline.mjs';

const policy = { product: { forbiddenIdentifiers: ['silviaoliveira.vercel.app', 'clinica-silvia'] } };
const env = { DEPLOYMENT_ENVIRONMENT: 'staging', PROTECTED_PRODUCTION_PROJECT_ID: 'prod-project', PROTECTED_PRODUCTION_DATABASE_ID: 'prod-db' };
const request = { tenantId: 'demo-staging', releaseId: 'release-1', idempotencyKey: 'intent-1', domain: 'demo-staging.example.test', providerProjectId: 'demo-project', databaseId: 'demo-db' };

test('smoke simulado conclui todas as etapas sem serviço externo', async () => {
  const adapter = createMockAdapter();
  const result = await runMockProvisioning(request, { store: new MemoryProvisioningStore(), adapter, env, policy });
  assert.equal(result.status, 'COMPLETED');
  assert.deepEqual(adapter.calls.map((item) => item.phase), MOCK_PHASES);
  assert.ok(Object.values(result.results).every((item) => item.synthetic));
});

test('replay idempotente não repete etapas concluídas', async () => {
  const store = new MemoryProvisioningStore(); const adapter = createMockAdapter();
  const first = await runMockProvisioning(request, { store, adapter, env, policy });
  const second = await runMockProvisioning(request, { store, adapter, env, policy });
  assert.deepEqual(second, first); assert.equal(adapter.calls.length, MOCK_PHASES.length);
});

test('falha retryable retoma da etapa sem duplicar anteriores', async () => {
  const store = new MemoryProvisioningStore(); const adapter = createMockAdapter({ failOnceAt: 'MIGRATING_SCHEMA' });
  const failed = await runMockProvisioning(request, { store, adapter, env, policy });
  assert.equal(failed.status, 'FAILED_RETRYABLE');
  const completed = await runMockProvisioning(request, { store, adapter, env, policy });
  assert.equal(completed.status, 'COMPLETED'); assert.equal(completed.attempt, 2);
  assert.equal(adapter.calls.filter((item) => item.phase === 'RESERVING').length, 1);
  assert.equal(adapter.calls.filter((item) => item.phase === 'MIGRATING_SCHEMA').length, 2);
});

test('mesma chave com outra intenção e recurso protegido são bloqueados', async () => {
  const store = new MemoryProvisioningStore(); const adapter = createMockAdapter();
  await runMockProvisioning(request, { store, adapter, env, policy });
  await assert.rejects(() => runMockProvisioning({ ...request, releaseId: 'release-2' }, { store, adapter, env, policy }), /IDEMPOTENCY_CONFLICT/);
  await assert.rejects(() => runMockProvisioning({ ...request, idempotencyKey: 'x', databaseId: 'prod-db' }, { store, adapter, env, policy }), /Destino protegido/);
});

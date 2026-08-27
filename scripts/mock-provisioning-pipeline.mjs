import { createHash } from 'node:crypto';
import { assertProvisioningAllowed } from './provisioning-guard.mjs';

export const MOCK_PHASES = ['RESERVING', 'VALIDATING_RESOURCES', 'PROVISIONING_DATABASE', 'MIGRATING_SCHEMA', 'PROVISIONING_APP', 'CONFIGURING_APP', 'VERIFYING', 'COMPLETED'];
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export class MemoryProvisioningStore {
  operations = new Map();
  get(key) { return this.operations.get(key); }
  set(key, value) { this.operations.set(key, structuredClone(value)); return structuredClone(value); }
}

export function createMockAdapter({ failOnceAt } = {}) {
  const calls = [];
  let failed = false;
  return {
    calls,
    async execute(phase, context) {
      calls.push({ phase, operationId: context.operationId });
      if (phase === failOnceAt && !failed) { failed = true; throw Object.assign(new Error('simulated'), { retryable: true }); }
      return { synthetic: true, reference: `mock:${context.operationId}:${phase}` };
    }
  };
}

export async function runMockProvisioning(request, { store, adapter, env, policy }) {
  assertProvisioningAllowed({ ...request, mode: 'mock', executeExternalProvider: false }, { env, policy });
  if (!request.idempotencyKey || !request.tenantId || !request.releaseId) throw new Error('tenantId, releaseId e idempotencyKey são obrigatórios.');
  const intentHash = digest({ tenantId: request.tenantId, releaseId: request.releaseId });
  let operation = store.get(request.idempotencyKey);
  if (operation && operation.intentHash !== intentHash) throw new Error('IDEMPOTENCY_CONFLICT');
  if (!operation) operation = { operationId: `mock-${digest(request.idempotencyKey).slice(0, 16)}`, intentHash, phaseIndex: 0, status: 'PENDING', attempt: 1, results: {} };
  if (operation.status === 'COMPLETED') return operation;
  if (operation.status === 'FAILED_RETRYABLE') { operation.status = 'PENDING'; operation.attempt += 1; }

  for (; operation.phaseIndex < MOCK_PHASES.length; operation.phaseIndex += 1) {
    const phase = MOCK_PHASES[operation.phaseIndex];
    operation.status = 'RUNNING'; operation.phase = phase; store.set(request.idempotencyKey, operation);
    try { operation.results[phase] ??= await adapter.execute(phase, operation); }
    catch (error) {
      operation.status = error?.retryable ? 'FAILED_RETRYABLE' : 'FAILED_MANUAL';
      operation.errorCode = error?.retryable ? 'SIMULATED_RETRYABLE' : 'SIMULATED_MANUAL';
      return store.set(request.idempotencyKey, operation);
    }
    if (phase === 'COMPLETED') operation.status = 'COMPLETED';
    store.set(request.idempotencyKey, operation);
  }
  return store.get(request.idempotencyKey);
}

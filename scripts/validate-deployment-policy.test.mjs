import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDeploymentPolicy, validateWorkflowGuards } from './validate-deployment-policy.mjs';

const validPolicy = () => ({
  canonicalProduction: {
    branch: 'main', environment: 'production', owner: 'clinica-silvia',
    host: 'silviaoliveira.vercel.app', automaticPromotion: false
  },
  product: {
    branch: 'codex/product-platform', allowedEnvironments: ['preview', 'staging'],
    canonicalProductionPromotion: 'forbidden', productionDatabaseAccess: 'forbidden'
  }
});

test('aceita a separação declarada entre clínica e produto', () => {
  assert.deepEqual(validateDeploymentPolicy(validPolicy()), []);
});

test('rejeita produto promovível ao domínio ou banco da clínica', () => {
  const policy = validPolicy();
  policy.product.allowedEnvironments.push('production');
  policy.product.canonicalProductionPromotion = 'automatic';
  policy.product.productionDatabaseAccess = 'allowed';
  assert.equal(validateDeploymentPolicy(policy).length, 3);
});

test('rejeita troca da branch ou host da produção clínica', () => {
  const policy = validPolicy();
  policy.canonicalProduction.branch = 'codex/product-platform';
  policy.canonicalProduction.host = 'product.example.com';
  assert.ok(validateDeploymentPolicy(policy).length >= 2);
});

test('exige quality gate do produto e guardas da main nos workflows produtivos', () => {
  const guarded = "if: github.ref == 'refs/heads/main'";
  assert.deepEqual(validateWorkflowGuards({
    qualityGate: '- codex/product-platform', migrations: guarded, smoke: guarded
  }), []);
  assert.equal(validateWorkflowGuards({ qualityGate: '', migrations: '', smoke: '' }).length, 3);
});

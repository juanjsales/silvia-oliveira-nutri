import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import { issueLicense, licenseAllows, validateLicense } from './product-license.mjs';

const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const claims = { tenantId: 'tenant-demo', issuedAt: '2026-01-01T00:00:00Z', expiresAt: '2026-02-01T00:00:00Z', graceUntil: '2026-02-08T00:00:00Z', entitlements: ['agenda'] };
const token = issueLicense(claims, privateKey);

test('valida licença assinada ativa sem expor chave privada', () => {
  const result = validateLicense(token, publicKey, { now: new Date('2026-01-15'), expectedTenantId: 'tenant-demo' });
  assert.equal(result.state, 'ACTIVE');
  assert.equal(licenseAllows(result, 'write'), true);
});

test('mantém operação no grace e vira somente leitura com exportação depois', () => {
  assert.equal(validateLicense(token, publicKey, { now: new Date('2026-02-05') }).state, 'GRACE');
  const expired = validateLicense(token, publicKey, { now: new Date('2026-03-01') });
  assert.equal(expired.state, 'READ_ONLY');
  assert.equal(licenseAllows(expired, 'write'), false);
  assert.equal(licenseAllows(expired, 'export'), true);
});

test('assinatura adulterada ou tenant divergente falha fechado', () => {
  assert.equal(validateLicense(`${token}x`, publicKey).state, 'INVALID');
  assert.equal(validateLicense(token, publicKey, { expectedTenantId: 'outro' }).state, 'INVALID');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueToken, hashPassword, hashToken, verifyPassword } from '../src/shared/crypto.js';

test('password uses a one-way Argon2id hash', async () => {
  const hash = await hashPassword('SenhaSegura123!');
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await verifyPassword(hash, 'SenhaSegura123!'), true);
  assert.equal(await verifyPassword(hash, 'incorreta'), false);
});

test('opaque tokens are random and stored as SHA-256', () => {
  const a = createOpaqueToken();
  const b = createOpaqueToken();
  assert.notEqual(a, b);
  assert.match(hashToken(a), /^[a-f0-9]{64}$/);
  assert.equal(hashToken(a).includes(a), false);
});

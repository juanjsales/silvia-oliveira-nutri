import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSecureSessionCookie, parseBoolean, parseSmokeConfig } from './production-smoke-config.mjs';

const valid = (overrides = {}) => ({
  SMOKE_BASE_URL: 'https://silviaoliveira.vercel.app',
  SMOKE_ALLOWED_HOSTS: 'silviaoliveira.vercel.app',
  SMOKE_TIMEOUT_MS: '15000',
  ...overrides
});

test('normaliza e valida a configuração pública do smoke', () => {
  const config = parseSmokeConfig(valid({ SMOKE_BASE_URL: 'https://silviaoliveira.vercel.app/' }));
  assert.equal(config.base, 'https://silviaoliveira.vercel.app');
  assert.equal(config.authenticated, false);
});

test('rejeita URL insegura, URL com caminho e host fora da allowlist', () => {
  assert.throws(() => parseSmokeConfig(valid({ SMOKE_BASE_URL: 'http://silviaoliveira.vercel.app' })), /HTTPS/);
  assert.throws(() => parseSmokeConfig(valid({ SMOKE_BASE_URL: 'https://silviaoliveira.vercel.app/portal' })), /apenas a origem/);
  assert.throws(() => parseSmokeConfig(valid({ SMOKE_BASE_URL: 'https://example.com' })), /host não autorizado/);
});

test('credenciais parciais falham mesmo fora do modo estrito', () => {
  assert.throws(() => parseSmokeConfig(valid({ SMOKE_ADMIN_IDENTIFIER: 'smoke@example.test' })), /incompletas/);
  assert.throws(() => parseSmokeConfig(valid({ SMOKE_ADMIN_PASSWORD: 'secret' })), /incompletas/);
});

test('modo estrito exige o par de credenciais', () => {
  assert.throws(() => parseSmokeConfig(valid({ STRICT_SMOKE_AUTH: 'true' })), /obrigatórias ausentes/);
  const config = parseSmokeConfig(valid({
    STRICT_SMOKE_AUTH: 'true',
    SMOKE_ADMIN_IDENTIFIER: 'smoke@example.test',
    SMOKE_ADMIN_PASSWORD: 'secret'
  }));
  assert.equal(config.authenticated, true);
});

test('booleanos inválidos não desativam silenciosamente a proteção', () => {
  assert.equal(parseBoolean('STRICT_SMOKE_AUTH', 'false'), false);
  assert.throws(() => parseBoolean('STRICT_SMOKE_AUTH', 'TRUE'), /deve ser/);
});

test('cookie de sessão exige HttpOnly, Secure e SameSite', () => {
  assert.equal(
    assertSecureSessionCookie('session=abc; Path=/; HttpOnly; Secure; SameSite=Lax'),
    'session=abc'
  );
  assert.throws(() => assertSecureSessionCookie('session=abc; Path=/; HttpOnly'), /Secure, SameSite/);
});

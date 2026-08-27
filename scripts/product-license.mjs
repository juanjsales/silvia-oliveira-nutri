import { sign, verify } from 'node:crypto';

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

const encode = (value) => Buffer.from(value).toString('base64url');
const decode = (value) => Buffer.from(value, 'base64url');

export function issueLicense(claims, privateKey) {
  const payload = {
    version: 1,
    tenantId: claims.tenantId,
    issuedAt: claims.issuedAt,
    expiresAt: claims.expiresAt,
    graceUntil: claims.graceUntil,
    entitlements: [...new Set(claims.entitlements ?? [])].sort()
  };
  if (!payload.tenantId || !payload.issuedAt || !payload.expiresAt || !payload.graceUntil) throw new Error('Claims obrigatórias ausentes.');
  const body = encode(canonical(payload));
  return `${body}.${sign(null, Buffer.from(body), privateKey).toString('base64url')}`;
}

export function validateLicense(token, publicKey, { now = new Date(), expectedTenantId } = {}) {
  try {
    const [body, signature, extra] = String(token).split('.');
    if (!body || !signature || extra || !verify(null, Buffer.from(body), publicKey, decode(signature))) return { state: 'INVALID', permissions: [] };
    const claims = JSON.parse(decode(body).toString('utf8'));
    if (claims.version !== 1 || !claims.tenantId || (expectedTenantId && claims.tenantId !== expectedTenantId)) return { state: 'INVALID', permissions: [] };
    const current = now.getTime();
    const issued = Date.parse(claims.issuedAt);
    const expires = Date.parse(claims.expiresAt);
    const grace = Date.parse(claims.graceUntil);
    if (![issued, expires, grace].every(Number.isFinite) || issued > expires || expires > grace || current < issued) return { state: 'INVALID', permissions: [] };
    if (current <= expires) return { state: 'ACTIVE', permissions: ['read', 'write', 'export'], claims };
    if (current <= grace) return { state: 'GRACE', permissions: ['read', 'write', 'export'], claims };
    return { state: 'READ_ONLY', permissions: ['read', 'export'], claims };
  } catch {
    return { state: 'INVALID', permissions: [] };
  }
}

export const licenseAllows = (result, operation) => result.permissions.includes(operation);

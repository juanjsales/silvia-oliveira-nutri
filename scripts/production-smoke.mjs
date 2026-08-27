import { assertSecureSessionCookie, parseSmokeConfig } from './production-smoke-config.mjs';

const { base, origin, timeoutMs, identifier, password, authenticated } = parseSmokeConfig();

async function request(path, { expected = 200, cookie, method = 'GET', body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      accept: 'application/json',
      origin,
      ...(cookie ? { cookie } : {}),
      ...(body ? { 'content-type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const type = response.headers.get('content-type') || '';
  const payload = type.includes('application/json') ? await response.json() : await response.text();
  if (response.status !== expected) {
    const detail = payload?.schema?.requiredMigration
      ? ` Migração exigida: ${payload.schema.requiredMigration}.`
      : payload?.error ? ` ${payload.error}` : '';
    throw new Error(`${method} ${path}: esperado ${expected}, recebido ${response.status}.${detail}`);
  }
  return { response, payload, type };
}

console.log(`Homologando ${base}`);
const home = await request('/');
if (!home.type.includes('text/html') || !String(home.payload).includes('id="root"')) {
  throw new Error('A aplicação React não foi entregue corretamente.');
}
console.log('✓ Aplicação React');

const health = await request('/health');
if (health.payload?.status !== 'ok' || health.payload?.schema?.ready !== true) {
  throw new Error(`API indisponível ou schema pendente (${health.payload?.schema?.requiredMigration ?? 'migração desconhecida'}).`);
}
console.log('✓ API, banco e migrações');

const identity = await request('/api/settings/public');
if (!identity.payload?.data?.clinicName) throw new Error('Identidade pública do consultório incompleta.');
console.log('✓ Identidade do consultório');

await request('/api/auth/me', { expected: 401 });
console.log('✓ Proteção de sessão anônima');

if (authenticated) {
  const login = await request('/api/auth/login', { method: 'POST', body: { identifier, password } });
  const cookie = assertSecureSessionCookie(login.response.headers.get('set-cookie'));

  const session = await request('/api/auth/me', { cookie });
  if (session.payload?.user?.role !== 'ADMIN') throw new Error('A credencial do smoke não pertence a um administrador.');

  const readiness = await request('/api/settings/readiness', { cookie });
  if (readiness.payload?.data?.ready !== true) {
    const pending = (readiness.payload?.data?.checks ?? [])
      .filter((check) => check.required && !check.ready)
      .map((check) => check.label)
      .join(', ');
    throw new Error(`Produção não está pronta${pending ? `; pendências: ${pending}` : ''}.`);
  }

  await request('/api/patients', { cookie });
  await request('/api/finance/summary', { cookie });
  const today = new Date().toISOString().slice(0, 10);
  await request(`/api/appointments?from=${today}&to=${today}`, { cookie });
  await request('/api/auth/logout', { cookie, method: 'POST', expected: 204 });
  await request('/api/auth/me', { cookie, expected: 401 });
  console.log('✓ Sessão administrativa, readiness, módulos essenciais e logout');
} else {
  console.log('• Credenciais de homologação ausentes; etapa autenticada ignorada.');
}

console.log('Homologação concluída sem falhas.');

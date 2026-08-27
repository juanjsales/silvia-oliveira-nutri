const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function parseBoolean(name, value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} deve ser "true" ou "false".`);
}

export function parseSmokeConfig(env = process.env) {
  const rawBase = env.SMOKE_BASE_URL?.trim();
  if (!rawBase) throw new Error('Defina SMOKE_BASE_URL com a URL publicada.');

  let url;
  try {
    url = new URL(rawBase);
  } catch {
    throw new Error('SMOKE_BASE_URL não é uma URL válida.');
  }

  if (url.protocol !== 'https:' || LOCAL_HOSTS.has(url.hostname)) {
    throw new Error('SMOKE_BASE_URL deve usar HTTPS e não pode apontar para localhost.');
  }
  if (url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error('SMOKE_BASE_URL deve conter apenas a origem HTTPS, sem credenciais, caminho, parâmetros ou fragmento.');
  }

  const allowedHosts = (env.SMOKE_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (allowedHosts.length && !allowedHosts.includes(url.hostname.toLowerCase())) {
    throw new Error(`SMOKE_BASE_URL aponta para um host não autorizado (${url.hostname}).`);
  }

  const timeoutMs = Number(env.SMOKE_TIMEOUT_MS || 15_000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 60_000) {
    throw new Error('SMOKE_TIMEOUT_MS deve ser um inteiro entre 1000 e 60000.');
  }

  const strictAuth = parseBoolean('STRICT_SMOKE_AUTH', env.STRICT_SMOKE_AUTH);
  const identifier = env.SMOKE_ADMIN_IDENTIFIER?.trim() || '';
  const password = env.SMOKE_ADMIN_PASSWORD || '';
  const hasIdentifier = Boolean(identifier);
  const hasPassword = Boolean(password.trim());
  if (hasIdentifier !== hasPassword) {
    throw new Error('Credenciais de homologação incompletas: configure identificador e senha em conjunto.');
  }
  if (strictAuth && !hasIdentifier) {
    throw new Error('Credenciais de homologação obrigatórias ausentes. Configure SMOKE_ADMIN_IDENTIFIER e SMOKE_ADMIN_PASSWORD no environment production.');
  }

  return {
    base: url.origin,
    origin: url.origin,
    timeoutMs,
    strictAuth,
    identifier,
    password,
    authenticated: hasIdentifier
  };
}

export function assertSecureSessionCookie(setCookie) {
  if (!setCookie) throw new Error('Login não criou uma sessão segura.');
  const attributes = setCookie.toLowerCase();
  const missing = [
    ['httponly', 'HttpOnly'],
    ['secure', 'Secure'],
    ['samesite=', 'SameSite']
  ].filter(([fragment]) => !attributes.includes(fragment)).map(([, label]) => label);
  if (missing.length) throw new Error(`Cookie de sessão sem atributos obrigatórios: ${missing.join(', ')}.`);
  return setCookie.split(';')[0];
}

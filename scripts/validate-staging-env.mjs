import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const markerPattern = /(?:^|[-_.])(staging|preview|homolog|test)(?:$|[-_.])/i;

const value = (env, name) => String(env[name] ?? '').trim();

export function validateStagingEnvironment(env, policy) {
  const failures = [];
  const product = policy?.product ?? {};
  const required = ['DEPLOYMENT_ENVIRONMENT', 'STAGING_INSTANCE_ID', 'DATABASE_ENVIRONMENT_ID', 'DATABASE_URL', 'FRONTEND_ORIGIN', 'APP_URL'];

  for (const name of required) if (!value(env, name)) failures.push(`${name} é obrigatório em homologação.`);
  if (value(env, 'DEPLOYMENT_ENVIRONMENT') !== product.requiredEnvironmentMarker) {
    failures.push(`DEPLOYMENT_ENVIRONMENT deve ser ${product.requiredEnvironmentMarker ?? 'staging'}.`);
  }
  for (const name of ['STAGING_INSTANCE_ID', 'DATABASE_ENVIRONMENT_ID']) {
    const current = value(env, name);
    if (current && !markerPattern.test(current)) failures.push(`${name} deve identificar explicitamente staging/preview/homolog/test.`);
  }

  for (const name of ['FRONTEND_ORIGIN', 'APP_URL']) {
    const current = value(env, name);
    if (!current) continue;
    try {
      const parsed = new URL(current);
      if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') failures.push(`${name} deve usar HTTPS.`);
      if (parsed.pathname !== '/' || parsed.search || parsed.hash) failures.push(`${name} deve conter somente a origem.`);
    } catch { failures.push(`${name} deve ser uma URL válida.`); }
  }

  const inspected = required.map((name) => value(env, name)).filter(Boolean).join('\n').toLowerCase();
  for (const forbidden of product.forbiddenIdentifiers ?? []) {
    if (inspected.includes(String(forbidden).toLowerCase())) failures.push(`Configuração de homologação contém identificador proibido: ${forbidden}.`);
  }
  if (value(env, 'DATABASE_URL') && !/^postgres(?:ql)?:\/\//i.test(value(env, 'DATABASE_URL'))) {
    failures.push('DATABASE_URL deve ser uma URL PostgreSQL válida.');
  }
  return [...new Set(failures)];
}

async function run() {
  const policy = JSON.parse(await readFile(resolve(root, '.github/deployment-policy.json'), 'utf8'));
  const failures = validateStagingEnvironment(process.env, policy);
  if (failures.length) {
    console.error('Ambiente de homologação bloqueado (fail-closed):');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else console.log('OK  homologação isolada da produção canônica.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await run();

const truthy = new Set(['true', '1', 'yes']);

const clean = (value) => String(value ?? '').trim();
const normalize = (value) => clean(value).toLowerCase();

export function validateProvisioningRequest(request, { env = process.env, policy } = {}) {
  const failures = [];
  const mode = normalize(request?.mode);
  const externalRequested = request?.executeExternalProvider === true;
  const protectedProjectId = clean(env.PROTECTED_PRODUCTION_PROJECT_ID);
  const protectedDatabaseId = clean(env.PROTECTED_PRODUCTION_DATABASE_ID);

  if (!['mock', 'staging'].includes(mode)) failures.push('Provisionamento só pode operar em mode mock ou staging.');
  if (!protectedProjectId) failures.push('PROTECTED_PRODUCTION_PROJECT_ID é obrigatório para comparar o projeto real.');
  if (!protectedDatabaseId) failures.push('PROTECTED_PRODUCTION_DATABASE_ID é obrigatório para comparar o banco real.');

  const forbidden = [
    ...(policy?.product?.forbiddenIdentifiers ?? []),
    protectedProjectId,
    protectedDatabaseId
  ].filter(Boolean).map(normalize);
  const inspected = JSON.stringify(request ?? {}).toLowerCase();
  for (const identifier of forbidden) {
    if (inspected.includes(identifier)) failures.push(`Destino protegido recusado: ${identifier}.`);
  }

  if (mode === 'mock' && externalRequested) failures.push('O modo mock nunca pode executar provedores externos.');
  if (externalRequested && !truthy.has(normalize(env.ALLOW_EXTERNAL_PROVIDER_PROVISIONING))) {
    failures.push('Provider externo bloqueado: defina explicitamente ALLOW_EXTERNAL_PROVIDER_PROVISIONING=true.');
  }
  if (externalRequested && normalize(env.DEPLOYMENT_ENVIRONMENT) !== 'staging') {
    failures.push('Provider externo só pode executar com DEPLOYMENT_ENVIRONMENT=staging.');
  }
  return [...new Set(failures)];
}

export function assertProvisioningAllowed(request, options) {
  const failures = validateProvisioningRequest(request, options);
  if (failures.length) throw new Error(`Provisionamento bloqueado (fail-closed): ${failures.join(' ')}`);
}

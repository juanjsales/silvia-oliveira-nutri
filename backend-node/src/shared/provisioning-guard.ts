type GuardEnvironment = {
  DEPLOYMENT_ENVIRONMENT?: string;
  ALLOW_EXTERNAL_PROVIDER_PROVISIONING?: boolean;
  PROVIDER_EXECUTION_CONFIRMATION?: string;
  PROTECTED_PRODUCTION_PROJECT_ID?: string;
  PROTECTED_PRODUCTION_DATABASE_ID?: string;
};

export type ProvisioningIntent = {
  operationId: string;
  executeExternalProvider: boolean;
  identifiers: string[];
};

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();

export function validateProvisioningIntent(intent: ProvisioningIntent, env: GuardEnvironment) {
  const failures: string[] = [];
  const protectedIds = [env.PROTECTED_PRODUCTION_PROJECT_ID, env.PROTECTED_PRODUCTION_DATABASE_ID].map(normalize).filter(Boolean);
  if (env.DEPLOYMENT_ENVIRONMENT !== 'staging') failures.push('O provisionamento externo só pode operar em homologação.');
  if (!env.ALLOW_EXTERNAL_PROVIDER_PROVISIONING || !intent.executeExternalProvider) failures.push('A execução do provedor externo não foi autorizada explicitamente.');
  if (!env.PROTECTED_PRODUCTION_PROJECT_ID || !env.PROTECTED_PRODUCTION_DATABASE_ID) failures.push('Os identificadores protegidos da produção são obrigatórios.');
  if (env.PROVIDER_EXECUTION_CONFIRMATION !== `staging:${intent.operationId}`) failures.push('A confirmação não corresponde à operação de homologação.');
  const inspected = intent.identifiers.map(normalize);
  if (protectedIds.some(id => inspected.some(value => value.includes(id)))) failures.push('Um destino protegido da produção foi recusado.');
  return [...new Set(failures)];
}

export function assertProvisioningIntent(intent: ProvisioningIntent, env: GuardEnvironment) {
  const failures = validateProvisioningIntent(intent, env);
  if (failures.length) throw Object.assign(new Error(failures.join(' ')), { statusCode: 422, code: 'PROVISIONING_BLOCKED' });
}

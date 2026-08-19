const secretNames = new Set([
  'APP_ENCRYPTION_KEY',
  'CRON_SECRET',
  'DATABASE_URL',
  'SMTP_PASS',
  'SUPABASE_SERVICE_ROLE_KEY'
]);

function present(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validUrl(value, protocols, allowCredentials = false) {
  try {
    const url = new URL(value);
    return protocols.includes(url.protocol) && (allowCredentials || (!url.username && !url.password));
  } catch {
    return false;
  }
}

export function validateProductionEnv(env) {
  const failures = [];
  const required = ['DATABASE_URL', 'FRONTEND_ORIGIN', 'APP_URL', 'SMTP_FROM', 'APP_ENCRYPTION_KEY', 'CRON_SECRET'];
  for (const name of required) {
    if (!present(env[name])) failures.push(`${name} ausente.`);
  }

  if (present(env.DATABASE_URL) && !validUrl(env.DATABASE_URL, ['postgres:', 'postgresql:'], true)) {
    failures.push('DATABASE_URL deve ser uma URL PostgreSQL válida.');
  }
  for (const name of ['FRONTEND_ORIGIN', 'APP_URL']) {
    if (present(env[name]) && !validUrl(env[name], ['https:'])) failures.push(`${name} deve ser uma URL HTTPS sem credenciais.`);
  }
  for (const name of ['APP_ENCRYPTION_KEY', 'CRON_SECRET']) {
    if (present(env[name]) && env[name].length < 32) failures.push(`${name} deve ter pelo menos 32 caracteres.`);
  }

  const smtp = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const smtpPresent = smtp.filter((name) => present(env[name]));
  if (smtpPresent.length > 0 && smtpPresent.length !== smtp.length) {
    failures.push('SMTP_HOST, SMTP_USER e SMTP_PASS devem ser configuradas em conjunto.');
  }

  const storage = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_EXAMS_BUCKET'];
  const storagePresent = storage.filter((name) => present(env[name]));
  if (storagePresent.length > 0 && storagePresent.length !== storage.length) {
    failures.push('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_EXAMS_BUCKET devem ser configuradas em conjunto.');
  }
  if (present(env.SUPABASE_URL) && !validUrl(env.SUPABASE_URL, ['https:'])) failures.push('SUPABASE_URL deve ser uma URL HTTPS sem credenciais.');

  return failures;
}

export function redactedEnvironmentSummary(env) {
  return Object.keys(env)
    .filter((name) => secretNames.has(name))
    .sort()
    .map((name) => `${name}=<${present(env[name]) ? 'configurado' : 'ausente'}>`);
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href) {
  const failures = validateProductionEnv(process.env);
  if (failures.length) {
    console.error('Ambiente de produção inválido:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log('Ambiente de produção validado sem expor segredos.');
  }
}

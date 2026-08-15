import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const failures = [];
const pass = (message) => console.log(`OK  ${message}`);
const fail = (message) => failures.push(message);

function requireText(source, fragments, description) {
  const absent = fragments.filter((fragment) => !source.includes(fragment));
  if (absent.length) fail(`${description}: ausente ${absent.join(', ')}.`);
  else pass(description);
}

const migrations = (await readdir(resolve(root, 'backend-node/src/database/migrations')))
  .filter((name) => /^\d{3}_.+\.sql$/.test(name))
  .sort();
const latestMigration = migrations.at(-1);
const schemaSource = await read('backend-node/src/database/schema-version.ts');
const expected = schemaSource.match(/(?:REQUIRED_SCHEMA_MIGRATION|LATEST_MIGRATION)\s*=\s*['"]([^'"]+)['"]/)?.[1];
if (!latestMigration) fail('Nenhuma migração SQL foi encontrada.');
else if (expected !== latestMigration) fail(`schema-version aponta para ${expected ?? 'valor ausente'}, mas a última migração é ${latestMigration}.`);
else pass(`Versão do schema alinhada com ${latestMigration}`);

const numbers = migrations.map((name) => Number(name.slice(0, 3)));
const duplicateNumbers = [...new Set(numbers.filter((number, index) => numbers.indexOf(number) !== index))];
const sequenceErrors = numbers.flatMap((number, index) => {
  if (index === 0) return number === 1 ? [] : [`a sequência começa em ${String(number).padStart(3, '0')}`];
  const previous = numbers[index - 1];
  return number === previous + 1 ? [] : [`${String(previous).padStart(3, '0')} -> ${String(number).padStart(3, '0')}`];
});
if (duplicateNumbers.length) fail(`Números de migração duplicados: ${duplicateNumbers.map((number) => String(number).padStart(3, '0')).join(', ')}.`);
if (sequenceErrors.length) fail(`Sequência de migrações inválida: ${sequenceErrors.join(', ')}.`);
if (!duplicateNumbers.length && !sequenceErrors.length) pass('Sequência de migrações contínua e sem duplicatas');

let vercel;
try {
  vercel = JSON.parse(await read('vercel.json'));
} catch (error) {
  fail(`vercel.json inválido: ${error instanceof Error ? error.message : String(error)}.`);
}
if (vercel) {
  if (vercel.outputDirectory !== 'frontend-react/dist') fail('outputDirectory da Vercel deve ser frontend-react/dist.');
  else pass('Diretório de saída da Vercel');
  if (!String(vercel.buildCommand ?? '').includes('backend-node run build')) fail('Build da Vercel não valida o backend.');
  else pass('Build da Vercel inclui frontend e backend');
  if (!String(vercel.buildCommand ?? '').includes('release:env')) fail('Build da Vercel não valida as variáveis de produção.');
  else pass('Build da Vercel valida o ambiente de produção');
  const headers = vercel.headers?.flatMap((rule) => rule.headers ?? []) ?? [];
  const requiredHeaders = ['Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy'];
  const missingHeaders = requiredHeaders.filter((key) => !headers.some((header) => header.key === key));
  if (missingHeaders.length) fail(`Headers de segurança ausentes: ${missingHeaders.join(', ')}.`);
  else pass('Headers de segurança do deploy');
  const rewrites = vercel.rewrites ?? [];
  const requiredRewrites = [
    ['/api/:path*', '/api/[...path]'],
    ['/health', '/api/[...path]'],
    ['/:path*', '/index.html']
  ];
  const missingRewrites = requiredRewrites.filter(([source, destination]) =>
    !rewrites.some((rewrite) => rewrite.source === source && rewrite.destination === destination));
  if (missingRewrites.length) fail(`Rewrites obrigatórios ausentes ou incorretos: ${missingRewrites.map(([source]) => source).join(', ')}.`);
  else pass('Rewrites da API, health check e SPA');
}

const migrationWorkflow = await read('.github/workflows/database-migrations.yml');
requireText(migrationWorkflow, [
  'environment: production',
  'cancel-in-progress: false',
  'db:migrate',
  'db:status',
  'secrets.DATABASE_URL',
  'secrets.MIGRATION_DATABASE_URL'
], 'Workflow de migração protegido e verificável');

const smokeWorkflow = await read('.github/workflows/production-smoke.yml');
requireText(smokeWorkflow, [
  'environment: production',
  'RELEASE_REQUIRE_ENV: "true"',
  'STRICT_SMOKE_AUTH: "true"',
  'secrets.SMOKE_ADMIN_IDENTIFIER',
  'secrets.SMOKE_ADMIN_PASSWORD'
], 'Workflow de smoke autenticado e protegido');

const baseUrl = process.env.SMOKE_BASE_URL?.trim();
if (baseUrl) {
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
      fail('SMOKE_BASE_URL de produção deve usar HTTPS e não pode ser local.');
    } else {
      pass(`URL de produção válida (${url.hostname})`);
    }
  } catch {
    fail('SMOKE_BASE_URL não é uma URL válida.');
  }
}

if (process.env.RELEASE_REQUIRE_ENV === 'true') {
  const required = ['SMOKE_BASE_URL', 'SMOKE_ADMIN_IDENTIFIER', 'SMOKE_ADMIN_PASSWORD'];
  const absent = required.filter((name) => !process.env[name]?.trim());
  if (absent.length) fail(`Variáveis de homologação ausentes: ${absent.join(', ')}.`);
  else pass('Variáveis obrigatórias de homologação presentes');
}

if (failures.length) {
  console.error('\nPreflight de produção reprovado:');
  failures.forEach((message) => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log('\nPreflight de produção aprovado.');
}

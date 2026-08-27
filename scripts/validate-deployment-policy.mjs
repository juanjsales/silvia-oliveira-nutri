import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');

export function validateDeploymentPolicy(policy) {
  const failures = [];
  const production = policy?.canonicalProduction;
  const product = policy?.product;

  if (production?.branch !== 'main') failures.push('A produção canônica deve aceitar somente a branch main.');
  if (production?.environment !== 'production') failures.push('A main deve usar o environment production.');
  if (production?.owner !== 'clinica-silvia') failures.push('A produção canônica deve permanecer sob responsabilidade da clínica Silvia.');
  if (production?.host !== 'silviaoliveira.vercel.app') failures.push('O host canônico da clínica foi alterado.');
  if (production?.automaticPromotion !== false) failures.push('Promoção automática para a produção canônica deve permanecer desativada.');
  if (product?.branch !== 'codex/product-platform') failures.push('A branch permanente do produto deve ser codex/product-platform.');
  if (!Array.isArray(product?.allowedEnvironments) ||
      product.allowedEnvironments.length === 0 ||
      product.allowedEnvironments.some((environment) => !['preview', 'staging'].includes(environment))) {
    failures.push('O produto só pode usar ambientes preview ou staging.');
  }
  if (product?.canonicalProductionPromotion !== 'forbidden') failures.push('A promoção do produto ao domínio canônico deve ser proibida.');
  if (product?.productionDatabaseAccess !== 'forbidden') failures.push('A branch do produto não pode acessar o banco de produção.');
  if (product?.requiredEnvironmentMarker !== 'staging') failures.push('O produto deve exigir marcação explícita de staging.');
  if (!Array.isArray(product?.forbiddenIdentifiers) || !product.forbiddenIdentifiers.includes(production?.host) || !product.forbiddenIdentifiers.includes(production?.owner)) {
    failures.push('Host e proprietário da produção devem constar nos identificadores proibidos do staging.');
  }
  if (production?.branch === product?.branch) failures.push('As branches de produção clínica e produto devem ser distintas.');

  return failures;
}

export function validateWorkflowGuards({ qualityGate, migrations, smoke }) {
  const failures = [];
  if (!qualityGate.includes('- codex/product-platform')) failures.push('Quality gate não observa codex/product-platform.');
  for (const [name, source] of [['migrações', migrations], ['smoke de produção', smoke]]) {
    if (!source.includes("if: github.ref == 'refs/heads/main'")) {
      failures.push(`Workflow de ${name} não está restrito à main.`);
    }
  }
  return failures;
}

async function run() {
  const read = (path) => readFile(resolve(root, path), 'utf8');
  const [policySource, qualityGate, migrations, smoke] = await Promise.all([
    read('.github/deployment-policy.json'),
    read('.github/workflows/quality-gate.yml'),
    read('.github/workflows/database-migrations.yml'),
    read('.github/workflows/production-smoke.yml')
  ]);
  let policy;
  try {
    policy = JSON.parse(policySource);
  } catch (error) {
    console.error(`Política de deploy inválida: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }
  const failures = [
    ...validateDeploymentPolicy(policy),
    ...validateWorkflowGuards({ qualityGate, migrations, smoke })
  ];
  if (failures.length) {
    console.error('Política de isolamento de deploy reprovada:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log('OK  main isolada como produção clínica; produto limitado a preview/staging.');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await run();

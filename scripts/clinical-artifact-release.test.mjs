import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createClinicalReleasePackage, createReleaseCatalog, validateVercelBuildOutput, verifyClinicalReleasePackage, verifyReleaseCatalog } from './clinical-artifact-release.mjs';

const keys = generateKeyPairSync('ed25519');
const privateKey = keys.privateKey.export({ type: 'pkcs8', format: 'pem' });
const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' });

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'clinical-release-'));
  await mkdir(join(root, 'static', 'assets'), { recursive: true });
  await mkdir(join(root, 'functions', 'api.func'), { recursive: true });
  await writeFile(join(root, 'config.json'), JSON.stringify({ version: 3 }));
  await writeFile(join(root, 'static', 'index.html'), '<main>Produto clínico neutro</main>');
  await writeFile(join(root, 'static', 'assets', 'app-immutable.js'), 'console.log("clinical")');
  await writeFile(join(root, 'functions', 'api.func', '.vc-config.json'), JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.js' }));
  await writeFile(join(root, 'functions', 'api.func', 'index.js'), 'export default function handler(){}');
  await writeFile(join(root, 'diagnostics.json'), JSON.stringify({ ignored: true }));
  return root;
}

test('empacota o build clínico de forma determinística e verifica assinatura', async () => {
  const releasePackage = await createClinicalReleasePackage({ vercelOutputDirectory: await fixture(), releaseId: 'clinical-1.0.0', sourceCommit: 'a'.repeat(40), privateKey });
  assert.equal(releasePackage.format, 'kos-clinical-vercel-prebuilt-v2');
  assert.deepEqual(verifyClinicalReleasePackage(releasePackage, publicKey), []);
  assert.ok(releasePackage.entries.some(entry => entry.path === '.vercel/output/static/index.html'));
  assert.ok(releasePackage.entries.some(entry => entry.path.endsWith('/api.func/index.js')));
  assert.equal(releasePackage.entries.some(entry => entry.path.includes('diagnostics')), false);
});

test('catálogo contém somente metadados públicos imutáveis', async () => {
  const releasePackage = await createClinicalReleasePackage({ vercelOutputDirectory: await fixture(), releaseId: 'clinical-1.0.0', sourceCommit: 'b'.repeat(40), privateKey });
  const catalog = createReleaseCatalog({ releasePackage, downloadUrl: 'https://github.com/acme/repo/releases/download/clinical-1.0.0/clinical-artifact.json' });
  assert.deepEqual(verifyReleaseCatalog(catalog), []);
  assert.equal(JSON.stringify(catalog).includes('data'), false);
  assert.equal(catalog.current.fileCount, 5);
});

test('recusa catálogo mutável ou sem integridade', () => {
  assert.ok(verifyReleaseCatalog({ format: 'kos-clinical-release-catalog-v1', current: { releaseId: 'latest', sourceCommit: 'main', artifactDigest: '', downloadUrl: 'http://inseguro', fileCount: 0, totalBytes: 0 } }).length >= 5);
});

test('alteração no pacote publicado é detectada', async () => {
  const releasePackage = await createClinicalReleasePackage({ vercelOutputDirectory: await fixture(), releaseId: 'clinical-1.0.0', sourceCommit: 'c'.repeat(40), privateKey });
  releasePackage.entries[0].data = Buffer.from('adulterado').toString('base64');
  assert.ok(verifyClinicalReleasePackage(releasePackage, publicKey).some(failure => failure.includes('Integridade')));
});

test('recusa pacote sem frontend, backend ou configuração Vercel válida', () => {
  const entries = [{ path: '.vercel/output/config.json', data: Buffer.from('{"version":2}') }];
  const failures = validateVercelBuildOutput(entries);
  assert.ok(failures.some(value => value.includes('version 3')));
  assert.ok(failures.some(value => value.includes('Frontend')));
  assert.ok(failures.some(value => value.includes('backend')));
});

test('limita quantidade e tamanho antes de assinar ou materializar implantação', () => {
  const oversized = [{ path: '.vercel/output/static/index.html', data: Buffer.alloc(25 * 1024 * 1024 + 1) }];
  assert.ok(validateVercelBuildOutput(oversized).some(value => value.includes('25 MiB')));
  const tooMany = Array.from({ length: 2001 }, (_, index) => ({ path: `.vercel/output/static/${index}.txt`, data: Buffer.from('x') }));
  assert.ok(validateVercelBuildOutput(tooMany).some(value => value.includes('2.000')));
});

import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createClinicalReleasePackage, createReleaseCatalog, verifyClinicalReleasePackage, verifyReleaseCatalog } from './clinical-artifact-release.mjs';

const keys = generateKeyPairSync('ed25519');
const privateKey = keys.privateKey.export({ type: 'pkcs8', format: 'pem' });
const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' });

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'clinical-release-'));
  await mkdir(join(root, 'assets'));
  await writeFile(join(root, 'index.html'), '<main>Produto clínico neutro</main>');
  await writeFile(join(root, 'assets', 'app-immutable.js'), 'console.log("clinical")');
  return root;
}

test('empacota o build clínico de forma determinística e verifica assinatura', async () => {
  const releasePackage = await createClinicalReleasePackage({ distDirectory: await fixture(), releaseId: 'clinical-1.0.0', sourceCommit: 'a'.repeat(40), privateKey });
  assert.equal(releasePackage.format, 'kos-clinical-prebuilt-v1');
  assert.deepEqual(verifyClinicalReleasePackage(releasePackage, publicKey), []);
  assert.deepEqual(releasePackage.entries.map(entry => entry.path), ['assets/app-immutable.js', 'index.html']);
});

test('catálogo contém somente metadados públicos imutáveis', async () => {
  const releasePackage = await createClinicalReleasePackage({ distDirectory: await fixture(), releaseId: 'clinical-1.0.0', sourceCommit: 'b'.repeat(40), privateKey });
  const catalog = createReleaseCatalog({ releasePackage, downloadUrl: 'https://github.com/acme/repo/releases/download/clinical-1.0.0/clinical-artifact.json' });
  assert.deepEqual(verifyReleaseCatalog(catalog), []);
  assert.equal(JSON.stringify(catalog).includes('data'), false);
  assert.equal(catalog.current.fileCount, 2);
});

test('recusa catálogo mutável ou sem integridade', () => {
  assert.ok(verifyReleaseCatalog({ format: 'kos-clinical-release-catalog-v1', current: { releaseId: 'latest', sourceCommit: 'main', artifactDigest: '', downloadUrl: 'http://inseguro', fileCount: 0, totalBytes: 0 } }).length >= 5);
});

test('alteração no pacote publicado é detectada', async () => {
  const releasePackage = await createClinicalReleasePackage({ distDirectory: await fixture(), releaseId: 'clinical-1.0.0', sourceCommit: 'c'.repeat(40), privateKey });
  releasePackage.entries[0].data = Buffer.from('adulterado').toString('base64');
  assert.ok(verifyClinicalReleasePackage(releasePackage, publicKey).some(failure => failure.includes('Integridade')));
});

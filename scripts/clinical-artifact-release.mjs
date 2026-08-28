import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSignedArtifactManifest, verifySignedArtifact } from './prebuilt-artifact.mjs';

const sha256 = value => createHash('sha256').update(value).digest('hex');

async function collectFiles(root, directory = root) {
  const entries = [];
  for (const name of (await readdir(directory)).sort()) {
    const absolute = join(directory, name);
    const metadata = await stat(absolute);
    if (metadata.isDirectory()) entries.push(...await collectFiles(root, absolute));
    else if (metadata.isFile()) entries.push({ path: relative(root, absolute).replaceAll('\\', '/'), data: await readFile(absolute) });
  }
  return entries;
}

export async function createClinicalReleasePackage({ distDirectory, releaseId, sourceCommit, privateKey }) {
  const root = resolve(distDirectory);
  const entries = await collectFiles(root);
  const bundle = createSignedArtifactManifest(entries, { releaseId, sourceCommit, privateKey });
  return {
    format: 'kos-clinical-prebuilt-v1',
    bundle,
    entries: entries.map(entry => ({ path: entry.path, data: entry.data.toString('base64') })),
  };
}

export function verifyClinicalReleasePackage(value, publicKey) {
  if (value?.format !== 'kos-clinical-prebuilt-v1' || !Array.isArray(value.entries)) return ['Formato do pacote clínico inválido.'];
  const entries = value.entries.map(entry => ({ path: entry.path, data: Buffer.from(String(entry.data ?? ''), 'base64') }));
  return verifySignedArtifact(value.bundle, entries, publicKey);
}

export function createReleaseCatalog({ releasePackage, downloadUrl }) {
  if (!/^https:\/\/[^\s]+$/i.test(String(downloadUrl ?? ''))) throw new Error('downloadUrl HTTPS obrigatório.');
  const { manifest } = releasePackage.bundle;
  return {
    format: 'kos-clinical-release-catalog-v1',
    generatedAt: new Date().toISOString(),
    current: {
      releaseId: manifest.releaseId,
      sourceCommit: manifest.sourceCommit,
      artifactDigest: releasePackage.bundle.digest,
      downloadUrl,
      fileCount: manifest.files.length,
      totalBytes: manifest.files.reduce((total, file) => total + file.size, 0),
    },
  };
}

export function verifyReleaseCatalog(catalog) {
  const failures = [];
  if (catalog?.format !== 'kos-clinical-release-catalog-v1') failures.push('Formato do catálogo inválido.');
  if (!/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(String(catalog?.current?.releaseId ?? ''))) failures.push('Release do catálogo inválido.');
  if (!/^[a-f0-9]{40}$/i.test(String(catalog?.current?.sourceCommit ?? ''))) failures.push('Commit do catálogo inválido.');
  if (!/^[a-f0-9]{64}$/i.test(String(catalog?.current?.artifactDigest ?? ''))) failures.push('Digest do catálogo inválido.');
  if (!/^https:\/\/[^\s]+$/i.test(String(catalog?.current?.downloadUrl ?? ''))) failures.push('URL do catálogo inválida.');
  if (!Number.isSafeInteger(catalog?.current?.fileCount) || catalog.current.fileCount < 1) failures.push('Quantidade de arquivos inválida.');
  if (!Number.isSafeInteger(catalog?.current?.totalBytes) || catalog.current.totalBytes < 1) failures.push('Tamanho do artefato inválido.');
  return failures;
}

async function runCli() {
  const [command, ...args] = process.argv.slice(2);
  const option = name => { const index = args.indexOf(`--${name}`); return index < 0 ? undefined : args[index + 1]; };
  if (command === 'build') {
    const dist = option('dist'), output = option('output'), releaseId = option('release-id'), sourceCommit = option('source-commit');
    const privateKey = process.env.CLINICAL_ARTIFACT_PRIVATE_KEY;
    if (!dist || !output || !releaseId || !sourceCommit || !privateKey) throw new Error('Use build com --dist, --output, --release-id, --source-commit e CLINICAL_ARTIFACT_PRIVATE_KEY.');
    const releasePackage = await createClinicalReleasePackage({ distDirectory: dist, releaseId, sourceCommit, privateKey });
    await mkdir(resolve(output, '..'), { recursive: true });
    await writeFile(output, JSON.stringify(releasePackage));
    console.log(JSON.stringify({ releaseId, digest: releasePackage.bundle.digest, file: basename(output) }));
    return;
  }
  if (command === 'catalog') {
    const artifact = option('artifact'), output = option('output'), downloadUrl = option('download-url');
    if (!artifact || !output || !downloadUrl) throw new Error('Use catalog com --artifact, --output e --download-url.');
    const releasePackage = JSON.parse(await readFile(artifact, 'utf8'));
    const catalog = createReleaseCatalog({ releasePackage, downloadUrl });
    const failures = verifyReleaseCatalog(catalog);
    if (failures.length) throw new Error(failures.join(' '));
    await writeFile(output, JSON.stringify(catalog, null, 2));
    console.log(JSON.stringify({ releaseId: catalog.current.releaseId, catalogDigest: sha256(JSON.stringify(catalog)) }));
    return;
  }
  throw new Error('Comando esperado: build ou catalog.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runCli();
}

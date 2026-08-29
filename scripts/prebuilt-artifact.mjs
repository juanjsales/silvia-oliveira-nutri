import { createHash, sign, verify } from 'node:crypto';

const hash=(data)=>createHash('sha256').update(data).digest('hex');
const forbiddenPath=/(^|\/)(\.env(?:\.[^/]*)?)|\.(map|ts|tsx|jsx|sql|pem|key)$/i;
const secretPattern=/(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/[^\s]+:[^\s]+@|(?:api[_-]?key|secret|password)\s*[:=]\s*[^\s"']{8,})/i;

export function inspectPrebuiltEntries(entries){
  const failures=[];
  if(!Array.isArray(entries)||entries.length===0)return['O artefato prebuilt está vazio.'];
  const paths=new Set();
  for(const entry of entries){
    const path=String(entry.path??'').replaceAll('\\','/');const data=Buffer.isBuffer(entry.data)?entry.data:Buffer.from(String(entry.data??''));
    if(!path||path.startsWith('/')||path.includes('../'))failures.push(`Caminho inválido: ${path||'<vazio>'}.`);
    if(paths.has(path))failures.push(`Caminho duplicado no artefato: ${path}.`);else paths.add(path);
    const generatedFunctionSource=path.startsWith('.vercel/output/functions/')&&/\.(?:js|cjs|mjs|json|node)$/i.test(path);
    if(forbiddenPath.test(path)||(/(^|\/)src(?:\/|$)/i.test(path)&&!generatedFunctionSource))failures.push(`Arquivo não permitido no artefato prebuilt: ${path}.`);
    if(secretPattern.test(data.toString('utf8')))failures.push(`Possível segredo encontrado no artefato: ${path}.`);
  }
  return failures;
}

export function createSignedArtifactManifest(entries,{releaseId,sourceCommit,privateKey}){
  const failures=inspectPrebuiltEntries(entries);if(failures.length)throw new Error(failures.join(' '));
  if(!/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(String(releaseId??'')))throw new Error('releaseId inválido.');
  if(!/^([a-f0-9]{40}|[a-f0-9]{64})$/i.test(sourceCommit))throw new Error('sourceCommit deve ser imutável e completo.');
  const files=entries.map(entry=>({path:entry.path.replaceAll('\\','/'),size:Buffer.byteLength(entry.data),sha256:hash(entry.data)})).sort((a,b)=>a.path.localeCompare(b.path));
  const manifest={version:1,releaseId,sourceCommit,files};const body=Buffer.from(JSON.stringify(manifest));
  return{manifest,signature:sign(null,body,privateKey).toString('base64url'),digest:hash(body)};
}

export function verifySignedArtifact(bundle,entries,publicKey){
  const failures=inspectPrebuiltEntries(entries);
  if(!bundle||bundle.manifest?.version!==1||!Array.isArray(bundle.manifest?.files))return[...failures,'Formato do manifesto inválido.'];
  const body=Buffer.from(JSON.stringify(bundle.manifest));
  if(bundle.digest!==hash(body))failures.push('Digest do manifesto divergente.');
  try{if(!verify(null,body,publicKey,Buffer.from(String(bundle.signature??''),'base64url')))failures.push('Assinatura do manifesto inválida.')}catch{failures.push('Assinatura do manifesto inválida.')}
  const expected=new Map(bundle.manifest.files.map(file=>[file.path,file]));
  if(expected.size!==entries.length)failures.push('Quantidade de arquivos divergente.');
  for(const entry of entries){const file=expected.get(entry.path.replaceAll('\\','/'));if(!file||file.size!==Buffer.byteLength(entry.data)||file.sha256!==hash(entry.data))failures.push(`Integridade divergente: ${entry.path}.`)}
  return[...new Set(failures)];
}

export function createFakePrebuiltDeployAdapter(){
  const calls=[];return{calls,async deploy(input){calls.push({releaseId:input.bundle.manifest.releaseId,fileCount:input.entries.length,external:false});const failures=verifySignedArtifact(input.bundle,input.entries,input.publicKey);if(failures.length)throw new Error(`Artefato recusado: ${failures.join(' ')}`);return{provider:'FAKE',external:false,status:'READY',deploymentId:`fake-${input.bundle.digest.slice(0,16)}`}}};
}

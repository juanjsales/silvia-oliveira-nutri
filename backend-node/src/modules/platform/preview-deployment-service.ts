import { createHash, verify, type KeyLike } from 'node:crypto';
import type { VercelProvider } from '../../integrations/vercel-provider.js';

export type ArtifactEntry = { path:string; data:Uint8Array };
export type SignedArtifactBundle = {
  manifest:{version:1;releaseId:string;sourceCommit:string;files:Array<{path:string;size:number;sha256:string}>};
  signature:string;digest:string;
};
export type PreviewUploadCapability = {
  uploadFile(input:{accessToken:string;teamId?:string;sha:string;data:Uint8Array}):Promise<void>;
  createPreviewDeployment(input:{accessToken:string;teamId?:string;projectId:string;name:string;files:Array<{file:string;sha:string;size:number}>;metadata:{releaseId:string;sourceCommit:string;artifactDigest:string}}):Promise<{id:string;url:string;status:string}>;
};
export type PreviewLimits={maxFiles:number;maxFileBytes:number;maxTotalBytes:number};
const defaults:PreviewLimits={maxFiles:2_000,maxFileBytes:25*1024*1024,maxTotalBytes:100*1024*1024};
const forbidden=/(^|\/)(\.env(?:\.[^/]*)?|src(?:\/|$))|\.(map|ts|tsx|jsx|sql|pem|key)$/i;
const secret=/(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/[^\s]+:[^\s]+@|(?:api[_-]?key|secret|password)\s*[:=]\s*[^\s"']{8,})/i;
const sha=(algorithm:string,data:Uint8Array)=>createHash(algorithm).update(data).digest('hex');
function normalizedPath(value:string){
  if(!value||value!==value.trim()||value.includes('\\')||value.startsWith('/')||value.includes('\0'))throw new Error('ARTIFACT_INVALID_PATH');
  const parts=value.split('/');if(parts.some(part=>!part||part==='.'||part==='..')||forbidden.test(value))throw new Error('ARTIFACT_FORBIDDEN_PATH');return value;
}

export async function deploySignedPreview(input:{accessToken:string;teamId?:string;projectId:string;projectName:string;bundle:SignedArtifactBundle;entries:ArtifactEntry[];publicKey:KeyLike;limits?:Partial<PreviewLimits>},dependencies:{provider:VercelProvider&PreviewUploadCapability}){
  const limits={...defaults,...input.limits};
  if(!input.entries.length||input.entries.length>limits.maxFiles)throw new Error('ARTIFACT_FILE_LIMIT');
  if(input.bundle.manifest.version!==1||!input.bundle.manifest.releaseId||!/^([a-f0-9]{40}|[a-f0-9]{64})$/i.test(input.bundle.manifest.sourceCommit))throw new Error('ARTIFACT_INVALID_MANIFEST');
  const body=Buffer.from(JSON.stringify(input.bundle.manifest));
  if(sha('sha256',body)!==input.bundle.digest||!verify(null,body,input.publicKey,Buffer.from(input.bundle.signature,'base64url')))throw new Error('ARTIFACT_INVALID_SIGNATURE');
  if(input.bundle.manifest.files.length!==input.entries.length)throw new Error('ARTIFACT_FILE_COUNT_MISMATCH');
  const expected=new Map<string,{size:number;sha256:string}>();
  for(const file of input.bundle.manifest.files){const path=normalizedPath(file.path);if(expected.has(path))throw new Error('ARTIFACT_DUPLICATE_PATH');expected.set(path,{size:file.size,sha256:file.sha256})}
  let total=0;const references:Array<{file:string;sha:string;size:number;sha256:string;data:Uint8Array}>=[];const seenEntries=new Set<string>();
  for(const entry of input.entries){const path=normalizedPath(entry.path);if(seenEntries.has(path))throw new Error('ARTIFACT_DUPLICATE_PATH');seenEntries.add(path);const item=expected.get(path);if(!item)throw new Error('ARTIFACT_UNEXPECTED_FILE');const size=entry.data.byteLength;total+=size;if(size>limits.maxFileBytes||total>limits.maxTotalBytes)throw new Error('ARTIFACT_SIZE_LIMIT');const digest=sha('sha256',entry.data);if(item.size!==size||item.sha256!==digest)throw new Error('ARTIFACT_INTEGRITY_MISMATCH');if(secret.test(Buffer.from(entry.data).toString('utf8')))throw new Error('ARTIFACT_SECRET_DETECTED');references.push({file:path,sha:sha('sha1',entry.data),size,sha256:digest,data:entry.data})}
  const uploads=new Map<string,{sha256:string;data:Uint8Array}>();for(const file of references){const prior=uploads.get(file.sha);if(prior&&prior.sha256!==file.sha256)throw new Error('ARTIFACT_PROVIDER_DIGEST_COLLISION');uploads.set(file.sha,{sha256:file.sha256,data:file.data})}
  const teamScope=input.teamId?{teamId:input.teamId}:{};
  for(const[providerSha,file]of uploads)await dependencies.provider.uploadFile({accessToken:input.accessToken,...teamScope,sha:providerSha,data:file.data});
  const deployment=await dependencies.provider.createPreviewDeployment({accessToken:input.accessToken,...teamScope,projectId:input.projectId,name:input.projectName,files:references.map(({file,sha,size})=>({file,sha,size})),metadata:{releaseId:input.bundle.manifest.releaseId,sourceCommit:input.bundle.manifest.sourceCommit,artifactDigest:input.bundle.digest}});
  return{deploymentId:deployment.id,url:deployment.url,status:deployment.status,uploadedFiles:uploads.size,referencedFiles:references.length};
}

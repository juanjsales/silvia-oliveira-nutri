export const PREVIEW_PUBLIC_KEYS=['APP_URL','FRONTEND_ORIGIN','SESSION_COOKIE_NAME','INSTALLATION_ID','LICENSE_PUBLIC_KEY']as const;
export const PREVIEW_SECRET_KEYS=['DATABASE_URL','MIGRATION_DATABASE_URL','APP_ENCRYPTION_KEY','CRON_SECRET','SMTP_PASS']as const;
type PublicKey=typeof PREVIEW_PUBLIC_KEYS[number];type SecretKey=typeof PREVIEW_SECRET_KEYS[number];
export type PreviewEnvironmentInput={key:PublicKey|SecretKey;target:'preview';value?:string;secretRef?:string};
export type SecretResolver=(reference:string)=>Promise<string>;
const publicKeys=new Set<string>(PREVIEW_PUBLIC_KEYS),secretKeys=new Set<string>(PREVIEW_SECRET_KEYS);
const secretRef=/^vault:\/\/[a-z0-9][a-z0-9/_-]{2,200}$/i;

export async function resolvePreviewEnvironment(input:PreviewEnvironmentInput[],options:{resolveSecret:SecretResolver;forbiddenIdentifiers:string[];installationId:string}){
  const failures:string[]=[],seen=new Set<string>(),resolved:Array<{key:string;value:string;target:['preview'];type:'encrypted'}>=[];
  for(const item of input){
    if(!publicKeys.has(item.key)&&!secretKeys.has(item.key)){failures.push(`ENV_KEY_FORBIDDEN:${item.key}`);continue}
    if(seen.has(item.key)){failures.push(`ENV_KEY_DUPLICATE:${item.key}`);continue}seen.add(item.key);
    if(item.target!=='preview'){failures.push(`ENV_TARGET_FORBIDDEN:${item.key}`);continue}
    const isSecret=secretKeys.has(item.key);
    if(isSecret&&(!item.secretRef||item.value!==undefined||!secretRef.test(item.secretRef))){failures.push(`ENV_SECRET_REFERENCE_REQUIRED:${item.key}`);continue}
    if(!isSecret&&(item.value===undefined||item.secretRef!==undefined)){failures.push(`ENV_PUBLIC_VALUE_REQUIRED:${item.key}`);continue}
    let value:string;try{value=isSecret?await options.resolveSecret(item.secretRef!):item.value!}catch{failures.push(`ENV_SECRET_UNAVAILABLE:${item.key}`);continue}
    if(!value){failures.push(`ENV_VALUE_EMPTY:${item.key}`);continue}
    const normalized=value.toLowerCase();if(options.forbiddenIdentifiers.some(identifier=>normalized.includes(identifier.toLowerCase()))){failures.push(`ENV_PRODUCTION_IDENTIFIER:${item.key}`);continue}
    if(item.key==='INSTALLATION_ID'&&value!==options.installationId){failures.push('ENV_INSTALLATION_MISMATCH:INSTALLATION_ID');continue}
    if((item.key==='APP_URL'||item.key==='FRONTEND_ORIGIN')){try{const url=new URL(value);if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash)throw new Error()}catch{failures.push(`ENV_ORIGIN_INVALID:${item.key}`);continue}}
    if((item.key==='DATABASE_URL'||item.key==='MIGRATION_DATABASE_URL')&&!/^postgres(?:ql)?:\/\//i.test(value)){failures.push(`ENV_DATABASE_INVALID:${item.key}`);continue}
    resolved.push({key:item.key,value,target:['preview'],type:'encrypted'});
  }
  if(failures.length)throw Object.assign(new Error('Preview environment recusado.'),{code:'PREVIEW_ENV_REJECTED',failures});
  return resolved;
}

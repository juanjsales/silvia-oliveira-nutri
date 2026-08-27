export type PreviewSmokeResult={passed:boolean;checks:Array<{code:string;passed:boolean}>};
type SmokeEnvironment={PROTECTED_PRODUCTION_PROJECT_ID?:string|undefined;PROTECTED_PRODUCTION_DATABASE_ID?:string|undefined};

export async function smokePreview(url:string,{fetcher=fetch,env={}}:{fetcher?:typeof fetch;env?:SmokeEnvironment}={}):Promise<PreviewSmokeResult>{
  const parsed=new URL(url),protectedValues=[env.PROTECTED_PRODUCTION_PROJECT_ID,env.PROTECTED_PRODUCTION_DATABASE_ID].filter(Boolean).map(v=>v!.toLowerCase());
  if(parsed.protocol!=='https:'||parsed.pathname!=='/'||parsed.search||parsed.hash||!parsed.hostname.endsWith('.vercel.app')||protectedValues.some(v=>parsed.hostname.toLowerCase().includes(v)))throw Object.assign(new Error('URL de preview recusada.'),{code:'PREVIEW_URL_FORBIDDEN'});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10_000);
  try{const response=await fetcher(new URL('/health',parsed),{signal:controller.signal,redirect:'error',headers:{accept:'application/json'}});let body:unknown;try{body=await response.json()}catch{body=null}const record=body&&typeof body==='object'?body as Record<string,unknown>:{};const checks=[{code:'HTTPS_PREVIEW_HOST',passed:true},{code:'HEALTH_HTTP_200',passed:response.status===200},{code:'HEALTH_READY',passed:record.status==='ok'||record.status==='ready'}];return{passed:checks.every(check=>check.passed),checks}}finally{clearTimeout(timer)}
}

export type VercelScope={teamId?:string;configurationId?:string};
export type VercelToken={accessToken:string;accountId:string;teamId?:string;configurationId?:string};
export type VercelProject={id:string;name:string};export type VercelDeployment={id:string;url:string;status:string};
type Auth=VercelScope&{accessToken:string};
export interface VercelProvider{
 authorizationUrl(input:{state:string;codeChallenge:string;configurationId?:string}):Promise<string>;
 exchangeCode(input:{code:string;codeVerifier:string;configurationId?:string}):Promise<VercelToken>;
 createProject(input:Auth&{name:string}):Promise<VercelProject>;
 getProject(input:Auth&{projectId:string}):Promise<VercelProject|null>;
 revoke(input:Auth):Promise<void>;
 getAccount?(input:Auth):Promise<{id:string;email?:string}>;
 checkProjectName?(input:Auth&{name:string}):Promise<boolean>;
 uploadDeploymentFile?(input:Auth&{sha:string;bytes:Uint8Array}):Promise<void>;
 setEnvironmentVariables?(input:Auth&{projectId:string;variables:Array<{key:string;value:string;target:Array<'production'|'preview'|'development'>}>}):Promise<void>;
 createPrebuiltDeployment?(input:Auth&{projectId:string;name:string;files:Array<{file:string;sha:string;size:number}>}):Promise<VercelDeployment>;
 getDeployment?(input:Auth&{deploymentId:string}):Promise<VercelDeployment|null>;
 addDomain?(input:Auth&{projectId:string;domain:string}):Promise<{name:string;verified:boolean}>;
 rollback?(input:Auth&{projectId:string;deploymentId:string}):Promise<void>;
}
const off=async()=>{throw Object.assign(new Error('Integração Vercel não configurada.'),{code:'PROVIDER_DISABLED'})};
export const disabledVercelProvider:VercelProvider={authorizationUrl:off,exchangeCode:off,createProject:off,getProject:off,revoke:off,getAccount:off,checkProjectName:off,uploadDeploymentFile:off,setEnvironmentVariables:off,createPrebuiltDeployment:off,getDeployment:off,addDomain:off,rollback:off};

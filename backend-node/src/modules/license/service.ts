import { verify } from 'node:crypto';
import type { Database } from '../../database/pool.js';

export type LicenseState='DISABLED'|'ACTIVE'|'GRACE'|'READ_ONLY'|'INVALID';
export type LicenseResult={state:LicenseState;permissions:('read'|'write'|'export')[];expiresAt?:string;graceUntil?:string};
const decode=(value:string)=>Buffer.from(value,'base64url');

export function validateInstalledLicense(token:string,publicKey:string,installationId:string,now=new Date()):LicenseResult{
  try{
    const[body,signature,extra]=token.split('.');
    if(!body||!signature||extra||!verify(null,Buffer.from(body),publicKey,decode(signature)))return{state:'INVALID',permissions:[]};
    const claims=JSON.parse(decode(body).toString('utf8'));
    const issued=Date.parse(claims.issuedAt),expires=Date.parse(claims.expiresAt),grace=Date.parse(claims.graceUntil),current=now.getTime();
    if(claims.version!==1||claims.tenantId!==installationId||![issued,expires,grace].every(Number.isFinite)||issued>expires||expires>grace||current<issued)return{state:'INVALID',permissions:[]};
    if(current<=expires)return{state:'ACTIVE',permissions:['read','write','export'],expiresAt:claims.expiresAt,graceUntil:claims.graceUntil};
    if(current<=grace)return{state:'GRACE',permissions:['read','write','export'],expiresAt:claims.expiresAt,graceUntil:claims.graceUntil};
    return{state:'READ_ONLY',permissions:['read','export'],expiresAt:claims.expiresAt,graceUntil:claims.graceUntil};
  }catch{return{state:'INVALID',permissions:[]}}
}

export async function loadLicenseState(db:Database,publicKey?:string,installationId?:string,now=new Date()):Promise<LicenseResult>{
  if(!publicKey||!installationId)return{state:'DISABLED',permissions:['read','write','export']};
  const row=(await db.query<{token:string}>('SELECT token FROM installation_license WHERE singleton=true')).rows[0];
  return row?validateInstalledLicense(row.token,publicKey,installationId,now):{state:'INVALID',permissions:[]};
}

export const isExportRequest=(method:string,url:string)=>method==='GET'&&url.split('?')[0]==='/api/privacy/export';
export const isLicenseWriteExempt=(method:string,url:string)=>{
  const path=url.split('?')[0]!;
  return path.startsWith('/api/auth/')||path==='/api/license/install';
};

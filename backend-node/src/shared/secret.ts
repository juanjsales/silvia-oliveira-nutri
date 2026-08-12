import{createCipheriv,createDecipheriv,createHash,randomBytes}from'node:crypto';
const key=(secret:string)=>createHash('sha256').update(secret).digest();
export function encryptSecret(value:string,secret:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(secret),iv),encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]),tag=cipher.getAuthTag();return[iv,tag,encrypted].map(v=>v.toString('base64url')).join('.')}
export function decryptSecret(value:string,secret:string){const[iv,tag,encrypted]=value.split('.').map(v=>Buffer.from(v!,'base64url'));const decipher=createDecipheriv('aes-256-gcm',key(secret),iv!);decipher.setAuthTag(tag!);return Buffer.concat([decipher.update(encrypted!),decipher.final()]).toString('utf8')}

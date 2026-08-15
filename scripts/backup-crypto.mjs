import { createCipheriv, createDecipheriv, randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { open, rename, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';

const scrypt=promisify(scryptCallback),MAGIC=Buffer.from('NUTRIBACKUP1'),mode=process.argv[2],source=process.argv[3],target=process.argv[4],password=process.env.BACKUP_PASSPHRASE;
if(!['encrypt','decrypt'].includes(mode)||!source||!target||!password||password.length<16)throw new Error('Uso: backup-crypto.mjs encrypt|decrypt origem destino. BACKUP_PASSPHRASE deve ter ao menos 16 caracteres.');
const temporary=`${target}.partial`;
try{
  if(mode==='encrypt'){const salt=randomBytes(16),iv=randomBytes(12),key=await scrypt(password,salt,32),cipher=createCipheriv('aes-256-gcm',key,iv),out=createWriteStream(temporary);out.write(Buffer.concat([MAGIC,salt,iv]));await pipeline(createReadStream(source),cipher,out);const handle=await open(temporary,'a');await handle.write(cipher.getAuthTag());await handle.close()}
  else{const handle=await open(source,'r'),stat=await handle.stat(),header=Buffer.alloc(MAGIC.length+28),tag=Buffer.alloc(16);await handle.read(header,0,header.length,0);await handle.read(tag,0,16,stat.size-16);await handle.close();if(!header.subarray(0,MAGIC.length).equals(MAGIC))throw new Error('Arquivo de backup inválido.');const salt=header.subarray(MAGIC.length,MAGIC.length+16),iv=header.subarray(MAGIC.length+16),key=await scrypt(password,salt,32),decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAuthTag(tag);await pipeline(createReadStream(source,{start:header.length,end:stat.size-17}),decipher,createWriteStream(temporary))}
  await rename(temporary,target);
}catch(error){await rm(temporary,{force:true});throw error}

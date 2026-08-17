import { createSign } from 'node:crypto';
import type { AppEnv } from '../config/env.js';

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

export function jaasRoomUrl(env: AppEnv, input: { room: string; userId: string; name: string; moderator: boolean; expiresAt: number }) {
  if (!env.JAAS_APP_ID || !env.JAAS_KEY_ID || !env.JAAS_PRIVATE_KEY) return null;
  const now = Math.floor(Date.now() / 1000);
  const kid = env.JAAS_KEY_ID.startsWith(`${env.JAAS_APP_ID}/`) ? env.JAAS_KEY_ID : `${env.JAAS_APP_ID}/${env.JAAS_KEY_ID}`;
  const header = encode({ alg: 'RS256', kid, typ: 'JWT' });
  const payload = encode({
    aud: 'jitsi', iss: 'chat', sub: env.JAAS_APP_ID, room: input.room,
    nbf: now - 10, exp: input.expiresAt,
    context: { features: { recording: false, livestreaming: false, transcription: false }, user: { id: input.userId, name: input.name, moderator: input.moderator } }
  });
  const unsigned = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256').update(unsigned).end().sign(env.JAAS_PRIVATE_KEY.replace(/\\n/g, '\n')).toString('base64url');
  return `https://8x8.vc/${env.JAAS_APP_ID}/${encodeURIComponent(input.room)}?jwt=${unsigned}.${signature}`;
}

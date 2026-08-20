import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEnv } from '../src/config/env.js';

const base = {
  NODE_ENV:'test', DATABASE_URL:'postgres://test:test@localhost/test',
  FRONTEND_ORIGIN:'http://localhost:5173', APP_URL:'http://localhost:5173',
  SMTP_FROM:'Nutri <teste@example.com>',
};

test('signaling is optional for the explicit compatibility fallback', () => {
  const env = loadEnv(base);
  assert.equal(env.WEBRTC_SIGNALING_HOST, undefined);
});

test('managed PeerJS signaling configuration is parsed without secrets', () => {
  const env = loadEnv({
    ...base,
    WEBRTC_SIGNALING_HOST:'peer.example.com',
    WEBRTC_SIGNALING_PORT:'443',
    WEBRTC_SIGNALING_PATH:'/peerjs',
    WEBRTC_SIGNALING_SECURE:'true',
  });
  assert.equal(env.WEBRTC_SIGNALING_HOST, 'peer.example.com');
  assert.equal(env.WEBRTC_SIGNALING_PORT, 443);
  assert.equal(env.WEBRTC_SIGNALING_PATH, '/peerjs');
  assert.equal(env.WEBRTC_SIGNALING_SECURE, true);
});

test('signaling options without a host are rejected', () => {
  assert.throws(() => loadEnv({ ...base, WEBRTC_SIGNALING_PATH:'/peerjs' }), /WEBRTC_SIGNALING_HOST/);
});

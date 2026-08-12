import test from 'node:test';import assert from 'node:assert/strict';import{loadEnv}from'../src/config/env.js';
const base={NODE_ENV:'test',DATABASE_URL:'postgres://test:test@localhost/test',FRONTEND_ORIGIN:'http://localhost:5173',APP_URL:'http://localhost:5173',SMTP_FROM:'Nutri <teste@example.com>'};
test('environment applies secure operational defaults',()=>{const env=loadEnv(base);assert.equal(env.SESSION_TTL_HOURS,6);assert.equal(env.PASSWORD_RESET_TTL_MINUTES,30);assert.equal(env.SESSION_COOKIE_NAME,'nutri_session')});
test('environment rejects incomplete configuration',()=>{assert.throws(()=>loadEnv({NODE_ENV:'test'}),/DATABASE_URL/)});
test('environment rejects invalid public origins',()=>{assert.throws(()=>loadEnv({...base,FRONTEND_ORIGIN:'not-a-url'}),/FRONTEND_ORIGIN/)});

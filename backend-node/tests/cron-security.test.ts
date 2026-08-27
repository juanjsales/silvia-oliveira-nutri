import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const base: AppEnv = {NODE_ENV:'test',PORT:3000,HOST:'127.0.0.1',DATABASE_URL:'postgres://test',DB_POOL_MAX:2,DB_CONNECTION_TIMEOUT_MS:10000,DB_IDLE_TIMEOUT_MS:10000,FRONTEND_ORIGIN:'http://localhost:5173',SESSION_COOKIE_NAME:'nutri_session',SESSION_TTL_HOURS:6,PASSWORD_RESET_TTL_MINUTES:30,PATIENT_INVITATION_TTL_HOURS:24,APP_URL:'http://localhost:5173',SMTP_PORT:587,SMTP_SECURE:false,SMTP_FROM:'test@example.com'};
const db={query:async()=>({rows:[],rowCount:0})};

test('appointment reminder job is unavailable without a cron secret',async()=>{const app=await buildApp(base,db as never);const response=await app.inject({method:'GET',url:'/api/cron/appointment-reminders'});assert.equal(response.statusCode,503);await app.close()});

test('appointment reminder job rejects an invalid bearer secret',async()=>{const env={...base,CRON_SECRET:'a'.repeat(32)};const app=await buildApp(env,db as never);const response=await app.inject({method:'GET',url:'/api/cron/appointment-reminders',headers:{authorization:`Bearer ${'b'.repeat(32)}`}});assert.equal(response.statusCode,401);await app.close()});

test('appointment reminder job accepts the configured Vercel secret',async()=>{const secret='a'.repeat(32);const env={...base,CRON_SECRET:secret};const app=await buildApp(env,db as never);const response=await app.inject({method:'GET',url:'/api/cron/appointment-reminders',headers:{authorization:`Bearer ${secret}`}});assert.equal(response.statusCode,200);assert.deepEqual(response.json().data,{scheduled:0,sent:0,failed:0});await app.close()});

test('cron responses are not cacheable and malformed authorization is rejected',async()=>{const secret='a'.repeat(32);const env={...base,CRON_SECRET:secret};const app=await buildApp(env,db as never);const response=await app.inject({method:'GET',url:'/api/cron/appointment-reminders',headers:{authorization:secret}});assert.equal(response.statusCode,401);assert.equal(response.headers['cache-control'],'no-store');await app.close()});

test('database prune uses the same cron protection',async()=>{const secret='a'.repeat(32);const env={...base,CRON_SECRET:secret};const app=await buildApp(env,db as never);const unavailable=await app.inject({method:'GET',url:'/api/cron/database-prune'});assert.equal(unavailable.statusCode,401);const invalid=await app.inject({method:'GET',url:'/api/cron/database-prune',headers:{authorization:`Bearer ${'b'.repeat(31)}`}});assert.equal(invalid.statusCode,401);assert.equal(invalid.headers['cache-control'],'no-store');await app.close()});

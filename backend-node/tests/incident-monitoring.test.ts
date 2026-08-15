import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';

const env:AppEnv={NODE_ENV:'test',PORT:3000,HOST:'127.0.0.1',DATABASE_URL:'postgres://test',DB_POOL_MAX:2,DB_CONNECTION_TIMEOUT_MS:10000,DB_IDLE_TIMEOUT_MS:10000,FRONTEND_ORIGIN:'http://localhost:5173',SESSION_COOKIE_NAME:'nutri_session',SESSION_TTL_HOURS:6,PASSWORD_RESET_TTL_MINUTES:30,APP_URL:'http://localhost:5173',SMTP_PORT:587,SMTP_SECURE:false,SMTP_FROM:'test@example.com'};

test('unexpected API failures return a reference and create a sanitized incident',async()=>{let incidentParams:unknown[]|undefined;const db={query:async(sql:string,params?:unknown[])=>{if(sql.includes('INSERT INTO system_incidents')){incidentParams=params;return{rows:[]}}throw Object.assign(new Error('sensitive database detail'),{code:'XX001'})}};const app=await buildApp(env,db as never);const response=await app.inject({method:'GET',url:'/api/settings/public'});assert.equal(response.statusCode,500);assert.ok(response.json().requestId);assert.equal(incidentParams?.[1],'GET');assert.equal(incidentParams?.[2],'/api/settings/public');assert.equal(incidentParams?.[3],'Error');assert.equal(incidentParams?.[4],'XX001');assert.equal(JSON.stringify(incidentParams).includes('sensitive database detail'),false);await app.close()});

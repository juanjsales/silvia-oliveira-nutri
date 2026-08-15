import type { FastifyRequest } from 'fastify';
import type { Database } from '../database/pool.js';

export async function recordIncident(db:Database,request:FastifyRequest,error:unknown) {
  const name=error instanceof Error?error.name:'UnknownError';
  const code=typeof error==='object'&&error!==null&&'code'in error?String(error.code).slice(0,80):null;
  await db.query(`INSERT INTO system_incidents(request_id,method,route,error_name,error_code,user_id)
    VALUES($1,$2,$3,$4,$5,$6)`,[request.id,request.method,request.routeOptions.url||'unknown',name.slice(0,120),code,request.auth?.userId||null]);
}

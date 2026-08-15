import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';

export async function monitoringRoutes(app:FastifyInstance) {
  app.addHook('preHandler',app.requireAdmin);
  app.get('/incidents',async()=>{const result=await app.db.query(`SELECT id,request_id AS "requestId",method,route,error_name AS "errorName",error_code AS "errorCode",occurred_at AS "occurredAt",resolved_at AS "resolvedAt" FROM system_incidents ORDER BY occurred_at DESC LIMIT 50`);return{data:result.rows}});
  app.patch('/incidents/:id/resolve',async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params);const result=await app.db.query(`UPDATE system_incidents SET resolved_at=now(),resolved_by=$1 WHERE id=$2 AND resolved_at IS NULL RETURNING id`,[request.auth!.userId,id]);if(!result.rows[0])return reply.code(404).send({error:'Incidente não encontrado ou já resolvido.'});await audit(app.db,'SYSTEM_INCIDENT_RESOLVED','system_incident',{actorUserId:request.auth!.userId,entityId:id});return{data:{id}}});
}

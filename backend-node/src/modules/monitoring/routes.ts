import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';
import { getDatabaseStorageStats, runDatabasePrune } from '../../shared/maintenance.js';

export async function monitoringRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/incidents', async () => {
    const result = await app.db.query(
      `SELECT id, request_id AS "requestId", method, route, error_name AS "errorName", error_code AS "errorCode", occurred_at AS "occurredAt", resolved_at AS "resolvedAt" FROM system_incidents ORDER BY occurred_at DESC LIMIT 50`
    );
    return { data: result.rows };
  });

  app.patch('/incidents/:id/resolve', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const result = await app.db.query(
      `UPDATE system_incidents SET resolved_at=now(), resolved_by=$1 WHERE id=$2 AND resolved_at IS NULL RETURNING id`,
      [request.auth!.userId, id]
    );
    if (!result.rows[0])
      return reply
        .code(404)
        .send({ error: 'Incidente não encontrado ou já resolvido.' });
    await audit(app.db, 'SYSTEM_INCIDENT_RESOLVED', 'system_incident', {
      actorUserId: request.auth!.userId,
      entityId: id,
    });
    return { data: { id } };
  });

  app.post('/incidents/resolve-all', async (request) => {
    const result = await app.db.query(
      `UPDATE system_incidents SET resolved_at=now(), resolved_by=$1 WHERE resolved_at IS NULL RETURNING id`,
      [request.auth!.userId]
    );
    await audit(app.db, 'SYSTEM_ALL_INCIDENTS_RESOLVED', 'system_incident', {
      actorUserId: request.auth!.userId,
      metadata: { count: result.rowCount },
    });
    return {
      message: `${result.rowCount || 0} incidentes marcados como resolvidos.`,
    };
  });

  app.get('/maintenance/stats', async () => {
    const stats = await getDatabaseStorageStats(app.db);
    return { data: stats };
  });

  app.post('/maintenance/prune', async (request) => {
    const result = await runDatabasePrune(app.db);
    await audit(app.db, 'DATABASE_MAINTENANCE_PRUNED', 'system', {
      actorUserId: request.auth!.userId,
      metadata: result,
    });
    return {
      message: `Faxina concluída com sucesso! ${result.totalPruned} registros temporários foram eliminados.`,
      data: result,
    };
  });
}

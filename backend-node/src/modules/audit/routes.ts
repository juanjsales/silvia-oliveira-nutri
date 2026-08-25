import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';

const querySchema = z.object({
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(200).optional(),
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function auditRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/', async request => {
    const query = querySchema.parse(request.query);
    const result = await app.db.query<{
      id: number; actorUserId: string | null; actorEmail: string | null; action: string;
      entityType: string; entityId: string | null; metadata: Record<string, unknown>; createdAt: Date;
    }>(
      `SELECT a.id, a.actor_user_id AS "actorUserId", u.email AS "actorEmail",
              a.action, a.entity_type AS "entityType", a.entity_id AS "entityId",
              a.metadata, a.created_at AS "createdAt"
         FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id
        WHERE ($1::text IS NULL OR a.action=$1)
          AND ($2::text IS NULL OR a.entity_type=$2)
          AND ($3::text IS NULL OR a.entity_id=$3)
          AND ($4::bigint IS NULL OR a.id < $4)
        ORDER BY a.id DESC LIMIT $5`,
      [query.action ?? null, query.entityType ?? null, query.entityId ?? null, query.cursor ?? null, query.limit]
    );
    await audit(app.db, 'AUDIT_LOG_VIEWED', 'audit_log', {
      actorUserId: request.auth!.userId,
      metadata: { action: query.action, entityType: query.entityType, entityId: query.entityId, resultCount: result.rows.length },
    });
    return { data: result.rows, nextCursor: result.rows[result.rows.length - 1]?.id ?? null };
  });
}

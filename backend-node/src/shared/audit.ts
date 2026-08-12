import type { Database } from '../database/pool.js';

export async function audit(
  db: Database,
  action: string,
  entityType: string,
  options: { actorUserId?: string; entityId?: string; metadata?: Record<string, unknown> } = {}
) {
  await db.query(
    `INSERT INTO audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [options.actorUserId ?? null, action, entityType, options.entityId ?? null, options.metadata ?? {}]
  );
}

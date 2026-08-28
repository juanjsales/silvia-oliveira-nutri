import type { Database } from './pool.js';

export const REQUIRED_SCHEMA_MIGRATION = '045_detox_silvia_weekly_template.sql';

export async function schemaStatus(db: Database) {
  try {
    const result = await db.query<{ appliedAt: Date }>(
      `SELECT applied_at AS "appliedAt"
       FROM schema_migrations
       WHERE filename = $1`,
      [REQUIRED_SCHEMA_MIGRATION]
    );

    return {
      ready: Boolean(result.rows[0]),
      requiredMigration: REQUIRED_SCHEMA_MIGRATION,
      appliedAt: result.rows[0]?.appliedAt ?? null
    };
  } catch {
    return {
      ready: false,
      requiredMigration: REQUIRED_SCHEMA_MIGRATION,
      appliedAt: null
    };
  }
}

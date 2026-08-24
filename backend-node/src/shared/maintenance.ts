import type { Database } from '../database/pool.js';

export type PruneResult = {
  sessionsPruned: number;
  tokensPruned: number;
  rateLimitsPruned: number;
  incidentsPruned: number;
  notificationsPruned: number;
  requestsPruned: number;
  outboxPruned: number;
  totalPruned: number;
  executedAt: string;
};

export type DatabaseStorageStats = {
  dbSizeBytes: number;
  dbSizeFormatted: string;
  totalPatients: number;
  totalEncounters: number;
  totalExams: number;
  temporaryRowsCount: number;
  tablesStats: Array<{ tableName: string; rowCount: number; totalSizeBytes: number; totalSizeFormatted: string }>;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function runDatabasePrune(db: Database): Promise<PruneResult> {
  const [
    sessions,
    tokens,
    rateLimits,
    incidents,
    notifications,
    requests,
    outbox,
  ] = await Promise.all([
    db.query(`DELETE FROM sessions WHERE expires_at < now() RETURNING 1`),
    db.query(`DELETE FROM password_reset_tokens WHERE expires_at < now() RETURNING 1`),
    db.query(`DELETE FROM auth_rate_limits WHERE updated_at < now() - INTERVAL '2 days' RETURNING 1`),
    db.query(`DELETE FROM system_incidents WHERE resolved_at IS NOT NULL AND occurred_at < now() - INTERVAL '15 days' RETURNING 1`),
    db.query(`DELETE FROM patient_notifications WHERE expires_at < now() OR (read_at IS NOT NULL AND created_at < now() - INTERVAL '45 days') RETURNING 1`),
    db.query(`DELETE FROM professional_notifications WHERE status IN ('RESOLVED','ARCHIVED') AND updated_at < now() - INTERVAL '90 days' RETURNING 1`).catch(() => ({ rowCount: 0 })),
    db.query(`DELETE FROM appointment_requests WHERE status IN ('APPROVED', 'DECLINED') AND created_at < now() - INTERVAL '60 days' RETURNING 1`),
    db.query(`DELETE FROM appointment_email_outbox WHERE status = 'SENT' AND sent_at < now() - INTERVAL '30 days' RETURNING 1`).catch(() => ({ rowCount: 0 })),
  ]);

  const sCount = sessions.rowCount || 0;
  const tCount = tokens.rowCount || 0;
  const rCount = rateLimits.rowCount || 0;
  const iCount = incidents.rowCount || 0;
  const nCount = notifications.rowCount || 0;
  const reqCount = requests.rowCount || 0;
  const oCount = outbox.rowCount || 0;

  return {
    sessionsPruned: sCount,
    tokensPruned: tCount,
    rateLimitsPruned: rCount,
    incidentsPruned: iCount,
    notificationsPruned: nCount,
    requestsPruned: reqCount,
    outboxPruned: oCount,
    totalPruned: sCount + tCount + rCount + iCount + nCount + reqCount + oCount,
    executedAt: new Date().toISOString(),
  };
}

export async function getDatabaseStorageStats(db: Database): Promise<DatabaseStorageStats> {
  const [
    dbSizeRes,
    patientsRes,
    encountersRes,
    examsRes,
    tempRowsRes,
    tablesRes,
  ] = await Promise.all([
    db.query<{ size: string }>(`SELECT pg_database_size(current_database()) AS size`),
    db.query<{ count: string }>(`SELECT count(*) AS count FROM patients`),
    db.query<{ count: string }>(`SELECT count(*) AS count FROM clinical_encounters`),
    db.query<{ count: string }>(`SELECT count(*) AS count FROM patient_exam_uploads`),
    db.query<{ count: string }>(`
      SELECT (
        (SELECT count(*) FROM sessions WHERE expires_at < now()) +
        (SELECT count(*) FROM password_reset_tokens WHERE expires_at < now()) +
        (SELECT count(*) FROM system_incidents WHERE resolved_at IS NOT NULL) +
        (SELECT count(*) FROM patient_notifications WHERE expires_at < now() OR read_at IS NOT NULL)
      ) AS count
    `),
    db.query<{ relname: string; n_live_tup: string; total_bytes: string }>(`
      SELECT
        c.relname,
        c.reltuples::bigint AS n_live_tup,
        pg_total_relation_size(c.oid) AS total_bytes
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY pg_total_relation_size(c.oid) DESC
      LIMIT 12
    `),
  ]);

  const dbSizeBytes = Number(dbSizeRes.rows[0]?.size || 0);

  const tablesStats = tablesRes.rows.map((r) => {
    const bytes = Number(r.total_bytes || 0);
    return {
      tableName: r.relname,
      rowCount: Math.max(0, Number(r.n_live_tup || 0)),
      totalSizeBytes: bytes,
      totalSizeFormatted: formatBytes(bytes),
    };
  });

  return {
    dbSizeBytes,
    dbSizeFormatted: formatBytes(dbSizeBytes),
    totalPatients: Number(patientsRes.rows[0]?.count || 0),
    totalEncounters: Number(encountersRes.rows[0]?.count || 0),
    totalExams: Number(examsRes.rows[0]?.count || 0),
    temporaryRowsCount: Number(tempRowsRes.rows[0]?.count || 0),
    tablesStats,
  };
}

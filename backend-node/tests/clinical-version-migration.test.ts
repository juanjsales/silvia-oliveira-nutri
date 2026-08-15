import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

test('clinical history migration is idempotent and backfills existing sections', async () => {
  const migration=fileURLToPath(new URL('../src/database/migrations/023_clinical_versions_email_outbox.sql',import.meta.url));
  const sql=await readFile(migration,'utf8');
  assert.match(sql,/CREATE TABLE IF NOT EXISTS clinical_section_versions/);
  assert.match(sql,/DROP TRIGGER IF EXISTS clinical_sections_preserve_version/);
  assert.match(sql,/WHERE NOT EXISTS \(SELECT 1 FROM clinical_section_versions/);
  assert.match(sql,/pg_advisory_xact_lock/);
  assert.match(sql,/deduplication_key text NOT NULL UNIQUE/);
  assert.match(sql,/ADD COLUMN IF NOT EXISTS processing_started_at/);
});

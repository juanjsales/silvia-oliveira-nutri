import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('video broadcast migration provides shared expiring storage', async () => {
  const sql = await readFile(
    new URL('../src/database/migrations/028_persistent_video_broadcasts.sql', import.meta.url),
    'utf8',
  );

  assert.match(sql, /CREATE TABLE IF NOT EXISTS video_broadcasts/);
  assert.match(sql, /patient_id uuid NOT NULL REFERENCES patients\(id\) ON DELETE CASCADE/);
  assert.match(sql, /state jsonb NOT NULL/);
  assert.match(sql, /expires_at timestamptz NOT NULL/);
  assert.match(sql, /video_broadcasts_expiry_idx/);
});

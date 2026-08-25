import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('teleconsultation migration persists authoritative sessions, opaque tokens and ordered events', async () => {
  const sql = await readFile(new URL('../src/database/migrations/031_teleconsultation_sessions.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS teleconsultation_sessions/i);
  assert.match(sql, /CHECK \(state IN/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS teleconsultation_join_tokens/i);
  assert.match(sql, /token_hash text PRIMARY KEY/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS teleconsultation_events/i);
  assert.match(sql, /sequence bigserial PRIMARY KEY/i);
  assert.doesNotMatch(sql, /openrelay|credential\s*=/i);
});

test('teleconsultation consent migration records a versioned patient acknowledgement', async () => {
  const sql = await readFile(new URL('../src/database/migrations/039_teleconsultation_consent.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS teleconsultation_consents/i);
  assert.match(sql, /UNIQUE\(patient_id, source_id, notice_version\)/i);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/i);
});

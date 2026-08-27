import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../src/database/migrations/045_staff_management_foundation.sql', import.meta.url);

test('staff migration is additive and links profiles and invitations to RBAC', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /CREATE TABLE staff_profiles\s*\([\s\S]*user_id uuid NOT NULL UNIQUE REFERENCES users\(id\)/);
  assert.match(sql, /CREATE TABLE staff_invites\s*\([\s\S]*role_id uuid NOT NULL REFERENCES roles\(id\)/);
  assert.match(sql, /invited_by uuid NOT NULL REFERENCES users\(id\)/);
  assert.match(sql, /accepted_by_user_id uuid REFERENCES users\(id\)/);
  assert.doesNotMatch(sql, /ALTER TABLE users/);
  assert.doesNotMatch(sql, /DROP (?:TABLE|COLUMN|TYPE)/i);
});

test('staff invitations enforce expiration, lifecycle consistency and one pending invite per email', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /status IN \('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED'\)/);
  assert.match(sql, /expires_at > created_at/);
  assert.match(sql, /staff_invites_acceptance_consistent/);
  assert.match(sql, /staff_invites_cancellation_consistent/);
  assert.match(sql, /CREATE UNIQUE INDEX staff_invites_pending_email_key[\s\S]*WHERE status = 'PENDING'/);
  assert.match(sql, /token_hash text NOT NULL UNIQUE/);
});

test('staff tables are inaccessible through direct Data API roles', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  for (const table of ['staff_profiles', 'staff_invites']) {
    assert.match(sql, new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`));
  }
  assert.match(sql, /REVOKE ALL ON staff_profiles, staff_invites FROM anon/);
  assert.match(sql, /REVOKE ALL ON staff_profiles, staff_invites FROM authenticated/);
});

test('staff migration backfills legacy administrators without changing their role', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /INSERT INTO staff_profiles/);
  assert.match(sql, /u\.role::text = 'ADMIN'/);
  assert.doesNotMatch(sql, /UPDATE users/);
});

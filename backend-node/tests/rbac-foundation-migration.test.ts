import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../src/database/migrations/044_rbac_foundation.sql', import.meta.url);

test('RBAC migration creates normalized role and permission relationships', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /CREATE TABLE roles\s*\(/);
  assert.match(sql, /CREATE TABLE permissions\s*\(/);
  assert.match(sql, /CREATE TABLE role_permissions\s*\([\s\S]*PRIMARY KEY \(role_id, permission_id\)/);
  assert.match(sql, /CREATE TABLE user_roles\s*\([\s\S]*PRIMARY KEY \(user_id, role_id\)/);
  assert.match(sql, /user_id uuid NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/);
});

test('RBAC migration seeds initial clinic roles and least-privilege permissions', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  for (const role of ['CLINIC_OWNER', 'NUTRITIONIST', 'RECEPTIONIST', 'PATIENT', 'SMOKE_TEST']) {
    assert.match(sql, new RegExp(`'${role}'`));
  }
  for (const permission of ['patients:read', 'encounters:write', 'finance:manage', 'staff:manage', 'portal:access', 'smoke:run']) {
    assert.match(sql, new RegExp(`'${permission}'`));
  }
  assert.match(sql, /r\.code = 'CLINIC_OWNER' AND p\.code NOT IN \('portal:access', 'smoke:run'\)/);
  assert.match(sql, /WHERE r\.code = 'PATIENT'/);
  assert.match(sql, /JOIN permissions p ON p\.code = 'smoke:run'\s+WHERE r\.code = 'SMOKE_TEST'/);
});

test('RBAC migration backfills legacy roles without changing users.role', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /INSERT INTO user_roles \(user_id, role_id\)/);
  assert.match(sql, /WHEN 'ADMIN' THEN 'CLINIC_OWNER'/);
  assert.match(sql, /WHEN 'PATIENT' THEN 'PATIENT'/);
  assert.doesNotMatch(sql, /ALTER TABLE users/);
  assert.doesNotMatch(sql, /UPDATE users/);
  assert.doesNotMatch(sql, /DROP (?:COLUMN|TYPE)[\s\S]*(?:role|user_role)/i);
});

test('RBAC tables deny direct Data API access', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  for (const table of ['roles', 'permissions', 'role_permissions', 'user_roles']) {
    assert.match(sql, new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`));
  }
  assert.match(sql, /REVOKE ALL ON roles, permissions, role_permissions, user_roles FROM anon/);
  assert.match(sql, /REVOKE ALL ON roles, permissions, role_permissions, user_roles FROM authenticated/);
});

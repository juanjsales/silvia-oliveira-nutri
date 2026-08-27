-- Internal control-plane foundation. No external infrastructure is created by
-- this migration or by the initial assisted provisioning routes.
INSERT INTO roles(code,name,description) VALUES
  ('PLATFORM_ADMIN','Administradora da plataforma','Opera a central de instalações sem acesso implícito para administradores de clínicas.')
ON CONFLICT(code) DO NOTHING;

INSERT INTO permissions(code,description) VALUES
  ('platform:manage','Gerenciar tenants e provisionamento assistido da plataforma.')
ON CONFLICT(code) DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='PLATFORM_ADMIN' AND p.code='platform:manage'
ON CONFLICT DO NOTHING;

CREATE TABLE platform_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  contact_email text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN('DRAFT','READY','PROVISIONING','ACTIVE','SUSPENDED','FAILED','ARCHIVED')),
  creation_key text NOT NULL UNIQUE,
  creation_fingerprint text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_tenants_slug_format CHECK(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT platform_tenants_name_length CHECK(char_length(name) BETWEEN 2 AND 160),
  CONSTRAINT platform_tenants_email_normalized CHECK(contact_email=lower(btrim(contact_email)))
);

CREATE TABLE provisioning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform_tenants(id) ON DELETE RESTRICT,
  operation text NOT NULL CHECK(operation IN('PROVISION_TENANT','REPAIR_TENANT')),
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN('PENDING','RUNNING','SUCCEEDED','FAILED')),
  idempotency_key text NOT NULL,
  request_fingerprint text NOT NULL,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  requested_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  started_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  completed_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 10),
  available_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,idempotency_key),
  CONSTRAINT provisioning_jobs_started_consistent CHECK(
    (status='PENDING' AND started_at IS NULL AND started_by IS NULL)
    OR (status<>'PENDING' AND started_at IS NOT NULL AND started_by IS NOT NULL)
  ),
  CONSTRAINT provisioning_jobs_completed_consistent CHECK(
    (status IN('SUCCEEDED','FAILED') AND completed_at IS NOT NULL AND completed_by IS NOT NULL)
    OR (status IN('PENDING','RUNNING') AND completed_at IS NULL AND completed_by IS NULL)
  )
);

CREATE INDEX platform_tenants_status_idx ON platform_tenants(status,created_at DESC);
CREATE INDEX provisioning_jobs_queue_idx ON provisioning_jobs(status,available_at,created_at);
CREATE INDEX provisioning_jobs_tenant_idx ON provisioning_jobs(tenant_id,created_at DESC);

ALTER TABLE platform_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE provisioning_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON platform_tenants,provisioning_jobs FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON platform_tenants,provisioning_jobs FROM authenticated;
  END IF;
END $$;

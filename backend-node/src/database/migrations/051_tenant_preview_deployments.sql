CREATE TABLE tenant_preview_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform_tenants(id) ON DELETE RESTRICT,
  provisioning_job_id uuid NOT NULL REFERENCES provisioning_jobs(id) ON DELETE RESTRICT,
  release_id text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN('PENDING','VALIDATING_ARTIFACT','UPLOADING_FILES','CREATING_PREVIEW','WAITING_PREVIEW','SMOKE_TESTING','READY_TO_PROMOTE','FAILED_RETRYABLE','FAILED_MANUAL','KNOWN_GOOD','ROLLED_BACK','CANCELLED')),
  state_version integer NOT NULL DEFAULT 1 CHECK(state_version>0),
  idempotency_key text NOT NULL,
  request_fingerprint char(64) NOT NULL,
  artifact_digest char(64) NOT NULL,
  source_commit text NOT NULL CHECK(source_commit ~ '^[0-9a-f]{40,64}$'),
  vercel_project_id text NOT NULL,
  vercel_deployment_id text,
  preview_url text,
  previous_known_good_deployment_id text,
  progress integer NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  smoke_passed boolean NOT NULL DEFAULT false,
  attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 10),
  last_error_code text,
  lease_owner text,
  lease_expires_at timestamptz,
  requested_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(tenant_id,idempotency_key),
  CONSTRAINT preview_known_good_complete CHECK(status<>'KNOWN_GOOD' OR (vercel_deployment_id IS NOT NULL AND preview_url IS NOT NULL AND smoke_passed AND progress=100 AND completed_at IS NOT NULL)),
  CONSTRAINT preview_ready_smoke CHECK(status<>'READY_TO_PROMOTE' OR (vercel_deployment_id IS NOT NULL AND preview_url IS NOT NULL AND smoke_passed)),
  CONSTRAINT preview_url_https CHECK(preview_url IS NULL OR preview_url ~ '^https://[^[:space:]]+$'),
  CONSTRAINT preview_lease_consistent CHECK((lease_owner IS NULL)=(lease_expires_at IS NULL))
);

CREATE UNIQUE INDEX tenant_preview_one_mutable_idx ON tenant_preview_deployments(tenant_id)
WHERE status IN('PENDING','VALIDATING_ARTIFACT','UPLOADING_FILES','CREATING_PREVIEW','WAITING_PREVIEW','SMOKE_TESTING','READY_TO_PROMOTE');
CREATE INDEX tenant_preview_history_idx ON tenant_preview_deployments(tenant_id,created_at DESC);
ALTER TABLE tenant_preview_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_preview_deployments FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON tenant_preview_deployments FROM anon; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON tenant_preview_deployments FROM authenticated; END IF;
END $$;

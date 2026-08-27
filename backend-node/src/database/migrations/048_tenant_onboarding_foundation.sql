CREATE TABLE tenant_onboardings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES platform_tenants(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN('DRAFT','OWNER_INVITED','READY','CANCELLED')),
  clinic_name text NOT NULL,
  professional_name text NOT NULL,
  contact_email text NOT NULL,
  owner_name text NOT NULL,
  owner_email text NOT NULL,
  owner_invite_token_hash text NOT NULL UNIQUE,
  owner_invite_expires_at timestamptz NOT NULL,
  owner_invite_status text NOT NULL DEFAULT 'PENDING' CHECK(owner_invite_status IN('PENDING','ACCEPTED','EXPIRED','CANCELLED')),
  idempotency_key text NOT NULL,
  request_fingerprint text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,idempotency_key),
  CONSTRAINT tenant_onboarding_names CHECK(char_length(clinic_name) BETWEEN 2 AND 160 AND char_length(professional_name) BETWEEN 2 AND 160 AND char_length(owner_name) BETWEEN 2 AND 160),
  CONSTRAINT tenant_onboarding_emails_normalized CHECK(contact_email=lower(btrim(contact_email)) AND owner_email=lower(btrim(owner_email))),
  CONSTRAINT tenant_onboarding_invite_expiration CHECK(owner_invite_expires_at>created_at)
);
CREATE INDEX tenant_onboardings_status_idx ON tenant_onboardings(status,created_at DESC);
ALTER TABLE tenant_onboardings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON tenant_onboardings FROM anon; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON tenant_onboardings FROM authenticated; END IF;
END $$;

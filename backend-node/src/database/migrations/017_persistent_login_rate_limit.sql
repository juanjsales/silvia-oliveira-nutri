CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key_hash char(64) PRIMARY KEY,
  attempts smallint NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_rate_limits_cleanup_idx ON auth_rate_limits(updated_at);
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON auth_rate_limits FROM anon; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON auth_rate_limits FROM authenticated; END IF;
END $$;

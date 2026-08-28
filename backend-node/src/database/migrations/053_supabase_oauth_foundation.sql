ALTER TABLE provider_oauth_states DROP CONSTRAINT provider_oauth_states_provider_check;
ALTER TABLE provider_oauth_states ADD CONSTRAINT provider_oauth_states_provider_check CHECK(provider IN('VERCEL','SUPABASE'));
ALTER TABLE provider_oauth_states ADD COLUMN request_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE tenant_provider_connections DROP CONSTRAINT tenant_provider_connections_provider_check;
ALTER TABLE tenant_provider_connections ADD CONSTRAINT tenant_provider_connections_provider_check CHECK(provider IN('VERCEL','SUPABASE'));
ALTER TABLE tenant_provider_connections ADD COLUMN refresh_token_encrypted text;
ALTER TABLE tenant_provider_connections ADD COLUMN token_expires_at timestamptz;
ALTER TABLE tenant_provider_connections ADD COLUMN organization_slug text;
ALTER TABLE tenant_provider_connections ADD COLUMN region text;
ALTER TABLE tenant_provider_connections ADD COLUMN database_url_encrypted text;
ALTER TABLE tenant_provider_connections ADD COLUMN migration_database_url_encrypted text;

ALTER TABLE tenant_provider_connections ADD CONSTRAINT tenant_provider_connections_supabase_secrets
CHECK(provider<>'SUPABASE' OR status<>'CONNECTED' OR (
  organization_slug IS NOT NULL AND project_id IS NOT NULL AND
  database_url_encrypted IS NOT NULL AND migration_database_url_encrypted IS NOT NULL
));

CREATE UNIQUE INDEX tenant_provider_connections_supabase_project_idx
  ON tenant_provider_connections(project_id)
  WHERE provider='SUPABASE' AND status='CONNECTED';

ALTER TABLE tenant_provider_connections
  ADD COLUMN team_id text,
  ADD COLUMN configuration_id text;

ALTER TABLE tenant_provider_connections
  ADD CONSTRAINT tenant_provider_connections_team_id_valid
    CHECK (team_id IS NULL OR char_length(btrim(team_id)) BETWEEN 2 AND 160),
  ADD CONSTRAINT tenant_provider_connections_configuration_id_valid
    CHECK (configuration_id IS NULL OR char_length(btrim(configuration_id)) BETWEEN 2 AND 160);

CREATE UNIQUE INDEX tenant_provider_connections_vercel_configuration_idx
  ON tenant_provider_connections(configuration_id)
  WHERE provider='VERCEL' AND configuration_id IS NOT NULL;

COMMENT ON COLUMN tenant_provider_connections.team_id IS
  'Vercel team owning tenant resources; must scope every provider API call when present.';
COMMENT ON COLUMN tenant_provider_connections.configuration_id IS
  'Opaque Vercel integration installation/configuration identifier.';

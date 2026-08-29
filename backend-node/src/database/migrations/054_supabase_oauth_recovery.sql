ALTER TABLE provider_oauth_states
  ADD COLUMN IF NOT EXISTS provider_secret_encrypted text;

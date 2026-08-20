CREATE TABLE IF NOT EXISTS video_broadcasts (
  broadcast_id uuid PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS video_broadcasts_expiry_idx ON video_broadcasts(expires_at);

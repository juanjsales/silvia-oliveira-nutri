ALTER TABLE clinical_encounters
  ADD COLUMN IF NOT EXISTS correction_open boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS correction_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS correction_started_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revision_count integer NOT NULL DEFAULT 0 CHECK (revision_count >= 0);

CREATE INDEX IF NOT EXISTS clinical_encounters_correction_idx
  ON clinical_encounters(correction_open, updated_at DESC)
  WHERE correction_open = true;

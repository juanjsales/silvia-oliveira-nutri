CREATE TABLE IF NOT EXISTS teleconsultation_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  source_id uuid NOT NULL,
  notice_version text NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  user_agent text,
  UNIQUE(patient_id, source_id, notice_version)
);

CREATE INDEX IF NOT EXISTS teleconsultation_consents_patient_idx
  ON teleconsultation_consents(patient_id, acknowledged_at DESC);

ALTER TABLE teleconsultation_consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON teleconsultation_consents FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON teleconsultation_consents FROM authenticated;
  END IF;
END $$;


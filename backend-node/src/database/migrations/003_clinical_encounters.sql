CREATE TABLE clinical_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_id uuid UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
  opened_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','COMPLETED','CANCELLED')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clinical_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  section_key text NOT NULL CHECK (section_key IN ('context','anamnesis','assessment','exams','conduct')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  saved_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(encounter_id, section_key)
);

CREATE INDEX clinical_encounters_patient_idx ON clinical_encounters(patient_id, started_at DESC);
CREATE INDEX clinical_sections_encounter_idx ON clinical_sections(encounter_id);
ALTER TABLE clinical_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_sections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON clinical_encounters, clinical_sections FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON clinical_encounters, clinical_sections FROM authenticated; END IF;
END $$;

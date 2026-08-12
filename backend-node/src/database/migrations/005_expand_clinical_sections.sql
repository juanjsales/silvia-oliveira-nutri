ALTER TABLE clinical_sections DROP CONSTRAINT clinical_sections_section_key_check;
ALTER TABLE clinical_sections ADD CONSTRAINT clinical_sections_section_key_check
  CHECK (section_key IN ('context','anamnesis','recall24h','followup','assessment','exams','conduct','supplements','notes'));

ALTER TABLE appointments ADD COLUMN video_room_token text UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex');
ALTER TABLE clinical_encounters ADD COLUMN video_room_token text UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex');

CREATE TABLE laboratory_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), encounter_id uuid NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT, exam_date date,
  marker text NOT NULL, value text NOT NULL, unit text, reference_value text,
  status text, observation text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX laboratory_results_patient_idx ON laboratory_results(patient_id, exam_date DESC);

CREATE TABLE supplement_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), encounter_id uuid NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  name text NOT NULL, dosage text, posology text, pharmaceutical_form text, observation text,
  position smallint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX supplement_prescriptions_patient_idx ON supplement_prescriptions(patient_id, created_at DESC);

ALTER TABLE laboratory_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_prescriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON laboratory_results,supplement_prescriptions FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON laboratory_results,supplement_prescriptions FROM authenticated; END IF;
END $$;

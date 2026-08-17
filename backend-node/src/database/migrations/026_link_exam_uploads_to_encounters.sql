ALTER TABLE patient_exam_uploads
  ADD COLUMN IF NOT EXISTS encounter_id uuid REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS clinical_interpretation text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS patient_exam_uploads_encounter_idx
  ON patient_exam_uploads(encounter_id) WHERE encounter_id IS NOT NULL;

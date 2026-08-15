CREATE UNIQUE INDEX IF NOT EXISTS appointments_id_patient_unique
  ON appointments(id, patient_id);

CREATE TABLE IF NOT EXISTS preconsult_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id uuid,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(24) NOT NULL DEFAULT 'PENDING_REVIEW'
    CHECK (status IN ('PENDING_REVIEW','REVIEWED')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT preconsult_checkins_appointment_patient_fk
    FOREIGN KEY (appointment_id, patient_id)
    REFERENCES appointments(id, patient_id) ON DELETE RESTRICT,
  CONSTRAINT preconsult_checkins_review_consistency CHECK (
    (status = 'PENDING_REVIEW' AND reviewed_at IS NULL AND reviewed_by IS NULL)
    OR (status = 'REVIEWED' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
  ),
  CONSTRAINT preconsult_checkins_answers_object CHECK (jsonb_typeof(answers) = 'object')
);

CREATE INDEX IF NOT EXISTS preconsult_checkins_patient_status_idx
  ON preconsult_checkins(patient_id,status,submitted_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS preconsult_checkins_appointment_unique
  ON preconsult_checkins(appointment_id) WHERE appointment_id IS NOT NULL;

ALTER TABLE preconsult_checkins ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON preconsult_checkins FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON preconsult_checkins FROM authenticated;
  END IF;
END $$;

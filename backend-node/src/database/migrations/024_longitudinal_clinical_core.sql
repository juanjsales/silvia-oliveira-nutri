-- Longitudinal clinical core. These records belong to the patient and survive
-- individual encounters, while retaining the encounter that originated them.
CREATE UNIQUE INDEX IF NOT EXISTS clinical_encounters_id_patient_unique
  ON clinical_encounters(id, patient_id);

CREATE TABLE IF NOT EXISTS clinical_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  source_encounter_id uuid,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','MONITORING','CONTROLLED','RESOLVED')),
  onset_date date,
  resolved_at timestamptz,
  conduct text,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_problems_source_patient_fk
    FOREIGN KEY (source_encounter_id, patient_id)
    REFERENCES clinical_encounters(id, patient_id) ON DELETE RESTRICT,
  CONSTRAINT clinical_problems_resolution_consistency
    CHECK ((status = 'RESOLVED') = (resolved_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS clinical_problems_patient_idx ON clinical_problems(patient_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS clinical_therapies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  source_encounter_id uuid,
  kind text NOT NULL CHECK (kind IN ('MEDICATION','SUPPLEMENT')),
  name text NOT NULL,
  dosage text,
  schedule text,
  indication text,
  prescriber text,
  food_guidance text,
  started_on date,
  ended_on date,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','FINISHED')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_therapies_source_patient_fk
    FOREIGN KEY (source_encounter_id, patient_id)
    REFERENCES clinical_encounters(id, patient_id) ON DELETE RESTRICT,
  CONSTRAINT clinical_therapies_dates_ordered
    CHECK (ended_on IS NULL OR started_on IS NULL OR ended_on >= started_on)
);
CREATE INDEX IF NOT EXISTS clinical_therapies_patient_idx ON clinical_therapies(patient_id, status, kind, updated_at DESC);

CREATE TABLE IF NOT EXISTS clinical_followup_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  source_encounter_id uuid,
  title text NOT NULL,
  details text,
  due_date date,
  priority text NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW','NORMAL','HIGH')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','DONE','CANCELLED')),
  completed_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_followup_tasks_source_patient_fk
    FOREIGN KEY (source_encounter_id, patient_id)
    REFERENCES clinical_encounters(id, patient_id) ON DELETE RESTRICT,
  CONSTRAINT clinical_followup_tasks_completion_consistency
    CHECK ((status = 'DONE') = (completed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS clinical_followup_tasks_patient_idx ON clinical_followup_tasks(patient_id, status, due_date);

CREATE TABLE IF NOT EXISTS clinical_alert_dismissals (
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  alert_key text NOT NULL,
  dismissed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(patient_id, alert_key)
);

ALTER TABLE laboratory_results ADD COLUMN IF NOT EXISTS numeric_value numeric;
ALTER TABLE laboratory_results ADD COLUMN IF NOT EXISTS marker_key text;
CREATE INDEX IF NOT EXISTS laboratory_results_marker_history_idx
  ON laboratory_results(patient_id, marker_key, exam_date DESC, created_at DESC);

ALTER TABLE clinical_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_therapies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_followup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_alert_dismissals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON clinical_problems, clinical_therapies, clinical_followup_tasks, clinical_alert_dismissals FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON clinical_problems, clinical_therapies, clinical_followup_tasks, clinical_alert_dismissals FROM authenticated;
  END IF;
END $$;

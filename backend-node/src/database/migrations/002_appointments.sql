CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  duration_minutes smallint NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 15 AND 480),
  appointment_type text NOT NULL DEFAULT 'Avaliação Inicial',
  price numeric(10,2) CHECK (price IS NULL OR price >= 0),
  status text NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED','WAITING','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')),
  notes text,
  clinical_notes text,
  meeting_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX appointments_date_time_idx ON appointments(appointment_date, appointment_time);
CREATE INDEX appointments_patient_date_idx ON appointments(patient_id, appointment_date DESC);
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON appointments FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON appointments FROM authenticated; END IF;
END $$;

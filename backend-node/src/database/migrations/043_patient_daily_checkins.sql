CREATE TABLE IF NOT EXISTS patient_daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  feeling text NOT NULL CHECK (feeling IN ('EASY','ADJUSTMENTS','DIFFICULT','NOT_TODAY')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patient_daily_checkins_patient_date_key UNIQUE (patient_id, checkin_date),
  CONSTRAINT patient_daily_checkins_reason_length CHECK (reason IS NULL OR char_length(reason) <= 500)
);

CREATE INDEX IF NOT EXISTS patient_daily_checkins_patient_recent_idx
  ON patient_daily_checkins(patient_id, checkin_date DESC);


ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS patient_response text NOT NULL DEFAULT 'PENDING'
    CHECK(patient_response IN('PENDING','CONFIRMED','RESCHEDULE_REQUESTED')),
  ADD COLUMN IF NOT EXISTS patient_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS patient_response_note text;

CREATE INDEX IF NOT EXISTS idx_appointments_patient_response
  ON appointments(patient_response, appointment_date) WHERE patient_response <> 'CONFIRMED';

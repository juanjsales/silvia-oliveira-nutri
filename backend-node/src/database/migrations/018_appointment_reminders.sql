CREATE TABLE IF NOT EXISTS appointment_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('REMINDER_24H')),
  recipient text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_appointment_email_events_appointment
  ON appointment_email_events(appointment_id, event_type);

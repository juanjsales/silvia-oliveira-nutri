ALTER TABLE appointment_email_outbox
  ADD COLUMN IF NOT EXISTS deliver_before timestamptz;

-- Existing operational messages receive a conservative deadline. New writes
-- always provide the appointment-specific deadline.
UPDATE appointment_email_outbox
SET deliver_before = COALESCE(deliver_before, created_at + interval '7 days')
WHERE deliver_before IS NULL;

ALTER TABLE appointment_email_outbox
  ALTER COLUMN deliver_before SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointment_email_outbox_deliverable
  ON appointment_email_outbox(next_attempt_at, deliver_before, created_at)
  WHERE status IN ('PENDING','FAILED');

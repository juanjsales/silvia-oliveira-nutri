CREATE TABLE IF NOT EXISTS clinical_section_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_section_id uuid NOT NULL REFERENCES clinical_sections(id) ON DELETE CASCADE,
  encounter_id uuid NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  version integer NOT NULL,
  data jsonb NOT NULL,
  saved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinical_section_id, version)
);

CREATE INDEX IF NOT EXISTS idx_clinical_section_versions_history
  ON clinical_section_versions(encounter_id, section_key, version DESC);

CREATE OR REPLACE FUNCTION preserve_clinical_section_version()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE next_version integer;
BEGIN
  -- Updates of the same clinical section already hold a row lock. The advisory
  -- lock also serializes the initial version/backfill path and makes this
  -- function safe if it is invoked manually by an operational repair.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.id::text, 0));
  SELECT COALESCE(max(version), 0) + 1 INTO next_version
    FROM clinical_section_versions WHERE clinical_section_id = NEW.id;
  INSERT INTO clinical_section_versions(clinical_section_id, encounter_id, section_key, version, data, saved_by, saved_at)
  VALUES(NEW.id, NEW.encounter_id, NEW.section_key, next_version, NEW.data, NEW.saved_by, NEW.saved_at);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS clinical_sections_preserve_version ON clinical_sections;
CREATE TRIGGER clinical_sections_preserve_version
AFTER INSERT OR UPDATE OF data, saved_by, saved_at ON clinical_sections
FOR EACH ROW EXECUTE FUNCTION preserve_clinical_section_version();

INSERT INTO clinical_section_versions(clinical_section_id, encounter_id, section_key, version, data, saved_by, saved_at)
SELECT s.id, s.encounter_id, s.section_key, 1, s.data, s.saved_by, s.saved_at
FROM clinical_sections s
WHERE NOT EXISTS (SELECT 1 FROM clinical_section_versions v WHERE v.clinical_section_id=s.id);

CREATE TABLE IF NOT EXISTS appointment_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('SCHEDULED','RESCHEDULED','CANCELLED','REMINDER_24H')),
  recipient text NOT NULL,
  payload jsonb NOT NULL,
  deduplication_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SENT','FAILED')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  attempted_at timestamptz,
  processing_started_at timestamptz,
  sent_at timestamptz
);

-- Keep the migration safe when it is re-applied to a database that received an
-- earlier draft of this table.
ALTER TABLE appointment_email_outbox
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_appointment_email_outbox_pending
  ON appointment_email_outbox(next_attempt_at, created_at)
  WHERE status IN ('PENDING','FAILED');

CREATE INDEX IF NOT EXISTS idx_appointment_email_outbox_processing
  ON appointment_email_outbox(processing_started_at)
  WHERE status = 'PROCESSING';

ALTER TABLE appointment_email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_section_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON appointment_email_outbox, clinical_section_versions FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON appointment_email_outbox, clinical_section_versions FROM authenticated;
  END IF;
END $$;

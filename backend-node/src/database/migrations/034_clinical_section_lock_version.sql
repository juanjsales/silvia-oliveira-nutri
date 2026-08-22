ALTER TABLE clinical_sections
  ADD COLUMN IF NOT EXISTS lock_version bigint NOT NULL DEFAULT 1 CHECK (lock_version > 0);

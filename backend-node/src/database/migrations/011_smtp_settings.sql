ALTER TABLE clinic_settings ADD COLUMN smtp_host text;
ALTER TABLE clinic_settings ADD COLUMN smtp_port integer NOT NULL DEFAULT 587 CHECK(smtp_port BETWEEN 1 AND 65535);
ALTER TABLE clinic_settings ADD COLUMN smtp_secure boolean NOT NULL DEFAULT false;
ALTER TABLE clinic_settings ADD COLUMN smtp_user text;
ALTER TABLE clinic_settings ADD COLUMN smtp_password_encrypted text;
ALTER TABLE clinic_settings ADD COLUMN smtp_from text;
ALTER TABLE clinic_settings ADD COLUMN smtp_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE clinic_settings
  ADD COLUMN IF NOT EXISTS portrait_url text,
  ADD COLUMN IF NOT EXISTS full_body_url text,
  ADD COLUMN IF NOT EXISTS consultation_image_url text;


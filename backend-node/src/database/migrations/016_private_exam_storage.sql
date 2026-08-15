ALTER TABLE patient_exam_uploads ALTER COLUMN file_url DROP NOT NULL;
ALTER TABLE patient_exam_uploads ADD COLUMN IF NOT EXISTS file_path text, ADD COLUMN IF NOT EXISTS mime_type text, ADD COLUMN IF NOT EXISTS file_size integer;
CREATE UNIQUE INDEX IF NOT EXISTS patient_exam_file_path_unique ON patient_exam_uploads(file_path) WHERE file_path IS NOT NULL;

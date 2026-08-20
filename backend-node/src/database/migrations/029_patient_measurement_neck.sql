ALTER TABLE patient_measurements
  ADD COLUMN IF NOT EXISTS neck numeric(6,2);

ALTER TABLE patient_measurements
  DROP CONSTRAINT IF EXISTS patient_measurements_neck_range;

ALTER TABLE patient_measurements
  ADD CONSTRAINT patient_measurements_neck_range
  CHECK (neck IS NULL OR (neck > 0 AND neck <= 200));

-- Consolida entradas de diário por paciente e data
DELETE FROM patient_diary_entries a USING patient_diary_entries b
WHERE a.id < b.id
  AND a.patient_id = b.patient_id
  AND a.entry_date = b.entry_date;

CREATE UNIQUE INDEX IF NOT EXISTS patient_diary_unique_patient_date_idx
  ON patient_diary_entries(patient_id, entry_date);

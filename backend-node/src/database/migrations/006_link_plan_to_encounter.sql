ALTER TABLE clinical_sections DROP CONSTRAINT clinical_sections_section_key_check;
ALTER TABLE clinical_sections ADD CONSTRAINT clinical_sections_section_key_check
  CHECK (section_key IN ('context','anamnesis','recall24h','followup','assessment','exams','conduct','plan','supplements','notes'));
CREATE UNIQUE INDEX meal_plans_encounter_active_unique ON meal_plans(encounter_id) WHERE encounter_id IS NOT NULL AND status<>'ARCHIVED';

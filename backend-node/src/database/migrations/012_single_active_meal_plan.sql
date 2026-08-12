WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY patient_id ORDER BY updated_at DESC, id DESC) AS position
  FROM meal_plans
  WHERE status = 'PUBLISHED'
)
UPDATE meal_plans
SET status = 'ARCHIVED', updated_at = now()
WHERE id IN (SELECT id FROM ranked WHERE position > 1);

CREATE UNIQUE INDEX IF NOT EXISTS meal_plans_one_published_per_patient_idx
  ON meal_plans(patient_id)
  WHERE status = 'PUBLISHED';

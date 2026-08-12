CREATE TABLE foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legacy_id text UNIQUE,
  name text NOT NULL, category text NOT NULL, source text NOT NULL DEFAULT 'TACO_CURATED',
  reference_amount numeric(10,2) NOT NULL DEFAULT 100, reference_unit text NOT NULL DEFAULT 'g',
  kcal numeric(10,3) NOT NULL DEFAULT 0, carbohydrate numeric(10,3) NOT NULL DEFAULT 0,
  protein numeric(10,3) NOT NULL DEFAULT 0, fat numeric(10,3) NOT NULL DEFAULT 0,
  fiber numeric(10,3) NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX foods_search_idx ON foods(lower(name));
CREATE INDEX foods_category_idx ON foods(category) WHERE active=true;

CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legacy_id text UNIQUE,
  title text NOT NULL, category text NOT NULL, preparation_time text,
  yield_text text, instructions text NOT NULL, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX recipes_search_idx ON recipes(lower(title));

CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE SET NULL, position smallint NOT NULL,
  name_snapshot text NOT NULL, amount_text text NOT NULL,
  kcal numeric(10,3) NOT NULL DEFAULT 0, carbohydrate numeric(10,3) NOT NULL DEFAULT 0,
  protein numeric(10,3) NOT NULL DEFAULT 0, fat numeric(10,3) NOT NULL DEFAULT 0,
  UNIQUE(recipe_id, position)
);

CREATE TABLE meal_plan_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legacy_id text UNIQUE,
  title text NOT NULL, objective text, target_kcal numeric(10,2), content jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  template_id uuid REFERENCES meal_plan_templates(id) ON DELETE SET NULL,
  title text NOT NULL, objective text, status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  content jsonb NOT NULL DEFAULT '{"meals":[],"extras":[]}'::jsonb,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  published_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meal_plans_patient_idx ON meal_plans(patient_id, created_at DESC);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY; ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY; ALTER TABLE meal_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON foods,recipes,recipe_ingredients,meal_plan_templates,meal_plans FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON foods,recipes,recipe_ingredients,meal_plan_templates,meal_plans FROM authenticated; END IF;
END $$;

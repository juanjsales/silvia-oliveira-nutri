CREATE TABLE financial_transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
 appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL, description text NOT NULL,
 amount numeric(10,2) NOT NULL CHECK(amount>=0), due_date date NOT NULL, paid_at timestamptz,
 payment_method text, status text NOT NULL DEFAULT 'PENDING' CHECK(status IN('PENDING','PAID','CANCELLED','OVERDUE')),
 notes text, created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX financial_transactions_due_idx ON financial_transactions(due_date,status);
CREATE INDEX financial_transactions_patient_idx ON financial_transactions(patient_id,created_at DESC);
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON financial_transactions FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON financial_transactions FROM authenticated; END IF;
END $$;

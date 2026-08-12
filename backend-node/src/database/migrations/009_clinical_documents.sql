CREATE SEQUENCE clinical_document_number_seq START 1001;
CREATE TABLE clinical_documents(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_number bigint NOT NULL DEFAULT nextval('clinical_document_number_seq'),
 version smallint NOT NULL DEFAULT 1 CHECK(version>0), type text NOT NULL CHECK(type IN('RECEIPT','CLINICAL_SUMMARY','DECLARATION','CERTIFICATE','SUPPLEMENTS','MEAL_PLAN')),
 patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT, encounter_id uuid REFERENCES clinical_encounters(id) ON DELETE SET NULL,
 financial_transaction_id uuid REFERENCES financial_transactions(id) ON DELETE SET NULL, title text NOT NULL,
 snapshot jsonb NOT NULL, status text NOT NULL DEFAULT 'ISSUED' CHECK(status IN('ISSUED','CANCELLED')),
 available_to_patient boolean NOT NULL DEFAULT false, issued_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 issued_at timestamptz NOT NULL DEFAULT now(), cancelled_at timestamptz, cancellation_reason text,
 UNIQUE(document_number,version)
);
CREATE INDEX clinical_documents_patient_idx ON clinical_documents(patient_id,issued_at DESC);
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON clinical_documents FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON clinical_documents FROM authenticated; END IF;
END $$;

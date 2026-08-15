CREATE TABLE IF NOT EXISTS privacy_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notice_version text NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(patient_id, notice_version)
);

CREATE TABLE IF NOT EXISTS data_subject_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  request_type text NOT NULL CHECK(request_type IN('ACCESS','CORRECTION','DELETION')),
  details text,
  status text NOT NULL DEFAULT 'OPEN' CHECK(status IN('OPEN','IN_REVIEW','COMPLETED','REJECTED')),
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_data_subject_requests_status ON data_subject_requests(status,created_at);

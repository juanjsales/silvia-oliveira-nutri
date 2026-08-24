ALTER TABLE clinic_settings
  ADD COLUMN IF NOT EXISTS privacy_contact_name text,
  ADD COLUMN IF NOT EXISTS privacy_contact_email text,
  ADD COLUMN IF NOT EXISTS privacy_controller_name text,
  ADD COLUMN IF NOT EXISTS privacy_controller_document text,
  ADD COLUMN IF NOT EXISTS privacy_notice_updated_at timestamptz;

ALTER TABLE data_subject_requests DROP CONSTRAINT IF EXISTS data_subject_requests_request_type_check;
ALTER TABLE data_subject_requests ADD CONSTRAINT data_subject_requests_request_type_check CHECK(request_type IN('ACCESS','CORRECTION','DELETION','PORTABILITY','INFORMATION','REVOCATION','OBJECTION'));
ALTER TABLE data_subject_requests DROP CONSTRAINT IF EXISTS data_subject_requests_status_check;
ALTER TABLE data_subject_requests ADD CONSTRAINT data_subject_requests_status_check CHECK(status IN('OPEN','IN_REVIEW','COMPLETED','REJECTED','CANCELLED'));
ALTER TABLE data_subject_requests ADD COLUMN IF NOT EXISTS due_at timestamptz;
CREATE TABLE IF NOT EXISTS data_subject_request_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),request_id uuid NOT NULL REFERENCES data_subject_requests(id) ON DELETE CASCADE,status text NOT NULL,notes text,actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_data_subject_request_history ON data_subject_request_history(request_id,created_at);

CREATE TABLE IF NOT EXISTS privacy_processing_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  purpose text NOT NULL,
  data_categories text[] NOT NULL DEFAULT '{}',
  data_subjects text[] NOT NULL DEFAULT '{}',
  legal_basis text NOT NULL,
  recipients text[] NOT NULL DEFAULT '{}',
  storage_location text,
  retention_rule text NOT NULL,
  security_measures text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS privacy_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_category text NOT NULL UNIQUE,
  retention_rule text NOT NULL,
  legal_or_operational_reason text NOT NULL,
  disposition_action text NOT NULL CHECK (disposition_action IN ('REVIEW','ANONYMIZE','DELETE','PRESERVE')),
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO privacy_retention_policies(data_category,retention_rule,legal_or_operational_reason,disposition_action)
VALUES
 ('Prontuário e documentos clínicos','Conservar pelo prazo definido pela responsável clínica e pelas normas profissionais aplicáveis. Revisar antes de qualquer descarte.','Continuidade do cuidado, defesa de direitos e obrigações profissionais.','PRESERVE'),
 ('Solicitações de titulares','Conservar o histórico da solicitação, análise e resposta conforme política interna.','Comprovação do atendimento aos direitos do titular.','PRESERVE'),
 ('Logs técnicos e de segurança','Conservar apenas pelo período necessário à segurança, investigação e prestação de contas.','Segurança e prevenção a incidentes.','REVIEW'),
 ('Sessões de autenticação','Revogar ao encerrar, trocar senha ou exceder o prazo; eliminar registros expirados conforme rotina técnica.','Controle de acesso e segurança.','DELETE')
ON CONFLICT(data_category) DO NOTHING;

CREATE TABLE IF NOT EXISTS privacy_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  detected_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ASSESSING' CHECK(status IN('ASSESSING','CONTAINED','NOTIFICATION_REVIEW','CLOSED')),
  risk_level text NOT NULL DEFAULT 'UNDER_REVIEW' CHECK(risk_level IN('UNDER_REVIEW','LOW','MEDIUM','HIGH')),
  data_categories text[] NOT NULL DEFAULT '{}',
  affected_subjects_estimate integer CHECK(affected_subjects_estimate IS NULL OR affected_subjects_estimate >= 0),
  containment_actions text,
  assessment_notes text,
  notification_decision text,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_privacy_incidents_status ON privacy_incidents(status,detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_processing_active ON privacy_processing_activities(active,name);

ALTER TABLE privacy_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_incidents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON privacy_processing_activities,privacy_retention_policies,privacy_incidents FROM anon;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON privacy_processing_activities,privacy_retention_policies,privacy_incidents FROM authenticated;
 END IF;
END $$;

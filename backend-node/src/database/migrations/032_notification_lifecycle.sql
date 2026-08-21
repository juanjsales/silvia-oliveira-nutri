ALTER TABLE patient_notifications
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS dedupe_key text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE patient_notifications DROP CONSTRAINT IF EXISTS patient_notifications_status_check;
ALTER TABLE patient_notifications ADD CONSTRAINT patient_notifications_status_check CHECK(status IN('ACTIVE','RESOLVED','ARCHIVED'));
ALTER TABLE patient_notifications DROP CONSTRAINT IF EXISTS patient_notifications_priority_check;
ALTER TABLE patient_notifications ADD CONSTRAINT patient_notifications_priority_check CHECK(priority IN('LOW','NORMAL','HIGH','URGENT'));
CREATE UNIQUE INDEX IF NOT EXISTS patient_notifications_active_dedupe_idx
  ON patient_notifications(patient_id,dedupe_key) WHERE dedupe_key IS NOT NULL AND status='ACTIVE';
CREATE INDEX IF NOT EXISTS patient_notifications_inbox_idx
  ON patient_notifications(patient_id,status,created_at DESC);

-- Remove o falso estado "ao vivo" das notificacoes antigas. O banner ativo
-- continua sendo calculado pelo estado real da teleconsulta.
UPDATE patient_notifications SET status='RESOLVED',resolved_at=COALESCE(resolved_at,now())
 WHERE title='🎥 Teleconsulta iniciada pela nutricionista' AND status='ACTIVE';

CREATE TABLE IF NOT EXISTS professional_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'INFO',
  title text NOT NULL,
  body text NOT NULL,
  priority text NOT NULL DEFAULT 'NORMAL' CHECK(priority IN('LOW','NORMAL','HIGH','URGENT')),
  entity_type text,
  entity_id uuid,
  action_url text,
  dedupe_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN('ACTIVE','RESOLVED','ARCHIVED')),
  read_at timestamptz,
  resolved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS professional_notifications_inbox_idx
  ON professional_notifications(status,created_at DESC);

INSERT INTO professional_notifications(kind,title,body,priority,entity_type,entity_id,action_url,dedupe_key)
SELECT 'APPOINTMENT_REQUEST','Novo pedido de consulta',p.name||' enviou um pedido de consulta.','HIGH','appointment_request',r.id,'/atendimentos','appointment-request:'||r.id
FROM appointment_requests r JOIN patients p ON p.id=r.patient_id WHERE r.status='PENDING'
ON CONFLICT(dedupe_key) DO NOTHING;

INSERT INTO professional_notifications(kind,title,body,priority,entity_type,entity_id,action_url,dedupe_key)
SELECT 'CHECKIN','Check-in aguardando revisão','Um check-in de '||p.name||' está pronto para revisão.','NORMAL','preconsult_checkin',c.id,'/pacientes/'||c.patient_id||'/clinico','checkin:'||c.id
FROM preconsult_checkins c JOIN patients p ON p.id=c.patient_id WHERE c.status='PENDING_REVIEW'
ON CONFLICT(dedupe_key) DO NOTHING;

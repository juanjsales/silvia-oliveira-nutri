-- RBAC foundation. The legacy users.role enum remains the authorization source
-- until the application is migrated to consume these tables.
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  system_role boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roles_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]*$')
);

CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT permissions_code_format CHECK (code ~ '^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$')
);

CREATE TABLE role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX user_roles_role_idx ON user_roles(role_id, user_id);
CREATE INDEX role_permissions_permission_idx ON role_permissions(permission_id, role_id);

INSERT INTO roles (code, name, description) VALUES
  ('CLINIC_OWNER', 'Proprietária da clínica', 'Administração completa da instalação clínica.'),
  ('NUTRITIONIST', 'Nutricionista', 'Atendimento e gestão de informações clínicas.'),
  ('RECEPTIONIST', 'Recepção', 'Agenda e cadastros operacionais autorizados.'),
  ('PATIENT', 'Paciente', 'Acesso exclusivo ao próprio portal e dados.'),
  ('SMOKE_TEST', 'Teste de homologação', 'Identidade técnica restrita à validação da instalação.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, description) VALUES
  ('patients:read', 'Consultar pacientes autorizados.'),
  ('patients:write', 'Cadastrar e atualizar pacientes.'),
  ('appointments:read', 'Consultar agenda autorizada.'),
  ('appointments:manage', 'Criar, reagendar e cancelar compromissos.'),
  ('encounters:read', 'Consultar prontuários e atendimentos autorizados.'),
  ('encounters:write', 'Registrar e atualizar atendimentos clínicos.'),
  ('meal_plans:read', 'Consultar planos alimentares autorizados.'),
  ('meal_plans:write', 'Criar e atualizar planos alimentares.'),
  ('finance:read', 'Consultar informações financeiras.'),
  ('finance:manage', 'Gerenciar cobranças, pagamentos e estornos.'),
  ('settings:manage', 'Gerenciar configurações da clínica.'),
  ('staff:manage', 'Gerenciar equipe, papéis e permissões.'),
  ('privacy:manage', 'Gerenciar solicitações e governança de privacidade.'),
  ('portal:access', 'Acessar o próprio portal do paciente.'),
  ('smoke:run', 'Executar verificações técnicas de homologação.')
ON CONFLICT (code) DO NOTHING;

-- The owner receives every initial clinic permission except the patient-only portal.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CLINIC_OWNER' AND p.code NOT IN ('portal:access', 'smoke:run')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = ANY (ARRAY[
  'patients:read', 'patients:write', 'appointments:read', 'appointments:manage',
  'encounters:read', 'encounters:write', 'meal_plans:read', 'meal_plans:write'
])
WHERE r.code = 'NUTRITIONIST'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = ANY (ARRAY[
  'patients:read', 'patients:write', 'appointments:read', 'appointments:manage'
])
WHERE r.code = 'RECEPTIONIST'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('portal:access')
WHERE r.code = 'PATIENT'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'smoke:run'
WHERE r.code = 'SMOKE_TEST'
ON CONFLICT DO NOTHING;

-- Retrocompatible backfill: users.role is intentionally retained unchanged.
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = CASE u.role::text
  WHEN 'ADMIN' THEN 'CLINIC_OWNER'
  WHEN 'PATIENT' THEN 'PATIENT'
END
WHERE u.role::text IN ('ADMIN', 'PATIENT')
ON CONFLICT DO NOTHING;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON roles, permissions, role_permissions, user_roles FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON roles, permissions, role_permissions, user_roles FROM authenticated;
  END IF;
END $$;

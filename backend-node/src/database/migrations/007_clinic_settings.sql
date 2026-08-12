CREATE TABLE clinic_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  clinic_name text NOT NULL DEFAULT 'Dra. Silvia Oliveira Lemos', professional_name text NOT NULL DEFAULT 'Dra. Silvia Oliveira Lemos',
  crn text NOT NULL DEFAULT 'CRN-4 25104731', specialty text NOT NULL DEFAULT 'Nutrição Clínica & Esportiva',
  phone text, email text, address text, city text DEFAULT 'Rio de Janeiro', logo_url text,
  primary_color varchar(7) NOT NULL DEFAULT '#203528', secondary_color varchar(7) NOT NULL DEFAULT '#8ca481',
  in_person_price numeric(10,2) NOT NULL DEFAULT 280, online_price numeric(10,2) NOT NULL DEFAULT 250,
  default_duration_minutes smallint NOT NULL DEFAULT 60 CHECK(default_duration_minutes BETWEEN 15 AND 480),
  reminder_message text NOT NULL DEFAULT 'Olá {NOME}! Lembramos da sua consulta em {DATA}, às {HORA}.',
  followup_message text NOT NULL DEFAULT 'Olá {NOME}! Seu plano alimentar está disponível no Portal do Paciente.',
  document_footer text NOT NULL DEFAULT 'Consultório de Nutrição Especializada',
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO clinic_settings(singleton) VALUES(true) ON CONFLICT DO NOTHING;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON clinic_settings FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON clinic_settings FROM authenticated; END IF;
END $$;

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS profiles text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS profile_notes text;

COMMENT ON COLUMN patients.profiles IS
  'Perfis clínicos escolhidos explicitamente no cadastro; nunca inferidos de outros dados pessoais.';
COMMENT ON COLUMN patients.profile_notes IS
  'Descrição livre quando OUTRO ou um contexto adicional for selecionado.';

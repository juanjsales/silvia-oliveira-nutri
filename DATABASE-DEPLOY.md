# Migrações antes do deploy

O endpoint `/health` retorna `503 degraded` quando o banco ainda não possui a versão exigida pelo código publicado. Isso diferencia falha de conexão de banco desatualizado.

## Configuração única no GitHub

No repositório, abra **Settings → Environments → New environment** e crie `production`. Adicione os secrets:

- `DATABASE_URL`: Transaction Pooler do Supabase (`6543`).
- `MIGRATION_DATABASE_URL`: conexão direta ou Session Pooler (`5432`).

Proteja o environment com aprovação manual para impedir alterações acidentais no banco.

## Processo de publicação

1. Abra **Actions → Database migrations → Run workflow** na branch que será publicada.
2. Confira se `Verify schema` terminou com sucesso.
3. Faça ou promova o deploy na Vercel.
4. Confirme que `/health` responde com `status: ok`.

O workflow é manual deliberadamente: migrations clínicas não devem executar em paralelo durante builds ou cold starts da Vercel.

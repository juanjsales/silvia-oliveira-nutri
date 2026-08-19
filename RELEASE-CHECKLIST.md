# Checklist de release

## Verificações automatizadas

Antes de publicar, execute:

```sh
npm ci
npm run check
```

Esse comando valida a sequência das migrações, a versão esperada do schema, os rewrites da Vercel, a proteção dos workflows, tipos, testes e builds de produção. O workflow `Quality gate` também executa os testes de navegação do Playwright.

O build da Vercel executa `npm run release:env` antes de compilar. A validação reprova URLs inseguras, segredos curtos e integrações parcialmente configuradas; ela informa apenas os nomes das variáveis, nunca seus valores.

Após aplicar as migrações e publicar, execute manualmente o workflow `Production smoke test`. Ele exige autenticação administrativa, confirma o schema, a readiness operacional, os módulos essenciais e a revogação da sessão no logout.

## Variáveis obrigatórias na Vercel

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão da aplicação ao pool transacional do PostgreSQL. |
| `FRONTEND_ORIGIN` | Origem HTTPS exata permitida pelo CORS. |
| `APP_URL` | URL HTTPS pública usada nos links enviados por e-mail. |
| `SMTP_FROM` | Remetente padrão; é obrigatório mesmo quando o SMTP fica armazenado no banco. |
| `APP_ENCRYPTION_KEY` | Segredo aleatório com pelo menos 32 caracteres para proteger credenciais SMTP armazenadas. |
| `CRON_SECRET` | Segredo aleatório com pelo menos 32 caracteres usado pelo cron de lembretes. |

Configuração condicional:

- `SMTP_HOST`, `SMTP_USER` e `SMTP_PASS`: obrigatórias em conjunto quando o SMTP não for configurado pela tela administrativa. `SMTP_PORT` e `SMTP_SECURE` são opcionais.
- `Teleconsulta`: 100% nativa em P2P WebRTC (não exige chaves de terceiros nem servidores pagos).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_EXAMS_BUCKET`: obrigatórias em conjunto para upload privado de exames. O recurso é opcional para a readiness geral.
- `VITE_API_URL`: deixe vazia no deploy de mesma origem da Vercel; informe somente se a API estiver em outra origem.

Variáveis com defaults seguros que normalmente não precisam ser definidas: `NODE_ENV`, `PORT`, `HOST`, `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS`, `DB_IDLE_TIMEOUT_MS`, `SESSION_COOKIE_NAME`, `SESSION_TTL_HOURS` e `PASSWORD_RESET_TTL_MINUTES`.

## Secrets obrigatórios no environment `production` do GitHub

| Secret | Workflow |
| --- | --- |
| `DATABASE_URL` | Migrações; conexão operacional usada no status do schema. |
| `MIGRATION_DATABASE_URL` | Migrações; conexão direta usada para aplicar DDL. |
| `SMOKE_ADMIN_IDENTIFIER` | Smoke; e-mail ou CPF de uma conta administrativa dedicada. |
| `SMOKE_ADMIN_PASSWORD` | Smoke; senha da conta administrativa dedicada. |

Não use banco de produção em `E2E_DATABASE_URL`. O teste clínico só aceita nomes de conexão que indiquem explicitamente teste, testing ou homologação.

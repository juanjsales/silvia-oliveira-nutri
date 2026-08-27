# Checklist de release

## Isolamento entre clínica e produto

A política versionada em `.github/deployment-policy.json` é obrigatória e validada por `npm run deploy:policy` no quality gate:

- `main` é exclusivamente a produção real da clínica Silvia e o único ponto autorizado a usar o environment `production` e o domínio `silviaoliveira.vercel.app`;
- `codex/product-platform` aceita somente deploys de `preview` ou `staging`, com banco e credenciais próprios de homologação;
- a branch do produto não pode ser promovida automaticamente ao domínio canônico nem acessar o banco de produção;
- os workflows manuais de migração e smoke produtivos possuem guarda de branch e só executam a partir da `main`;
- qualquer promoção futura exige revisão humana, plano de migração específico e alteração explícita desta política em PR.

Na Vercel, configure o projeto de homologação do produto separadamente e mantenha o domínio canônico associado apenas ao projeto clínico. Esta política é uma trava no repositório; as proteções de branch, environments e projetos também devem permanecer habilitadas nos provedores.

## Verificações automatizadas

Antes de publicar, execute:

```sh
npm ci
npm run check
```

Esse comando valida a sequência das migrações, a versão esperada do schema, os rewrites da Vercel, a proteção dos workflows, tipos, testes e builds de produção. O workflow `Quality gate` também executa os testes de navegação do Playwright.

O build da Vercel executa `npm run release:env` antes de compilar. A validação reprova URLs inseguras, segredos curtos e integrações parcialmente configuradas; ela informa apenas os nomes das variáveis, nunca seus valores.

Após aplicar as migrações e publicar, execute manualmente o workflow `Production smoke test`. Ele aceita somente o domínio canônico, exige autenticação administrativa, reproduz a origem enviada pelo navegador e confirma schema, readiness operacional, atributos seguros do cookie, módulos essenciais e revogação da sessão no logout.

## Variáveis obrigatórias na Vercel

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão da aplicação ao pool transacional do PostgreSQL. |
| `FRONTEND_ORIGIN` | Origem HTTPS exata permitida pelo CORS. |
| `APP_URL` | URL HTTPS pública usada nos links enviados por e-mail. |
| `LEGACY_APP_ORIGINS` | Origens HTTPS antigas, separadas por vírgula, aceitas temporariamente durante migração de domínio. |
| `SMTP_FROM` | Remetente padrão; é obrigatório mesmo quando o SMTP fica armazenado no banco. |
| `APP_ENCRYPTION_KEY` | Segredo aleatório com pelo menos 32 caracteres para proteger credenciais SMTP armazenadas. |
| `CRON_SECRET` | Segredo aleatório com pelo menos 32 caracteres usado pelo cron de lembretes. |

Configuração condicional:

- `SMTP_HOST`, `SMTP_USER` e `SMTP_PASS`: obrigatórias em conjunto quando o SMTP não for configurado pela tela administrativa. `SMTP_PORT` e `SMTP_SECURE` são opcionais.
- `Teleconsulta`: 100% nativa em P2P WebRTC (não exige chaves de terceiros nem servidores pagos).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_EXAMS_BUCKET`: obrigatórias em conjunto para upload privado de exames. O recurso é opcional para a readiness geral.
- `VITE_API_URL`: deixe vazia no deploy de mesma origem da Vercel; informe somente se a API estiver em outra origem.

Variáveis com defaults seguros que normalmente não precisam ser definidas: `NODE_ENV`, `PORT`, `HOST`, `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS`, `DB_IDLE_TIMEOUT_MS`, `SESSION_COOKIE_NAME`, `SESSION_TTL_HOURS`, `PASSWORD_RESET_TTL_MINUTES` e `PATIENT_INVITATION_TTL_HOURS`.

## Secrets obrigatórios no environment `production` do GitHub

| Secret | Workflow |
| --- | --- |
| `DATABASE_URL` | Migrações; conexão operacional usada no status do schema. |
| `MIGRATION_DATABASE_URL` | Migrações; conexão direta usada para aplicar DDL. |
| `SMOKE_ADMIN_IDENTIFIER` | Smoke; e-mail ou CPF de uma conta administrativa dedicada. |
| `SMOKE_ADMIN_PASSWORD` | Smoke; senha da conta administrativa dedicada. |

A conta do smoke deve ser exclusiva para homologação, possuir papel administrativo e usar uma senha própria armazenada apenas como secret do environment `production`. Não reutilize a conta pessoal da nutricionista. O workflow falha — em vez de ignorar a etapa autenticada — quando uma das duas credenciais estiver ausente.

Não use banco de produção em `E2E_DATABASE_URL`. O teste clínico só aceita nomes de conexão que indiquem explicitamente teste, testing ou homologação.

No GitHub Environment `production`, configure preferencialmente `MIGRATION_DATABASE_URL` com a conexão direta ou Session Pooler compatível com DDL. O workflow aceita `DATABASE_URL` como fallback e valida o schema antes e depois de aplicar as migrações. Na Vercel, `CRON_SECRET` deve ter pelo menos 32 caracteres; o agendador envia automaticamente esse valor como `Authorization: Bearer ...` para os endpoints protegidos.

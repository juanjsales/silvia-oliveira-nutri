# API Node.js do sistema nutricional

Fundação do novo backend, criada para substituir Google Apps Script e Google
Sheets. Nesta primeira etapa estão disponíveis autenticação, recuperação de
senha, sessões seguras, auditoria e cadastro de pacientes.

## Banco escolhido: Supabase

Usamos apenas o PostgreSQL gerenciado do Supabase. Autenticação, autorização e
sessões continuam na API Node; o frontend não recebe `service_role`, senha do
banco ou acesso direto às tabelas clínicas.

No painel do Supabase, use **Connect** para obter:

- `DATABASE_URL`: Supavisor transaction mode (`6543`) para Vercel/serverless. Use
  `DB_POOL_MAX=2` (ou `1` em planos com limite baixo) para não multiplicar conexões
  a cada instância da função. Em servidor Node persistente, session mode (`5432`)
  também pode ser usado com um pool maior configurado conscientemente.
- `MIGRATION_DATABASE_URL`: conexão direta (`db.PROJECT_REF...:5432`) para
  migrations. Em rede sem IPv6, use Supavisor session mode.

Mantenha `?sslmode=require` nas duas URLs. A migration ativa RLS e não cria
políticas para `anon` ou `authenticated`; a Data API não terá acesso às tabelas.

## Requisitos

- Node.js 22+
- Projeto Supabase

## Configuração local

```powershell
Copy-Item .env.example .env
# Preencha DATABASE_URL e MIGRATION_DATABASE_URL com os valores de Connect
npm install
npm run db:migrate
npm run admin:create -- admin@example.com "uma-senha-forte"
npm run dev
```

Não use a senha ou o endereço de exemplo em produção.

## Rotas iniciais

| Método | Rota | Acesso |
|---|---|---|
| GET | `/health` | Público |
| POST | `/api/auth/login` | Público, 5 tentativas/15 min |
| POST | `/api/auth/logout` | Autenticado |
| GET | `/api/auth/me` | Autenticado |
| POST | `/api/auth/password-recovery` | Público, 3 solicitações/hora |
| POST | `/api/auth/password-reset` | Token de uso único |
| GET | `/api/patients` | Administradora |
| GET | `/api/patients/:id` | Administradora |
| POST | `/api/patients` | Administradora |
| PATCH | `/api/patients/:id` | Administradora |
| DELETE | `/api/patients/:id` | Administradora; desativação lógica |
| GET | `/api/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD` | Administradora |
| POST | `/api/appointments` | Administradora |
| PATCH | `/api/appointments/:id` | Administradora |
| GET/POST | `/api/encounters` | Administradora |
| GET | `/api/encounters/:id` | Administradora |
| PUT | `/api/encounters/:id/sections/:section` | Administradora |
| POST | `/api/encounters/:id/finalize` | Administradora |
| GET | `/api/nutrition/foods` | Administradora |
| GET | `/api/nutrition/recipes` | Administradora |
| GET | `/api/nutrition/templates` | Administradora |
| GET/POST | `/api/nutrition/plans` | Administradora |
| PATCH | `/api/nutrition/plans/:id` | Administradora |

As sessões são mantidas em cookies `HttpOnly`, `SameSite=Lax` e `Secure` em
produção. Tokens de sessão e recuperação são armazenados apenas como SHA-256;
senhas usam Argon2id.

O `docker-compose.yml` permanece apenas como opção de desenvolvimento offline.

## Decisões relevantes

- Exclusão de paciente é lógica para preservar integridade clínica e auditoria.
- Recuperação envia o e-mail antes de persistir o token.
- A redefinição revoga todas as sessões existentes.
- Logs ocultam cookies, tokens e senhas.
- O banco começa vazio; não há importação das planilhas.

## Próxima etapa

Criar o núcleo do prontuário (`anamneses`, `evolutions`, `meal_plans`, `exams`
e `prescriptions`) e migrar a sequência clínica orientada do atendimento.

# Arquitetura da plataforma comercial

Status: decisão de arquitetura para implementação incremental na branch `codex/product-platform`.

## 1. Objetivo e princípios

A plataforma distribui uma instalação isolada do sistema para cada nutricionista ou clínica. A instalação da Dra. Silvia, mantida na `main`, não é ambiente de desenvolvimento, homologação, control plane nem tenant piloto.

Princípios obrigatórios:

1. **Um tenant, um banco clínico e um deploy.** Não existe tabela clínica compartilhada entre clientes.
2. **A central não lê dados assistenciais.** Ela administra contratos, versões e estado técnico, não pacientes.
3. **Credenciais pertencem ao cliente.** Preferir OAuth e autorizações revogáveis; nunca pedir senha de conta Supabase, Vercel ou GitHub.
4. **Falha fechada.** Indisponibilidade da central não libera funcionalidades contratualmente bloqueadas nem impede acesso clínico já autorizado.
5. **Publicação deliberada.** Migrações são aplicadas antes do código e nunca durante build ou cold start.
6. **Compatibilidade verificável.** Cada release declara versão mínima/máxima de schema, passos de migração e rollback possível.

## 2. Visão de componentes

```text
Operador da plataforma                 Nutricionista / equipe / paciente
          |                                         |
          v                                         v
+-----------------------+              +-------------------------------+
| Control plane         |              | Tenant plane (um por clínica) |
| portal + API          |              | Vite + API Node na Vercel     |
| Supabase da plataforma|              | Supabase PostgreSQL próprio   |
+-----------+-----------+              +---------------+---------------+
            | OAuth / APIs de gestão                   |
            +------------------------------------------+
             cria/configura deploy; nunca consulta
             tabelas ou endpoints clínicos
```

### 2.1 Control plane

Aplicação e projeto Supabase exclusivos da empresa operadora. Responsabilidades:

- cadastro comercial da clínica e contatos administrativos;
- termos, consentimentos comerciais e base legal aplicável;
- plano, situação de cobrança e direitos de uso (`entitlements`);
- catálogo de releases e compatibilidade de schema;
- orquestração e histórico de provisionamento;
- referências opacas dos recursos externos (`project_id`, `deployment_id`, domínio);
- health técnico mínimo informado pelo tenant;
- auditoria de ações de operadores e de automações;
- concessão temporária e explícita de suporte.

O control plane deve usar seu próprio banco, projeto Vercel, domínio, secrets, logs e backups. Nenhuma variável `DATABASE_URL` de tenant pode ser configurada no runtime geral da central.

### 2.2 Tenant plane

Uma instância isolada do sistema atual por clínica:

- frontend Vite e API Node no mesmo deploy Vercel;
- Supabase usado como PostgreSQL gerenciado;
- autenticação, autorização e sessões na API Node;
- nenhum segredo ou acesso direto às tabelas no frontend;
- RLS sem políticas para `anon`/`authenticated`, mantendo a Data API sem acesso clínico;
- `DATABASE_URL` para runtime e `MIGRATION_DATABASE_URL` apenas para job controlado de migração;
- storage, SMTP, domínio, contas profissionais e dados clínicos pertencentes ao tenant.

O tenant conhece apenas seu `tenant_id`, a chave pública de verificação de licença, o endpoint restrito da central e seu token técnico rotacionável. Ele não recebe credenciais da central nem identifica outros tenants.

## 3. Dados da central

### Permitidos

- razão social/nome comercial, CNPJ/CPF quando necessário para contrato e cobrança;
- nome, e-mail e telefone de responsáveis comerciais/administrativos;
- identificador interno aleatório do tenant;
- plano, ciclo de cobrança, status contratual, limites e datas;
- IDs externos opacos de projeto/deploy e domínio público;
- versão do aplicativo, versão do schema, data do último health check;
- códigos de erro técnicos sanitizados, duração e fase de jobs;
- trilha de auditoria: ator, ação, alvo técnico, horário, resultado e justificativa;
- hash/identificador de credencial, escopos e expiração, sem expor o segredo.

### Proibidos

- cadastro de pacientes, CPF de paciente ou contato de paciente;
- prontuário, anamnese, evolução, medidas, exames, prescrições ou plano alimentar;
- agenda nominal, teleconsulta, mensagens ou documentos clínicos;
- conteúdo de e-mails/SMS/push clínicos;
- cookies, senhas, tokens de sessão ou recuperação;
- `DATABASE_URL`, senha do banco ou chaves de serviço em tabelas, logs ou tickets;
- dumps, anexos ou backups clínicos;
- logs com corpo de requisição/resposta do tenant.

Telemetria central é agregada e técnica. Exemplos válidos: `schema_version=44`, `health=ok`, `migration_duration_ms=8120`. Exemplos inválidos: nome do paciente, URL assinada de exame ou payload de consulta.

## 4. Modelo mínimo do control plane

As tabelas abaixo são uma especificação lógica; nomes finais podem seguir as convenções do projeto.

| Entidade | Campos essenciais |
|---|---|
| `tenants` | id UUID, nome comercial, status, região, criado_em |
| `tenant_contacts` | tenant_id, tipo, nome, e-mail, telefone, base/finalidade |
| `subscriptions` | tenant_id, plano, status, início, renovação, cancelamento |
| `entitlements` | tenant_id, recurso, limite/booleano, válido_até |
| `provider_connections` | tenant_id, provedor, owner externo, escopos, expiração, secret_ref |
| `tenant_resources` | tenant_id, tipo, external_id, região, domínio, status |
| `releases` | versão imutável, commit/tag, schema alvo, artefato, checksum, status |
| `deployments` | tenant_id, release, estado, fase, tentativa, timestamps |
| `provisioning_events` | deployment_id, fase, resultado, erro sanitizado, correlação |
| `support_grants` | tenant_id, escopo, justificativa, aprovado_por, expira_em, revogado_em |
| `audit_events` | ator, ação, recurso, resultado, IP truncado/retido por política, data |

Tokens OAuth e secrets ficam em cofre gerenciado, referenciados por `secret_ref`. Devem ser criptografados com chave fora do banco, rotacionáveis e inacessíveis em listagens e logs.

## 5. Identidade, OAuth e autorização

### Central

- login de operador com MFA obrigatório;
- RBAC separado: comercial, suporte, provisionador e administrador de segurança;
- ações críticas exigem reautenticação; acesso de suporte exige justificativa e expiração;
- contas de serviço específicas por automação, sem compartilhar conta humana.

### Conexões de provedor

OAuth usa Authorization Code com PKCE e parâmetro `state` de uso único. O callback valida `state`, emissor e expiração antes de trocar o código. Solicitar o menor conjunto de escopos possível e registrar consentimento, escopos e owner externo.

- Supabase: autorização de gestão limitada a criar/configurar o projeto escolhido. Se o provedor ou plano não oferecer OAuth adequado, usar fluxo assistido em que o cliente cria o projeto e fornece somente referências/segredos pelo cofre; nunca senha da conta.
- Vercel: autorização limitada ao team/escopo selecionado, criação do projeto, variáveis e deploys.
- GitHub, se necessário: GitHub App instalada apenas no repositório/template ou organização dedicada; evitar token pessoal amplo.

Revogação remove a conexão do cofre e marca recursos como não gerenciáveis; não exclui a instalação. Callbacks e webhooks devem validar assinatura, timestamp e idempotency key.

### Tenant

A autenticação clínica continua local à API Node. A central não é provedor de login para profissionais ou pacientes. O RBAC do tenant (`CLINIC_OWNER`, `NUTRITIONIST`, `RECEPTIONIST`, `PATIENT`, `SMOKE_TEST`) é independente do RBAC de operadores da plataforma.

## 6. Licenciamento seguro e modo degradado

O licenciamento não pode depender de uma consulta síncrona à central em cada request e não pode conceder acesso clínico.

1. A central emite um documento curto assinado assimetricamente contendo `tenant_id`, plano, entitlements, emissão, expiração, versão mínima e identificador único.
2. O tenant guarda somente o documento assinado; a chave privada permanece exclusivamente na central e a chave pública é incorporada/configurada no tenant.
3. A API valida assinatura, tenant, datas e versão local. Nunca confiar em flags vindas do frontend.
4. Renovação ocorre em background por canal autenticado, com jitter e cache local.
5. Indisponibilidade da central ativa uma janela de tolerância definida contratualmente. Durante ela, funções já licenciadas continuam e novas concessões não aparecem.
6. Após expiração e tolerância, bloquear apenas recursos comerciais opcionais. Login, leitura/exportação de dados próprios e rotinas necessárias à continuidade assistencial permanecem disponíveis conforme política jurídica e contratual.

Suspensão, revogação ou redução de plano gera evento auditável e nunca apaga dados. Alterações de entitlement devem ser monotônicas por número de versão para impedir replay. A comunicação usa TLS e token técnico rotacionável; respostas não contêm dados clínicos.

## 7. Releases e atualizações

- Releases são imutáveis, identificadas por SemVer, tag/commit e checksum do artefato.
- O catálogo distingue `draft`, `canary`, `approved`, `deprecated` e `blocked`.
- Cada release declara schema esperado, pré-requisitos, incompatibilidades e estratégia de rollback.
- Promoção: testes locais/CI -> tenant fictício de homologação -> canário consentido -> lote pequeno -> expansão gradual.
- Atualização por tenant usa lock exclusivo para impedir dois jobs simultâneos.
- Antes da migração: validar backup/restauração, espaço, versão atual e compatibilidade.
- Depois: verificar schema, `/health`, login smoke dedicado e módulos essenciais sem usar paciente real.

Migrações seguem o padrão atual: job deliberado antes do deploy. Migrations destrutivas exigem estratégia expand/contract em releases distintas; downgrade de schema não é presumido.

## 8. LGPD e segurança operacional

Papéis jurídicos e responsabilidades devem constar em contrato e RIPD, conforme o caso. Por arquitetura, a clínica controla os dados clínicos de sua instância; a operadora trata apenas o necessário para hospedagem/suporte conforme instruções e bases definidas.

Controles mínimos:

- minimização, finalidade e retenção documentadas por categoria;
- região de dados acordada e subprocessadores registrados;
- criptografia em trânsito e em repouso, secrets em cofre;
- backups por tenant, restauração testada e retenção definida;
- auditoria imutável ou resistente a adulteração;
- logs sanitizados e correlação por IDs aleatórios;
- processo para incidente, comunicação e preservação de evidências;
- exportação e eliminação executadas no tenant, com retenções legais e trilha;
- suporte temporário, com escopo mínimo, aprovação do cliente e expiração automática.

Suporte padrão usa diagnóstico técnico sem acesso a conteúdo. Acesso excepcional ao tenant deve ser `break-glass`, com autorização explícita, MFA, duração curta, registro integral e revogação automática. Não criar usuário mestre universal.

## 9. Limites de rede e secrets

- Central e tenants em projetos e bancos distintos; sem foreign data wrapper ou réplica cruzada.
- Endpoints de controle do tenant aceitam apenas operações técnicas enumeradas (health sanitizado, licença e comando de atualização autenticado).
- Egress da central para banco clínico é proibido por design. O executor efêmero de migração recebe credencial por job, não a persiste e a descarta ao terminar.
- Segredos de um tenant nunca são reutilizados em outro.
- Ambientes `development`, `homologation` e `production` possuem projetos, chaves e contas separados.
- Preview de PR usa banco fictício descartável ou de homologação; nunca o banco da Dra. Silvia nem de cliente.

## 10. Fases de entrega

1. **Isolamento do produto:** branch-base, Supabase/Vercel de homologação e dados fictícios; nenhum vínculo com `main`.
2. **Identidade e RBAC do tenant:** concluir permissões e gestão de equipe mantendo compatibilidade legada.
3. **Control plane mínimo:** tenants, contatos, assinaturas, releases, auditoria e RBAC de operador.
4. **Provisionamento assistido:** checklist e executor por fases, com credenciais no cofre e intervenção humana.
5. **Licença assinada:** entitlements locais, renovação, tolerância e testes de falha da central.
6. **Automação OAuth:** conexões revogáveis com provedores e criação idempotente de recursos.
7. **Atualizações graduais:** canário, lotes, backup, health gate e rollback do código.
8. **Operação madura:** suporte break-glass, resposta a incidentes, recuperação testada e evidências LGPD.

Nenhuma fase promove automaticamente código para `main`. Melhorias úteis à instalação atual exigem seleção e PR independentes.

## 11. Critérios arquiteturais de aceite

- desligar a central não interrompe consulta ou login local já licenciados;
- comprometer um tenant não fornece credenciais ou identificadores utilizáveis de outro;
- operador comercial não consegue obter segredo ou dado clínico;
- logs e banco da central não contêm dado de paciente em testes automatizados de prevenção;
- cada job é idempotente, retomável e auditável;
- atualização com falha conserva a versão anterior do deploy e não executa downgrade destrutivo automático;
- restauração de backup é testada em ambiente isolado antes do primeiro cliente pago.

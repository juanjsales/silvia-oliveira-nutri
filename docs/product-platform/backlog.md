# Backlog executável da plataforma

Este backlog transforma `architecture.md` e `provisioning-flow.md` em entregas pequenas. Ele se aplica somente à linha de produto iniciada em `codex/product-platform`; não autoriza mudanças, deploys ou migrações na `main` nem na instalação da Dra. Silvia.

## Corte do MVP de provisionamento

O MVP é um **provisionamento assistido, seguro e repetível** de uma clínica fictícia em homologação. Ele não precisa criar contas de provedores automaticamente.

### Incluído no MVP

- control plane separado com cadastro de tenant, contato, plano, recursos e auditoria;
- estados persistidos do provisionamento e retomada por fase;
- vínculo assistido de um projeto Supabase e um projeto Vercel exclusivos;
- secrets inseridos diretamente em cofre/ambiente protegido, sem persistência no banco central;
- executor deliberado de migrations antes do deploy;
- deploy de release imutável e verificação de schema/health;
- convite de uso único para `CLINIC_OWNER` e conta `SMOKE_TEST` mínima;
- licença assinada, validada localmente e com tolerância à indisponibilidade da central;
- checklist de aceite, auditoria, falha segura e rollback de código;
- dados totalmente fictícios e ambiente sem vínculo com produção real.

### Fora do MVP

- criação automática de projetos via OAuth/API;
- cobrança automática, marketplace ou autoatendimento comercial;
- rollout simultâneo para vários clientes;
- migração de dados de clínica existente;
- suporte com acesso clínico remoto;
- exclusão automática de recursos no offboarding;
- customização avançada de domínio, tema ou módulos por cliente;
- downgrade automático de banco.

### Critério de conclusão do MVP

O MVP está concluído quando um operador autorizado consegue provisionar do zero uma instalação fictícia, interromper e retomar o processo sem duplicar recursos, ativá-la após todos os gates, validar a licença com a central offline e reverter um deploy defeituoso sem perda de banco. A central deve permanecer sem qualquer dado de paciente ou segredo de tenant em suas tabelas e logs.

## Fase 0 — Guardrails e homologação isolada

Objetivo: tornar impossível confundir produto, homologação e produção atual.

### Entregas

- [ ] Registrar IDs/domínios proibidos da instalação da Dra. Silvia em política versionada sem secrets.
- [ ] Definir matriz de ambientes: local, homologação do produto e futuro tenant de produção.
- [ ] Criar inventário dos nomes de variáveis por escopo, proprietário e consumidor.
- [ ] Definir fixtures exclusivamente fictícias e conta smoke sem permissão clínica.
- [ ] Documentar responsáveis por aprovar migrations, deploy e operação destrutiva.

### Critérios de aceite

- validação falha antes de qualquer mutação quando um ID/domínio proibido é informado;
- preview não aceita URL de banco cujo ambiente seja produção real;
- nenhum documento ou fixture contém credencial ou dado clínico real;
- cada ação crítica tem um aprovador definido.

## Fase 1 — Fundação do tenant

Objetivo: concluir o isolamento de identidade e permissões dentro de uma instalação.

### Entregas

- [ ] Consolidar papéis `CLINIC_OWNER`, `NUTRITIONIST`, `RECEPTIONIST`, `PATIENT` e `SMOKE_TEST`.
- [ ] Implementar gestão mínima de equipe: convite, perfil, ativação, desativação e revogação de sessão.
- [ ] Migrar autorização de áreas prioritárias de `ADMIN` genérico para permissões explícitas.
- [ ] Garantir auditoria de alterações administrativas.
- [ ] Preservar compatibilidade apenas onde declarada e testada.

### Critérios de aceite

- recepcionista não acessa prontuário quando não possui permissão clínica;
- nutricionista acessa somente funções concedidas;
- paciente não entra em áreas profissionais;
- smoke executa apenas verificações técnicas autorizadas;
- desativar usuário revoga sessões e mantém trilha de auditoria.

## Fase 2 — Control plane mínimo

Objetivo: armazenar somente metadados necessários e controlar o ciclo do tenant.

### Entregas

- [ ] Criar projeto Supabase e aplicação da central separados de qualquer tenant.
- [ ] Implementar entidades mínimas: `tenants`, `tenant_contacts`, `subscriptions`, `entitlements`, `tenant_resources`, `releases`, `deployments`, `provisioning_events` e `audit_events`.
- [ ] Implementar RBAC de operador: comercial, provisionador, suporte e segurança.
- [ ] Sanitizar logs por allowlist e bloquear campos clínicos/secrets conhecidos.
- [ ] Cadastrar release imutável com commit/tag, checksum e schema esperado.

### Critérios de aceite

- operador comercial não visualiza credenciais nem executa deploy;
- banco central rejeita ou não possui campos para conteúdo clínico;
- toda transição de deployment registra ator, horário, origem e resultado;
- uma release publicada não pode ter commit, checksum ou schema alterados;
- testes demonstram que payloads proibidos não aparecem em logs.

## Fase 3 — Orquestrador assistido (núcleo do MVP)

Objetivo: conduzir provisionamento por fases idempotentes, mesmo com recursos criados manualmente.

### Entregas

- [ ] Implementar máquina de estados descrita no fluxo de provisionamento.
- [ ] Gerar `operation_id`, idempotency key e lock exclusivo por tenant.
- [ ] Criar telas/endpoints para vincular external IDs de Supabase e Vercel.
- [ ] Validar ownership, ambiente e denylist antes de aceitar um recurso.
- [ ] Persistir eventos sanitizados e permitir retry apenas de fases seguras.
- [ ] Exigir aprovação explícita para ativação e qualquer limpeza de recurso.

### Critérios de aceite

- repetir uma fase não cria segundo tenant, projeto ou deployment;
- concorrência para o mesmo tenant produz um vencedor e uma tentativa recusada;
- job interrompido retoma da última fase confirmada;
- timeout ambíguo consulta o estado externo antes de tentar criar novamente;
- erro registrado não contém token, URL de banco ou resposta bruta do provedor.

## Fase 4 — Migrations, deploy e gates (conclusão do MVP)

Objetivo: publicar uma instalação fictícia de forma verificável e reversível no nível do código.

### Entregas

- [ ] Executar migrations em job efêmero com lock e credencial temporária.
- [ ] Validar sequência/checksum, versão do schema e RLS após migration.
- [ ] Publicar release fixada em preview e depois no domínio de homologação.
- [ ] Executar preflight, build, `/health`, login/logout smoke e módulos essenciais.
- [ ] Criar convite de uso único para o owner sem senha conhecida pela operadora.
- [ ] Registrar deployment anterior conhecido como bom e operação de repromoção.

### Critérios de aceite

- código nunca é promovido antes de schema compatível;
- migration falha impede o deploy e mantém diagnóstico sanitizado;
- smoke falho impede ativação;
- repromoção restaura a versão anterior compatível sem excluir ou restaurar o banco;
- tenant ativado possui domínio/TLS, owner e evidências dos gates;
- nenhuma etapa usa banco, domínio, usuário ou secret da Dra. Silvia.

## Fase 5 — Licença assinada e resiliência (conclusão do MVP)

Objetivo: aplicar direitos comerciais sem acoplar a continuidade clínica à central.

### Entregas

- [ ] Definir payload versionado de licença e par de chaves assimétricas.
- [ ] Assinar na central e validar exclusivamente na API do tenant.
- [ ] Implementar cache, renovação em background, jitter e janela de tolerância.
- [ ] Impedir replay usando versão/identificador monotônico.
- [ ] Definir matriz de recursos opcionais versus funções de continuidade.

### Critérios de aceite

- adulterar payload, tenant, datas ou assinatura invalida a licença;
- chave privada nunca está no tenant;
- central indisponível não interrompe operação licenciada durante a tolerância;
- expiração não apaga dados nem bloqueia leitura/exportação necessária;
- frontend não consegue liberar entitlement sem validação da API.

## Fase 6 — Piloto controlado

Objetivo: comprovar o MVP em homologação antes de qualquer cliente real.

### Entregas

- [ ] Provisionar tenant fictício do zero usando o runbook.
- [ ] Ensaiar interrupção/retry em cada fase mutável.
- [ ] Ensaiar falha de migration, deploy ruim e central offline.
- [ ] Restaurar backup em projeto isolado e medir RTO/RPO observado.
- [ ] Revisar banco/logs da central procurando dados e secrets proibidos.
- [ ] Produzir evidências e lista de riscos residuais para aceite.

### Critérios de aceite

- todos os critérios do corte do MVP são demonstrados;
- restauração produz aplicação íntegra e schema esperado;
- rollback de código respeita compatibilidade de schema;
- varredura não encontra dados clínicos ou secrets na central;
- riscos residuais têm proprietário, mitigação e prazo;
- aprovação humana encerra o piloto, sem promoção automática a cliente real.

## Fase 7 — Pós-MVP: OAuth e escala

Objetivo: automatizar apenas o fluxo já comprovado.

### Entregas

- [ ] OAuth Authorization Code + PKCE para provedores suportados.
- [ ] Tokens em cofre com rotação, revogação e escopos mínimos.
- [ ] Webhooks assinados, anti-replay e idempotentes.
- [ ] Criação automática de recursos com tags de ownership.
- [ ] rollout canário e por lotes, com pausa automática por erro.

### Critérios de aceite

- revogar OAuth impede novas mudanças, mas não exclui nem derruba o tenant;
- callback valida `state`, emissor, owner e expiração;
- automação não amplia escopos sem novo consentimento;
- taxa de falha do lote interrompe novas promoções;
- recursos criados são reconciliáveis por external ID e idempotency key.

## Fase 8 — Pós-MVP: operação e encerramento

Objetivo: preparar suporte, incidentes e offboarding de clientes reais.

### Entregas

- [ ] Suporte `break-glass` com MFA, dupla aprovação, escopo e expiração.
- [ ] Runbooks de incidente, rotação de secrets e comunicação.
- [ ] Exportação do tenant e retenção configurável.
- [ ] Offboarding com dupla confirmação e validação exata de recursos.
- [ ] Evidências LGPD, subprocessadores e testes recorrentes de restauração.

### Critérios de aceite

- não existe usuário mestre universal;
- acesso excepcional expira e é integralmente auditado;
- offboarding nunca remove recurso por nome, slug ou correspondência parcial;
- exportação acontece diretamente no tenant;
- exclusão preserva apenas evidências permitidas pela política de retenção.

## Ordem de execução e dependências

```text
Fase 0 -> Fase 1
      \-> Fase 2 -> Fase 3 -> Fase 4 -> Fase 5 -> Fase 6
                                                   |
                                      MVP aprovado-+
                                                   v
                                          Fases 7 e 8
```

Fases 1 e 2 podem avançar em paralelo após os guardrails. O orquestrador depende do modelo central; deploy depende do orquestrador; licença depende de identidade estável do tenant; piloto depende de todo o MVP.

## Definição de pronto para qualquer item

Um item só está pronto quando:

- possui testes proporcionais ao risco e caso de falha;
- não introduz segredo ou dado clínico em log/central;
- registra evento auditável quando altera estado;
- inclui instrução de operação e recuperação;
- passa preflight, typecheck, testes e build aplicáveis;
- foi verificado exclusivamente em ambiente fictício;
- não altera nem depende da `main` ou da produção da Dra. Silvia.

## Próximas três histórias recomendadas

1. **Política de isolamento:** como provisionador, quero que IDs e domínios protegidos sejam recusados antes de qualquer mutação, para eliminar risco contra a produção atual.
2. **Modelo mínimo da central:** como operador, quero registrar tenant, release, deployment e eventos sem dados clínicos, para ter uma fonte de verdade auditável.
3. **Máquina de estados idempotente:** como provisionador, quero retomar uma operação interrompida sem duplicar recursos, para executar o fluxo assistido com segurança.

Essas histórias iniciam a implementação sem depender de OAuth ou automação destrutiva.

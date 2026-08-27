# Fluxo de provisionamento de uma clínica

Este runbook descreve um fluxo implementável para a stack atual (Vite, API Node, Vercel e PostgreSQL Supabase), orquestrado pelo control plane definido em `architecture.md`.

## 1. Estados e garantias

```text
DRAFT -> AWAITING_AUTHORIZATION -> VALIDATING -> PROVISIONING_DATABASE
      -> MIGRATING -> PROVISIONING_APP -> CONFIGURING -> VERIFYING
      -> AWAITING_ACCEPTANCE -> ACTIVE

Qualquer fase pode ir para FAILED_RETRYABLE ou FAILED_MANUAL.
ACTIVE pode ir para UPDATING, SUSPENDED, OFFBOARDING ou ARCHIVED.
```

Cada execução recebe `operation_id`, idempotency key, tenant, release alvo e versão de estado. Transições usam compare-and-set; somente um job mutável por tenant mantém o lock. Repetir uma etapa deve retornar o recurso já criado ou continuar com segurança, nunca duplicá-lo.

## 2. Pré-condições

- contrato e responsáveis cadastrados;
- região, plano e domínio escolhidos;
- controlador/operador e subprocessadores formalizados;
- autorizações OAuth concluídas com escopo mínimo, ou fluxo assistido aprovado;
- release marcada `approved` e compatível com instalação vazia;
- projeto de homologação validado com a mesma release;
- contatos de incidente e recuperação confirmados.

O sistema rejeita qualquer conexão cujo identificador corresponda à instalação da Dra. Silvia ou a outro tenant. Essa denylist é validada antes de armazenar referências e antes de cada mutação.

## 3. Provisionamento inicial

### Fase A — Reserva

1. Gerar `tenant_id` UUID e slug não sensível.
2. Reservar domínio e nomes de projeto sem usar nome de paciente.
3. Criar registro de deployment em `DRAFT` com release alvo.
4. Registrar aceite, finalidade e autorizações sem copiar conteúdo de provedores.

Rollback: liberar apenas reservas não publicadas e marcar a operação cancelada. Não apagar registros de auditoria.

### Fase B — Autorização dos provedores

1. Redirecionar o responsável ao provedor usando Authorization Code + PKCE e `state` único.
2. Exibir exatamente owner/team e escopos solicitados.
3. Armazenar tokens somente no cofre e salvar `secret_ref`, escopos e expiração na central.
4. Testar uma chamada de leitura mínima e confirmar que o owner selecionado corresponde ao tenant.

Se OAuth não estiver disponível, o cliente cria o recurso seguindo checklist. Segredos são inseridos diretamente no cofre por formulário de uso único, nunca em chat, e-mail, issue ou campo comum do banco.

Rollback: revogar token/conexão recém-criada; recursos ainda não criados permanecem inexistentes.

### Fase C — Banco do tenant

1. Criar ou vincular projeto Supabase exclusivo na região acordada.
2. Aguardar disponibilidade e capturar apenas o external project ID na central.
3. Gerar credenciais distintas de runtime e migração.
4. Configurar SSL obrigatório, pool compatível com serverless e backup/retention contratados.
5. Colocar `DATABASE_URL` e `MIGRATION_DATABASE_URL` no cofre de implantação do tenant; nunca no banco da central.
6. Verificar banco vazio e ausência de vínculos com outros tenants.

Rollback antes de dados: remover o projeto somente após dupla confirmação de que foi criado pela operação, está vazio e o external ID coincide. Caso contrário, preservar e encaminhar para revisão manual.

### Fase D — Schema

1. Iniciar executor efêmero com a release imutável e `MIGRATION_DATABASE_URL` injetada em memória/ambiente do job.
2. Adquirir advisory lock de migração.
3. Validar sequência e checksum das migrations.
4. Executar `npm run db:migrate` e verificar a versão esperada do schema.
5. Confirmar RLS e ausência de políticas Data API para papéis públicos.
6. Destruir executor e credencial temporária/rotação quando suportado.

Não há downgrade automático. Falha transacional reverte a migration corrente; falha após migrations concluídas mantém o banco na versão nova e impede deploy incompatível.

### Fase E — Aplicação

1. Criar/vincular projeto Vercel exclusivo no team autorizado.
2. Fixar a release por tag/commit e checksum, sem deploy a partir de branch mutável.
3. Configurar variáveis do tenant: URLs de banco, segredos de sessão/cron, domínio canônico, SMTP/storage e chave pública de licença.
4. Criar token técnico do tenant e documento inicial de licença assinado.
5. Executar build com validação de ambiente e publicar primeiro em URL de preview.
6. Não configurar credenciais smoke da central como usuário clínico permanente.

Rollback: apagar preview inválido ou promover novamente o deployment conhecido como bom. Nunca apagar banco como consequência de falha de frontend.

### Fase F — Bootstrap e verificação

1. Criar convite de uso único para `CLINIC_OWNER`, com expiração curta; não definir senha conhecida pela operadora.
2. Criar conta `SMOKE_TEST` de privilégio mínimo, isolada e rotacionável.
3. Verificar `/health`, schema, headers/cookies seguros, login/logout smoke, licença e módulos essenciais com dados sintéticos.
4. Confirmar que endpoints e logs não enviam conteúdo clínico à central.
5. Configurar domínio e TLS; repetir smoke no domínio canônico.
6. Entregar códigos/processo de recuperação ao responsável por canal autenticado.

Falha de smoke impede ativação. A instalação fica inacessível ao público ou marcada como manutenção até correção.

### Fase G — Aceite e ativação

1. Responsável aceita termos, ativa MFA quando disponível, troca/configura credenciais e confirma identidade visual.
2. Realizar teste de restauração do backup em projeto isolado ou obter evidência recente do procedimento.
3. Registrar versão, schema, domínio, evidências técnicas e aceite.
4. Marcar `ACTIVE`, iniciar renovação de licença e monitoramento técnico sanitizado.
5. Revogar acessos temporários de provisionamento e conexões que não sejam necessárias para operação contínua.

## 4. Atualização de tenant

1. Selecionar release `approved` compatível e criar operação `UPDATING`.
2. Renovar/verificar autorização do provedor sem ampliar escopos silenciosamente.
3. Validar health atual, versão, schema, capacidade e ausência de outra operação.
4. Confirmar backup recuperável e registrar o recovery point sem copiar o backup à central.
5. Publicar candidato em preview contra ambiente de homologação; executar gates.
6. Para o tenant, aplicar migrations compatíveis sob lock e verificar schema.
7. Publicar novo deployment, executar smoke sintético e promover domínio.
8. Observar janela curta de canário; concluir ou pausar o lote.

Para mudanças destrutivas:

- release N expande schema e mantém compatibilidade;
- release N+1 migra/backfill e passa a usar o novo formato;
- somente após período de estabilidade uma release posterior remove o formato antigo.

## 5. Falhas e rollback

| Falha | Resposta automática | Quando exigir ação humana |
|---|---|---|
| OAuth expirado/revogado | pausar e solicitar reconexão | owner/escopo divergente |
| rate limit do provedor | retry com backoff, jitter e limite | tentativas esgotadas |
| criação ambígua por timeout | consultar por idempotency key/tag | mais de um recurso candidato |
| migration falha | interromper deploy; preservar logs sanitizados | migration não transacional ou schema parcial |
| build/deploy falha | manter deployment anterior | nenhum deployment saudável |
| smoke pós-deploy falha | não promover ou repromover versão anterior | migration incompatível com versão anterior |
| central indisponível | tenant opera com licença em cache | tolerância expirada |
| possível vazamento de secret | revogar/rotacionar e congelar job | sempre abrir incidente |

Rollback de código usa o deployment anterior conhecido como bom, desde que compatível com o schema atual. Rollback de dados usa restauração para novo projeto e reconciliação aprovada; nunca sobrescrever produção automaticamente. Se a versão anterior não suporta o schema, servir modo de manutenção/continuidade compatível e corrigir adiante.

Erros persistidos na central contêm fase, código interno, provedor, timestamp e correlation ID, sem stack com secrets, URL de banco, payload clínico ou resposta bruta do provedor.

## 6. Suspensão, suporte e desligamento

### Suspensão comercial

- atualizar licença/entitlements sem excluir recursos;
- manter acesso mínimo necessário a dados próprios, exportação e continuidade definida;
- bloquear apenas funções opcionais previstas em contrato;
- informar responsável e registrar motivo, ator e prazo.

### Suporte temporário

1. Cliente abre solicitação e define escopo.
2. Operador habilitado registra justificativa; segundo aprovador para acesso sensível.
3. Conceder acesso nominal, MFA, somente leitura quando possível e expiração automática.
4. Auditar ações e revogar ao concluir.
5. Se conteúdo clínico for inevitável, registrar base/instrução, minimizar e não copiar para ticket.

### Offboarding

1. Confirmar identidade e autoridade do solicitante.
2. Congelar novas cobranças e mudanças, mantendo acesso previsto.
3. Oferecer exportação verificável diretamente do tenant.
4. Definir prazo de retenção e data de eliminação conforme contrato/obrigações.
5. Revogar OAuth, tokens técnicos, webhooks e acessos de suporte.
6. Remover recursos somente após confirmação explícita, backup/exportação acordada e validação exata dos external IDs.
7. Guardar apenas comprovantes e auditoria permitidos pela política de retenção; nunca reter dump clínico na central.

## 7. Observabilidade e alertas

O tenant envia somente:

- disponibilidade e latência do `/health` sanitizado;
- versão do app e schema;
- sucesso/falha de backup, migração e renovação de licença;
- contadores técnicos agregados, sem dimensões de paciente.

Alertas mínimos: falha de backup, schema divergente, licença perto de expirar, domínio/TLS, OAuth expirando, smoke falho, múltiplas tentativas de job e uso de release bloqueada. Logs detalhados clínicos permanecem no tenant, com acesso regido pela clínica.

## 8. Checklist de aceite por tenant

- [ ] Supabase, Vercel, domínio e secrets são exclusivos.
- [ ] Nenhuma referência aponta para `main` ou produção da Dra. Silvia.
- [ ] Banco vazio recebeu migrations verificadas e RLS esperado.
- [ ] Preview e produção passaram preflight, build e smoke sintético.
- [ ] `CLINIC_OWNER` entrou por convite e a operadora não conhece sua senha.
- [ ] Licença assinada funciona com a central indisponível dentro da tolerância.
- [ ] Backup e procedimento de restauração foram validados.
- [ ] OAuth e suporte têm escopo mínimo, auditoria e revogação.
- [ ] Central armazena somente metadados permitidos.
- [ ] Rollback de código foi ensaiado e limitações de rollback de dados foram aceitas.
- [ ] Contatos, termos, retenção e resposta a incidente estão registrados.

## 9. Ordem recomendada de automação

Começar assistido reduz risco e produz evidência antes de automatizar:

1. checklist persistido e estados idempotentes;
2. vínculo manual de projetos de homologação;
3. executor efêmero de migrations e gates;
4. deploy e rollback de código;
5. licença assinada e renovação;
6. OAuth e criação automática de recursos;
7. rollout em lotes e offboarding automatizado com aprovações.

Operações destrutivas, acesso excepcional e promoção final continuam com aprovação humana mesmo após automação.

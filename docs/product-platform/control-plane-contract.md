# Contrato técnico do control plane

Versão do contrato: `1.0-draft`. Este documento é normativo para a central de tenants e provisionamento descrita em `architecture.md`, `provisioning-flow.md` e `backlog.md`.

## 1. Limites do contrato

A central administra metadados comerciais e recursos técnicos. Ela não autentica profissionais/pacientes e não recebe dados clínicos. Todas as APIs são JSON sobre TLS, versionadas sob `/control/v1`, autenticadas e auditadas.

Regras invariantes:

- `tenant_id`, `operation_id`, `release_id` e `event_id` são UUIDs opacos;
- uma instalação pertence a exatamente um tenant;
- uma operação mutável possui exatamente um tenant e uma release alvo;
- somente um lock mutável pode existir por tenant;
- transitions usam compare-and-set por `state_version`;
- comandos mutáveis exigem `Idempotency-Key` único por tenant e intenção;
- nenhum payload aceita conteúdo clínico, senha, token ou URL de banco;
- secrets são recebidos por canal de cofre separado; a API aceita apenas `secret_ref`;
- IDs/domínios protegidos são verificados antes de leitura de secret ou mutação externa.

## 2. Estados do tenant

| Estado | Significado | Operações permitidas |
|---|---|---|
| `DRAFT` | cadastro incompleto | editar metadados permitidos, cancelar |
| `PROVISIONING` | instalação em andamento | consultar e executar operação atual |
| `AWAITING_ACCEPTANCE` | gates técnicos aprovados | aceitar, reprovar, corrigir configuração |
| `ACTIVE` | instalação liberada | atualizar, suspender, iniciar offboarding |
| `SUSPENDED` | restrição comercial/operacional sem exclusão | reativar, exportar, iniciar offboarding |
| `OFFBOARDING` | encerramento aprovado em execução | exportar, revogar, arquivar |
| `ARCHIVED` | recursos encerrados; auditoria retida | somente leitura autorizada |

Transições válidas:

```text
DRAFT -> PROVISIONING | ARCHIVED
PROVISIONING -> AWAITING_ACCEPTANCE | DRAFT
AWAITING_ACCEPTANCE -> ACTIVE | PROVISIONING | ARCHIVED
ACTIVE -> SUSPENDED | OFFBOARDING
SUSPENDED -> ACTIVE | OFFBOARDING
OFFBOARDING -> ARCHIVED
```

Não existe exclusão direta de tenant. Transição fora do grafo retorna `409 INVALID_TRANSITION` sem alterar estado.

## 3. Estados da operação de provisionamento

`phase` informa onde o job está; `status` informa sua execução.

### Fases ordenadas

```text
RESERVING
AUTHORIZING_PROVIDERS
VALIDATING_RESOURCES
PROVISIONING_DATABASE
MIGRATING_SCHEMA
PROVISIONING_APP
CONFIGURING_APP
VERIFYING
AWAITING_ACCEPTANCE
ACTIVATING
COMPLETED
```

No MVP assistido, `AUTHORIZING_PROVIDERS` registra o vínculo/aprovação manual; não implica OAuth automático.

### Status

| Status | Pode executar? | Próxima ação |
|---|---:|---|
| `PENDING` | não | scheduler inicia |
| `RUNNING` | sim | concluir, falhar ou perder lease |
| `WAITING_INPUT` | não | operador fornece entrada permitida |
| `WAITING_APPROVAL` | não | aprovador decide |
| `FAILED_RETRYABLE` | não | retry explícito com mesma intenção |
| `FAILED_MANUAL` | não | resolução e nova aprovação |
| `CANCELLED` | não | terminal |
| `SUCCEEDED` | não | avançar fase ou concluir |

Uma fase só avança de `SUCCEEDED` para a próxima fase ordenada. `RUNNING` requer lease com expiração e heartbeat. Lease expirada não autoriza repetição cega: a fase vai para reconciliação e só então `FAILED_RETRYABLE`, `SUCCEEDED` ou `FAILED_MANUAL`.

`COMPLETED/SUCCEEDED`, `CANCELLED` e uma operação substituída são terminais. Falha não é estado terminal do tenant e nunca implica apagar recursos.

## 4. Contrato de recursos principais

### Tenant

```json
{
  "id": "uuid",
  "display_name": "Clínica Exemplo",
  "slug": "clinica-exemplo-7f2a",
  "status": "DRAFT",
  "state_version": 1,
  "region": "south-america-east",
  "plan_code": "professional",
  "created_at": "2026-08-27T12:00:00Z",
  "updated_at": "2026-08-27T12:00:00Z"
}
```

`display_name` é comercial, não nome de paciente. `slug` não é identidade nem chave de autorização.

### Recurso externo

```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "provider": "SUPABASE",
  "resource_type": "PROJECT",
  "external_id": "opaque-provider-id",
  "environment": "HOMOLOGATION",
  "region": "south-america-east",
  "canonical_domain": null,
  "ownership_status": "VERIFIED",
  "secret_ref": "vault://opaque-reference",
  "verified_at": "2026-08-27T12:05:00Z"
}
```

`external_id` e domínio devem ser únicos entre tenants. Respostas comuns não retornam `secret_ref`; ele é apresentado aqui apenas como representação persistida interna.

### Release

```json
{
  "id": "uuid",
  "version": "1.0.0",
  "source_commit": "full-immutable-commit-sha",
  "artifact_digest": "sha256:...",
  "schema_from": 44,
  "schema_to": 45,
  "rollback_compatible_schema_min": 45,
  "status": "APPROVED"
}
```

Após `APPROVED`, commit, digest e limites de schema são imutáveis. Correção cria nova release.

### Operação

```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "kind": "INITIAL_PROVISION",
  "release_id": "uuid",
  "phase": "VALIDATING_RESOURCES",
  "status": "RUNNING",
  "state_version": 8,
  "idempotency_key_hash": "sha256:...",
  "attempt": 1,
  "lease_expires_at": "2026-08-27T12:12:00Z",
  "last_error": null,
  "created_at": "2026-08-27T12:00:00Z",
  "updated_at": "2026-08-27T12:10:00Z"
}
```

Tipos iniciais: `INITIAL_PROVISION`, `UPDATE`, `RECONCILE`, `SUSPEND`, `REACTIVATE` e `OFFBOARD`. O MVP implementa obrigatoriamente os três primeiros; os demais podem permanecer manuais.

### Erro sanitizado

```json
{
  "code": "RESOURCE_OWNERSHIP_UNVERIFIED",
  "category": "VALIDATION",
  "retryable": false,
  "provider": "VERCEL",
  "correlation_id": "uuid",
  "occurred_at": "2026-08-27T12:10:30Z"
}
```

Não persistir mensagem/resposta bruta do provedor, stack, request body ou identificador secreto. Detalhe operacional usa catálogo interno por `code`.

## 5. Comandos HTTP mínimos

### Criar tenant

`POST /control/v1/tenants`

```json
{
  "display_name": "Clínica Exemplo",
  "slug": "clinica-exemplo-7f2a",
  "region": "south-america-east",
  "plan_code": "professional",
  "administrative_contact": {
    "name": "Responsável Exemplo",
    "email": "responsavel@example.test"
  }
}
```

Exige `Idempotency-Key`. Mesmo corpo e chave retornam o mesmo `201/200`; mesma chave com corpo semanticamente diferente retorna `409 IDEMPOTENCY_CONFLICT`.

### Vincular recurso externo

`POST /control/v1/tenants/{tenant_id}/resources`

```json
{
  "provider": "SUPABASE",
  "resource_type": "PROJECT",
  "external_id": "opaque-provider-id",
  "environment": "HOMOLOGATION",
  "region": "south-america-east",
  "secret_ref": "vault://opaque-reference"
}
```

O comando só conclui após denylist, unicidade, ownership e ambiente. Falha em qualquer verificação não cria vínculo parcial.

### Iniciar provisionamento

`POST /control/v1/tenants/{tenant_id}/operations`

```json
{
  "kind": "INITIAL_PROVISION",
  "release_id": "uuid",
  "expected_tenant_state_version": 3
}
```

Retorna `202` com a operação. Requer tenant `DRAFT`, release `APPROVED`, recursos mínimos verificados e ausência de lock.

### Fornecer entrada permitida

`POST /control/v1/operations/{operation_id}/inputs`

```json
{
  "expected_operation_state_version": 6,
  "input_type": "RESOURCE_REFERENCE_CONFIRMED",
  "resource_id": "uuid"
}
```

Não aceita campo livre. `input_type` possui schema fechado por fase. Secrets são colocados no cofre antes desse comando.

### Aprovar gate

`POST /control/v1/operations/{operation_id}/approvals`

```json
{
  "expected_operation_state_version": 11,
  "decision": "APPROVE",
  "gate": "ACTIVATE_TENANT",
  "reason_code": "TECHNICAL_AND_CUSTOMER_ACCEPTANCE_COMPLETE"
}
```

Ativação exige aprovador diferente do executor quando a política de segregação determinar. Justificativa livre opcional deve ser sanitizada e ter limite curto.

### Retry

`POST /control/v1/operations/{operation_id}/retry`

```json
{
  "expected_operation_state_version": 9,
  "expected_phase": "PROVISIONING_APP",
  "reason_code": "PROVIDER_RATE_LIMIT_RESOLVED"
}
```

Retry é aceito somente em `FAILED_RETRYABLE`, após reconciliação quando houve efeito externo possível. Conserva a idempotency key da intenção e incrementa `attempt`.

### Consultas

- `GET /control/v1/tenants/{tenant_id}`
- `GET /control/v1/tenants/{tenant_id}/operations/{operation_id}`
- `GET /control/v1/tenants/{tenant_id}/events?after=<cursor>`

Listagens usam cursor opaco e projeção por allowlist. Nunca incluem secrets ou payload bruto.

## 6. Evento de auditoria

```json
{
  "event_id": "uuid",
  "event_type": "PROVISIONING_PHASE_CHANGED",
  "tenant_id": "uuid",
  "operation_id": "uuid",
  "actor": { "type": "SERVICE", "id": "uuid" },
  "from": { "phase": "MIGRATING_SCHEMA", "status": "RUNNING" },
  "to": { "phase": "MIGRATING_SCHEMA", "status": "SUCCEEDED" },
  "reason_code": "SCHEMA_VERIFIED",
  "correlation_id": "uuid",
  "occurred_at": "2026-08-27T12:20:00Z"
}
```

Eventos são append-only, ordenáveis por cursor e emitidos na mesma transação da mudança de estado via outbox. Entrega externa é pelo menos uma vez; consumidores deduplicam por `event_id`.

## 7. Critérios fail-closed

O comando deve falhar sem mutação externa quando qualquer condição abaixo for verdadeira:

- identidade, MFA exigido, papel ou escopo do ator não puder ser comprovado;
- `Idempotency-Key`, expected state version ou lock válido estiver ausente;
- tenant, release, recurso ou operação estiver em estado incompatível;
- release não for imutável, aprovada ou compatível com o schema observado;
- external ID/domínio estiver na denylist, já pertencer a outro tenant ou tiver ownership incerto;
- ambiente solicitado não corresponder ao recurso observado;
- secret necessário estiver ausente, expirado, revogado ou com escopo excessivo/não aprovado;
- health/schema/backup obrigatório não puder ser verificado;
- payload contiver chave desconhecida, dado clínico, secret ou valor fora do schema fechado;
- auditoria/outbox não puder ser persistida atomicamente;
- relógio, assinatura de licença, callback/webhook ou integridade do artefato não puder ser validado.

Comportamentos proibidos:

- assumir sucesso após timeout;
- trocar automaticamente homologação por produção;
- continuar deploy após migration ou smoke falhar;
- ativar tenant por ausência de resposta do aprovador;
- apagar banco/recurso como compensação automática;
- fazer downgrade destrutivo de schema;
- registrar resposta bruta para facilitar diagnóstico;
- usar slug, domínio ou nome como autorização.

## 8. Códigos e semântica de resposta

| HTTP | Código | Uso |
|---:|---|---|
| `400` | `INVALID_PAYLOAD` | schema fechado inválido |
| `401` | `AUTHENTICATION_REQUIRED` | identidade não comprovada |
| `403` | `INSUFFICIENT_SCOPE` | ator autenticado sem autorização |
| `404` | `RESOURCE_NOT_FOUND` | recurso inexistente ou ocultado por escopo |
| `409` | `INVALID_TRANSITION` | estado incompatível |
| `409` | `STATE_VERSION_CONFLICT` | concorrência otimista |
| `409` | `IDEMPOTENCY_CONFLICT` | chave reutilizada com outra intenção |
| `409` | `TENANT_LOCKED` | operação mutável concorrente |
| `422` | `GUARDRAIL_REJECTED` | denylist, ownership ou ambiente |
| `423` | `MANUAL_REVIEW_REQUIRED` | efeito externo ambíguo ou risco elevado |
| `429` | `RATE_LIMITED` | limite interno/provedor |
| `503` | `DEPENDENCY_UNVERIFIED` | dependência indisponível sem inferir sucesso |

Resposta de erro pública:

```json
{
  "error": {
    "code": "STATE_VERSION_CONFLICT",
    "correlation_id": "uuid",
    "retryable": false
  }
}
```

## 9. Aceite do contrato no MVP

- testes de tabela cobrem todas as transições válidas e inválidas;
- teste concorrente comprova um único lock/operação mutável por tenant;
- testes de idempotência cobrem replay igual, conflito e timeout ambíguo;
- contract tests rejeitam campos desconhecidos, secrets e amostras de dados clínicos;
- denylist bloqueia IDs/domínios protegidos antes do adaptador do provedor ser chamado;
- falha da auditoria/outbox reverte a transição;
- credencial revogada, schema divergente ou smoke falho impede avanço;
- operação retomada reconcilia o provedor antes de repetir efeito externo;
- logs e respostas passam por verificação automática de sanitização;
- central indisponível não altera a licença local nem bloqueia o tenant durante sua tolerância válida.

## 10. Relação com o backlog

Este contrato detalha as Fases 2 e 3 do backlog e os gates das Fases 4 e 5. O corte do MVP permanece provisionamento assistido: integrações OAuth e criação automática de projetos continuam pós-MVP. Antes de implementar endpoints, os schemas JSON e a tabela de transições devem virar testes de contrato compartilhados pelos handlers, workers e adaptadores de provedores.

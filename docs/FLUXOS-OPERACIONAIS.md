# Fluxos operacionais oficiais

Este documento descreve os estados que a aplicação aceita. O servidor é a fonte de verdade; a interface não deve inventar transições adicionais.

## Agendamentos

| Estado | Significado | Próximas ações permitidas |
| --- | --- | --- |
| `WAITING` | horário reservado aguardando confirmação | confirmar, iniciar, cancelar, falta ou reagendar |
| `CONFIRMED` | paciente confirmou o horário | aguardar, iniciar, cancelar, falta ou reagendar |
| `IN_PROGRESS` | prontuário/atendimento aberto | somente concluir pelo atendimento |
| `COMPLETED` | atendimento concluído | terminal; correções ocorrem no prontuário, sem reabrir agenda |
| `CANCELLED` | consulta cancelada | terminal; novo horário cria/reabre mediante reagendamento explícito |
| `NO_SHOW` | ausência registrada | terminal; novo horário exige reagendamento explícito |

- Descartar é diferente de cancelar. Descarte só existe para um registro sem prontuário, pré-check-in ou pagamento confirmado.
- Iniciar um atendimento altera o agendamento para `IN_PROGRESS`.
- Finalizar o prontuário altera o agendamento para `COMPLETED`, encerra a sala, resolve o aviso de entrada e cria a cobrança quando aplicável.
- Pagamento confirmado nunca é apagado por cancelamento ou descarte.

## Pagamentos

| Estado | Significado | Próximas ações permitidas |
| --- | --- | --- |
| `PENDING` | cobrança aberta | pagar, cancelar ou vencer automaticamente |
| `OVERDUE` | cobrança aberta após vencimento | pagar, cancelar ou voltar a pendente |
| `PAID` | recebimento confirmado | somente estorno formal |
| `REFUNDED` | pagamento integralmente estornado | terminal e preservado no histórico |
| `CANCELLED` | cobrança anulada antes do pagamento | pode voltar a pendente quando houver finalidade válida |

O estorno exige justificativa, registra data e profissional responsável e avisa o paciente sem expor detalhes financeiros na notificação.

## Prontuário e retificação

- `IN_PROGRESS`: permite edição e salvamento versionado.
- `COMPLETED`: bloqueado para edição normal.
- `COMPLETED + correction_open`: permite retificação sem reativar consulta, agenda ou teleconsulta.
- A abertura da correção exige justificativa clínica. Autor, justificativa, versões e término da correção permanecem auditáveis.

## Pré-check-in

- Disponível apenas para a próxima consulta do próprio paciente em `WAITING` ou `CONFIRMED`.
- Uma resposta por agendamento; depois do envio, a resposta é imutável para o paciente.
- A nutricionista revisa apenas no atendimento vinculado à mesma consulta.
- Cancelamento, conclusão ou descarte retira o item das pendências e notificações ativas.

## Teleconsulta

- A entrada usa credencial opaca e efêmera vinculada ao usuário autenticado.
- O paciente registra ciência específica antes de permitir câmera e microfone; a chamada não é gravada pela plataforma.
- Navegar no sistema minimiza o vídeo sem emitir uma credencial nova.
- O miniplayer consulta somente o snapshot da sessão. Reconectar é uma ação explícita.
- Encerrar a sala termina o vídeo; finalizar o atendimento termina também prontuário, agendamento e avisos relacionados.

## Notificações

- `ACTIVE`: visível e acionável.
- leitura não encerra a ação; apenas preenche `read_at`.
- `RESOLVED`: a situação deixou de exigir ação e não deve reaparecer.
- `ARCHIVED`: removida manualmente da caixa ativa.
- Toda notificação acionável deve possuir entidade, chave de deduplicação, destino válido e prazo de expiração quando aplicável.

## Checklist de publicação

1. Aplicar todas as migrações até a versão exigida pelo health check.
2. Executar `npm run check`.
3. Executar E2E Chromium e mobile.
4. Publicar e executar smoke autenticado.
5. Confirmar health check, envio de e-mail, encerramento de sala, notificação resolvida e criação da cobrança.
6. Registrar versão e resultado da homologação sem dados pessoais ou tokens.

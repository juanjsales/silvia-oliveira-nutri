# Runbook operacional da teleconsulta

Este documento orienta suporte, operação e resposta a incidentes da teleconsulta. Ele não substitui o plano de continuidade, a política de privacidade ou a avaliação de impacto à proteção de dados.

## Objetivos de serviço

| Indicador | Meta inicial | Como medir |
| --- | ---: | --- |
| Entrada autorizada na sala | >= 98% | sessões com `connected` / tentativas autorizadas |
| Tempo para conexão (p95) | <= 10 s | `connected_at - join_requested_at` |
| Propagação do término (p95) | <= 2 s | último `ended` recebido - `ended_at` |
| Recuperação de desconexão (p95) | <= 15 s | `reconnected_at - disconnected_at` |
| Sessões órfãs | 0 após 2 min | sessão sem heartbeat além do limite |

As metas devem ser revistas com dados reais. Uma consulta não deve ser considerada conectada apenas porque a página ou o iframe carregou.

## Estados e responsabilidades

O servidor é a fonte de verdade do ciclo de vida. A interface apenas apresenta o estado recebido e solicita transições permitidas.

`CREATED -> WAITING_PROFESSIONAL -> WAITING_PATIENT -> READY -> CONNECTING -> CONNECTED -> RECONNECTING -> ENDED`

`FAILED` e `EXPIRED` são estados terminais alternativos. Transições repetidas devem ser idempotentes. Eventos atrasados não podem reabrir uma sessão encerrada.

- Sair ou minimizar: preserva a sessão e os dispositivos, quando tecnicamente possível.
- Monitorar a sessão: usa apenas leitura do snapshot; nunca deve emitir ou rotacionar tokens de entrada.
- Reconectar: ação explícita do participante, que solicita uma nova credencial e recarrega o player.
- Encerrar teleconsulta: desconecta participantes, invalida credenciais da sala e registra motivo e autor.
- Finalizar atendimento: conclui o prontuário; exige confirmação clínica e não deve ocorrer implicitamente ao fechar a chamada.

## Diagnóstico rápido

1. Confirme `correlation_id`, `session_id`, papel do participante, estado atual e horário do último heartbeat.
2. Confirme se a consulta está no intervalo permitido e pertence ao usuário autenticado.
3. Verifique separadamente sinalização, negociação ICE, mídia local e mídia remota.
4. Oriente o teste de microfone/câmera e, se necessário, o modo somente áudio.
5. Preserve o prontuário. Nunca peça senha, token, URL completa da sala ou captura com dados clínicos.

| Sintoma | Verificação | Ação segura |
| --- | --- | --- |
| Acesso negado | vínculo, horário, sessão expirada | renovar convite pelo fluxo autenticado; não reutilizar URL |
| Câmera/microfone bloqueados | permissão do navegador e dispositivo em uso | orientar permissão; oferecer troca de dispositivo/somente áudio |
| Participantes não se encontram | presença e sinalização de ambos | renovar canal; impedir chamadas simultâneas concorrentes |
| Conecta apenas em algumas redes | candidato ICE/TURN e tipo da rede | renovar credencial TURN efêmera; tentar somente áudio |
| Queda durante a consulta | heartbeat, `disconnected`, ICE | `RECONNECTING`, ICE restart e retorno com backoff limitado |
| Duas abas abertas | participante ativo e lease da aba | manter uma aba controladora; outra fica em modo informativo |
| Término não propagado | sequência/ack do evento `ended` | consultar estado autoritativo e repetir operação idempotente |

## Severidade e escalonamento

- SEV-1: exposição de dados, entrada indevida, indisponibilidade geral ou sessão que permanece acessível após término. Bloquear novas entradas quando necessário, preservar evidências e acionar imediatamente o responsável por segurança e privacidade.
- SEV-2: falha recorrente de conexão, término ou notificações para vários usuários. Ativar contingência e investigar em até uma hora.
- SEV-3: falha isolada com alternativa funcional. Registrar correlação, dispositivo/navegador e acompanhar.

Não registrar nome, CPF, e-mail, conteúdo clínico, SDP, candidatos ICE completos, tokens ou URLs da sala. Métricas e logs devem usar identificadores opacos, motivo enumerado, estado, latência, navegador em nível agregado e `correlation_id`.

## Contingência clínica

Se áudio/vídeo não estabilizar após uma tentativa controlada de reconexão:

1. ofereça somente áudio;
2. confirme com o paciente o canal alternativo previamente autorizado;
3. registre no prontuário apenas a ocorrência clínica necessária, sem detalhes técnicos sensíveis;
4. encerre/invalide a sessão de vídeo;
5. reagende quando a qualidade impedir atendimento seguro.

O sistema não deve gravar áudio ou vídeo por padrão. Qualquer gravação futura exige base legal, informação transparente, retenção definida, controle de acesso e consentimento quando aplicável.

Antes de liberar câmera e microfone, o portal registra a ciência versionada do paciente sobre atendimento remoto, uso dos dispositivos, possibilidade de oscilação e ausência de gravação pela plataforma.

## Encerramento do incidente

- confirme que todas as credenciais e sessões afetadas expiraram;
- valide ausência de participantes e sessões órfãs;
- registre linha do tempo, impacto, causa, correção e prevenção sem dados pessoais;
- execute os cenários automatizados de acesso, reconexão, múltiplas abas e término;
- comunique titulares e autoridade quando a avaliação jurídica/LGPD determinar.

# Estratégia de testes da teleconsulta

## Pirâmide de validação

1. Contrato/backend: autorização por papel e vínculo, tokens efêmeros vinculados ao ator, transições da máquina de estados, idempotência, expiração e sanitização.
2. Componente/frontend: pré-checagem, estados de espera/erro, reconexão, aba controladora e separação entre sair, encerrar e finalizar.
3. E2E isolado: dois contextos autenticados com API simulada; nenhum banco, TURN, PeerJS ou câmera real.
4. E2E de infraestrutura em ambiente controlado: dois navegadores, sinalização e TURN reais, rede degradada. Não pertence à suíte determinística de pull request.

## Matriz mínima de cenários

| Área | Cenários obrigatórios |
| --- | --- |
| Autorização | profissional vinculado; paciente vinculado; papel trocado; outro paciente; token expirado; reutilização pelo mesmo ator dentro da política; sessão encerrada |
| Entrada | profissional primeiro; paciente primeiro; entradas simultâneas; recarga; URL sem segredo reutilizável |
| Dispositivos | câmera negada; microfone negado; nenhum dispositivo; dispositivo removido/trocado; somente áudio |
| Rede | offline antes da entrada; queda após conexão; perda de sinalização; falha de TURN; reconexão; eventos fora de ordem/duplicados |
| Ciclo de vida | minimizar/restaurar; sair; encerrar por cada papel; expirar; finalizar prontuário separadamente |
| Concorrência | duas abas do mesmo usuário; nova aba assume lease; aba antiga não publica comandos; término idempotente |
| Tempo real | presença; material compartilhado; notificação; ack; retomada desde sequência; fallback para polling com backoff |
| Privacidade | sem token/papel/nome na URL; origem exata em `postMessage`; CSP; logs e telemetria sem dados clínicos |

## Regras para E2E determinístico

- Interceptar toda API da teleconsulta e falhar diante de requisição inesperada.
- Usar relógio ou respostas controladas; não esperar intervalos arbitrários quando for possível observar estado/evento.
- Não baixar scripts externos nem depender de permissões físicas do computador.
- Usar dois `BrowserContext` para usuários diferentes e duas páginas no mesmo contexto para múltiplas abas.
- Validar efeitos observáveis e payloads, não detalhes internos de React.
- Gerar trace e screenshot apenas em falha; artefatos não podem conter tokens ou dados pessoais reais.

## Critérios para liberação

- testes de contrato, typecheck, build e E2E Chromium aprovados;
- nenhum segredo estático de TURN, token de sala ou papel confiado pela URL;
- encerramento propagado e idempotente, inclusive após recarga;
- sessão expirada não volta a `CONNECTED` por evento atrasado;
- falhas de câmera, microfone e rede oferecem orientação e alternativa recuperável;
- logs de teste confirmam sanitização dos campos proibidos;
- teste manual em Chrome/Edge desktop e Safari/Chrome mobile no ambiente de homologação.

## Evidência de homologação

Para cada versão, guardar somente: versão, ambiente, navegador, cenário, resultado, duração, identificador opaco da execução e referência do defeito. Nunca anexar credenciais, URL integral da sala, conteúdo clínico ou mídia do paciente.

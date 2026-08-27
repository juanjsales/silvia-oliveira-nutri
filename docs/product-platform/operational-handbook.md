# Manual operacional da plataforma — fundação de homologação

> Documento técnico-operacional. Não substitui revisão jurídica, contábil, de segurança ou de proteção de dados. A clínica real e a `main` não participam deste fluxo.

## Objetivo e limite atual

Este incremento prepara uma operação repetível para cadastrar uma clínica fictícia, validar configuração, gerar artefato prebuilt, executar provisionamento fake e testar recuperação. Por padrão, tudo falha fechado: sem opt-in explícito, nenhum provider externo pode ser chamado e promoção para produção permanece desativada.

## Papéis

- **Operador da plataforma:** cria o tenant fictício, acompanha gates e registra evidências.
- **Responsável da clínica:** aceita o convite e confirma identidade/dados administrativos.
- **Responsável técnico:** analisa falhas, rollback e integridade do artefato.
- **Encarregado/LGPD e jurídico:** validam contratos, bases legais, retenção, incidentes e responsabilidades antes do piloto real.

## Implantação segura em staging

1. Confirmar a branch `codex/product-platform`; interromper se estiver na `main`.
2. Usar apenas tenant, domínio, projeto e banco fictícios, diferentes dos identificadores protegidos.
3. Preencher somente a allowlist documentada em `first-staging-checklist.md`; segredos devem ser referências `vault://`, nunca valores brutos.
4. Executar testes locais dos guards e do pipeline fake.
5. Gerar o build em CI confiável a partir de commit completo e imutável.
6. Criar e assinar o manifesto Ed25519; a chave privada fica fora do repositório e do pacote.
7. Validar que o artefato não contém `src/`, `.env*`, TypeScript, SQL, chaves, source maps, caminhos duplicados ou conteúdo semelhante a segredo.
8. Executar o checklist de primeiro staging. A saída deve confirmar preview, smoke fake, migrations desligadas e promoção desligada.
9. Guardar somente evidências técnicas sem segredo nem dado clínico.

## Convite e ativação

1. O operador cadastra nome administrativo e e-mail da responsável.
2. O sistema emite convite de uso único, com validade curta e estado auditável; nunca envia senha.
3. A responsável abre o domínio de staging, confere a clínica e define sua autenticação.
4. Convite expirado, já utilizado ou de outro tenant deve ser recusado sem revelar se a conta existe.
5. A ativação só conclui após aceite dos termos vigentes e confirmação do e-mail.
6. Reenvio invalida o convite anterior. Suporte não deve solicitar senha, token ou chave de banco.

## Piloto integralmente fictício

Use nomes e endereços reservados, por exemplo `Clínica Aurora`, `owner@example.test` e domínio `*.example.test`. O roteiro mínimo é:

1. Preparar configuração administrativa.
2. Validar artefato assinado e seu hash.
3. Resolver apenas referências secretas permitidas.
4. Criar preview **fake**, com `external: false`.
5. Executar smoke fake de autenticação, isolamento de tenant e rotas essenciais.
6. Injetar uma falha sintética; comprovar retry idempotente a partir da etapa que falhou.
7. Executar rollback fake; comprovar que banco/configuração foram preservados.
8. Confirmar que promoção real segue indisponível.

Nenhum paciente, prontuário, e-mail real, domínio canônico ou credencial de produção pode ser usado.

## Recuperação e rollback

- **Falha antes do preview:** corrigir entrada, manter etapas aprovadas e retomar pelo mesmo `operationId`.
- **Falha no smoke:** bloquear promoção, preservar logs sanitizados e reexecutar somente após diagnóstico.
- **Artefato divergente:** descartar o pacote; nunca “corrigir” o manifesto depois da assinatura.
- **Referência secreta indisponível:** não aceitar valor bruto como atalho; restaurar o secret manager e tentar novamente.
- **Rollback:** reverter somente o preview/release, preservar dados e registrar ator, motivo, versão e horário.
- **Dúvida sobre ambiente:** interromper. Ausência de confirmação equivale a negação.

## Riscos ainda abertos

- Termos comerciais, DPA, política de privacidade e definição formal de controlador/operador aguardam revisão jurídica.
- Custos, limites e permissão de uso comercial dos planos dos providers precisam de validação antes da venda.
- OAuth, gestão de tokens, cofre de segredos, rotação e revogação precisam de infraestrutura aprovada.
- Backup, restauração ensaiada, RPO/RTO, monitoramento e resposta a incidentes precisam de responsáveis e evidências.
- Entregabilidade de e-mail, domínio próprio, DNS e suporte precisam de processo operacional.
- Migrações reais exigem backup verificado, ensaio em staging e janela de rollback; não são executadas por este fluxo.

## Decisões que dependem do usuário

- Escolher providers e quem será titular/pagador das contas.
- Aprovar nome do produto, domínio da plataforma e modelo de cobrança/licença.
- Definir suporte, SLA, retenção, exportação e encerramento de contrato.
- Contratar revisão jurídica/LGPD e aprovar documentos finais.
- Disponibilizar ambiente fictício de staging e secret manager, sem reutilizar credenciais da clínica real.
- Autorizar separadamente qualquer primeiro teste externo; essa autorização não inclui produção.

## Critério de saída para um futuro piloto real

Todos os testes locais e de staging aprovados; isolamento multi-tenant testado; restore ensaiado; documentos jurídicos aprovados; observabilidade e resposta a incidentes ativas; convite/ativação auditáveis; rollback comprovado; custos aceitos; e autorização humana registrada. Até lá, o sistema permanece em simulação fechada.

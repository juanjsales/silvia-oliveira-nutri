# Escopo de preservação funcional

Este documento torna explícito o que deve ser preservado durante a migração do HTML/Google Sheets para React/Node/Supabase.

## Atendimento clínico

Nenhuma aba clínica do `atendimento.html` será descartada:

- anamnese completa, incluindo dados sociais, hábitos, histórico, sintomas, alergias, medicamentos e objetivos;
- recordatório alimentar de 24 horas e Escala de Bristol;
- questionário completo de retorno;
- antropometria, bioimpedância, dobras e perfis clínicos específicos (adulto, gestante e pediatria);
- exames laboratoriais estruturados por marcador, valor, unidade, referência e interpretação;
- plano alimentar;
- prescrição estruturada de suplementos;
- anotações clínicas;
- histórico e evolução longitudinal;
- revisão e finalização do atendimento.

Os registros permanecem privados e acessíveis somente na área profissional autenticada. Campos novos podem ser adicionados sem remover dados históricos.

## Planos, alimentos e receitas

- alimentos permanecem estruturados por quantidade, unidade, energia, carboidrato, proteína, gordura, fibra, categoria e fonte;
- receitas permanecem estruturadas em ingredientes, quantidades, preparo, rendimento e macros;
- modelos são apenas pontos de partida e geram um rascunho individual para o paciente;
- planos mantêm refeições, itens, substituições, extras, lista de compras, totais e estado de publicação;
- valores nutricionais usados em um plano devem ser gravados como snapshot, evitando que uma atualização futura do catálogo altere uma prescrição já publicada.

O catálogo legado contém uma seleção curada de 71 alimentos; ele não deve ser apresentado como a tabela TACO oficial completa.

## Documentos A4

Devem existir templates A4 próprios, com a identidade visual do consultório, para:

- plano alimentar e lista de compras;
- prescrição de suplementação;
- declaração de comparecimento;
- atestado nutricional;
- prontuário/resumo clínico quando solicitado.

Os documentos devem ter paginação previsível, cabeçalho, identificação profissional, CRN, dados do paciente, rodapé e versão de impressão. Conteúdo clínico será escapado e nunca montado por `innerHTML` com entrada livre.

## Videoconsulta

O recurso será mantido, mas a implementação antiga não será copiada literalmente. Salas previsíveis e papel de moderador inferido pelo nome não oferecem autorização suficiente. A nova integração deverá usar sala não enumerável, validade limitada e autorização vinculada ao agendamento.

O consultório virtual React já usa um identificador aleatório por agendamento/atendimento e mantém o vídeo ao lado do prontuário. Antes da abertura ao paciente em produção, o acesso externo ainda deverá receber token com expiração e validação do agendamento.

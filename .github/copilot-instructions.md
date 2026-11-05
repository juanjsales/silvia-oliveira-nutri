# Instruções para GitHub Copilot

## Contexto do produto
- Este sistema atende uma única nutricionista e seus pacientes. Não introduza multi-tenancy, tenants, provisionamento de clínicas ou `tenant_id` sem solicitação explícita.
- O backend é Node.js/TypeScript e usa PostgreSQL no Supabase; o frontend é React/Vite e o deploy é feito no Vercel.
- Preserve os contratos e as migrações existentes. Antes de mudar o schema, examine as migrações SQL reais e os testes; não trate arquivos `.sql` como código da aplicação.

## Como trabalhar
- Antes de editar, identifique a causa, leia os arquivos envolvidos e faça a menor alteração que resolva a tarefa.
- Preserve alterações preexistentes e evite refatorações fora do escopo.
- Para correções, acrescente ou ajuste testes que reproduzam o comportamento esperado.
- Não invente sucesso de testes, deploys, migrações ou verificações externas.

## Verificação
- Após alterações de aplicação, execute `npm run check`.
- Para mudanças de interface, fluxos do navegador ou testes E2E, execute `npm --workspace frontend-react run test:e2e:ci`; quando a tarefa exigir cobertura móvel, execute também o projeto E2E mobile.
- Execute `npm audit` quando alterar dependências.
- Informe claramente testes ignorados, falhas e verificações que não puderam ser feitas.

## Segurança e produção
- Nunca acesse, altere ou migre o Supabase de produção durante tarefas automatizadas. Não execute `db:migrate`, SQL destrutivo, restauração, limpeza de dados ou seeds sem pedido explícito e confirmação do destino.
- Nunca exponha, registre ou versione URLs de conexão, senhas, tokens, chaves ou dados clínicos. Use somente um banco separado de teste/homologação para testes de integração.
- Não dispare e-mails reais nem smoke tests autenticados em produção sem autorização explícita.
- Não faça deploy de produção, altere secrets/configuração do Vercel ou mescle em `main` sem autorização explícita. Prefira branch e pull request, aguarde CI e revisão humana.
- Nunca force push, reescreva histórico remoto ou sobrescreva mudanças alheias.

## Revisão
- Priorize riscos de privacidade e autorização: confira autenticação, perfil e propriedade dos dados do paciente em cada endpoint alterado.
- Ao revisar pull requests, aponte primeiro bugs, regressões, riscos de segurança ou incompatibilidades de schema, com arquivo/linha e impacto. Diferencie achados confirmados de hipóteses.

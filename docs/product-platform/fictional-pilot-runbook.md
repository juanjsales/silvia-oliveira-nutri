# Piloto fictício automatizado

Execute sem credenciais, banco ou rede:

```powershell
node --test scripts/fictional-tenant-pilot.test.mjs
```

O roteiro cria somente tenants terminados em `-fictional`, nomes marcados como “Fictícia” e owners `@example.test`. Ele percorre clínica, Vercel fake, Supabase por referência de cofre, identidade, revisão, preview, smoke, owner e publicação. Também comprova isolamento entre dois tenants, retry sem repetição das fases concluídas e rejeição recursiva de secrets, PII não fictícia e dados clínicos em eventos.

Uma `secretRef` opaca, por exemplo `vault://tenant/<tenantId>/database/runtime`, é metadado permitido: identifica onde o executor autorizado buscará o valor, mas não contém a credencial. O valor resolvido jamais pode entrar no store, evento, log ou resposta. O resolvedor recebe `tenantId`, referência e nome da variável, e recusa referências cujo tenant não coincida com o contexto da operação.

Critério de aprovação: todos os testes passam, cada tenant termina com `knownGood` próprio e `assertPilotPrivacy` aprova os eventos. Este piloto não autoriza deploy ou migração.

# Fundação Supabase e releases — homologação

Fontes oficiais consultadas em 27/08/2026:

- [Management API](https://supabase.com/docs/reference/api/getting-started): aceita PAT ou OAuth2; PAT herda privilégios da conta e deve permanecer secreto.
- [Construir integração OAuth Supabase](https://supabase.com/docs/guides/integrations/build-a-supabase-oauth-integration): OAuth2 com PKCE é recomendado para aplicativos terceiros; criação de projeto usa `POST /v1/projects`; senha de banco existente não pode ser recuperada pela API.
- [Escopos OAuth](https://supabase.com/docs/guides/integrations/build-a-supabase-oauth-integration/oauth-scopes): solicitar apenas os escopos Management API necessários.

## Decisão

Preferir OAuth2 Management API com PKCE quando a integração estiver cadastrada e revisada. Até lá, usar o fallback guiado: a nutricionista cria o projeto em sua conta e informa apenas referências públicas; senha do banco entra diretamente no cofre, nunca em chat ou tabela comum. PAT não é o caminho padrão.

O provider HTTP nasce `DISABLED`. Ele só existe quando flag externa, client ID, client secret, redirect URI e executor HTTP forem todos injetados explicitamente. Testes usam apenas o adapter fake.

Tokens de acesso/refresh e URLs PostgreSQL são cifrados com AES-256-GCM pela chave da aplicação. A central deve guardar referências de cofre quando disponível, aplicar rotação e jamais retornar esses campos na API ou em logs.

## Release gradual

1. validar artefato assinado;
2. comprovar backup/restauração;
3. executar migrations sob lock;
4. smoke sintético;
5. pausar em canário para aprovação;
6. rollout gradual e conclusão.

Falha de migration pausa manualmente e nunca avança ao smoke. Falha retryable pausa até reconciliação. Rollback fake representa somente retorno da aplicação à release anterior; restauração de banco exige procedimento separado e aprovação humana. Nenhuma rotina desta fundação chama rede ou aplica migration.

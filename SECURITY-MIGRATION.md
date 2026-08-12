# Migração de segurança

Esta branch substitui as flags locais como mecanismo de autorização por sessões
emitidas e validadas no Google Apps Script.

## Antes do novo deployment

1. Abra o projeto no editor do Google Apps Script.
2. Atualize `Code.gs` com a versão desta branch.
3. Execute manualmente `configurarAdminInicial(email, senha)` pelo editor. A senha
   deve ter pelo menos 12 caracteres e não deve ser armazenada no repositório.
4. Execute manualmente `migrarCredenciaisLegadas()`. Ela converte credenciais
   antigas em texto simples para hash e informa quantas linhas foram migradas.
5. Crie uma nova versão do deployment Web App.
6. Atualize o endpoint no frontend caso o deployment gere uma URL diferente.
7. Revogue o deployment antigo após validar o novo login.

## Comportamento das sessões

- Sessões expiram em seis horas e ficam no `CacheService` do Apps Script.
- Administradores podem acessar as ações clínicas e administrativas.
- Pacientes só podem consultar ou alterar dados vinculados ao próprio ID.
- A disponibilidade pública não retorna nome, telefone, ID ou observações.

## Proteções adicionais

- Cinco falhas de login bloqueiam o identificador por 15 minutos.
- A recuperação de senha é limitada a três solicitações por hora por identificador.
- Respostas de login não revelam se o CPF/e-mail ou a senha estavam incorretos.
- Payloads contendo tags HTML, handlers de evento ou URLs `javascript:` são recusados.
- Registros antigos com markup suspeito são neutralizados antes de chegar ao navegador.
- Campos clínicos críticos renderizados via template usam codificação HTML explícita.
- Login e troca de senha não aceitam mais credenciais armazenadas em texto simples.
- Na recuperação, a credencial só é substituída depois que o envio do e-mail é aceito.

## Mudanças incompatíveis intencionais

- A senha fixa anteriormente presente no código não é mais aceita.
- Ações administrativas sem `session_token` são recusadas.
- A anamnese pública agora exige sessão do paciente. Links públicos assinados
  devem ser implementados antes de reativar submissões sem login.
- A criação de consulta completa exige sessão administrativa. O fluxo público
  continua encaminhando solicitações por WhatsApp.

## Próximas medidas

- Migrar hashes antigos e eliminar compatibilidade com PIN em texto simples.
- Adicionar limitação de tentativas no login e recuperação.
- Implementar links de anamnese assinados, com uso único e validade curta.
- Corrigir pontos de `innerHTML` com dados externos para impedir XSS armazenado.
- Adicionar testes automatizados de autorização e isolamento entre pacientes.

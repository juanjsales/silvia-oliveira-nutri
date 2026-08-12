# Debugging: Erros POST no Vercel - Verificações Adicionais

Se depois de adicionar `FRONTEND_ORIGIN` o login ainda não funcionar, siga este checklist:

## 🔧 Verificação 1: Confirmar Deploy com Novas Variáveis

```bash
# No Vercel Dashboard:
# 1. Vá para "Deployments"
# 2. Veja se há um novo deployment DEPOIS de você adicionar as variáveis
# 3. Se não houver, clique em um deployment antigo e selecione "Redeploy"
```

## 🔍 Verificação 2: Checar Logs do Vercel

1. Acesse seu projeto no Vercel
2. Vá para **Deployments**
3. Clique no deployment ativo
4. Clique em **Runtime Logs**
5. Procure por mensagens de erro contendo:
   - "CORS"
   - "env"
   - "DATABASE"
   - "SMTP"

## 🌐 Verificação 3: Testar a API Diretamente

Abra a console do navegador (F12) e execute:

```javascript
// Testar requisição de login
fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'seu-email@exemplo.com',
    password: 'sua-senha'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(e => console.error('Error:', e))
```

## 📊 Verificação 4: Verificar Headers da Requisição

1. Abra **Devtools → Network** (F12)
2. Faça login
3. Procure pela requisição `/api/auth/login`
4. Veja a aba **Headers**
5. Procure por:
   - ✅ `Content-Type: application/json` - deve existir
   - ✅ `Origin: https://seu-projeto.vercel.app` - deve estar correto
   - ✅ `Cookie: ...` - deve ter cookies de sessão

## 🚨 Verificação 5: Erros Comuns

### Erro: "CORS error" ou "No Access-Control-Allow-Origin"
- **Causa**: `FRONTEND_ORIGIN` está diferente da URL real no navegador
- **Solução**: Compare a URL no navegador com `FRONTEND_ORIGIN` no Vercel exatamente

### Erro: "Credenciais inválidas" mesmo com dados corretos
- **Causa**: Pode ser CORS rejeitando cookies
- **Solução**: Verifique que `FRONTEND_ORIGIN` está EXATAMENTE como a URL do navegador

### Erro: "ENV variable not found"
- **Causa**: Variável de ambiente não foi configurada
- **Solução**: Redeploy após adicionar as variáveis

### Erro: "Database connection refused"
- **Causa**: `DATABASE_URL` está incorreta ou banco não está acessível
- **Solução**: Verifique que a URL PostgreSQL permite conexão do Vercel

## 📝 Variáveis Necessárias (Mínimo)

Para login/recuperação funcionar, você PRECISA de:

```env
FRONTEND_ORIGIN=https://seu-projeto.vercel.app
DATABASE_URL=sua-url-postgres
SMTP_FROM=um-email@seu-dominio.com
```

Sem essas 3, o servidor não inicia ou rejeita requisições.

## 💡 Dicas de Debug

1. **Limpar cache e cookies**:
   - Abra DevTools → Application → Cookies
   - Delete todos os cookies do seu domínio
   - Recarregue a página

2. **Testar com curl** (se tiver acesso via terminal):
   ```bash
   curl -X POST https://seu-projeto.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"test@example.com","password":"test123"}'
   ```

3. **Verificar se a API está respondendo**:
   - Acesse `https://seu-projeto.vercel.app/health`
   - Deve retornar: `{"status":"ok"}`
   - Se não funcionar, a API não está iniciando corretamente

---

**Precisa de mais ajuda?** Compartilhe o erro exato que aparece nos logs do Vercel.

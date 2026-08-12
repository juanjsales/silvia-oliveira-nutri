# Corrigindo Erro de POST Login/Recuperação de Senha no Vercel

## 🔴 Problema Identificado

As requisições POST para login e recuperação de senha falham no Vercel porque a variável de ambiente **`FRONTEND_ORIGIN`** não está configurada.

O backend Fastify está rejeitando requisições CORS porque:
- `FRONTEND_ORIGIN` é obrigatória no arquivo `backend-node/src/config/env.ts`
- Sem ela, o CORS não permite requisições POST do frontend
- No localhost funciona porque no `.env.example` está `FRONTEND_ORIGIN=http://localhost:5173`

## ✅ Solução: Configurar Variáveis no Vercel

### Passo 1: Acessar o Vercel Dashboard

1. Acesse https://vercel.com
2. Acesse seu projeto Nutricionista
3. Vá para **Settings → Environment Variables**

### Passo 2: Adicionar as Variáveis de Ambiente

Clique em **Add New** e configure as seguintes variáveis:

#### Obrigatórias (para funcionar):
| Variável | Valor | Explicação |
|----------|-------|-----------|
| `FRONTEND_ORIGIN` | `https://seu-projeto.vercel.app` | **CRÍTICO**: Deve ser a URL exata do seu Vercel |
| `APP_URL` | `https://seu-projeto.vercel.app` | URL da aplicação para links de recuperação de senha |
| `DATABASE_URL` | Sua URL PostgreSQL | Mesmo valor que usa localmente |
| `SMTP_FROM` | `noreply@seu-dominio.com` | Email de origem dos emails |

#### Opcionais (se usar SMTP):
| Variável | Valor |
|----------|-------|
| `SMTP_HOST` | Servidor SMTP |
| `SMTP_PORT` | Porta (geralmente 587) |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASS` | Senha SMTP |
| `SMTP_SECURE` | false (para porta 587) ou true (para 465) |

### Passo 3: Fazer o Deploy

Após adicionar as variáveis:
1. Vá para **Deployments**
2. Clique no deploy mais recente
3. Clique em **Redeploy**
4. Aguarde a conclusão

## 🔍 Verificar se Funcionou

Teste no Vercel:
1. Acesse `https://seu-projeto.vercel.app/login`
2. Tente fazer login com suas credenciais
3. Ou clique em "Esqueci a senha" e teste a recuperação

## 📋 Checklist Final

- [ ] `FRONTEND_ORIGIN` está configurado com a URL correta do Vercel
- [ ] `APP_URL` aponta para o Vercel
- [ ] `DATABASE_URL` está configurada
- [ ] `SMTP_FROM` está preenchido
- [ ] Deployment foi refeito após adicionar variáveis
- [ ] Login funciona no Vercel
- [ ] Recuperação de senha funciona no Vercel

## 🚨 Dica Importante

Se ainda não funcionar:
1. Verifique os logs no Vercel: **Deployments → Seu deployment → Logs**
2. Procure por erros relacionados a "CORS" ou "env"
3. Certifique-se de que a URL em `FRONTEND_ORIGIN` é exatamente a mesma da URL da navegador

---

**Nota**: As variáveis de ambiente no Vercel só entram em efeito após um novo deploy.

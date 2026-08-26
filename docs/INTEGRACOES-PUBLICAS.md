# Integrações públicas sem credenciais externas

O sistema usa apenas integrações públicas que não exigem conta, token ou chave de API de terceiros.

## Integrações ativas

- **ViaCEP**, com **BrasilAPI** como contingência: recebe somente o CEP e sugere rua, bairro, cidade e estado. O número e o complemento continuam sob conferência manual.
- **Open Food Facts**: usado somente quando a busca local TACO retorna poucos resultados. Todo item externo aparece com fonte e aviso de conferência no rótulo.
- **Web Push próprio**: não depende de SaaS, mas requer um par VAPID interno da instalação. Essas chaves são mecanismos criptográficos do sistema, não credenciais de uma API externa.

## Configuração do Web Push

1. Execute `npm run push:keys` uma única vez para a instalação.
2. Cadastre `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` no ambiente da hospedagem.
3. Use `mailto:email-do-responsavel@dominio.com` no `VAPID_SUBJECT`.
4. Nunca versionar ou enviar a chave privada em mensagens.
5. Faça um novo deploy e verifique o item **Notificações no dispositivo** em Configurações.

## Regras de privacidade e resiliência

- Nenhum nome, e-mail, CPF, diagnóstico ou prontuário é enviado a essas fontes.
- Falhas externas não impedem o preenchimento manual nem a busca TACO local.
- Dados colaborativos não substituem avaliação profissional ou informação do rótulo.
- O backend aplica timeout e limita o volume retornado.

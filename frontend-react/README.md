# Frontend React

Nova interface profissional do Portal Nutricional. A aplicação usa a API de `backend-node` e autenticação por cookie HttpOnly.

## Desenvolvimento

```bash
npm install
npm run dev
```

Com o backend em `http://127.0.0.1:3000`, o Vite encaminha `/api` automaticamente. Em ambientes separados, configure `VITE_API_URL` com a URL pública da API e ajuste `FRONTEND_ORIGIN` no backend.

## Escopo migrado

- login e restauração da sessão;
- navegação profissional protegida;
- dashboard inicial;
- listagem, busca, cadastro e edição de pacientes;
- calendário mensal, criação de consultas e atualização de status;
- atendimento clínico privado em etapas, com retomada e finalização;
- consultório virtual com vídeo persistente ao lado do prontuário;
- catálogos estruturados de alimentos, receitas e modelos de planos;
- criação de rascunhos de planos vinculados ao paciente;
- editor de plano incorporado ao atendimento, preservando a videochamada;
- prévia A4 do plano com refeições paginadas e lista de compras;
- placeholder explícito para configurações.

As páginas HTML antigas continuam disponíveis durante a migração incremental.

# Primeiro staging — checklist automatizado

O primeiro staging só está apto quando `assertFirstStagingReady` aprovar simultaneamente branch do produto, ambiente staging, projeto/banco distintos dos fingerprints protegidos, URL preview Vercel, artefato assinado, variáveis resolvidas pela allowlist, smoke fake, migration desativada e promoção desativada.

As variáveis do tenant seguem duas classes fechadas:

- públicas controladas: `APP_URL`, `FRONTEND_ORIGIN`, `SESSION_COOKIE_NAME`, `INSTALLATION_ID`, `LICENSE_PUBLIC_KEY`;
- secretas por referência `vault://`: `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `APP_ENCRYPTION_KEY`, `CRON_SECRET`, `SMTP_PASS`.

Payloads nunca aceitam valor bruto para chave secreta. O resolver injeta o valor apenas no limite do provider, valida fingerprints de produção e produz exclusivamente `target: ['preview']`. Nenhum valor resolvido deve ser persistido em logs, eventos ou respostas.

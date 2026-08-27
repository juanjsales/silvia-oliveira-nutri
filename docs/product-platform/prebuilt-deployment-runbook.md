# Deploy prebuilt seguro — runbook de homologação

Este fluxo é apenas uma fundação local. Não autoriza deploy nem conexão com Vercel, Supabase ou outro provedor.

## Artefato aceito

1. Compilar frontend e backend em CI confiável a partir de commit completo e imutável.
2. Empacotar somente saídas executáveis; excluir `src/`, `.env*`, TypeScript, SQL, chaves e source maps.
3. Gerar hashes SHA-256 por arquivo e manifesto da release.
4. Assinar o manifesto com chave Ed25519 mantida fora do repositório e do artefato.
5. Antes de publicar, verificar assinatura, digest, lista, tamanho e hash de todos os arquivos.
6. Manter o manifesto e a evidência do gate; nunca registrar segredo ou conteúdo clínico.

## Homologação simulada

- Executar primeiro o adapter `FAKE`; resultado deve declarar `external: false`.
- Adulteração, arquivo extra/ausente, fonte, source map ou possível segredo reprova o pacote.
- Smoke usa somente tenant fictício, banco fictício e domínio não canônico.

## Provider real — bloqueado por padrão

Uma integração futura só poderá atravessar o guard quando os três sinais coincidirem:

1. comando fechado com `executeExternalProvider: true` e `operationId`;
2. ambiente efêmero com `ALLOW_EXTERNAL_PROVIDER_PROVISIONING=true`;
3. confirmação efêmera exata `PROVIDER_EXECUTION_CONFIRMATION=staging:<operationId>`.

Além disso, `DEPLOYMENT_ENVIRONMENT=staging`, denylist, IDs protegidos e manifesto válido continuam obrigatórios. Remover os dois valores de opt-in imediatamente após a operação. Produção e a instalação da Dra. Silvia permanecem fora de escopo.

# Artefato clínico implantável

O artefato clínico é uma saída completa da Vercel Build Output API v3. Ele inclui o frontend estático, a função backend empacotada e `config.json`; não é apenas uma cópia da pasta `dist`.

## Publicação automática

1. Atualize `clinical-release.json` na branch `codex/clinical-product-base`.
2. O workflow `publish-clinical-artifact.yml` baixa as variáveis de **preview** do projeto clínico de build e executa `vercel build`.
3. O script conserva somente `.vercel/output/config.json`, `static/**` e `functions/**`.
4. Cada arquivo recebe SHA-256 e o manifesto é assinado com Ed25519.
5. O pacote e o catálogo são publicados numa GitHub Release imutável.

## Segredos do GitHub Actions

- `CLINICAL_ARTIFACT_PRIVATE_KEY`: chave Ed25519 privada em PEM, exclusiva do assinador.
- `CLINICAL_BUILD_VERCEL_TOKEN`: token limitado usado somente para obter a configuração do projeto de build.
- `CLINICAL_BUILD_VERCEL_ORG_ID`: organização proprietária do projeto de build neutro.
- `CLINICAL_BUILD_VERCEL_PROJECT_ID`: projeto Vercel neutro, sem dados de clínica real.

A chave pública correspondente deve ser configurada na central como `PREVIEW_ARTIFACT_PUBLIC_KEY`. A chave privada nunca deve ser instalada na central ou nos projetos das nutricionistas.

## Validação antes de implantar

O consumidor deve verificar, nesta ordem:

1. formato `kos-clinical-vercel-prebuilt-v2`;
2. Build Output API `version: 3`;
3. presença de `static/index.html`;
4. presença de pelo menos uma função com `.vc-config.json`, runtime Node permitido e handler existente;
5. digest e assinatura do manifesto;
6. tamanho e SHA-256 de todos os arquivos.

O publicador limita o pacote a 2.000 arquivos, 100 MiB descompactados e 25 MiB por arquivo, alinhado ao contrato atual do orquestrador e evitando materialização sem limite.

Qualquer divergência bloqueia a implantação. O pacote não contém variáveis de ambiente; banco, criptografia, URLs e e-mail continuam sendo configurados por tenant antes do smoke test.

## Limitações intencionais

- O build depende de um projeto Vercel neutro de referência para produzir a função serverless corretamente.
- O banco Supabase não integra o pacote: cada nutricionista mantém seu próprio projeto e credenciais.
- Migrações são executadas separadamente, com backup, status e idempotência; não rodam implicitamente durante o upload do artefato.
- O pacote pode ser grande por incluir a função Node. O orquestrador deve aplicar limites de download e tamanho antes de materializá-lo em memória.

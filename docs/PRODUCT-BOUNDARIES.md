# Limites do produto e da central

O repositório contém dois produtos implantáveis, mas eles não devem compartilhar a mesma superfície pública.

## Produto clínico (padrão seguro)

- `VITE_APP_SURFACE=clinical`
- `CONTROL_PLANE_ENABLED=false`
- Entregue à nutricionista e aos pacientes.
- Não expõe `/plataforma` nem `/api/platform/*`.
- Usa ilustrações neutras quando a clínica ainda não cadastrou fotos.

## Central de provisionamento

- `VITE_APP_SURFACE=control-plane`
- `CONTROL_PLANE_ENABLED=true`
- Mantida somente pelo operador da plataforma.
- Contém tenants, onboarding e integrações Vercel/Supabase.
- Nunca deve ser criada dentro da conta ou do banco clínico de uma nutricionista.

## Estratégia de branches

- `main`: clínica real já publicada; não recebe esta reestruturação diretamente.
- `codex/product-platform`: central e desenvolvimento da fábrica de instalações.
- `codex/clinical-product-base`: será derivada de uma versão aprovada e conterá o produto neutro distribuível.

A separação por configuração é a primeira barreira operacional. A extração para workspaces ou repositórios independentes só deve ocorrer depois de os contratos de API e o provisionamento estarem estabilizados.

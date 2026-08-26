const REQUEST_TIMEOUT_MS = 4500;

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ConsultorioNutricional/1.0 (public-data; no patient data)',
        ...headers,
      },
    });
    if (!response.ok) throw new Error(`Public data provider returned ${response.status}`);
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

export type PostalAddress = {
  postalCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  source: 'ViaCEP' | 'BrasilAPI';
};

export async function lookupPostalCode(postalCode: string): Promise<PostalAddress | null> {
  const cep = postalCode.replace(/\D/g, '');
  if (!/^\d{8}$/.test(cep)) return null;

  try {
    const value = await fetchJson<{ erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string }>(
      `https://viacep.com.br/ws/${cep}/json/`,
    );
    if (!value.erro && value.localidade && value.uf) return {
      postalCode: cep,
      street: value.logradouro?.trim() || '',
      neighborhood: value.bairro?.trim() || '',
      city: value.localidade.trim(),
      state: value.uf.trim().toUpperCase(),
      source: 'ViaCEP',
    };
  } catch {
    // A segunda fonte mantém o cadastro utilizável quando o ViaCEP oscila.
  }

  try {
    const value = await fetchJson<{ street?: string; neighborhood?: string; city?: string; state?: string }>(
      `https://brasilapi.com.br/api/cep/v2/${cep}`,
    );
    if (value.city && value.state) return {
      postalCode: cep,
      street: value.street?.trim() || '',
      neighborhood: value.neighborhood?.trim() || '',
      city: value.city.trim(),
      state: value.state.trim().toUpperCase(),
      source: 'BrasilAPI',
    };
  } catch {
    // Falhar de forma controlada: o preenchimento manual permanece disponível.
  }
  return null;
}

type OpenFoodFactsProduct = {
  code?: string;
  product_name_pt?: string;
  product_name?: string;
  brands?: string;
  nutriments?: Record<string, number | undefined>;
};

export type ExternalFood = {
  id: string;
  name: string;
  category: string;
  source: 'Open Food Facts';
  referenceUnit: '100 g';
  kcal: number;
  carbohydrate: number;
  protein: number;
  fat: number;
  fiber: number;
  external: true;
  verificationNotice: string;
};

export async function searchOpenFoodFacts(query: string, limit = 8): Promise<ExternalFood[]> {
  const term = query.trim();
  if (term.length < 3) return [];
  const params = new URLSearchParams({
    search_terms: term,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(Math.min(Math.max(limit, 1), 10)),
    fields: 'code,product_name_pt,product_name,brands,nutriments',
  });
  try {
    const value = await fetchJson<{ products?: OpenFoodFactsProduct[] }>(
      `https://br.openfoodfacts.org/cgi/search.pl?${params}`,
    );
    return (value.products || []).flatMap((product): ExternalFood[] => {
      const name = (product.product_name_pt || product.product_name || '').trim();
      if (!name) return [];
      const nutrients = product.nutriments || {};
      const kcal = Number(nutrients['energy-kcal_100g'] ?? nutrients['energy-kcal'] ?? 0);
      const carbohydrate = Number(nutrients.carbohydrates_100g ?? 0);
      const protein = Number(nutrients.proteins_100g ?? 0);
      const fat = Number(nutrients.fat_100g ?? 0);
      const fiber = Number(nutrients.fiber_100g ?? 0);
      if (![kcal, carbohydrate, protein, fat, fiber].some(number => number > 0)) return [];
      const brand = product.brands?.split(',')[0]?.trim();
      return [{
        id: `off:${product.code || encodeURIComponent(name)}`,
        name: brand ? `${name} · ${brand}` : name,
        category: 'Produto industrializado',
        source: 'Open Food Facts',
        referenceUnit: '100 g',
        kcal: Math.round(kcal),
        carbohydrate: Number(carbohydrate.toFixed(1)),
        protein: Number(protein.toFixed(1)),
        fat: Number(fat.toFixed(1)),
        fiber: Number(fiber.toFixed(1)),
        external: true,
        verificationNotice: 'Base colaborativa. Confirme os valores no rótulo antes do uso clínico.',
      }];
    });
  } catch {
    return [];
  }
}

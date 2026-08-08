/**
 * Base de Dados de Alimentos (Tabela TACO / IBGE + Open Food Facts API)
 * Nutricionista Dra. Silvia Oliveira Lemos
 *
 * Melhorias implementadas:
 *  1. Busca com Ranking (exato > início > contém)
 *  2. Normalização pré-computada (calculada 1x na inicialização)
 *  3. Busca Híbrida: TACO local + Open Food Facts com fallback/complemento
 *  4. Resiliência com AbortController (timeout 6s) na API externa
 *  5. calc() aceita objeto genérico (TACO ou Open Food Facts), não só id
 */

const TACO_DATABASE = [
  // CEREAIS E DERIVADOS
  { id: "c1",  nome: "Arroz Integral Cozido",           cat: "Cereais",     kcal: 124, carb: 25.8, prot: 2.6,  gord: 1.0,  fibra: 2.7, unid: "100g" },
  { id: "c2",  nome: "Arroz Branco Cozido",             cat: "Cereais",     kcal: 128, carb: 28.1, prot: 2.5,  gord: 0.2,  fibra: 1.6, unid: "100g" },
  { id: "c3",  nome: "Aveia em Flocos",                 cat: "Cereais",     kcal: 394, carb: 66.6, prot: 13.9, gord: 8.5,  fibra: 9.1, unid: "100g" },
  { id: "c4",  nome: "Pão Integral",                   cat: "Pães",        kcal: 247, carb: 49.9, prot: 9.4,  gord: 3.7,  fibra: 6.9, unid: "100g" },
  { id: "c5",  nome: "Pão de Forma Francês",           cat: "Pães",        kcal: 300, carb: 58.6, prot: 8.0,  gord: 3.1,  fibra: 2.3, unid: "100g" },
  { id: "c6",  nome: "Tapioca (Goma)",                 cat: "Cereais",     kcal: 240, carb: 60.0, prot: 0.4,  gord: 0.2,  fibra: 0.9, unid: "100g" },
  { id: "c7",  nome: "Batata Doce Cozida",             cat: "Tubérculos",  kcal: 77,  carb: 18.4, prot: 0.6,  gord: 0.1,  fibra: 2.2, unid: "100g" },
  { id: "c8",  nome: "Batata Inglesa Cozida",          cat: "Tubérculos",  kcal: 52,  carb: 11.9, prot: 1.2,  gord: 0.1,  fibra: 1.3, unid: "100g" },
  { id: "c9",  nome: "Mandioca / Aipim Cozido",        cat: "Tubérculos",  kcal: 125, carb: 30.1, prot: 0.6,  gord: 0.3,  fibra: 1.6, unid: "100g" },
  { id: "c10", nome: "Macarrão Integral Cozido",       cat: "Massas",      kcal: 124, carb: 26.5, prot: 5.3,  gord: 0.5,  fibra: 2.8, unid: "100g" },

  // LEGUMINOSAS
  { id: "l1",  nome: "Feijão Carioca Cozido",          cat: "Leguminosas", kcal: 76,  carb: 13.6, prot: 4.8,  gord: 0.5,  fibra: 8.5, unid: "100g" },
  { id: "l2",  nome: "Feijão Preto Cozido",            cat: "Leguminosas", kcal: 77,  carb: 14.0, prot: 4.5,  gord: 0.5,  fibra: 8.4, unid: "100g" },
  { id: "l3",  nome: "Grão de Bico Cozido",            cat: "Leguminosas", kcal: 120, carb: 20.1, prot: 7.0,  gord: 2.0,  fibra: 5.4, unid: "100g" },
  { id: "l4",  nome: "Lentilha Cozida",                cat: "Leguminosas", kcal: 93,  carb: 16.3, prot: 6.3,  gord: 0.4,  fibra: 3.8, unid: "100g" },

  // CARNES, AVES E OVOS
  { id: "p1",  nome: "Peito de Frango Grelhado",           cat: "Carnes",  kcal: 159, carb: 0.0, prot: 32.0, gord: 2.5,  fibra: 0.0, unid: "100g" },
  { id: "p2",  nome: "Sobrecoxa de Frango Sem Pele Assada",cat: "Carnes",  kcal: 233, carb: 0.0, prot: 24.5, gord: 14.2, fibra: 0.0, unid: "100g" },
  { id: "p3",  nome: "Ovo de Galinha Cozido",              cat: "Ovos",    kcal: 146, carb: 0.6, prot: 13.3, gord: 9.5,  fibra: 0.0, unid: "100g (aprox. 2 un)" },
  { id: "p4",  nome: "Ovo de Galinha Frito (Mexido)",      cat: "Ovos",    kcal: 196, carb: 1.1, prot: 12.8, gord: 15.3, fibra: 0.0, unid: "100g" },
  { id: "p5",  nome: "Patinho Bovino Grelhado",            cat: "Carnes",  kcal: 219, carb: 0.0, prot: 35.9, gord: 7.3,  fibra: 0.0, unid: "100g" },
  { id: "p6",  nome: "Alcatra Bovina Grelhada",            cat: "Carnes",  kcal: 241, carb: 0.0, prot: 31.9, gord: 11.6, fibra: 0.0, unid: "100g" },
  { id: "p7",  nome: "Carne Moída (Patinho) Refogada",     cat: "Carnes",  kcal: 212, carb: 0.0, prot: 28.5, gord: 10.2, fibra: 0.0, unid: "100g" },
  { id: "p8",  nome: "Filet de Tilápia Grelhado",          cat: "Peixes",  kcal: 128, carb: 0.0, prot: 26.0, gord: 2.7,  fibra: 0.0, unid: "100g" },
  { id: "p9",  nome: "Salmão Grelhado",                    cat: "Peixes",  kcal: 229, carb: 0.0, prot: 22.1, gord: 15.0, fibra: 0.0, unid: "100g" },
  { id: "p10", nome: "Atum Conserva em Água",              cat: "Peixes",  kcal: 116, carb: 0.0, prot: 25.5, gord: 1.0,  fibra: 0.0, unid: "100g" },

  // LATICÍNIOS E DERIVADOS
  { id: "d1",  nome: "Leite Desnatado",                cat: "Laticínios", kcal: 35,  carb: 4.9, prot: 3.4,  gord: 0.1,  fibra: 0.0, unid: "100ml" },
  { id: "d2",  nome: "Leite Integral",                 cat: "Laticínios", kcal: 61,  carb: 4.7, prot: 3.2,  gord: 3.3,  fibra: 0.0, unid: "100ml" },
  { id: "d3",  nome: "Iogurte Natural Desnatado",      cat: "Laticínios", kcal: 41,  carb: 5.8, prot: 3.8,  gord: 0.3,  fibra: 0.0, unid: "100g" },
  { id: "d4",  nome: "Iogurte Grego Natural",          cat: "Laticínios", kcal: 113, carb: 4.2, prot: 7.0,  gord: 7.5,  fibra: 0.0, unid: "100g" },
  { id: "d5",  nome: "Queijo Cottage",                 cat: "Laticínios", kcal: 98,  carb: 3.4, prot: 11.1, gord: 4.3,  fibra: 0.0, unid: "100g" },
  { id: "d6",  nome: "Queijo Minas Frescal",           cat: "Laticínios", kcal: 264, carb: 3.2, prot: 17.4, gord: 20.2, fibra: 0.0, unid: "100g" },
  { id: "d7",  nome: "Queijo Muçarela",                cat: "Laticínios", kcal: 330, carb: 3.0, prot: 22.6, gord: 25.2, fibra: 0.0, unid: "100g" },
  { id: "d8",  nome: "Requeijão Light",                cat: "Laticínios", kcal: 172, carb: 3.0, prot: 9.6,  gord: 13.5, fibra: 0.0, unid: "100g" },

  // FRUTAS
  { id: "f1",  nome: "Banana Prata / Caturra",         cat: "Frutas", kcal: 98,  carb: 26.0, prot: 1.3, gord: 0.1, fibra: 2.0, unid: "100g (1 un média)" },
  { id: "f2",  nome: "Maçã Fuji / Gala com Casca",     cat: "Frutas", kcal: 56,  carb: 14.5, prot: 0.3, gord: 0.2, fibra: 2.0, unid: "100g (1 un média)" },
  { id: "f3",  nome: "Mamão Papaia",                   cat: "Frutas", kcal: 45,  carb: 11.6, prot: 0.5, gord: 0.1, fibra: 1.8, unid: "100g" },
  { id: "f4",  nome: "Morango In Natura",              cat: "Frutas", kcal: 30,  carb: 6.8,  prot: 0.9, gord: 0.3, fibra: 1.7, unid: "100g" },
  { id: "f5",  nome: "Abacate",                        cat: "Frutas", kcal: 96,  carb: 6.0,  prot: 1.2, gord: 8.4, fibra: 6.3, unid: "100g" },
  { id: "f6",  nome: "Laranja Pêra",                   cat: "Frutas", kcal: 46,  carb: 11.5, prot: 1.0, gord: 0.1, fibra: 1.8, unid: "100g" },
  { id: "f7",  nome: "Uva Itália / Niágara",           cat: "Frutas", kcal: 53,  carb: 13.6, prot: 0.7, gord: 0.2, fibra: 0.9, unid: "100g" },

  // VERDURAS E HORTALIÇAS
  { id: "v1",  nome: "Alface Crespa / Americana",      cat: "Hortaliças", kcal: 11,  carb: 1.7, prot: 1.3, gord: 0.2, fibra: 1.4, unid: "100g" },
  { id: "v2",  nome: "Brócolis Cozido",                cat: "Hortaliças", kcal: 25,  carb: 4.4, prot: 2.1, gord: 0.3, fibra: 3.4, unid: "100g" },
  { id: "v3",  nome: "Cenoura Crua / Ralada",          cat: "Hortaliças", kcal: 34,  carb: 7.7, prot: 1.3, gord: 0.2, fibra: 3.2, unid: "100g" },
  { id: "v4",  nome: "Tomate Salada",                  cat: "Hortaliças", kcal: 15,  carb: 3.1, prot: 1.1, gord: 0.2, fibra: 1.2, unid: "100g" },
  { id: "v5",  nome: "Espinafre Cozido",               cat: "Hortaliças", kcal: 67,  carb: 4.2, prot: 2.7, gord: 0.6, fibra: 2.5, unid: "100g" },
  { id: "v6",  nome: "Abobrinha Italiana Cozida",      cat: "Hortaliças", kcal: 15,  carb: 3.0, prot: 1.1, gord: 0.2, fibra: 1.0, unid: "100g" },

  // GORDURAS E OLEAGINOSAS
  { id: "g1",  nome: "Azeite de Oliva Extra Virgem",   cat: "Gorduras",    kcal: 884, carb: 0.0,  prot: 0.0,  gord: 100.0, fibra: 0.0, unid: "100ml (1 colher de sopa = 108 kcal)" },
  { id: "g2",  nome: "Castanha do Pará / Brasil",      cat: "Oleaginosas", kcal: 643, carb: 15.1, prot: 14.5, gord: 63.5,  fibra: 7.9, unid: "100g (approx 20 un)" },
  { id: "g3",  nome: "Amendoim Torrado",               cat: "Oleaginosas", kcal: 544, carb: 20.3, prot: 27.2, gord: 43.9,  fibra: 8.0, unid: "100g" },
  { id: "g4",  nome: "Pasta de Amendoim Integral",     cat: "Oleaginosas", kcal: 588, carb: 21.0, prot: 25.0, gord: 50.0,  fibra: 6.0, unid: "100g" },
  { id: "g5",  nome: "Nozes",                          cat: "Oleaginosas", kcal: 620, carb: 13.7, prot: 14.0, gord: 59.4,  fibra: 7.2, unid: "100g" },

  // SUPLEMENTOS E OUTROS
  { id: "s1",  nome: "Whey Protein Concentrado 80%",   cat: "Suplementos", kcal: 400, carb: 7.0,  prot: 80.0, gord: 6.0, fibra: 0.0, unid: "100g (1 scoop 30g = 120 kcal, 24g prot)" },
  { id: "s2",  nome: "Whey Protein Isolado 90%",       cat: "Suplementos", kcal: 370, carb: 2.0,  prot: 90.0, gord: 1.0, fibra: 0.0, unid: "100g" },
  { id: "s3",  nome: "Creatina Monohidratada",         cat: "Suplementos", kcal: 0,   carb: 0.0,  prot: 0.0,  gord: 0.0, fibra: 0.0, unid: "100g" },
  { id: "s4",  nome: "Mel de Abelhas",                 cat: "Açúcares",    kcal: 309, carb: 84.0, prot: 0.4,  gord: 0.0, fibra: 0.2, unid: "100g" },
  { id: "s5",  nome: "Açúcar Mascavo",                 cat: "Açúcares",    kcal: 369, carb: 94.5, prot: 0.8,  gord: 0.1, fibra: 0.0, unid: "100g" },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * MELHORIA 2: Normalização pré-computada (1x na inicialização, não a cada busca)
 * Cada item recebe _nomeClean e _catClean calculados apenas uma vez.
 * ───────────────────────────────────────────────────────────────────────────── */
const _normalize = str =>
  String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

TACO_DATABASE.forEach(item => {
  item._nomeClean = _normalize(item.nome);
  item._catClean  = _normalize(item.cat);
});

/* ─────────────────────────────────────────────────────────────────────────────
 * MELHORIA 1: Busca com Ranking de relevância
 *   score 3 → coincidência exata no nome
 *   score 2 → nome começa com o termo
 *   score 1 → nome ou categoria contém o termo
 * Resultados são ordenados por score (maior primeiro), depois por nome.
 * ───────────────────────────────────────────────────────────────────────────── */
function _scoreItem(item, term) {
  const n = item._nomeClean;
  const c = item._catClean;
  if (n === term)               return 3;  // exato
  if (n.startsWith(term))       return 2;  // começa com
  if (n.includes(term) ||
      c.includes(term))         return 1;  // contém
  return 0;
}

const TacoDB = {

  /* ── Busca local TACO com ranking ───────────────────────────────────────── */
  search(query, limit = 20) {
    if (!query || typeof query !== "string") return [];
    const term = _normalize(query);
    if (term.length < 2) return [];

    const results = [];
    for (const item of TACO_DATABASE) {
      const score = _scoreItem(item, term);
      if (score > 0) results.push({ item, score });
    }

    return results
      .sort((a, b) => b.score - a.score || a.item.nome.localeCompare(b.item.nome, "pt-BR"))
      .slice(0, limit)
      .map(r => r.item);
  },

  /* ── MELHORIA 5: calc() aceita id (string), objeto TACO ou Open Food Facts ─ */
  calc(foodOrId, grams = 100) {
    let food = foodOrId;

    // Resolução por id string
    if (typeof foodOrId === "string") {
      food = TACO_DATABASE.find(item => item.id === foodOrId) ?? null;
    }

    if (!food || typeof food !== "object") return null;

    // Suporte a campos tanto da TACO quanto da Open Food Facts normalizada
    const ratio = Math.max(0, Number(grams) || 0) / 100;
    return {
      id:     food.id   ?? null,
      nome:   food.nome ?? "Alimento",
      cat:    food.cat  ?? "—",
      fonte:  food.fonte ?? (food.id?.startsWith("off_") ? "Open Food Facts" : "TACO"),
      gramas: grams,
      kcal:   Math.round((food.kcal  ?? 0) * ratio),
      carb:   parseFloat(((food.carb  ?? 0) * ratio).toFixed(1)),
      prot:   parseFloat(((food.prot  ?? 0) * ratio).toFixed(1)),
      gord:   parseFloat(((food.gord  ?? 0) * ratio).toFixed(1)),
      fibra:  parseFloat(((food.fibra ?? 0) * ratio).toFixed(1)),
    };
  },

  /* ── MELHORIA 4: Open Food Facts com AbortController (timeout 6s) ─────── */
  async searchOpenFoodFacts(query, limit = 8) {
    if (!query || query.trim().length < 3) return [];

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const url = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data?.products || !Array.isArray(data.products)) return [];

      return data.products
        .map(p => {
          const nut  = p.nutriments || {};
          const nome = (p.product_name_pt || p.product_name || "").trim();
          const marca = (p.brands || "").trim();

          // Descarta produtos sem nome ou sem nenhum dado nutricional
          if (!nome) return null;

          const kcal  = Math.round(nut["energy-kcal_100g"] || nut["energy-kcal"] || 0);
          const carb  = parseFloat((nut.carbohydrates_100g || 0).toFixed(1));
          const prot  = parseFloat((nut.proteins_100g      || 0).toFixed(1));
          const gord  = parseFloat((nut.fat_100g           || 0).toFixed(1));
          const fibra = parseFloat((nut.fiber_100g         || 0).toFixed(1));

          // Descarta se não houver absolutamente nenhum dado nutricional relevante
          if (kcal === 0 && carb === 0 && prot === 0 && gord === 0) return null;

          return {
            id:    "off_" + (p.code || Math.random()),
            nome:  marca ? `${nome} (${marca})` : nome,
            cat:   "Open Food Facts",
            fonte: "Open Food Facts",
            kcal, carb, prot, gord, fibra,
            unid:  "100g",
          };
        })
        .filter(Boolean); // remove nulos

    } catch (e) {
      if (e.name === "AbortError") {
        console.warn("TacoDB: timeout ao consultar Open Food Facts (>6s)");
      } else {
        console.warn("TacoDB: erro ao consultar Open Food Facts:", e.message);
      }
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /* ── MELHORIA 3: Busca Híbrida (TACO local + Open Food Facts complementar) ─
   *
   * Estratégia:
   *   1. Busca imediata na TACO local (síncrona, sem latência).
   *   2. Se resultados locais >= minLocal, retorna só TACO (rápido, offline).
   *   3. Se resultados locais < minLocal, complementa com Open Food Facts.
   *   4. Retorna { taco: [...], off: [...], all: [...] } para flexibilidade.
   * ───────────────────────────────────────────────────────────────────────── */
  async searchUnified(query, { minLocal = 3, offLimit = 6 } = {}) {
    if (!query || query.trim().length < 2) {
      return { taco: [], off: [], all: [] };
    }

    const tacoResults = this.search(query);

    // Se TACO já tem resultado suficiente, não chama a API externa
    if (tacoResults.length >= minLocal) {
      return { taco: tacoResults, off: [], all: tacoResults };
    }

    // Complementa com Open Food Facts (em paralelo, sem bloquear UI)
    const offResults = await this.searchOpenFoodFacts(query, offLimit);

    // Evita duplicatas grosseiras por nome normalizado
    const tacoNames = new Set(tacoResults.map(t => _normalize(t.nome)));
    const offFiltered = offResults.filter(
      o => !tacoNames.has(_normalize(o.nome))
    );

    const all = [...tacoResults, ...offFiltered];
    return { taco: tacoResults, off: offFiltered, all };
  },
};

if (typeof window !== "undefined") {
  window.TacoDB      = TacoDB;
  window.TACO_DATABASE = TACO_DATABASE;
}

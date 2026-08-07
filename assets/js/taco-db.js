/**
 * Base de Dados de Alimentos (Tabela TACO / IBGE + Open Food Facts API)
 * Nutricionista Dra. Silvia Lemos
 */

const TACO_DATABASE = [
  // CEREAIS E DERIVADOS
  { id: "c1", nome: "Arroz Integral Cozido", cat: "Cereais", kcal: 124, carb: 25.8, prot: 2.6, gord: 1.0, fibra: 2.7, unid: "100g" },
  { id: "c2", nome: "Arroz Branco Cozido", cat: "Cereais", kcal: 128, carb: 28.1, prot: 2.5, gord: 0.2, fibra: 1.6, unid: "100g" },
  { id: "c3", nome: "Aveia em Flocos", cat: "Cereais", kcal: 394, carb: 66.6, prot: 13.9, gord: 8.5, fibra: 9.1, unid: "100g" },
  { id: "c4", nome: "Pão Integral", cat: "Pães", kcal: 247, carb: 49.9, prot: 9.4, gord: 3.7, fibra: 6.9, unid: "100g" },
  { id: "c5", nome: "Pão de Forma Francês", cat: "Pães", kcal: 300, carb: 58.6, prot: 8.0, gord: 3.1, fibra: 2.3, unid: "100g" },
  { id: "c6", nome: "Tapioca (Goma)", cat: "Cereais", kcal: 240, carb: 60.0, prot: 0.4, gord: 0.2, fibra: 0.9, unid: "100g" },
  { id: "c7", nome: "Batata Doce Cozida", cat: "Tubérculos", kcal: 77, carb: 18.4, prot: 0.6, gord: 0.1, fibra: 2.2, unid: "100g" },
  { id: "c8", nome: "Batata Inglesa Cozida", cat: "Tubérculos", kcal: 52, carb: 11.9, prot: 1.2, gord: 0.1, fibra: 1.3, unid: "100g" },
  { id: "c9", nome: "Mandioca / Aipim Cozido", cat: "Tubérculos", kcal: 125, carb: 30.1, prot: 0.6, gord: 0.3, fibra: 1.6, unid: "100g" },
  { id: "c10", nome: "Macarrão Integral Cozido", cat: "Massas", kcal: 124, carb: 26.5, prot: 5.3, gord: 0.5, fibra: 2.8, unid: "100g" },

  // LEGUMINOSAS
  { id: "l1", nome: "Feijão Carioca Cozido", cat: "Leguminosas", kcal: 76, carb: 13.6, prot: 4.8, gord: 0.5, fibra: 8.5, unid: "100g" },
  { id: "l2", nome: "Feijão Preto Cozido", cat: "Leguminosas", kcal: 77, carb: 14.0, prot: 4.5, gord: 0.5, fibra: 8.4, unid: "100g" },
  { id: "l3", nome: "Grão de Bico Cozido", cat: "Leguminosas", kcal: 120, carb: 20.1, prot: 7.0, gord: 2.0, fibra: 5.4, unid: "100g" },
  { id: "l4", nome: "Lentilha Cozida", cat: "Leguminosas", kcal: 93, carb: 16.3, prot: 6.3, gord: 0.4, fibra: 3.8, unid: "100g" },

  // CARNES, AVES E OVOS
  { id: "p1", nome: "Peito de Frango Grelhado", cat: "Carnes", kcal: 159, carb: 0.0, prot: 32.0, gord: 2.5, fibra: 0.0, unid: "100g" },
  { id: "p2", nome: "Sobrecoxa de Frango Sem Pele Assada", cat: "Carnes", kcal: 233, carb: 0.0, prot: 24.5, gord: 14.2, fibra: 0.0, unid: "100g" },
  { id: "p3", nome: "Ovo de Galinha Cozido", cat: "Ovos", kcal: 146, carb: 0.6, prot: 13.3, gord: 9.5, fibra: 0.0, unid: "100g (aprox. 2 un)" },
  { id: "p4", nome: "Ovo de Galinha Frito (Mexido)", cat: "Ovos", kcal: 196, carb: 1.1, prot: 12.8, gord: 15.3, fibra: 0.0, unid: "100g" },
  { id: "p5", nome: "Patinho Bovino Grelhado", cat: "Carnes", kcal: 219, carb: 0.0, prot: 35.9, gord: 7.3, fibra: 0.0, unid: "100g" },
  { id: "p6", nome: "Alcatra Bovina Grelhada", cat: "Carnes", kcal: 241, carb: 0.0, prot: 31.9, gord: 11.6, fibra: 0.0, unid: "100g" },
  { id: "p7", nome: "Carne Moída (Patinho) Refogada", cat: "Carnes", kcal: 212, carb: 0.0, prot: 28.5, gord: 10.2, fibra: 0.0, unid: "100g" },
  { id: "p8", nome: "Filet de Tilápia Grelhado", cat: "Peixes", kcal: 128, carb: 0.0, prot: 26.0, gord: 2.7, fibra: 0.0, unid: "100g" },
  { id: "p9", nome: "Salmão Grelhado", cat: "Peixes", kcal: 229, carb: 0.0, prot: 22.1, gord: 15.0, fibra: 0.0, unid: "100g" },
  { id: "p10", nome: "Atum Conserva em Água", cat: "Peixes", kcal: 116, carb: 0.0, prot: 25.5, gord: 1.0, fibra: 0.0, unid: "100g" },

  // LATICÍNIOS E DERIVADOS
  { id: "d1", nome: "Leite Desnatado", cat: "Laticínios", kcal: 35, carb: 4.9, prot: 3.4, gord: 0.1, fibra: 0.0, unid: "100ml" },
  { id: "d2", nome: "Leite Integral", cat: "Laticínios", kcal: 61, carb: 4.7, prot: 3.2, gord: 3.3, fibra: 0.0, unid: "100ml" },
  { id: "d3", nome: "Iogurte Natural Desnatado", cat: "Laticínios", kcal: 41, carb: 5.8, prot: 3.8, gord: 0.3, fibra: 0.0, unid: "100g" },
  { id: "d4", nome: "Iogurte Grego Natural", cat: "Laticínios", kcal: 113, carb: 4.2, prot: 7.0, gord: 7.5, fibra: 0.0, unid: "100g" },
  { id: "d5", nome: "Queijo Cottage", cat: "Laticínios", kcal: 98, carb: 3.4, prot: 11.1, gord: 4.3, fibra: 0.0, unid: "100g" },
  { id: "d6", nome: "Queijo Minas Frescal", cat: "Laticínios", kcal: 264, carb: 3.2, prot: 17.4, gord: 20.2, fibra: 0.0, unid: "100g" },
  { id: "d7", nome: "Queijo Muçarela", cat: "Laticínios", kcal: 330, carb: 3.0, prot: 22.6, gord: 25.2, fibra: 0.0, unid: "100g" },
  { id: "d8", nome: "Requeijão Light", cat: "Laticínios", kcal: 172, carb: 3.0, prot: 9.6, gord: 13.5, fibra: 0.0, unid: "100g" },

  // FRUTAS
  { id: "f1", nome: "Banana Prata / Caturra", cat: "Frutas", kcal: 98, carb: 26.0, prot: 1.3, gord: 0.1, fibra: 2.0, unid: "100g (1 un média)" },
  { id: "f2", nome: "Maçã Fuji / Gala com Casca", cat: "Frutas", kcal: 56, carb: 14.5, prot: 0.3, gord: 0.2, fibra: 2.0, unid: "100g (1 un média)" },
  { id: "f3", nome: "Mamão Papaia", cat: "Frutas", kcal: 45, carb: 11.6, prot: 0.5, gord: 0.1, fibra: 1.8, unid: "100g" },
  { id: "f4", nome: "Morango In Natura", cat: "Frutas", kcal: 30, carb: 6.8, prot: 0.9, gord: 0.3, fibra: 1.7, unid: "100g" },
  { id: "f5", nome: "Abacate", cat: "Frutas", kcal: 96, carb: 6.0, prot: 1.2, gord: 8.4, fibra: 6.3, unid: "100g" },
  { id: "f6", nome: "Laranja Pêra", cat: "Frutas", kcal: 46, carb: 11.5, prot: 1.0, gord: 0.1, fibra: 1.8, unid: "100g" },
  { id: "f7", nome: "Uva Itália / Niágara", cat: "Frutas", kcal: 53, carb: 13.6, prot: 0.7, gord: 0.2, fibra: 0.9, unid: "100g" },

  // VERDURAS E HORTALIÇAS
  { id: "v1", nome: "Alface Crespa / Americana", cat: "Hortaliças", kcal: 11, carb: 1.7, prot: 1.3, gord: 0.2, fibra: 1.4, unid: "100g" },
  { id: "v2", nome: "Brócolis Cozido", cat: "Hortaliças", kcal: 25, carb: 4.4, prot: 2.1, gord: 0.3, fibra: 3.4, unid: "100g" },
  { id: "v3", nome: "Cenoura Crua / Ralada", cat: "Hortaliças", kcal: 34, carb: 7.7, prot: 1.3, gord: 0.2, fibra: 3.2, unid: "100g" },
  { id: "v4", nome: "Tomate Salada", cat: "Hortaliças", kcal: 15, carb: 3.1, prot: 1.1, gord: 0.2, fibra: 1.2, unid: "100g" },
  { id: "v5", nome: "Espinafre Cozido", cat: "Hortaliças", kcal: 67, carb: 4.2, prot: 2.7, gord: 0.6, fibra: 2.5, unid: "100g" },
  { id: "v6", nome: "Abobrinha Italiana Cozida", cat: "Hortaliças", kcal: 15, carb: 3.0, prot: 1.1, gord: 0.2, fibra: 1.0, unid: "100g" },

  // GORDURAS E OLEAGINOSAS
  { id: "g1", nome: "Azeite de Oliva Extra Virgem", cat: "Gorduras", kcal: 884, carb: 0.0, prot: 0.0, gord: 100.0, fibra: 0.0, unid: "100ml (1 colher de sopa = 108 kcal)" },
  { id: "g2", nome: "Castanha do Pará / Brasil", cat: "Oleaginosas", kcal: 643, carb: 15.1, prot: 14.5, gord: 63.5, fibra: 7.9, unid: "100g (approx 20 un)" },
  { id: "g3", nome: "Amendoim Torrado", cat: "Oleaginosas", kcal: 544, carb: 20.3, prot: 27.2, gord: 43.9, fibra: 8.0, unid: "100g" },
  { id: "g4", nome: "Pasta de Amendoim Integral", cat: "Oleaginosas", kcal: 588, carb: 21.0, prot: 25.0, gord: 50.0, fibra: 6.0, unid: "100g" },
  { id: "g5", nome: "Nozes", cat: "Oleaginosas", kcal: 620, carb: 13.7, prot: 14.0, gord: 59.4, fibra: 7.2, unid: "100g" },

  // SUPLEMENTOS E OUTROS
  { id: "s1", nome: "Whey Protein Concentrado 80%", cat: "Suplementos", kcal: 400, carb: 7.0, prot: 80.0, gord: 6.0, fibra: 0.0, unid: "100g (1 scoop 30g = 120 kcal, 24g prot)" },
  { id: "s2", nome: "Whey Protein Isolado 90%", cat: "Suplementos", kcal: 370, carb: 2.0, prot: 90.0, gord: 1.0, fibra: 0.0, unid: "100g" },
  { id: "s3", nome: "Creatina Monohidratada", cat: "Suplementos", kcal: 0, carb: 0.0, prot: 0.0, gord: 0.0, fibra: 0.0, unid: "100g" },
  { id: "s4", nome: "Mel de Abelhas", cat: "Açúcares", kcal: 309, carb: 84.0, prot: 0.4, gord: 0.0, fibra: 0.2, unid: "100g" },
  { id: "s5", nome: "Açúcar Mascavo", cat: "Açúcares", kcal: 369, carb: 94.5, prot: 0.8, gord: 0.1, fibra: 0.0, unid: "100g" }
];

const TacoDB = {
  search(query) {
    if (!query || typeof query !== "string") return [];
    const term = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (term.length < 2) return [];

    return TACO_DATABASE.filter(f => {
      const nameClean = f.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const catClean = f.cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return nameClean.includes(term) || catClean.includes(term);
    });
  },

  calc(foodOrId, grams = 100) {
    let food = foodOrId;
    if (typeof foodOrId === "string") {
      food = TACO_DATABASE.find(item => item.id === foodOrId);
    }
    if (!food) return null;

    const ratio = Math.max(0, grams) / 100;
    return {
      id: food.id,
      nome: food.nome,
      cat: food.cat,
      gramas: grams,
      kcal: Math.round(food.kcal * ratio),
      carb: parseFloat((food.carb * ratio).toFixed(1)),
      prot: parseFloat((food.prot * ratio).toFixed(1)),
      gord: parseFloat((food.gord * ratio).toFixed(1)),
      fibra: parseFloat((food.fibra * ratio).toFixed(1))
    };
  },

  async searchOpenFoodFacts(query) {
    if (!query || query.trim().length < 3) return [];
    try {
      const url = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data || !data.products) return [];

      return data.products.map(p => {
        const nut = p.nutriments || {};
        return {
          id: "off_" + p.code,
          nome: `${p.product_name_pt || p.product_name || "Produto"} (${p.brands || "Industrializado"})`,
          cat: "Open Food Facts",
          kcal: Math.round(nut["energy-kcal_100g"] || nut["energy-kcal"] || 0),
          carb: parseFloat((nut.carbohydrates_100g || 0).toFixed(1)),
          prot: parseFloat((nut.proteins_100g || 0).toFixed(1)),
          gord: parseFloat((nut.fat_100g || 0).toFixed(1)),
          fibra: parseFloat((nut.fiber_100g || 0).toFixed(1)),
          unid: "100g"
        };
      }).filter(p => p.kcal > 0 || p.carb > 0 || p.prot > 0);
    } catch (e) {
      console.warn("Erro ao consultar Open Food Facts:", e);
      return [];
    }
  }
};

if (typeof window !== "undefined") {
  window.TacoDB = TacoDB;
  window.TACO_DATABASE = TACO_DATABASE;
}

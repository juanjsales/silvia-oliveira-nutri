/**
 * BANCO DE MODELOS PRONTOS DE PLANOS ALIMENTARES
 * Dra. Silvia Oliveira Lemos - Nutricionista
 * 
 * Contém 20 modelos nutricionais pré-configurados (1200 kcal a 2500 kcal)
 * com alimentos estruturados (Tabela TACO/IBGE), gramagens, calorias, macros e recomendações.
 */

window.MODELOS_PLANOS_NUTRI = [
  // -------------------------------------------------------------
  // FAXA 1: EMAGRECIMENTO & DÉFICIT CALÓRICO (1200 kcal - 1500 kcal)
  // -------------------------------------------------------------
  {
    id: "1200_emagrecimento",
    titulo: "🎯 1200 kcal - Emagrecimento Rápido / Déficit Agressivo",
    categoria: "Emagrecimento",
    caloriasAlvo: 1200,
    apresentacao: "Plano hipocalórico focado em déficit estruturado para rápida perda de gordura corporal, com alto volume de vegetais e fibras para maximizar a saciedade.",
    objetivo: "Déficit calórico expressivo com foco em saciedade, controle glicêmico e preservação de massa magra.",
    metaAgua: 2.5,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        obs: "Substituição: 2 ovos mexidos por 150g de iogurte natural desnatado + 15g de chia.",
        alimentosList: [
          { id: "m1_1", nome: "Ovo de Galinha Cozido/Mexido", qtd: 2, unidade: "unidades (100g)", kcal: 140, carb: 1, prot: 12, gord: 9.5 },
          { id: "m1_2", nome: "Pão Integral de Forma", qtd: 1, unidade: "fatia (25g)", kcal: 60, carb: 11, prot: 2.5, gord: 0.8 },
          { id: "m1_3", nome: "Mamão Papaia", qtd: 100, unidade: "g", kcal: 45, carb: 11.5, prot: 0.5, gord: 0.1 },
          { id: "m1_4", nome: "Café Preto sem Açúcar", qtd: 150, unidade: "ml", kcal: 2, carb: 0.3, prot: 0.2, gord: 0 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        obs: "Pode consumir morangos ou kiwis como alternativa de menor densidade calórica.",
        alimentosList: [
          { id: "m1_5", nome: "Maçã Fuji / Gala", qtd: 1, unidade: "unidade média (120g)", kcal: 62, carb: 16, prot: 0.3, gord: 0.2 },
          { id: "m1_6", nome: "Castanha-do-Pará", qtd: 2, unidade: "unidades (8g)", kcal: 52, carb: 1, prot: 1.1, gord: 5.3 }
        ]
      },
      {
        titulo: "ALMOÇO",
        obs: "Tempere a salada apenas com azeite de oliva e limão.",
        alimentosList: [
          { id: "m1_7", nome: "Peito de Frango Grelhado", qtd: 120, unidade: "g", kcal: 195, carb: 0, prot: 37, gord: 4.2 },
          { id: "m1_8", nome: "Arroz Integral Cozido", qtd: 60, unidade: "g (2 col. sopa)", kcal: 74, carb: 15.5, prot: 1.5, gord: 0.6 },
          { id: "m1_9", nome: "Feijão Carioca Cozido", qtd: 50, unidade: "g (1/2 concha)", kcal: 38, carb: 6.8, prot: 2.4, gord: 0.3 },
          { id: "m1_10", nome: "Mix de Folhas Verdes & Tomate", qtd: 150, unidade: "g", kcal: 25, carb: 5, prot: 1.5, gord: 0.2 },
          { id: "m1_11", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml (1 col. chá)", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE",
        obs: "Consumir preferencialmente após o trabalho ou no meio da tarde.",
        alimentosList: [
          { id: "m1_12", nome: "Iogurte Natural Desnatado", qtd: 160, unidade: "g (1 pote)", kcal: 66, carb: 9, prot: 6.8, gord: 0.3 },
          { id: "m1_13", nome: "Farelo de Aveia", qtd: 15, unidade: "g (1 col. sopa)", kcal: 52, carb: 8.5, prot: 2.5, gord: 1.1 },
          { id: "m1_14", nome: "Morangos Frescos", qtd: 80, unidade: "g", kcal: 24, carb: 5.5, prot: 0.5, gord: 0.2 }
        ]
      },
      {
        titulo: "JANTAR",
        obs: "Evitar carboidratos simples no jantar para favorecer a lipólise noturna.",
        alimentosList: [
          { id: "m1_15", nome: "Filé de Tilápia / Peixe Branco Grelhado", qtd: 130, unidade: "g", kcal: 125, carb: 0, prot: 26, gord: 2.2 },
          { id: "m1_16", nome: "Brócolis e Couve-Flor no Vapor", qtd: 150, unidade: "g", kcal: 42, carb: 8, prot: 3.5, gord: 0.4 },
          { id: "m1_17", nome: "Abóbora Cabotiá Cozida", qtd: 80, unidade: "g", kcal: 32, carb: 7.5, prot: 1.1, gord: 0.2 },
          { id: "m1_18", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml (1 col. chá)", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      },
      {
        titulo: "CEIA",
        obs: "Chá morno sem açúcar para relaxamento muscular e qualidade do sono.",
        alimentosList: [
          { id: "m1_19", nome: "Chá de Camomila ou Melissa", qtd: 200, unidade: "ml", kcal: 0, carb: 0, prot: 0, gord: 0 },
          { id: "m1_20", nome: "Sementes de Abóbora Torradas", qtd: 10, unidade: "g", kcal: 54, carb: 1.5, prot: 3, gord: 4.5 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "ORIENTAÇÕES CLÍNICAS DO DÉFICIT 1200 kcal",
        blocos: [
          { titulo: "Estratégia de Saciedade", conteudo: "Beba 500ml de água 20 minutos antes do almoço e jantar. Folhas verdes e vegetais de baixo amido podem ser consumidos à vontade." },
          { titulo: "Suplementação Indicada", conteudo: "• Multivitamínico e Mineral completo (1 cápsula no café da manhã).\n• Picolinato de Cromo: 200mcg após o almoço para controle de compulsão por doces." }
        ]
      }
    ]
  },

  {
    id: "1300_emagrecimento_fem",
    titulo: "🌸 1300 kcal - Emagrecimento Feminino Equilibrado",
    categoria: "Emagrecimento",
    caloriasAlvo: 1300,
    apresentacao: "Plano feminino de reeducação alimentar com densidade de micronutrientes, controle lipídico e distribuição harmoniosa de carboidratos complexos.",
    objetivo: "Redução de gordura corporal mantendo viço de pele, energia e regulação hormonal feminina.",
    metaAgua: 2.5,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        obs: "A crepioca é uma opção prática e nutritiva.",
        alimentosList: [
          { id: "m2_1", nome: "Ovo de Galinha Inteiro", qtd: 2, unidade: "unidades", kcal: 140, carb: 1, prot: 12, gord: 9.5 },
          { id: "m2_2", nome: "Goma de Tapioca", qtd: 20, unidade: "g (1 col. sopa cheia)", kcal: 48, carb: 12, prot: 0, gord: 0 },
          { id: "m2_3", nome: "Semente de Chia", qtd: 10, unidade: "g (1 col. sobremesa)", kcal: 48, carb: 4.2, prot: 1.6, gord: 3.1 },
          { id: "m2_4", nome: "Café com Leite Desnatado (Sem Açúcar)", qtd: 150, unidade: "ml", kcal: 35, carb: 4.8, prot: 3.2, gord: 0.2 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        obs: "Mix antioxidante de frutas vermelhas e castanhas.",
        alimentosList: [
          { id: "m2_5", nome: "Morangos / Mirtilos", qtd: 100, unidade: "g", kcal: 32, carb: 7.7, prot: 0.7, gord: 0.3 },
          { id: "m2_6", nome: "Nozes Quartos", qtd: 10, unidade: "g (2 unidades)", kcal: 65, carb: 1.4, prot: 1.5, gord: 6.5 }
        ]
      },
      {
        titulo: "ALMOÇO",
        obs: "Dê preferência a cortes magros bovinos ou aves grelhadas.",
        alimentosList: [
          { id: "m2_7", nome: "Patinho Bóvino Mído Grelhado", qtd: 110, unidade: "g", kcal: 185, carb: 0, prot: 33, gord: 5.5 },
          { id: "m2_8", nome: "Batata Doce Cozida", qtd: 80, unidade: "g", kcal: 69, carb: 16, prot: 1.1, gord: 0.1 },
          { id: "m2_9", nome: "Feijão Preto Cozido", qtd: 60, unidade: "g", kcal: 46, carb: 8.4, prot: 2.7, gord: 0.4 },
          { id: "m2_10", nome: "Salada de Alface, Rúcula e Pepino", qtd: 150, unidade: "g", kcal: 22, carb: 4.5, prot: 1.2, gord: 0.2 },
          { id: "m2_11", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE",
        obs: "Panqueca proteica rápida de frigideira.",
        alimentosList: [
          { id: "m2_12", nome: "Banana Prata Média", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 },
          { id: "m2_13", nome: "Farelo de Aveia", qtd: 20, unidade: "g", kcal: 70, carb: 11.3, prot: 3.4, gord: 1.5 },
          { id: "m2_14", nome: "Whey Protein Concentrado / Isolado", qtd: 15, unidade: "g (1/2 scoop)", kcal: 60, carb: 1.2, prot: 12, gord: 0.9 }
        ]
      },
      {
        titulo: "JANTAR",
        obs: "Refeição leve de fácil digestibilidade.",
        alimentosList: [
          { id: "m2_15", nome: "Peito de Frango Grelhado Tiras", qtd: 120, unidade: "g", kcal: 195, carb: 0, prot: 37, gord: 4.2 },
          { id: "m2_16", nome: "Abobrinha e Cenoura Raladas / Refogadas", qtd: 150, unidade: "g", kcal: 45, carb: 9.5, prot: 1.8, gord: 0.3 },
          { id: "m2_17", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "RECOMENDAÇÕES NUTRICIONAIS FEMININAS",
        blocos: [
          { titulo: "Tensão Pré-Menstrual (TPM)", conteudo: "Aumente a ingestão de água e chás diuréticos (cavalinha e hibisco) 5 dias antes da menstruação. Evite excesso de sódio." }
        ]
      }
    ]
  },

  {
    id: "1350_lowcarb",
    titulo: "🥑 1350 kcal - Low Carb Emagrecimento",
    categoria: "Low Carb",
    caloriasAlvo: 1350,
    apresentacao: "Estratégia com redução acentuada de carboidratos (aprox. 50g a 70g/dia), priorizando proteínas de alto valor biológico e gorduras de qualidade.",
    objetivo: "Sensibilidade à insulina, depleção leve de glicogênio e queima eficiente de gorduras.",
    metaAgua: 2.8,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        obs: "Ovos mexidos na manteiga de garrafa ou azeite.",
        alimentosList: [
          { id: "m3_1", nome: "Ovo de Galinha Inteiro", qtd: 3, unidade: "unidades", kcal: 210, carb: 1.5, prot: 18, gord: 14 },
          { id: "m3_2", nome: "Queijo Minas Frescal ou Cotage", qtd: 30, unidade: "g", kcal: 52, carb: 1, prot: 5.2, gord: 3 },
          { id: "m3_3", nome: "Abacate", qtd: 50, unidade: "g", kcal: 80, carb: 4.2, prot: 1, gord: 7.3 },
          { id: "m3_4", nome: "Café Preto sem Açúcar", qtd: 150, unidade: "ml", kcal: 2, carb: 0.3, prot: 0.2, gord: 0 }
        ]
      },
      {
        titulo: "ALMOÇO",
        obs: "Prato colorido com vegetais de baixo índice glicêmico.",
        alimentosList: [
          { id: "m3_5", nome: "Overcoxa de Frango sem Pele Assada", qtd: 140, unidade: "g", kcal: 230, carb: 0, prot: 32, gord: 11 },
          { id: "m3_6", nome: "Couve Manteiga Refogada no Alho", qtd: 100, unidade: "g", kcal: 50, carb: 6, prot: 3, gord: 1.8 },
          { id: "m3_7", nome: "Salada Verde Abundante (Alface, Rúcula, Agrião)", qtd: 150, unidade: "g", kcal: 22, carb: 4, prot: 1.5, gord: 0.2 },
          { id: "m3_8", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml (1 col. sopa)", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE",
        obs: "Shake proteico low carb.",
        alimentosList: [
          { id: "m3_9", nome: "Whey Protein Isolado (Low Carb)", qtd: 30, unidade: "g (1 scoop)", kcal: 115, carb: 1.5, prot: 25, gord: 0.8 },
          { id: "m3_10", nome: "Pasta de Amendoim Integral", qtd: 15, unidade: "g (1 col. sobremesa)", kcal: 90, carb: 3, prot: 4, gord: 7.5 }
        ]
      },
      {
        titulo: "JANTAR",
        obs: "Carne magra com purê de couve-flor.",
        alimentosList: [
          { id: "m3_11", nome: "Patinho Moído Ensopado", qtd: 140, unidade: "g", kcal: 235, carb: 0, prot: 41, gord: 7 },
          { id: "m3_12", nome: "Purê de Couve-Flor (com azeite)", qtd: 150, unidade: "g", kcal: 65, carb: 7.5, prot: 3, gord: 2.8 },
          { id: "m3_13", nome: "Tomate em Rodelas com Orégano", qtd: 80, unidade: "g", kcal: 15, carb: 3.1, prot: 0.7, gord: 0.2 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "DIRETRIZES DA DIETA LOW CARB",
        blocos: [
          { titulo: "Adaptabilidade Inicial", conteudo: "Nos primeiros 3 a 5 dias pode haver leve fadiga ou dor de cabeça (keto-flu). Aumente a ingestão de sal integral e água." }
        ]
      }
    ]
  },

  {
    id: "1400_reeducacao",
    titulo: "🥗 1400 kcal - Reeducação Alimentar & Perda de Peso",
    categoria: "Reeducação Alimentar",
    caloriasAlvo: 1400,
    apresentacao: "Plano versátil e sustentável para médio e longo prazo, equilibrando todos os grupos alimentares sem restrições severas.",
    objetivo: "Perda gradual de peso (0.5kg a 1kg/semana) criando hábitos alimentares duradouros.",
    metaAgua: 2.5,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m4_1", nome: "Pão Francês sem Miolo", qtd: 1, unidade: "unidade (40g)", kcal: 110, carb: 23, prot: 3.5, gord: 0.8 },
          { id: "m4_2", nome: "Ovo Mexido com Orégano", qtd: 2, unidade: "unidades", kcal: 140, carb: 1, prot: 12, gord: 9.5 },
          { id: "m4_3", nome: "Mamão Papaia", qtd: 100, unidade: "g", kcal: 45, carb: 11.5, prot: 0.5, gord: 0.1 },
          { id: "m4_4", nome: "Café com Leite Semidesnatado", qtd: 150, unidade: "ml", kcal: 50, carb: 6.5, prot: 4.2, gord: 1.2 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        alimentosList: [
          { id: "m4_5", nome: "Banana Prata Média", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 },
          { id: "m4_6", nome: "Aveia em Flocos", qtd: 15, unidade: "g (1 col. sopa)", kcal: 56, carb: 9.5, prot: 2.1, gord: 1.1 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m4_7", nome: "Peito de Frango Grelhado", qtd: 130, unidade: "g", kcal: 210, carb: 0, prot: 40, gord: 4.5 },
          { id: "m4_8", nome: "Arroz Branco / Integral Cozido", qtd: 80, unidade: "g (3 col. sopa)", kcal: 104, carb: 22.5, prot: 2, gord: 0.5 },
          { id: "m4_9", nome: "Feijão Carioca Cozido", qtd: 80, unidade: "g (1 concha média)", kcal: 61, carb: 10.8, prot: 3.8, gord: 0.5 },
          { id: "m4_10", nome: "Salada Colorida (Alface, Cenoura, Beterraba)", qtd: 150, unidade: "g", kcal: 35, carb: 7.5, prot: 1.2, gord: 0.3 },
          { id: "m4_11", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE",
        alimentosList: [
          { id: "m4_12", nome: "Iogurte Natural Integral", qtd: 150, unidade: "g", kcal: 95, carb: 7, prot: 5.5, gord: 5 },
          { id: "m4_13", nome: "Granola sem Açúcar", qtd: 15, unidade: "g", kcal: 62, carb: 10.5, prot: 1.8, gord: 1.6 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m4_14", nome: "Filé de Peixe Assado (Tilápia / Merluza)", qtd: 140, unidade: "g", kcal: 135, carb: 0, prot: 28, gord: 2.5 },
          { id: "m4_15", nome: "Batata Inglesa Cozida / Assada", qtd: 100, unidade: "g", kcal: 85, carb: 19, prot: 1.8, gord: 0.1 },
          { id: "m4_16", nome: "Legumes Cozidos no Vapor (Legumes Variados)", qtd: 120, unidade: "g", kcal: 40, carb: 8.5, prot: 1.5, gord: 0.3 },
          { id: "m4_17", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "MUDANÇA DE COMPORTAMENTO ALIMENTAR",
        blocos: [
          { titulo: "Mastigação Consciente", conteudo: "Mastigue cada garfada de 15 a 20 vezes. Faça suas refeições longe de telas de celular ou televisão." }
        ]
      }
    ]
  },

  {
    id: "1450_semlactose_semgluten",
    titulo: "🌿 1450 kcal - Emagrecimento Sem Lactose & Sem Glúten",
    categoria: "Dietas Específicas",
    caloriasAlvo: 1450,
    apresentacao: "Cardápio hipoalergênico isento de glúten e lactose, ideal para pacientes com sensibilidade intestinal, estufamento abdominal ou Síndrome do Intestino Irritável.",
    objetivo: "Desinflamação intestinal, redução de retenção hídrica e emagrecimento leve.",
    metaAgua: 2.6,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m5_1", nome: "Tapioca com Chia", qtd: 30, unidade: "g goma + 10g chia", kcal: 120, carb: 22, prot: 2, gord: 3 },
          { id: "m5_2", nome: "Ovo Mexido com Fio de Azeite", qtd: 2, unidade: "unidades", kcal: 140, carb: 1, prot: 12, gord: 9.5 },
          { id: "m5_3", nome: "Café Preto ou Chá de Hortelã", qtd: 150, unidade: "ml", kcal: 2, carb: 0.3, prot: 0.2, gord: 0 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        alimentosList: [
          { id: "m5_4", nome: "Kiwi Fresco", qtd: 2, unidade: "unidades (120g)", kcal: 62, carb: 15, prot: 1.2, gord: 0.6 },
          { id: "m5_5", nome: "Castanha de Caju Torrada Sem Sal", qtd: 10, unidade: "g", kcal: 58, carb: 3, prot: 1.8, gord: 4.5 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m5_6", nome: "Sobrecoxa de Frango Assada sem Pele", qtd: 130, unidade: "g", kcal: 215, carb: 0, prot: 30, gord: 10.5 },
          { id: "m5_7", nome: "Arroz de Jasmim ou Arroz Parboilizado", qtd: 80, unidade: "g", kcal: 105, carb: 23, prot: 2, gord: 0.4 },
          { id: "m5_8", nome: "Lentilha Cozida", qtd: 60, unidade: "g", kcal: 56, carb: 9.8, prot: 4.3, gord: 0.3 },
          { id: "m5_9", nome: "Salada de Rúcula, Tomate e Pepino", qtd: 150, unidade: "g", kcal: 24, carb: 4.8, prot: 1.3, gord: 0.2 },
          { id: "m5_10", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE",
        alimentosList: [
          { id: "m5_11", nome: "Bebida Vegetal de Amêndoas / Arroz", qtd: 200, unidade: "ml", kcal: 48, carb: 4, prot: 1.2, gord: 3.2 },
          { id: "m5_12", nome: "Proteína Vegetal em Pó (Ervilha/Arroz)", qtd: 20, unidade: "g", kcal: 78, carb: 2, prot: 16, gord: 1.1 },
          { id: "m5_13", nome: "Banana Prata", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m5_14", nome: "Salmão ou Atum Grelhado", qtd: 120, unidade: "g", kcal: 210, carb: 0, prot: 26, gord: 11.5 },
          { id: "m5_15", nome: "Mandioca / Aipim Cozido", qtd: 70, unidade: "g", kcal: 88, carb: 21, prot: 0.8, gord: 0.2 },
          { id: "m5_16", nome: "Espinafre Refogado no Alho", qtd: 100, unidade: "g", kcal: 35, carb: 4.5, prot: 3.2, gord: 0.8 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "CUIDADOS COM SENSIBILIDADES ALIMENTARES",
        blocos: [
          { titulo: "Leitura de Rótulos", conteudo: "Sempre verifique rótulos de alimentos industrializados quanto a 'Pode conter traços de glúten ou leite'." }
        ]
      }
    ]
  },

  {
    id: "1500_deficit_altaproteina",
    titulo: "💪 1500 kcal - Déficit Moderado com Alta Proteína",
    categoria: "Emagrecimento",
    caloriasAlvo: 1500,
    apresentacao: "Estratégia voltada para quem pratica musculação ou exercícios intensos e busca perder gordura sem perder volume muscular.",
    objetivo: "Preservação da massa magra, alta resposta térmica dos alimentos (TEF) e saciedade prolongada.",
    metaAgua: 3.0,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m6_1", nome: "Ovo de Galinha Inteiro", qtd: 2, unidade: "unidades", kcal: 140, carb: 1, prot: 12, gord: 9.5 },
          { id: "m6_2", nome: "Clara de Ovo", qtd: 2, unidade: "unidades (60g)", kcal: 32, carb: 0.4, prot: 7.2, gord: 0.1 },
          { id: "m6_3", nome: "Pão Integral de Forma", qtd: 2, unidade: "fatias (50g)", kcal: 120, carb: 22, prot: 5, gord: 1.6 },
          { id: "m6_4", nome: "Queijo Cotage / Requeijão Light", qtd: 30, unidade: "g (1 col. sopa)", kcal: 35, carb: 1.2, prot: 4.5, gord: 1.1 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m6_5", nome: "Peito de Frango Grelhado", qtd: 150, unidade: "g", kcal: 245, carb: 0, prot: 46, gord: 5.2 },
          { id: "m6_6", nome: "Arroz Integral Cozido", qtd: 90, unidade: "g", kcal: 112, carb: 23, prot: 2.3, gord: 0.8 },
          { id: "m6_7", nome: "Feijão Carioca Cozido", qtd: 60, unidade: "g", kcal: 46, carb: 8.2, prot: 2.8, gord: 0.4 },
          { id: "m6_8", nome: "Salada Verde Abundante com Limão", qtd: 150, unidade: "g", kcal: 22, carb: 4.5, prot: 1.2, gord: 0.2 },
          { id: "m6_9", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE (PÓS-TREINO)",
        alimentosList: [
          { id: "m6_10", nome: "Whey Protein Concentrado 80%", qtd: 30, unidade: "g (1 scoop)", kcal: 120, carb: 3, prot: 24, gord: 1.8 },
          { id: "m6_11", nome: "Banana Prata Média", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 },
          { id: "m6_12", nome: "Farelo de Aveia", qtd: 15, unidade: "g", kcal: 52, carb: 8.5, prot: 2.5, gord: 1.1 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m6_13", nome: "Patinho Bóvino Grelhado", qtd: 140, unidade: "g", kcal: 235, carb: 0, prot: 41, gord: 7 },
          { id: "m6_14", nome: "Batata Doce Cozida", qtd: 90, unidade: "g", kcal: 77, carb: 18, prot: 1.2, gord: 0.1 },
          { id: "m6_15", nome: "Brócolis no Vapor", qtd: 120, unidade: "g", kcal: 35, carb: 6.5, prot: 3, gord: 0.3 },
          { id: "m6_16", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "SUPLEMENTAÇÃO E PERFORME MUSCULAR",
        blocos: [
          { titulo: "Creatina Monohidratada", conteudo: "3g a 5g por dia sem interrupção (mesmo em dias sem treino) para força e recuperação muscular." }
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // FAIXA 2: MANUTENÇÃO & ESTRATÉGIAS ESPECÍFICAS (1550 kcal - 1800 kcal)
  // -------------------------------------------------------------
  {
    id: "1550_vegetariano",
    titulo: "🌱 1550 kcal - Vegetariano (Plant-Based Equilibrado)",
    categoria: "Vegetariano / Vegano",
    caloriasAlvo: 1550,
    apresentacao: "Plano ovo-lacto-vegetariano rico em leguminosas, grãos integrais, sementes e vegetais densos para aporte de ferro e proteínas vegetais.",
    objetivo: "Alimentação limpa sustentável, controle de colesterol e manutenção de massa magra.",
    metaAgua: 2.7,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m7_1", nome: "Ovo de Galinha Mexido", qtd: 2, unidade: "unidades", kcal: 140, carb: 1, prot: 12, gord: 9.5 },
          { id: "m7_2", nome: "Pão de Forma Integral 100% Grãos", qtd: 2, unidade: "fatias (50g)", kcal: 130, carb: 21, prot: 6, gord: 2 },
          { id: "m7_3", nome: "Abacate Amassado", qtd: 40, unidade: "g", kcal: 64, carb: 3.4, prot: 0.8, gord: 5.8 },
          { id: "m7_4", nome: "Café Preto sem Açúcar", qtd: 150, unidade: "ml", kcal: 2, carb: 0.3, prot: 0.2, gord: 0 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        alimentosList: [
          { id: "m7_5", nome: "Iogurte Natural Parcialmente Desnatado", qtd: 170, unidade: "g", kcal: 90, carb: 9, prot: 6.8, gord: 3 },
          { id: "m7_6", nome: "Semente de Abóbora Torrada", qtd: 15, unidade: "g", kcal: 82, carb: 2.2, prot: 4.5, gord: 6.8 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m7_7", nome: "Tofu Grelhado Temperado", qtd: 120, unidade: "g", kcal: 102, carb: 2.3, prot: 12.5, gord: 5.2 },
          { id: "m7_8", nome: "Quinoa Cozida", qtd: 100, unidade: "g", kcal: 120, carb: 21, prot: 4.4, gord: 1.9 },
          { id: "m7_9", nome: "Grão-de-Bico Cozido", qtd: 80, unidade: "g", kcal: 130, carb: 21, prot: 7, gord: 2.1 },
          { id: "m7_10", nome: "Salada de Couve, Beterraba e Laranja", qtd: 150, unidade: "g", kcal: 45, carb: 9.5, prot: 1.8, gord: 0.3 },
          { id: "m7_11", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE",
        alimentosList: [
          { id: "m7_12", nome: "Proteína de Ervilha / Arroz em Pó", qtd: 30, unidade: "g (1 scoop)", kcal: 118, carb: 3, prot: 24, gord: 1.5 },
          { id: "m7_13", nome: "Maçã Fuji", qtd: 1, unidade: "unidade (120g)", kcal: 62, carb: 16, prot: 0.3, gord: 0.2 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m7_14", nome: "Hambúrguer de Lentilha / Grão de Bico Assado", qtd: 120, unidade: "g", kcal: 180, carb: 24, prot: 9.5, gord: 5 },
          { id: "m7_15", nome: "Legumes Grelhados (Beringela, Abobrinha, Pimentão)", qtd: 180, unidade: "g", kcal: 60, carb: 12, prot: 2.5, gord: 0.8 },
          { id: "m7_16", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "ORIENTAÇÕES DA DIETA VEGETARIANA",
        blocos: [
          { titulo: "Vitamina B12 & Ferro", conteudo: "Consuma alimentos ricos em vitamina C (limão/laranja) junto às refeições para maximizar a absorção de ferro vegetal. Suplementação de B12 recomendada." }
        ]
      }
    ]
  },

  {
    id: "1600_reeducacao_manutencao",
    titulo: "⚖️ 1600 kcal - Reeducação Alimentar & Manutenção Leve",
    categoria: "Manutenção",
    caloriasAlvo: 1600,
    apresentacao: "Plano normocalórico/leve déficit focado no equilíbrio nutricional diário, flexibilidade e variedade de macronutrientes.",
    objetivo: "Manutenção de peso saudável com excelente disposição física e mental.",
    metaAgua: 2.8,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m8_1", nome: "Pão Francês com Gergelim", qtd: 1, unidade: "unidade (50g)", kcal: 135, carb: 28, prot: 4, gord: 1 },
          { id: "m8_2", nome: "Ovo de Galinha Inteiro Mexido", qtd: 2, unidade: "unidades", kcal: 140, carb: 1, prot: 12, gord: 9.5 },
          { id: "m8_3", nome: "Queijo Mussarela", qtd: 15, unidade: "g (1 fatia fina)", kcal: 42, carb: 0.5, prot: 3.3, gord: 3.1 },
          { id: "m8_4", nome: "Café com Leite Semidesnatado", qtd: 150, unidade: "ml", kcal: 50, carb: 6.5, prot: 4.2, gord: 1.2 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        alimentosList: [
          { id: "m8_5", nome: "Mamão Papaia", qtd: 150, unidade: "g", kcal: 65, carb: 16.5, prot: 0.8, gord: 0.2 },
          { id: "m8_6", nome: "Chia / Linhaça Dourada", qtd: 15, unidade: "g", kcal: 72, carb: 6.3, prot: 2.5, gord: 4.7 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m8_7", nome: "Patinho Moído Grelhado", qtd: 130, unidade: "g", kcal: 218, carb: 0, prot: 38, gord: 6.5 },
          { id: "m8_8", nome: "Arroz Branco Cozido", qtd: 100, unidade: "g (4 col. sopa)", kcal: 130, carb: 28, prot: 2.5, gord: 0.4 },
          { id: "m8_9", nome: "Feijão Carioca Cozido", qtd: 80, unidade: "g", kcal: 61, carb: 10.8, prot: 3.8, gord: 0.5 },
          { id: "m8_10", nome: "Salada Verde Variada", qtd: 150, unidade: "g", kcal: 25, carb: 5, prot: 1.5, gord: 0.2 },
          { id: "m8_11", nome: "Azeite de Oliva Extra Virgem", qtd: 8, unidade: "ml", kcal: 70, carb: 0, prot: 0, gord: 8 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE",
        alimentosList: [
          { id: "m8_12", nome: "Iogurte Proteico / Natural", qtd: 160, unidade: "g", kcal: 90, carb: 8, prot: 10, gord: 1.5 },
          { id: "m8_13", nome: "Banana Prata", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m8_14", nome: "Peito de Frango Grelhado", qtd: 140, unidade: "g", kcal: 228, carb: 0, prot: 43, gord: 4.8 },
          { id: "m8_15", nome: "Purê de Batata Doce / Mandioquinha", qtd: 120, unidade: "g", kcal: 102, carb: 24, prot: 1.5, gord: 0.2 },
          { id: "m8_16", nome: "Legumes Cozidos (Cenoura, Vagem, Chuchu)", qtd: 120, unidade: "g", kcal: 42, carb: 9, prot: 1.6, gord: 0.3 },
          { id: "m8_17", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "SUSTENTABILIDADE ALIMENTAR",
        blocos: [
          { titulo: "Regra dos 80/20", conteudo: "Mantenha 80% do tempo foco em alimentos in natura e 20% de flexibilidade para eventos sociais sem culpa." }
        ]
      }
    ]
  },

  {
    id: "1650_antiinflamatorio",
    titulo: "🫐 1650 kcal - Dieta Anti-inflamatória & Saúde Intestinal",
    categoria: "Saúde & Longevidade",
    caloriasAlvo: 1650,
    apresentacao: "Focada em polifenóis, ômega-3, fitoquímicos e fibras prebióticas para redução de marcadores inflamatórios e modulação da microbiota intestinal.",
    objetivo: "Desinflamação sistêmica, melhora digestiva, disposição e rejuvenescimento celular.",
    metaAgua: 3.0,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m9_1", nome: "Ovo de Galinha Caipira Cozido", qtd: 2, unidade: "unidades", kcal: 140, carb: 1, prot: 12, gord: 9.5 },
          { id: "m9_2", nome: "Abacate com Cúrcuma e Pitada de Pimenta", qtd: 60, unidade: "g", kcal: 96, carb: 5, prot: 1.2, gord: 8.8 },
          { id: "m9_3", nome: "Pão de Fermentação Natural (Levain)", qtd: 1, unidade: "fatia (40g)", kcal: 98, carb: 20, prot: 3.2, gord: 0.6 },
          { id: "m9_4", nome: "Chá Verde ou Chá de Gengibre", qtd: 200, unidade: "ml", kcal: 2, carb: 0.4, prot: 0.1, gord: 0 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        alimentosList: [
          { id: "m9_5", nome: "Mirtilos / Amoras / Morangos", qtd: 120, unidade: "g", kcal: 45, carb: 10.8, prot: 0.9, gord: 0.4 },
          { id: "m9_6", nome: "Nozes Quartos (Rica em Ômega-3)", qtd: 15, unidade: "g", kcal: 98, carb: 2.1, prot: 2.3, gord: 9.8 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m9_7", nome: "Filé de Salmão / Sardinha Grelhada", qtd: 130, unidade: "g", kcal: 235, carb: 0, prot: 28, gord: 13 },
          { id: "m9_8", nome: "Arroz Negro / Arroz Cateto Integral", qtd: 80, unidade: "g", kcal: 104, carb: 22, prot: 2.2, gord: 0.7 },
          { id: "m9_9", nome: "Brócolis e Couve de Bruxelas ao Alho", qtd: 140, unidade: "g", kcal: 48, carb: 9, prot: 4, gord: 0.5 },
          { id: "m9_10", nome: "Salada de Rúcula, Tomate Cereja e Semente de Girassol", qtd: 150, unidade: "g", kcal: 55, carb: 5, prot: 2.2, gord: 3 },
          { id: "m9_11", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE",
        alimentosList: [
          { id: "m9_12", nome: "Kefir / Iogurte Natural com Probióticos", qtd: 170, unidade: "g", kcal: 95, carb: 8, prot: 6.5, gord: 3.5 },
          { id: "m9_13", nome: "Semente de Linhaça Dourada Moída", qtd: 15, unidade: "g", kcal: 74, carb: 4.3, prot: 2.7, gord: 5.4 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m9_14", nome: "Peito de Frango Orgânico / Caipira", qtd: 140, unidade: "g", kcal: 228, carb: 0, prot: 43, gord: 4.8 },
          { id: "m9_15", nome: "Abóbora Cabotiá Assada com Alecrim", qtd: 120, unidade: "g", kcal: 48, carb: 11, prot: 1.6, gord: 0.3 },
          { id: "m9_16", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "CONDIMENTOS ANTI-INFLAMATÓRIOS",
        blocos: [
          { titulo: "Especiarias Diárias", conteudo: "Utilize livremente cúrcuma com pimenta preta, gengibre fresco, alho, cebola, alecrim e orégano no preparo das refeições." }
        ]
      }
    ]
  },

  {
    id: "1700_cetogenica",
    titulo: "🥩 1700 kcal - Dieta Cetogênica (Ketogenic Low Carb)",
    categoria: "Cetogênica",
    caloriasAlvo: 1700,
    apresentacao: "Estratégia muito baixa em carboidratos (abaixo de 30g líquidos/dia), induzindo o estado de cetose nutricional para oxidação lipídica otimizada.",
    objetivo: "Cetose profunda, controle absoluto da glicemia, saciedade extrema e alta clareza mental.",
    metaAgua: 3.2,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ CETOGÊNICO",
        alimentosList: [
          { id: "m10_1", nome: "Ovo de Galinha Inteiro", qtd: 3, unidade: "unidades", kcal: 210, carb: 1.5, prot: 18, gord: 14 },
          { id: "m10_2", nome: "Bacon de Lombo em Fatias Assado", qtd: 25, unidade: "g", kcal: 110, carb: 0.3, prot: 8, gord: 8.5 },
          { id: "m10_3", nome: "Abacate", qtd: 80, unidade: "g", kcal: 128, carb: 6.8, prot: 1.6, gord: 11.6 },
          { id: "m10_4", nome: "Bulletproof Coffee (Café + 10g Óleo de Coco/MCT)", qtd: 1, unidade: "xícara", kcal: 90, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "ALMOÇO CETOGÊNICO",
        alimentosList: [
          { id: "m10_5", nome: "Bife de Picanha / Fraldinha Grelhada", qtd: 150, unidade: "g", kcal: 340, carb: 0, prot: 38, gord: 20 },
          { id: "m10_6", nome: "Couve-Flor Gratinada com Queijo", qtd: 120, unidade: "g", kcal: 110, carb: 4.5, prot: 6, gord: 7.5 },
          { id: "m10_7", nome: "Salada de Folhas Verdes Escuras", qtd: 150, unidade: "g", kcal: 22, carb: 3.5, prot: 1.5, gord: 0.2 },
          { id: "m10_8", nome: "Azeite de Oliva Extra Virgem", qtd: 15, unidade: "ml (1.5 col. sopa)", kcal: 132, carb: 0, prot: 0, gord: 15 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE CETOGÊNICO",
        alimentosList: [
          { id: "m10_9", nome: "Castanha de Caju / Nozes / Macadâmias", qtd: 30, unidade: "g", kcal: 195, carb: 5, prot: 4.5, gord: 18 },
          { id: "m10_10", nome: "Queijo Gorgonzola ou Parmessão", qtd: 25, unidade: "g", kcal: 98, carb: 0.5, prot: 6.5, gord: 7.8 }
        ]
      },
      {
        titulo: "JANTAR CETOGÊNICO",
        alimentosList: [
          { id: "m10_11", nome: "Sobrecoxa de Frango Assada com Pele", qtd: 160, unidade: "g", kcal: 310, carb: 0, prot: 35, gord: 18.5 },
          { id: "m10_12", nome: "Brócolis Refogado no Manteiga Ghee", qtd: 120, unidade: "g", kcal: 75, carb: 5.5, prot: 3, gord: 5 },
          { id: "m10_13", nome: "Azeite de Oliva Extra Virgem", qtd: 8, unidade: "ml", kcal: 70, carb: 0, prot: 0, gord: 8 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "MANUTENÇÃO DE ELETROLIUTOS NA CETOSE",
        blocos: [
          { titulo: "Reposição de Sódio e Magnésio", conteudo: "Devido ao efeito diurético inicial da cetose, consuma 1 colher de chá rasa de sal marinho dividida ao longo do dia e beba muita água." }
        ]
      }
    ]
  },

  {
    id: "1750_controleglicemico",
    titulo: "🩸 1750 kcal - Controle Glicêmico (Pré-diabetes)",
    categoria: "Saúde & Longevidade",
    caloriasAlvo: 1750,
    apresentacao: "Plano focado em alimentos de baixo e médio índice e carga glicêmica, combinando carboidratos complexos sempre acompanhados de fibras e proteínas.",
    objetivo: "Redução de picos insulinêmicos, controle da hemoglobina glicada (HbA1c) e prevenção da diabetes tipo 2.",
    metaAgua: 2.8,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m11_1", nome: "Pão de Centeio / 100% Integral", qtd: 2, unidade: "fatias (50g)", kcal: 120, carb: 20, prot: 4.8, gord: 1.2 },
          { id: "m11_2", nome: "Ovo de Galinha Inteiro Mexido", qtd: 2, unidade: "unidades", kcal: 140, carb: 1, prot: 12, gord: 9.5 },
          { id: "m11_3", nome: "Abacate Amassado", qtd: 40, unidade: "g", kcal: 64, carb: 3.4, prot: 0.8, gord: 5.8 },
          { id: "m11_4", nome: "Café com Canela em Pó (Sem Açúcar)", qtd: 150, unidade: "ml", kcal: 5, carb: 1, prot: 0.2, gord: 0 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        alimentosList: [
          { id: "m11_5", nome: "Maracujá ou Goiaba Vermelha", qtd: 1, unidade: "unidade (100g)", kcal: 54, carb: 12, prot: 1.1, gord: 0.4 },
          { id: "m11_6", nome: "Farelo de Aveia / Psyllium", qtd: 15, unidade: "g", kcal: 45, carb: 6, prot: 2, gord: 1 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m11_7", nome: "Peito de Frango Grelhado", qtd: 140, unidade: "g", kcal: 228, carb: 0, prot: 43, gord: 4.8 },
          { id: "m11_8", nome: "Arroz Integral Cozido", qtd: 90, unidade: "g", kcal: 112, carb: 23, prot: 2.3, gord: 0.8 },
          { id: "m11_9", nome: "Feijão Preto Cozido", qtd: 80, unidade: "g", kcal: 61, carb: 11, prot: 3.6, gord: 0.5 },
          { id: "m11_10", nome: "Salada de Folhas, Quiabo e Vagem", qtd: 150, unidade: "g", kcal: 40, carb: 8, prot: 2, gord: 0.3 },
          { id: "m11_11", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE",
        alimentosList: [
          { id: "m11_12", nome: "Iogurte Natural Desnatado", qtd: 170, unidade: "g", kcal: 70, carb: 9.5, prot: 7.2, gord: 0.3 },
          { id: "m11_13", nome: "Whey Protein / Proteína em Pó", qtd: 15, unidade: "g", kcal: 60, carb: 1, prot: 12, gord: 0.8 },
          { id: "m11_14", nome: "Castanha-do-Pará", qtd: 2, unidade: "unidades (8g)", kcal: 52, carb: 1, prot: 1.1, gord: 5.3 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m11_15", nome: "Filé de Tilápia / Peixe Grelhado", qtd: 150, unidade: "g", kcal: 145, carb: 0, prot: 30, gord: 2.6 },
          { id: "m11_16", nome: "Batata Yacon ou Quinoa Cozida", qtd: 80, unidade: "g", kcal: 72, carb: 16, prot: 1.5, gord: 0.3 },
          { id: "m11_17", nome: "Brócolis e Couve-Flor Refogados", qtd: 150, unidade: "g", kcal: 45, carb: 8.5, prot: 3.5, gord: 0.5 },
          { id: "m11_18", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "ESTRATÉGIAS DE CONTROLE GLICÊMICO",
        blocos: [
          { titulo: "Ordem dos Alimentos", conteudo: "Comece a refeição sempre pela salada e vegetais, depois consuma a proteína e deixe o carboidrato por último para achatar a curva glicêmica." }
        ]
      }
    ]
  },

  {
    id: "1800_manutencao_masculino",
    titulo: "🏃 1800 kcal - Manutenção Ativa & Deficit Masculino",
    categoria: "Manutenção",
    caloriasAlvo: 1800,
    apresentacao: "Plano bem distribuído para homens em déficit moderado ou mulheres muito ativas que praticam exercícios diários e necessitam de sustento energético.",
    objetivo: "Perda de gordura com manutenção de performance nos treinos de força e aeróbicos.",
    metaAgua: 3.2,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m12_1", nome: "Pão Francês sem Miolo", qtd: 1.5, unidade: "unidades (60g)", kcal: 165, carb: 34, prot: 5.2, gord: 1.2 },
          { id: "m12_2", nome: "Ovo de Galinha Inteiro", qtd: 3, unidade: "unidades", kcal: 210, carb: 1.5, prot: 18, gord: 14 },
          { id: "m12_3", nome: "Mamão Papaia", qtd: 100, unidade: "g", kcal: 45, carb: 11.5, prot: 0.5, gord: 0.1 },
          { id: "m12_4", nome: "Café Preto sem Açúcar", qtd: 150, unidade: "ml", kcal: 2, carb: 0.3, prot: 0.2, gord: 0 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m12_5", nome: "Patinho Moído / Carne Bovina Magra", qtd: 150, unidade: "g", kcal: 250, carb: 0, prot: 44, gord: 7.5 },
          { id: "m12_6", nome: "Arroz Parboilizado / Integral", qtd: 120, unidade: "g (5 col. sopa)", kcal: 156, carb: 34, prot: 3.2, gord: 0.6 },
          { id: "m12_7", nome: "Feijão Carioca Cozido", qtd: 90, unidade: "g", kcal: 68, carb: 12, prot: 4.2, gord: 0.5 },
          { id: "m12_8", nome: "Salada Verde & Tomate", qtd: 150, unidade: "g", kcal: 25, carb: 5, prot: 1.5, gord: 0.2 },
          { id: "m12_9", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE (PRÉ/PÓS TREINO)",
        alimentosList: [
          { id: "m12_10", nome: "Whey Protein Concentrado 80%", qtd: 30, unidade: "g (1 scoop)", kcal: 120, carb: 3, prot: 24, gord: 1.8 },
          { id: "m12_11", nome: "Banana Prata Média", qtd: 1.5, unidade: "unidades (120g)", kcal: 117, carb: 30, prot: 1.5, gord: 0.3 },
          { id: "m12_12", nome: "Pasta de Amendoim Integral", qtd: 15, unidade: "g", kcal: 90, carb: 3, prot: 4, gord: 7.5 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m12_13", nome: "Peito de Frango Grelhado", qtd: 150, unidade: "g", kcal: 245, carb: 0, prot: 46, gord: 5.2 },
          { id: "m12_14", nome: "Batata Doce Cozida / Assada", qtd: 120, unidade: "g", kcal: 103, carb: 24, prot: 1.6, gord: 0.2 },
          { id: "m12_15", nome: "Vegetais Variados no Vapor", qtd: 150, unidade: "g", kcal: 45, carb: 9, prot: 2.2, gord: 0.4 },
          { id: "m12_16", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "RECUPERAÇÃO E DISPOSIÇÃO FÍSICA",
        blocos: [
          { titulo: "Sono Reparador", conteudo: "Garanta de 7 a 8 horas de sono noturno continuo para otimização da síntese proteica e produção de GH e testosterona." }
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // FAIXA 3: HIPERTROFIA, GANHO DE MASSA & ATLETAS (1850 kcal - 2500 kcal)
  // -------------------------------------------------------------
  {
    id: "1850_ganhoseco_fem",
    titulo: "🌺 1850 kcal - Ganho Seco Feminino (Clean Bulk)",
    categoria: "Hipertrofia",
    caloriasAlvo: 1850,
    apresentacao: "Superávit calórico controlado projetado para mulheres que desejam hipertrofiar glúteos e pernas com mínimo acúmulo de gordura abdominal.",
    objetivo: "Ganho de massa muscular limpa (hipertrofia estética) sem retenção severa.",
    metaAgua: 3.0,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m13_1", nome: "Ovo de Galinha Mexido", qtd: 2, unidade: "unidades", kcal: 140, carb: 1, prot: 12, gord: 9.5 },
          { id: "m13_2", nome: "Tapioca com Queijo Coalho Grelhado", qtd: 40, unidade: "g goma + 25g queijo", kcal: 180, carb: 24, prot: 7.5, gord: 6.5 },
          { id: "m13_3", nome: "Mamão Papaia", qtd: 120, unidade: "g", kcal: 54, carb: 13.8, prot: 0.6, gord: 0.1 },
          { id: "m13_4", nome: "Café com Leite Semidesnatado", qtd: 150, unidade: "ml", kcal: 50, carb: 6.5, prot: 4.2, gord: 1.2 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        alimentosList: [
          { id: "m13_5", nome: "Iogurte Proteico / Grego Light", qtd: 150, unidade: "g", kcal: 110, carb: 8, prot: 14, gord: 2.5 },
          { id: "m13_6", nome: "Uvas Passas / Frutas Secas", qtd: 20, unidade: "g", kcal: 60, carb: 15, prot: 0.6, gord: 0.1 },
          { id: "m13_7", nome: "Castanha de Caju", qtd: 15, unidade: "g", kcal: 87, carb: 4.5, prot: 2.7, gord: 6.8 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m13_8", nome: "Peito de Frango / File Mignon Suíno", qtd: 140, unidade: "g", kcal: 228, carb: 0, prot: 42, gord: 5 },
          { id: "m13_9", nome: "Arroz Integral Cozido", qtd: 110, unidade: "g", kcal: 137, carb: 28.5, prot: 2.8, gord: 1 },
          { id: "m13_10", nome: "Feijão Carioca Cozido", qtd: 80, unidade: "g", kcal: 61, carb: 10.8, prot: 3.8, gord: 0.5 },
          { id: "m13_11", nome: "Salada Verde & Cenoura Ralada", qtd: 150, unidade: "g", kcal: 35, carb: 7.5, prot: 1.2, gord: 0.3 },
          { id: "m13_12", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE (PÓS-TREINO)",
        alimentosList: [
          { id: "m13_13", nome: "Whey Protein Concentrado 80%", qtd: 30, unidade: "g (1 scoop)", kcal: 120, carb: 3, prot: 24, gord: 1.8 },
          { id: "m13_14", nome: "Banana Prata Média", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 },
          { id: "m13_15", nome: "Farelo de Aveia", qtd: 30, unidade: "g (2 col. sopa)", kcal: 104, carb: 17, prot: 5, gord: 2.2 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m13_16", nome: "Patinho Moído / Peito de Frango", qtd: 130, unidade: "g", kcal: 218, carb: 0, prot: 38, gord: 6.5 },
          { id: "m13_17", nome: "Batata Doce Cozida", qtd: 110, unidade: "g", kcal: 95, carb: 22, prot: 1.5, gord: 0.2 },
          { id: "m13_18", nome: "Abobrinha e Legumes Grelhados", qtd: 120, unidade: "g", kcal: 35, carb: 7.5, prot: 1.5, gord: 0.3 },
          { id: "m13_19", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "HIPERTROFIA FEMININA E SOBRECARGA PROGRESSIVA",
        blocos: [
          { titulo: "Treino de Força", conteudo: "Mantenha o foco em treino com pesos com sobrecarga progressiva de carga/repetições semanalmente." }
        ]
      }
    ]
  },

  {
    id: "1900_hipertrofia_mod",
    titulo: "🏋️ 1900 kcal - Hipertrofia Moderada",
    categoria: "Hipertrofia",
    caloriasAlvo: 1900,
    apresentacao: "Plano hipertrófico com ingestão equilibrada de proteina (2.0g/kg) e carboidratos complexos de rápida e lenta absorção nos momentos estratégicos do dia.",
    objetivo: "Síntese proteica otimizada e ganho contínuo de massa magra.",
    metaAgua: 3.2,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m14_1", nome: "Ovo de Galinha Inteiro", qtd: 3, unidade: "unidades", kcal: 210, carb: 1.5, prot: 18, gord: 14 },
          { id: "m14_2", nome: "Pão Integral de Forma", qtd: 2, unidade: "fatias (50g)", kcal: 120, carb: 22, prot: 5, gord: 1.6 },
          { id: "m14_3", nome: "Banana Prata", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 },
          { id: "m14_4", nome: "Café Preto sem Açúcar", qtd: 150, unidade: "ml", kcal: 2, carb: 0.3, prot: 0.2, gord: 0 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        alimentosList: [
          { id: "m14_5", nome: "Iogurte Natural Integral", qtd: 170, unidade: "g", kcal: 108, carb: 8, prot: 6, gord: 6 },
          { id: "m14_6", nome: "Granola sem Açúcar", qtd: 25, unidade: "g", kcal: 103, carb: 17, prot: 3, gord: 2.7 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m14_7", nome: "Peito de Frango Grelhado", qtd: 160, unidade: "g", kcal: 260, carb: 0, prot: 49, gord: 5.5 },
          { id: "m14_8", nome: "Arroz Branco / Parboilizado Cozido", qtd: 130, unidade: "g", kcal: 169, carb: 37, prot: 3.3, gord: 0.6 },
          { id: "m14_9", nome: "Feijão Carioca Cozido", qtd: 90, unidade: "g", kcal: 68, carb: 12, prot: 4.2, gord: 0.5 },
          { id: "m14_10", nome: "Salada Verde Abundante", qtd: 150, unidade: "g", kcal: 25, carb: 5, prot: 1.5, gord: 0.2 },
          { id: "m14_11", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE (PÓS TREINO)",
        alimentosList: [
          { id: "m14_12", nome: "Whey Protein 80%", qtd: 30, unidade: "g (1 scoop)", kcal: 120, carb: 3, prot: 24, gord: 1.8 },
          { id: "m14_13", nome: "Farelo de Aveia", qtd: 30, unidade: "g", kcal: 104, carb: 17, prot: 5, gord: 2.2 },
          { id: "m14_14", nome: "Pasta de Amendoim Integral", qtd: 15, unidade: "g", kcal: 90, carb: 3, prot: 4, gord: 7.5 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m14_15", nome: "Patinho Bóvino Grelhado", qtd: 150, unidade: "g", kcal: 250, carb: 0, prot: 44, gord: 7.5 },
          { id: "m14_16", nome: "Batata Doce Cozida", qtd: 130, unidade: "g", kcal: 112, carb: 26, prot: 1.8, gord: 0.2 },
          { id: "m14_17", nome: "Legumes no Vapor (Brócolis, Cenoura)", qtd: 130, unidade: "g", kcal: 45, carb: 9, prot: 2.2, gord: 0.4 },
          { id: "m14_18", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "PERIODIZAÇÃO DA HIPERTROFIA",
        blocos: [
          { titulo: "Proteína Fracionada", conteudo: "Distribua o aporte proteico em 4 a 5 refeições diárias contendo pelo menos 25g a 35g de proteína em cada." }
        ]
      }
    ]
  },

  {
    id: "1950_highprotein",
    titulo: "🥩 1950 kcal - High Protein & Ganho de Massa",
    categoria: "Hipertrofia",
    caloriasAlvo: 1950,
    apresentacao: "Plano hiperproteico (aprox. 2.2g a 2.5g de proteína por kg de peso corporal) voltado para recomposição corporal avançada.",
    objetivo: "Máxima retenção nitrogenada, hipertrofia muscular rápida e densidade.",
    metaAgua: 3.5,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m15_1", nome: "Ovo de Galinha Inteiro", qtd: 3, unidade: "unidades", kcal: 210, carb: 1.5, prot: 18, gord: 14 },
          { id: "m15_2", nome: "Clara de Ovo", qtd: 3, unidade: "unidades (90g)", kcal: 48, carb: 0.6, prot: 10.8, gord: 0.2 },
          { id: "m15_3", nome: "Pão Integral de Forma", qtd: 2, unidade: "fatias (50g)", kcal: 120, carb: 22, prot: 5, gord: 1.6 },
          { id: "m15_4", nome: "Queijo Cotage", qtd: 40, unidade: "g", kcal: 46, carb: 1.6, prot: 6, gord: 1.4 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m15_5", nome: "Peito de Frango Grelhado", qtd: 180, unidade: "g", kcal: 295, carb: 0, prot: 55, gord: 6.3 },
          { id: "m15_6", nome: "Arroz Integral Cozido", qtd: 120, unidade: "g", kcal: 150, carb: 31, prot: 3.1, gord: 1.1 },
          { id: "m15_7", nome: "Feijão Carioca Cozido", qtd: 80, unidade: "g", kcal: 61, carb: 10.8, prot: 3.8, gord: 0.5 },
          { id: "m15_8", nome: "Salada Verde Variada", qtd: 150, unidade: "g", kcal: 25, carb: 5, prot: 1.5, gord: 0.2 },
          { id: "m15_9", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE (SHAKE ANABÓLICO)",
        alimentosList: [
          { id: "m15_10", nome: "Whey Protein Concentrado / Isolado", qtd: 40, unidade: "g (1.3 scoop)", kcal: 160, carb: 4, prot: 32, gord: 2.2 },
          { id: "m15_11", nome: "Banana Prata Média", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 },
          { id: "m15_12", nome: "Pasta de Amendoim Integral", qtd: 15, unidade: "g", kcal: 90, carb: 3, prot: 4, gord: 7.5 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m15_13", nome: "Patinho Moído Grelhado", qtd: 170, unidade: "g", kcal: 285, carb: 0, prot: 50, gord: 8.5 },
          { id: "m15_14", nome: "Mandioca / Aipim Cozido", qtd: 100, unidade: "g", kcal: 125, carb: 30, prot: 1.2, gord: 0.3 },
          { id: "m15_15", nome: "Brócolis e Legumes no Vapor", qtd: 130, unidade: "g", kcal: 45, carb: 9, prot: 2.2, gord: 0.4 },
          { id: "m15_16", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "HIDRATAÇÃO NA DIETA HIGH PROTEIN",
        blocos: [
          { titulo: "Sobrecarga Renal & Filtragem", conteudo: "Com alto aporte proteico, mantenha obrigatoriamente a meta de 3.5L de água por dia para saúde renal e eliminação de ureia." }
        ]
      }
    ]
  },

  {
    id: "2000_hipertrofia_padrao",
    titulo: "🏆 2000 kcal - Hipertrofia Padrão (Clean Bulk Masculino)",
    categoria: "Hipertrofia",
    caloriasAlvo: 2000,
    apresentacao: "Modelo de superávit normocalórico/hipertrófico robusto para homens praticantes de musculação de média e alta intensidade.",
    objetivo: "Construção de volume muscular com qualidade, força e rápido tempo de recuperação.",
    metaAgua: 3.5,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m16_1", nome: "Ovo de Galinha Inteiro", qtd: 3, unidade: "unidades", kcal: 210, carb: 1.5, prot: 18, gord: 14 },
          { id: "m16_2", nome: "Pão Francês sem Miolo", qtd: 2, unidade: "unidades (80g)", kcal: 220, carb: 46, prot: 7, gord: 1.6 },
          { id: "m16_3", nome: "Queijo Mussarela", qtd: 20, unidade: "g", kcal: 56, carb: 0.6, prot: 4.5, gord: 4.2 },
          { id: "m16_4", nome: "Café com Leite Semidesnatado", qtd: 150, unidade: "ml", kcal: 50, carb: 6.5, prot: 4.2, gord: 1.2 }
        ]
      },
      {
        titulo: "LANCHE DA MANHÃ",
        alimentosList: [
          { id: "m16_5", nome: "Banana Prata", qtd: 2, unidade: "unidades (160g)", kcal: 156, carb: 40, prot: 2, gord: 0.4 },
          { id: "m16_6", nome: "Aveia em Flocos", qtd: 30, unidade: "g (2 col. sopa)", kcal: 112, carb: 19, prot: 4.2, gord: 2.2 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m16_7", nome: "Peito de Frango Grelhado", qtd: 170, unidade: "g", kcal: 275, carb: 0, prot: 52, gord: 5.8 },
          { id: "m16_8", nome: "Arroz Branco Cozido", qtd: 150, unidade: "g (6 col. sopa)", kcal: 195, carb: 42, prot: 3.8, gord: 0.6 },
          { id: "m16_9", nome: "Feijão Carioca Cozido", qtd: 100, unidade: "g (1 concha grande)", kcal: 76, carb: 13.5, prot: 4.8, gord: 0.6 },
          { id: "m16_10", nome: "Salada Verde & Tomate", qtd: 150, unidade: "g", kcal: 25, carb: 5, prot: 1.5, gord: 0.2 },
          { id: "m16_11", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE (PÓS TREINO)",
        alimentosList: [
          { id: "m16_12", nome: "Whey Protein 80%", qtd: 35, unidade: "g (1.2 scoop)", kcal: 140, carb: 3.5, prot: 28, gord: 2.1 },
          { id: "m16_13", nome: "Maçã Fuji / Banana", qtd: 1, unidade: "unidade (120g)", kcal: 62, carb: 16, prot: 0.3, gord: 0.2 },
          { id: "m16_14", nome: "Pasta de Amendoim Integral", qtd: 20, unidade: "g", kcal: 120, carb: 4, prot: 5.3, gord: 10 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m16_15", nome: "Patinho Bóvino Grelhado", qtd: 160, unidade: "g", kcal: 268, carb: 0, prot: 47, gord: 8 },
          { id: "m16_16", nome: "Batata Doce / Inglesa Cozida", qtd: 140, unidade: "g", kcal: 120, carb: 28, prot: 2, gord: 0.2 },
          { id: "m16_17", nome: "Legumes no Vapor", qtd: 120, unidade: "g", kcal: 42, carb: 9, prot: 1.6, gord: 0.3 },
          { id: "m16_18", nome: "Azeite de Oliva Extra Virgem", qtd: 5, unidade: "ml", kcal: 44, carb: 0, prot: 0, gord: 5 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "METAS DE HIPERTROFIA 2000 kcal",
        blocos: [
          { titulo: "Acompanhamento de Cargas", conteudo: "Registre a carga e repetição de cada exercício no treino para garantir o princípio da sobrecarga progressiva." }
        ]
      }
    ]
  },

  {
    id: "2100_performance",
    titulo: "⚡ 2100 kcal - Performance Esportiva & Atleta",
    categoria: "Performance / Atleta",
    caloriasAlvo: 2100,
    apresentacao: "Plano desenvolvido para atletas de modalidades híbridas (CrossFit, corrida, lutas, futebol) com alto gasto energético diário.",
    objetivo: "Reposição rápida de glicogênio hepático e muscular, redução de fadiga e otimização do rendimento esportivo.",
    metaAgua: 3.8,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ (ENERGÉTICO)",
        alimentosList: [
          { id: "m17_1", nome: "Ovo de Galinha Inteiro", qtd: 3, unidade: "unidades", kcal: 210, carb: 1.5, prot: 18, gord: 14 },
          { id: "m17_2", nome: "Pão de Forma Integral", qtd: 2, unidade: "fatias (50g)", kcal: 120, carb: 22, prot: 5, gord: 1.6 },
          { id: "m17_3", nome: "Mel de Abelha", qtd: 15, unidade: "g (1 col. sopa)", kcal: 46, carb: 12, prot: 0.1, gord: 0 },
          { id: "m17_4", nome: "Banana Prata", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m17_5", nome: "Peito de Frango / Coxa Desossada", qtd: 180, unidade: "g", kcal: 290, carb: 0, prot: 52, gord: 8.5 },
          { id: "m17_6", nome: "Arroz Branco Cozido", qtd: 160, unidade: "g", kcal: 208, carb: 45, prot: 4, gord: 0.7 },
          { id: "m17_7", nome: "Feijão Preto Cozido", qtd: 100, unidade: "g", kcal: 76, carb: 14, prot: 4.5, gord: 0.6 },
          { id: "m17_8", nome: "Salada Variada", qtd: 150, unidade: "g", kcal: 30, carb: 6, prot: 1.5, gord: 0.2 },
          { id: "m17_9", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE (PRÉ/PÓS TREINO)",
        alimentosList: [
          { id: "m17_10", nome: "Whey Protein Isolado / Concentrado", qtd: 35, unidade: "g", kcal: 140, carb: 3.5, prot: 28, gord: 2.1 },
          { id: "m17_11", nome: "Palatinose / Dextrose / Aveia", qtd: 30, unidade: "g", kcal: 115, carb: 28, prot: 1, gord: 0.5 },
          { id: "m17_12", nome: "Pasta de Amendoim Integral", qtd: 20, unidade: "g", kcal: 120, carb: 4, prot: 5.3, gord: 10 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m17_13", nome: "Patinho Moído / Carne Bovina", qtd: 170, unidade: "g", kcal: 285, carb: 0, prot: 50, gord: 8.5 },
          { id: "m17_14", nome: "Batata Doce / Macaxeira Cozida", qtd: 150, unidade: "g", kcal: 129, carb: 30, prot: 2, gord: 0.3 },
          { id: "m17_15", nome: "Vegetais no Vapor", qtd: 150, unidade: "g", kcal: 45, carb: 9, prot: 2.2, gord: 0.4 },
          { id: "m17_16", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "CEIA",
        alimentosList: [
          { id: "m17_17", nome: "Iogurt Proteico / Natural", qtd: 160, unidade: "g", kcal: 90, carb: 8, prot: 10, gord: 1.5 },
          { id: "m17_18", nome: "Castanha-do-Pará", qtd: 2, unidade: "unidades (8g)", kcal: 52, carb: 1, prot: 1.1, gord: 5.3 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "ESTRATÉGIA DE INTRA-TREINO & HIDRATAÇÃO",
        blocos: [
          { titulo: "Eletrólitos Durante o Treino", conteudo: "Em sessões superiores a 60 minutos, adicione sais minerais (eletrólitos em pó ou bebida isotônica) em 500ml de água." }
        ]
      }
    ]
  },

  {
    id: "2200_hipertrofia_avancada",
    titulo: "🔥 2200 kcal - Hipertrofia Avançada / Alto Volume",
    categoria: "Hipertrofia",
    caloriasAlvo: 2200,
    apresentacao: "Plano hipertrófico denso para praticantes avançados de musculação com elevado volume de treino diário.",
    objetivo: "Máximo aporte de substrato energético e aminoácidos para supercompensação muscular.",
    metaAgua: 3.8,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ",
        alimentosList: [
          { id: "m18_1", nome: "Ovo de Galinha Inteiro", qtd: 4, unidade: "unidades", kcal: 280, carb: 2, prot: 24, gord: 19 },
          { id: "m18_2", nome: "Pão Francês com Gergelim", qtd: 2, unidade: "unidades (100g)", kcal: 270, carb: 56, prot: 8, gord: 2 },
          { id: "m18_3", nome: "Banana Prata Média", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 },
          { id: "m18_4", nome: "Café Preto sem Açúcar", qtd: 150, unidade: "ml", kcal: 2, carb: 0.3, prot: 0.2, gord: 0 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m18_5", nome: "Peito de Frango Grelhado", qtd: 180, unidade: "g", kcal: 295, carb: 0, prot: 55, gord: 6.3 },
          { id: "m18_6", nome: "Arroz Branco Cozido", qtd: 180, unidade: "g (7 col. sopa)", kcal: 234, carb: 51, prot: 4.5, gord: 0.8 },
          { id: "m18_7", nome: "Feijão Carioca Cozido", qtd: 100, unidade: "g", kcal: 76, carb: 13.5, prot: 4.8, gord: 0.6 },
          { id: "m18_8", nome: "Salada Verde & Tomate", qtd: 150, unidade: "g", kcal: 25, carb: 5, prot: 1.5, gord: 0.2 },
          { id: "m18_9", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE (PÓS TREINO)",
        alimentosList: [
          { id: "m18_10", nome: "Whey Protein 80%", qtd: 40, unidade: "g (1.3 scoop)", kcal: 160, carb: 4, prot: 32, gord: 2.2 },
          { id: "m18_11", nome: "Aveia em Flocos", qtd: 40, unidade: "g", kcal: 150, carb: 26, prot: 5.6, gord: 2.8 },
          { id: "m18_12", nome: "Pasta de Amendoim Integral", qtd: 20, unidade: "g", kcal: 120, carb: 4, prot: 5.3, gord: 10 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m18_13", nome: "Patinho Moído / Carne Bovina", qtd: 180, unidade: "g", kcal: 300, carb: 0, prot: 53, gord: 9 },
          { id: "m18_14", nome: "Batata Doce Cozida", qtd: 160, unidade: "g", kcal: 138, carb: 32, prot: 2.2, gord: 0.3 },
          { id: "m18_15", nome: "Legumes Variados no Vapor", qtd: 150, unidade: "g", kcal: 45, carb: 9, prot: 2.2, gord: 0.4 },
          { id: "m18_16", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "HIPERTROFIA E SUPLEMENTAÇÃO AVANÇADA",
        blocos: [
          { titulo: "Beta-Alanina & Creatina", conteudo: "Creatina 5g diárias + Beta-alanina 4g divididas em duas doses diárias para tamponamento láctico." }
        ]
      }
    ]
  },

  {
    id: "2350_bulking",
    titulo: "💥 2350 kcal - Ganho Calórico Intenso (Bulking)",
    categoria: "Hipertrofia",
    caloriasAlvo: 2350,
    apresentacao: "Plano hipercalórico estruturado para indivíduos ectomorfos ou praticantes em fase intensiva de ganho de peso e volume (Bulking Limpo).",
    objetivo: "Superávit calórico consistente para romper platôs de ganho de peso e hipertrofia.",
    metaAgua: 4.0,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ (HIPERCALÓRICO)",
        alimentosList: [
          { id: "m19_1", nome: "Ovo de Galinha Inteiro", qtd: 4, unidade: "unidades", kcal: 280, carb: 2, prot: 24, gord: 19 },
          { id: "m19_2", nome: "Tapioca com Queijo e Frango Desfiado", qtd: 50, unidade: "g goma + 50g frango", kcal: 220, carb: 27, prot: 16, gord: 4.5 },
          { id: "m19_3", nome: "Banana Prata Média", qtd: 1.5, unidade: "unidades (120g)", kcal: 117, carb: 30, prot: 1.5, gord: 0.3 },
          { id: "m19_4", nome: "Café com Leite Integral", qtd: 150, unidade: "ml", kcal: 85, carb: 7, prot: 4.5, gord: 4.5 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m19_5", nome: "Patinho Moído / Alcatra Grelhada", qtd: 190, unidade: "g", kcal: 320, carb: 0, prot: 56, gord: 10 },
          { id: "m19_6", nome: "Arroz Branco Cozido", qtd: 200, unidade: "g (8 col. sopa)", kcal: 260, carb: 56, prot: 5, gord: 0.8 },
          { id: "m19_7", nome: "Feijão Carioca Cozido", qtd: 120, unidade: "g", kcal: 91, carb: 16, prot: 5.7, gord: 0.7 },
          { id: "m19_8", nome: "Salada Verde & Beterraba", qtd: 150, unidade: "g", kcal: 35, carb: 7.5, prot: 1.2, gord: 0.3 },
          { id: "m19_9", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE (HIPERCALÓRICO SHAKE)",
        alimentosList: [
          { id: "m19_10", nome: "Whey Protein 80%", qtd: 40, unidade: "g", kcal: 160, carb: 4, prot: 32, gord: 2.2 },
          { id: "m19_11", nome: "Hipercalórico / Farelo de Aveia", qtd: 50, unidade: "g", kcal: 185, carb: 32, prot: 7, gord: 3.2 },
          { id: "m19_12", nome: "Pasta de Amendoim Integral", qtd: 30, unidade: "g (2 col. sopa)", kcal: 180, carb: 6, prot: 8, gord: 15 },
          { id: "m19_13", nome: "Banana Prata", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m19_14", nome: "Peito de Frango / Sobrecoxa Assada", qtd: 190, unidade: "g", kcal: 310, carb: 0, prot: 58, gord: 7 },
          { id: "m19_15", nome: "Batata Doce / Mandioca Cozida", qtd: 180, unidade: "g", kcal: 155, carb: 36, prot: 2.5, gord: 0.4 },
          { id: "m19_16", nome: "Legumes Refogados", qtd: 120, unidade: "g", kcal: 45, carb: 9, prot: 1.8, gord: 0.4 },
          { id: "m19_17", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "ESTRATÉGIA DE BULKING CONSCIENTE",
        blocos: [
          { titulo: "Ganho de Peso Ponderado", conteudo: "Busque um ganho de peso balança entre 0.3kg a 0.5kg por semana para evitar o ganho excessivo de tecido adiposo." }
        ]
      }
    ]
  },

  {
    id: "2500_atleta_endurance",
    titulo: "🥇 2500 kcal - Atleta de Alta Performance / Endurance",
    categoria: "Performance / Atleta",
    caloriasAlvo: 2500,
    apresentacao: "Plano nutricional de alta energia e rápida absorção carbídica para atletas de maratona, ciclismo, triatlo e esportes de alta demanda calórica diária.",
    objetivo: "Superávit e reposição acelerada de estoque de glicogênio, manutenção de alta taxa metabólica e pico de performance.",
    metaAgua: 4.2,
    refeicoes: [
      {
        titulo: "CAFÉ DA MANHÃ (ENDURANCE)",
        alimentosList: [
          { id: "m20_1", nome: "Ovo de Galinha Inteiro", qtd: 4, unidade: "unidades", kcal: 280, carb: 2, prot: 24, gord: 19 },
          { id: "m20_2", nome: "Pão Francês Inteiro", qtd: 2, unidade: "unidades (100g)", kcal: 270, carb: 56, prot: 8, gord: 2 },
          { id: "m20_3", nome: "Geleia de Frutas sem Açúcar / Mel", qtd: 20, unidade: "g", kcal: 52, carb: 13, prot: 0.1, gord: 0 },
          { id: "m20_4", nome: "Banana Prata", qtd: 1.5, unidade: "unidades (120g)", kcal: 117, carb: 30, prot: 1.5, gord: 0.3 },
          { id: "m20_5", nome: "Café com Leite Semidesnatado", qtd: 200, unidade: "ml", kcal: 66, carb: 9, prot: 5.6, gord: 1.6 }
        ]
      },
      {
        titulo: "ALMOÇO",
        alimentosList: [
          { id: "m20_6", nome: "Patinho Moído / File Mignon", qtd: 200, unidade: "g", kcal: 335, carb: 0, prot: 58, gord: 10.5 },
          { id: "m20_7", nome: "Arroz Branco Cozido", qtd: 220, unidade: "g (9 col. sopa)", kcal: 286, carb: 62, prot: 5.5, gord: 0.9 },
          { id: "m20_8", nome: "Feijão Carioca Cozido", qtd: 120, unidade: "g", kcal: 91, carb: 16, prot: 5.7, gord: 0.7 },
          { id: "m20_9", nome: "Salada Variada com Azeite", qtd: 150, unidade: "g", kcal: 35, carb: 7.5, prot: 1.2, gord: 0.3 },
          { id: "m20_10", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      },
      {
        titulo: "LANCHE DA TARDE (PRÉ/PÓS TREINO INTENSO)",
        alimentosList: [
          { id: "m20_11", nome: "Whey Protein 80%", qtd: 40, unidade: "g", kcal: 160, carb: 4, prot: 32, gord: 2.2 },
          { id: "m20_12", nome: "Aveia / Palatinose", qtd: 50, unidade: "g", kcal: 185, carb: 32, prot: 7, gord: 3.2 },
          { id: "m20_13", nome: "Pasta de Amendoim Integral", qtd: 30, unidade: "g", kcal: 180, carb: 6, prot: 8, gord: 15 },
          { id: "m20_14", nome: "Banana Prata Média", qtd: 1, unidade: "unidade (80g)", kcal: 78, carb: 20, prot: 1, gord: 0.2 }
        ]
      },
      {
        titulo: "JANTAR",
        alimentosList: [
          { id: "m20_15", nome: "Peito de Frango Grelhado", qtd: 200, unidade: "g", kcal: 325, carb: 0, prot: 61, gord: 7 },
          { id: "m20_16", nome: "Batata Doce Cozida / Macaxeira", qtd: 200, unidade: "g", kcal: 172, carb: 40, prot: 2.8, gord: 0.4 },
          { id: "m20_17", nome: "Legumes no Vapor", qtd: 150, unidade: "g", kcal: 45, carb: 9, prot: 2.2, gord: 0.4 },
          { id: "m20_18", nome: "Azeite de Oliva Extra Virgem", qtd: 10, unidade: "ml", kcal: 88, carb: 0, prot: 0, gord: 10 }
        ]
      }
    ],
    extras: [
      {
        tituloPagina: "ESTRATÉGIA NUTRICIONAL DE ENDURANCE",
        blocos: [
          { titulo: "Carbo-Loading e Supercompensação", conteudo: "Utilize a estratégia de aumento gradual de carboidratos 48h antes de provas de longa duração." }
        ]
      }
    ]
  }
];

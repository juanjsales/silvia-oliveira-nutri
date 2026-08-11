/**
 * BANCO DE DADOS DE RECEITAS FIT & FUNCIONAIS
 * Nutricionista Dra. Silvia Oliveira Lemos
 * 
 * Módulo centralizado de receitas pré-configuradas com ingredientes estruturados,
 * porções, modo de preparo e cálculo de macronutrientes.
 */

(function () {
  const RECEITAS_DATABASE = [
    {
      id: 'rec-pao-batata',
      titulo: 'Pãozinho Fit de Batata-Doce com Chia',
      categoria: 'Café da Manhã',
      tempo_preparo: '25 min (+20 min descanso)',
      rendimento: '5 pãezinhos (1 porção)',
      instrucoes: '1. Amasse a batata-doce cozida e reservada.\n2. Em uma tigela, coloque o polvilho azedo, o sal e a água morna. Misture bem para incorporar e escaldar o polvilho.\n3. Adicione a batata doce amassada e a chia e mexa bem.\n4. Faça bolinhas com a massa.\n5. Disponha as bolinhas em uma assadeira com papel-manteiga e asse em forno preaquecido a 180ºC por 25 min. Deixe o forno semiaberto por 20 min antes de retirar.',
      alimentosList: [
        { nome: 'Batata Doce Cozida', qtd: '100g', kcal: 77, prot: 0.6, carb: 18.4, gord: 0.1 },
        { nome: 'Polvilho Azedo / Doce', qtd: '90g (3/4 xícara)', kcal: 315, prot: 0.4, carb: 78.8, gord: 0.1 },
        { nome: 'Semente de Chia', qtd: '5g (1/2 col. sopa)', kcal: 24, prot: 0.8, carb: 2.1, gord: 1.5 },
        { nome: 'Sal', qtd: '2.5g (1/4 col. sopa)', kcal: 0, prot: 0.0, carb: 0.0, gord: 0.0 }
      ]
    },
    {
      id: 'rec-suco-revit',
      titulo: 'Suco Revitalizante (Beterraba, Gojiberry & Água de Coco)',
      categoria: 'Sucos & Shakes',
      tempo_preparo: '5 min',
      rendimento: '1 copo duplo (240ml)',
      instrucoes: 'Bata a beterraba crua, gojiberry, morango desidratado, água de coco e suco de laranja no liquidificador até obter consistência cremosa e uniforme. Consuma gelado.',
      alimentosList: [
        { nome: 'Beterraba Crua', qtd: '15g (1 col. sopa)', kcal: 6, prot: 0.2, carb: 1.4, gord: 0.0 },
        { nome: 'Gojiberry Desidratada', qtd: '10g (1 col. sopa)', kcal: 35, prot: 1.4, carb: 7.7, gord: 0.0 },
        { nome: 'Morango In Natura / Desidratado', qtd: '10g (1 col. sopa)', kcal: 30, prot: 0.5, carb: 6.8, gord: 0.2 },
        { nome: 'Água de Coco Natural', qtd: '150ml', kcal: 28, prot: 1.0, carb: 5.5, gord: 0.3 },
        { nome: 'Laranja Pêra (Suco)', qtd: '50ml', kcal: 23, prot: 0.5, carb: 5.7, gord: 0.0 }
      ]
    },
    {
      id: 'rec-suco-antiox',
      titulo: 'Suco Verde Antioxidante (Couve, Pepino, Chia & Linhaça)',
      categoria: 'Sucos & Shakes',
      tempo_preparo: '5 min',
      rendimento: '1 copo duplo (240ml)',
      instrucoes: 'Passe o pepino, maçã, aipo e couve na centrífuga (ou bata no liquidificador com um pouco de água). Adicione as sementes de linhaça, chia e gergelim. Não coe.',
      alimentosList: [
        { nome: 'Pepino com casca', qtd: '80g (1/2 un)', kcal: 10, prot: 0.5, carb: 2.0, gord: 0.1 },
        { nome: 'Maçã Fuji / Gala com Casca', qtd: '70g (1/2 un)', kcal: 39, prot: 0.2, carb: 10.1, gord: 0.1 },
        { nome: 'Aipo / Salsão (Talos)', qtd: '40g (2 talos)', kcal: 6, prot: 0.3, carb: 1.2, gord: 0.1 },
        { nome: 'Couve Manteiga', qtd: '30g (1 folha)', kcal: 8, prot: 0.9, carb: 1.7, gord: 0.1 },
        { nome: 'Semente de Linhaça Dourada', qtd: '3g (1 col. café)', kcal: 15, prot: 0.4, carb: 1.0, gord: 1.0 },
        { nome: 'Semente de Chia', qtd: '3g (1 col. café)', kcal: 15, prot: 0.5, carb: 1.3, gord: 0.9 },
        { nome: 'Gergelim Branco / Preto', qtd: '3g (1 col. café)', kcal: 17, prot: 0.5, carb: 0.7, gord: 1.5 }
      ]
    },
    {
      id: 'rec-suco-diuretico',
      titulo: 'Suco Verde Diurético (Couve, Limão & Gojiberry)',
      categoria: 'Sucos & Shakes',
      tempo_preparo: '5 min',
      rendimento: '1 copo duplo (240ml)',
      instrucoes: 'Bata a couve, limão sem sementes, pepino japonês, maçã com casca, água gelada, gojiberry, blueberry e cranberry no liquidificador. Sirva gelado.',
      alimentosList: [
        { nome: 'Couve Manteiga', qtd: '30g (1 folha)', kcal: 8, prot: 0.9, carb: 1.7, gord: 0.1 },
        { nome: 'Limão inteiro com casca', qtd: '40g (1/2 un)', kcal: 12, prot: 0.4, carb: 3.6, gord: 0.1 },
        { nome: 'Pepino japonês', qtd: '70g', kcal: 9, prot: 0.5, carb: 1.8, gord: 0.1 },
        { nome: 'Maçã Fuji com casca', qtd: '100g', kcal: 56, prot: 0.3, carb: 14.5, gord: 0.2 },
        { nome: 'Gojiberry Desidratada', qtd: '5g', kcal: 17, prot: 0.7, carb: 3.8, gord: 0.0 },
        { nome: 'Blueberry / Mirtilo', qtd: '5g', kcal: 3, prot: 0.1, carb: 0.7, gord: 0.0 },
        { nome: 'Cranberry seca', qtd: '5g', kcal: 15, prot: 0.0, carb: 4.1, gord: 0.0 }
      ]
    },
    {
      id: 'rec-suco-energizante',
      titulo: 'Suco Energizante de Açaí, Castanha do Pará & Linhaça',
      categoria: 'Sucos & Shakes',
      tempo_preparo: '5 min',
      rendimento: '1 copo duplo (240ml)',
      instrucoes: 'Bata a água de coco com maçã, pêra, mamão papaia, hortelã, semente de linhaça, castanhas do pará e açaí em pó por 3 minutos no liquidificador. Leve à geladeira antes de servir.',
      alimentosList: [
        { nome: 'Água de Coco Natural', qtd: '200ml', kcal: 38, prot: 1.4, carb: 7.4, gord: 0.4 },
        { nome: 'Maçã Fuji com casca', qtd: '70g (1/2 un)', kcal: 39, prot: 0.2, carb: 10.1, gord: 0.1 },
        { nome: 'Pêra sem casca', qtd: '70g (1/2 un)', kcal: 40, prot: 0.3, carb: 10.5, gord: 0.1 },
        { nome: 'Mamão papaia', qtd: '60g (1/4 un)', kcal: 27, prot: 0.3, carb: 7.0, gord: 0.1 },
        { nome: 'Semente de Linhaça Dourada', qtd: '10g (1 col. sopa)', kcal: 49, prot: 1.4, carb: 3.3, gord: 3.2 },
        { nome: 'Castanha do Pará', qtd: '8g (2 unidades)', kcal: 52, prot: 1.1, carb: 1.2, gord: 5.1 },
        { nome: 'Açaí em Pó Puro', qtd: '10g (1 col. sopa)', kcal: 25, prot: 1.0, carb: 3.6, gord: 0.8 }
      ]
    },
    {
      id: 'rec-suco-termogenico',
      titulo: 'Suco Termogênico de Laranja, Gengibre & Amaranto',
      categoria: 'Sucos & Shakes',
      tempo_preparo: '5 min',
      rendimento: '1 copo duplo (240ml)',
      instrucoes: 'Corte a laranja em pedaços tirando as sementes. Bata no liquidificador com a couve, gengibre, água, cenoura ralada, amaranto e chia. Coe e adoce a gosto.',
      alimentosList: [
        { nome: 'Laranja Pêra sem sementes', qtd: '130g (1 un)', kcal: 60, prot: 1.3, carb: 15.0, gord: 0.1 },
        { nome: 'Couve Manteiga', qtd: '30g (1 folha)', kcal: 8, prot: 0.9, carb: 1.7, gord: 0.1 },
        { nome: 'Gengibre em pó', qtd: '2g (1 col. café)', kcal: 6, prot: 0.1, carb: 1.3, gord: 0.1 },
        { nome: 'Cenoura Crua / Ralada', qtd: '20g', kcal: 7, prot: 0.3, carb: 1.5, gord: 0.0 },
        { nome: 'Amaranto em Flocos', qtd: '5g (1 col. chá)', kcal: 19, prot: 0.7, carb: 3.3, gord: 0.3 },
        { nome: 'Semente de Chia', qtd: '3g (1 col. café)', kcal: 15, prot: 0.5, carb: 1.3, gord: 0.9 }
      ]
    },
    {
      id: 'rec-sand-atum',
      titulo: 'Sanduíche Natural de Atum com Cenoura & Maionese Light',
      categoria: 'Lanches Proteicos',
      tempo_preparo: '10 min',
      rendimento: '1 sanduíche porção',
      instrucoes: 'Misture o atum light em conserva com a maionese light. Monte o pão integral com a mistura de atum, cenoura ralada, rodelas de tomate e folhas de alface.',
      alimentosList: [
        { nome: 'Atum Conserva em Água', qtd: '60g (1/2 lata)', kcal: 70, prot: 15.3, carb: 0.0, gord: 0.6 },
        { nome: 'Pão Integral', qtd: '50g (2 fatias)', kcal: 123, prot: 4.7, carb: 25.0, gord: 1.8 },
        { nome: 'Maionese Light', qtd: '30g (2 col. sopa)', kcal: 84, prot: 0.3, carb: 3.0, gord: 7.8 },
        { nome: 'Cenoura Crua / Ralada', qtd: '25g (1/2 un pequena)', kcal: 8, prot: 0.3, carb: 1.9, gord: 0.1 },
        { nome: 'Tomate Salada', qtd: '20g (1 fatia)', kcal: 3, prot: 0.2, carb: 0.6, gord: 0.0 },
        { nome: 'Alface Crespa / Americana', qtd: '15g (2 folhas)', kcal: 2, prot: 0.2, carb: 0.3, gord: 0.0 }
      ]
    },
    {
      id: 'rec-sand-frango-queijo',
      titulo: 'Sanduíche Natural de Frango com Queijo Minas & Rúcula',
      categoria: 'Lanches Proteicos',
      tempo_preparo: '15 min',
      rendimento: '1 sanduíche porção',
      instrucoes: 'Refogue o frango desfiado com cebola e azeite. Passe a maionese light no pão integral, adicione o frango temperado, a cenoura ralada, fatia de queijo minas e rúcula fresca.',
      alimentosList: [
        { nome: 'Peito de Frango Grelhado (Desfiado)', qtd: '50g', kcal: 80, prot: 16.0, carb: 0.0, gord: 1.3 },
        { nome: 'Pão Integral', qtd: '50g (2 fatias)', kcal: 123, prot: 4.7, carb: 25.0, gord: 1.8 },
        { nome: 'Queijo Minas Frescal', qtd: '30g (1 fatia)', kcal: 79, prot: 5.2, carb: 1.0, gord: 6.0 },
        { nome: 'Maionese Light', qtd: '15g (1 col. sopa)', kcal: 42, prot: 0.1, carb: 1.5, gord: 3.9 },
        { nome: 'Cenoura Crua / Ralada', qtd: '20g', kcal: 7, prot: 0.3, carb: 1.5, gord: 0.0 },
        { nome: 'Azeite de Oliva Extra Virgem', qtd: '2ml', kcal: 18, prot: 0.0, carb: 0.0, gord: 2.0 }
      ]
    },
    {
      id: 'rec-sand-ovo-atum',
      titulo: 'Sanduíche de Ovo Cozido com Atum & Requeijão Light',
      categoria: 'Lanches Proteicos',
      tempo_preparo: '10 min',
      rendimento: '1 sanduíche porção',
      instrucoes: 'Cozinhe os ovos, descasque e fatie em pedaços pequenos. Misture ao atum e ao requeijão light. Tempere com sal e pimenta a gosto e prepare o sanduíche com o pão integral.',
      alimentosList: [
        { nome: 'Ovo de Galinha Cozido', qtd: '2 unidades (100g)', kcal: 146, prot: 13.3, carb: 0.6, gord: 9.5 },
        { nome: 'Atum Conserva em Água', qtd: '60g (3 col. sopa)', kcal: 70, prot: 15.3, carb: 0.0, gord: 0.6 },
        { nome: 'Requeijão Light', qtd: '20g (1 col. sopa)', kcal: 34, prot: 1.9, carb: 0.6, gord: 2.7 },
        { nome: 'Pão Integral', qtd: '50g (2 fatias)', kcal: 123, prot: 4.7, carb: 25.0, gord: 1.8 }
      ]
    },
    {
      id: 'rec-pasta-ricota',
      titulo: 'Pasta de Ricota Funcional com Iogurte Natural & Ervas',
      categoria: 'Lanches Proteicos',
      tempo_preparo: '8 min',
      rendimento: '1 porção (80g de pasta)',
      instrucoes: 'Amasse a ricota com um garfo. Misture o iogurte natural desnatado, cebola picada, salsinha, cebolinha, orégano e sal. Sirva como patê para pães e torradas integrais.',
      alimentosList: [
        { nome: 'Ricota Fresca', qtd: '50g', kcal: 70, prot: 6.3, carb: 1.9, gord: 4.0 },
        { nome: 'Iogurte Natural Desnatado', qtd: '30g (2 col. sopa)', kcal: 12, prot: 1.1, carb: 1.7, gord: 0.1 },
        { nome: 'Cebola / Ervas Frescas', qtd: '10g', kcal: 4, prot: 0.1, carb: 0.8, gord: 0.0 }
      ]
    },
    {
      id: 'rec-1',
      titulo: 'Panqueca Proteica de Banana & Aveia',
      categoria: 'Café da Manhã',
      tempo_preparo: '10 min',
      rendimento: '1 porção',
      instrucoes: 'Amasse a banana com o garfo, misture bem com o ovo e a aveia. Despeje em frigideira antiaderente aquecida e grelhe dos dois lados até dourar.',
      alimentosList: [
        { nome: 'Banana prata madura', qtd: '1 unidade (80g)', kcal: 71, prot: 1.0, carb: 18.3, gord: 0.1 },
        { nome: 'Ovo de galinha caipira', qtd: '1 unidade (50g)', kcal: 72, prot: 6.3, carb: 0.3, gord: 4.8 },
        { nome: 'Aveia em flocos finos', qtd: '30g (3 col. sopa)', kcal: 118, prot: 4.2, carb: 20.0, gord: 2.2 },
        { nome: 'Canela em pó', qtd: '1 pitada (2g)', kcal: 5, prot: 0.1, carb: 1.6, gord: 0.0 }
      ]
    },
    {
      id: 'rec-2',
      titulo: 'Overnight Oats com Chia & Morangos',
      categoria: 'Café da Manhã',
      tempo_preparo: '5 min (+6h geladeira)',
      rendimento: '1 porção',
      instrucoes: 'Em um copo ou pote de vidro, misture a aveia, chia e leite. Adicione os morangos no topo e deixe na geladeira por pelo menos 6 horas antes de consumir.',
      alimentosList: [
        { nome: 'Aveia em flocos', qtd: '40g (4 col. sopa)', kcal: 157, prot: 5.6, carb: 26.6, gord: 2.9 },
        { nome: 'Leite vegetal de amêndoas', qtd: '120ml', kcal: 30, prot: 1.0, carb: 1.5, gord: 2.2 },
        { nome: 'Semente de chia', qtd: '10g (1 col. sobremesa)', kcal: 48, prot: 1.6, carb: 4.2, gord: 3.1 },
        { nome: 'Morango fresco fatiado', qtd: '5 unidades (75g)', kcal: 24, prot: 0.5, carb: 5.8, gord: 0.2 },
        { nome: 'Mel de abelha', qtd: '1 fio (10g)', kcal: 30, prot: 0.0, carb: 8.2, gord: 0.0 }
      ]
    },
    {
      id: 'rec-3',
      titulo: 'Crepioca Recheada de Frango Desfiado',
      categoria: 'Café da Manhã',
      tempo_preparo: '10 min',
      rendimento: '1 porção',
      instrucoes: 'Misture o ovo com a goma de tapioca até obter massa homogênea. Doure na frigideira dos dois lados e recheie com o frango desfiado temperado.',
      alimentosList: [
        { nome: 'Ovo de galinha', qtd: '1 unidade (50g)', kcal: 72, prot: 6.3, carb: 0.3, gord: 4.8 },
        { nome: 'Goma de tapioca', qtd: '30g (2 col. sopa)', kcal: 72, prot: 0.1, carb: 18.0, gord: 0.1 },
        { nome: 'Peito de frango desfiado temperado', qtd: '80g', kcal: 128, prot: 25.6, carb: 0.0, gord: 2.0 },
        { nome: 'Requeijão light', qtd: '15g (1 col. sopa)', kcal: 26, prot: 1.4, carb: 0.5, gord: 2.0 }
      ]
    },
    {
      id: 'rec-4',
      titulo: 'Waffle Proteico de Baunilha',
      categoria: 'Café da Manhã',
      tempo_preparo: '8 min',
      rendimento: '1 porção',
      instrucoes: 'Misture o Whey Protein, a farinha de aveia, o ovo e o fermento com um pouco de água até dar ponto de massa. Asse na máquina de waffle por 5 minutos.',
      alimentosList: [
        { nome: 'Whey Protein Baunilha', qtd: '30g (1 scoop)', kcal: 120, prot: 24.0, carb: 2.0, gord: 1.5 },
        { nome: 'Farinha de aveia', qtd: '20g (2 col. sopa)', kcal: 78, prot: 2.8, carb: 13.3, gord: 1.4 },
        { nome: 'Ovo de galinha', qtd: '1 unidade (50g)', kcal: 72, prot: 6.3, carb: 0.3, gord: 4.8 },
        { nome: 'Fermento em pó', qtd: '3g (1/2 col. chá)', kcal: 3, prot: 0.0, carb: 0.8, gord: 0.0 }
      ]
    },
    {
      id: 'rec-5',
      titulo: 'Omelete de Ervas Finas com Queijo Cottage',
      categoria: 'Almoço / Jantar',
      tempo_preparo: '8 min',
      rendimento: '1 porção',
      instrucoes: 'Bata os ovos com os temperos frescos. Despeje na frigideira untada com um fio de azeite. Recheie com o queijo cottage e tomate e dobre ao meio.',
      alimentosList: [
        { nome: 'Ovo de galinha caipira', qtd: '2 unidades (100g)', kcal: 143, prot: 12.6, carb: 0.7, gord: 9.5 },
        { nome: 'Queijo cottage zero lactose', qtd: '40g (2 col. sopa cheias)', kcal: 39, prot: 4.4, carb: 1.4, gord: 1.7 },
        { nome: 'Tomate picado', qtd: '50g', kcal: 9, prot: 0.5, carb: 1.9, gord: 0.1 },
        { nome: 'Azeite de oliva extra virgem', qtd: '5ml (1 col. chá)', kcal: 44, prot: 0.0, carb: 0.0, gord: 5.0 }
      ]
    },
    {
      id: 'rec-6',
      titulo: 'Escondidinho de Batata Doce com Frango',
      categoria: 'Almoço / Jantar',
      tempo_preparo: '20 min',
      rendimento: '1 porção',
      instrucoes: 'Amasse a batata doce cozida para fazer um purê leve. Em um refratário pequeno, faça uma camada de frango desfiado refogado e cubra com o purê. Doure no forno por 10 min.',
      alimentosList: [
        { nome: 'Batata doce cozida', qtd: '120g', kcal: 92, prot: 1.4, carb: 22.0, gord: 0.2 },
        { nome: 'Peito de frango desfiado refogado', qtd: '130g', kcal: 206, prot: 41.0, carb: 0.0, gord: 3.2 },
        { nome: 'Requeijão light', qtd: '20g (1 col. sopa cheia)', kcal: 34, prot: 1.9, carb: 0.6, gord: 2.7 },
        { nome: 'Azeite de oliva', qtd: '5ml', kcal: 44, prot: 0.0, carb: 0.0, gord: 5.0 }
      ]
    },
    {
      id: 'rec-7',
      titulo: 'Salada Funcional de Grão-de-Bico com Ervas',
      categoria: 'Almoço / Jantar',
      tempo_preparo: '12 min',
      rendimento: '1 porção',
      instrucoes: 'Em uma tigela, misture o grão-de-bico com os vegetais frescos picados. Tempere com o suco de limão, azeite extra virgem, sal rosa e hortelã.',
      alimentosList: [
        { nome: 'Grão-de-bico cozido', qtd: '150g (1 xícara)', kcal: 210, prot: 11.5, carb: 35.0, gord: 3.8 },
        { nome: 'Pepino japonês picado', qtd: '50g', kcal: 8, prot: 0.3, carb: 1.8, gord: 0.1 },
        { nome: 'Tomate cereja', qtd: '50g (5 unidades)', kcal: 10, prot: 0.5, carb: 2.2, gord: 0.1 },
        { nome: 'Cebola roxa picada', qtd: '20g', kcal: 8, prot: 0.2, carb: 1.9, gord: 0.0 },
        { nome: 'Azeite de oliva extra virgem', qtd: '8ml (1 col. sobremesa)', kcal: 70, prot: 0.0, carb: 0.0, gord: 7.8 }
      ]
    },
    {
      id: 'rec-8',
      titulo: 'Strogonoff Fit de Frango com Queijo Cottage',
      categoria: 'Almoço / Jantar',
      tempo_preparo: '15 min',
      rendimento: '1 porção',
      instrucoes: 'Doure os cubos de peito de frango no azeite com alho e cebola. Adicione cogumelos fatiados, molho de tomate natural e finalize com o queijo cottage batido para dar cremosidade.',
      alimentosList: [
        { nome: 'Peito de frango em cubos', qtd: '140g', kcal: 222, prot: 44.8, carb: 0.0, gord: 3.5 },
        { nome: 'Cogumelo champignon fatiado', qtd: '50g', kcal: 14, prot: 1.6, carb: 2.0, gord: 0.2 },
        { nome: 'Molho de tomate artesanal', qtd: '50g (3 col. sopa)', kcal: 18, prot: 0.8, carb: 3.5, gord: 0.2 },
        { nome: 'Queijo cottage cremoso', qtd: '40g', kcal: 39, prot: 4.4, carb: 1.4, gord: 1.7 },
        { nome: 'Azeite de oliva extra virgem', qtd: '5ml', kcal: 44, prot: 0.0, carb: 0.0, gord: 5.0 }
      ]
    },
    {
      id: 'rec-9',
      titulo: 'Filé de Tilápia Grelhado com Crosta de Gergelim',
      categoria: 'Almoço / Jantar',
      tempo_preparo: '12 min',
      rendimento: '1 porção',
      instrucoes: 'Tempere o filé de tilápia com limão, ervas e sal. Empane levemente com gergelim branco e preto e sele em frigideira quente com azeite até dourar.',
      alimentosList: [
        { nome: 'Filé de tilápia fresco', qtd: '150g', kcal: 192, prot: 39.0, carb: 0.0, gord: 4.0 },
        { nome: 'Gergelim branco e preto', qtd: '10g (1 col. sobremesa)', kcal: 57, prot: 1.8, carb: 2.3, gord: 5.0 },
        { nome: 'Azeite de oliva extra virgem', qtd: '5ml', kcal: 44, prot: 0.0, carb: 0.0, gord: 5.0 },
        { nome: 'Suco de limão taiti', qtd: '15ml', kcal: 4, prot: 0.1, carb: 1.2, gord: 0.0 }
      ]
    },
    {
      id: 'rec-10',
      titulo: 'Smoothie Verde Anti-inflamatório & Detox',
      categoria: 'Sucos & Shakes',
      tempo_preparo: '5 min',
      rendimento: '1 copo (300ml)',
      instrucoes: 'Bata a água de coco com a couve, maçã verde, semente de linhaça e gengibre no liquidificador. Consuma imediatamente sem coar.',
      alimentosList: [
        { nome: 'Água de coco natural', qtd: '200ml', kcal: 40, prot: 0.7, carb: 9.5, gord: 0.2 },
        { nome: 'Couve manteiga crua', qtd: '1 folha (30g)', kcal: 8, prot: 0.9, carb: 1.7, gord: 0.1 },
        { nome: 'Maçã verde com casca', qtd: '1/2 unidade (70g)', kcal: 36, prot: 0.2, carb: 9.6, gord: 0.1 },
        { nome: 'Linhaça dourada moída', qtd: '10g (1 col. sobremesa)', kcal: 49, prot: 1.8, carb: 3.0, gord: 3.3 },
        { nome: 'Gengibre fresco ralado', qtd: '5g', kcal: 4, prot: 0.1, carb: 0.9, gord: 0.0 }
      ]
    },
    {
      id: 'rec-11',
      titulo: 'Shake Pós-Treino Anabólico de Cacau & Whey',
      categoria: 'Sucos & Shakes',
      tempo_preparo: '5 min',
      rendimento: '1 copo (350ml)',
      instrucoes: 'Bata o Whey Protein com leite desnatado, banana congelada e cacau 100% até obter textura cremosa.',
      alimentosList: [
        { nome: 'Whey Protein Concentrado 80%', qtd: '30g (1 scoop)', kcal: 120, prot: 24.0, carb: 2.1, gord: 1.8 },
        { nome: 'Banana prata congelada', qtd: '1 unidade (80g)', kcal: 71, prot: 1.0, carb: 18.3, gord: 0.1 },
        { nome: 'Leite desnatado', qtd: '200ml', kcal: 70, prot: 6.8, carb: 9.8, gord: 0.2 },
        { nome: 'Cacau em pó 100%', qtd: '5g (1 col. chá)', kcal: 12, prot: 1.0, carb: 2.8, gord: 0.6 }
      ]
    },
    {
      id: 'rec-12',
      titulo: 'Cookie Fit de Frigideira com Cacau 70%',
      categoria: 'Doces Fit',
      tempo_preparo: '10 min',
      rendimento: '1 unidade',
      instrucoes: 'Misture o ovo, farinha de aveia, cacau e adoçante. Coloque na frigideira antiaderente em fogo baixo, adicione as gotas de chocolate por cima e abafe por 6 a 8 min.',
      alimentosList: [
        { nome: 'Ovo de galinha', qtd: '1 unidade (50g)', kcal: 72, prot: 6.3, carb: 0.3, gord: 4.8 },
        { nome: 'Farinha de aveia', qtd: '30g (2 col. sopa)', kcal: 118, prot: 4.2, carb: 20.0, gord: 2.2 },
        { nome: 'Cacau em pó 100%', qtd: '5g (1 col. chá)', kcal: 12, prot: 1.0, carb: 2.8, gord: 0.6 },
        { nome: 'Gotas de chocolate 70%', qtd: '10g', kcal: 50, prot: 0.8, carb: 4.5, gord: 3.2 }
      ]
    },
    {
      id: 'rec-13',
      titulo: 'Mousse Fit de Maracujá com Whey Protein',
      categoria: 'Doces Fit',
      tempo_preparo: '10 min (+1h geladeira)',
      rendimento: '2 taças',
      instrucoes: 'Bata o iogurte grego desnatado com a polpa de maracujá e o Whey Protein de Baunilha. Distribua em taças e leve à geladeira por 1 hora antes de servir.',
      alimentosList: [
        { nome: 'Iogurte grego desnatado natural', qtd: '150g', kcal: 82, prot: 12.0, carb: 6.5, gord: 0.5 },
        { nome: 'Whey Protein Baunilha', qtd: '20g (2/3 scoop)', kcal: 80, prot: 16.0, carb: 1.3, gord: 1.0 },
        { nome: 'Polpa de maracujá fresca', qtd: '40g', kcal: 20, prot: 0.9, carb: 3.8, gord: 0.3 }
      ]
    },
    {
      id: 'rec-14',
      titulo: 'Bolo de Caneca Proteico de Maçã & Canela',
      categoria: 'Doces Fit',
      tempo_preparo: '3 min (micro-ondas)',
      rendimento: '1 caneca',
      instrucoes: 'Na caneca, misture a maçã ralada, ovo, farelo de aveia, canela e fermento. Leve ao micro-ondas em potência alta por 2 minutos.',
      alimentosList: [
        { nome: 'Maçã fuji ralada', qtd: '60g (1/2 unidade)', kcal: 34, prot: 0.2, carb: 8.7, gord: 0.1 },
        { nome: 'Ovo de galinha', qtd: '1 unidade (50g)', kcal: 72, prot: 6.3, carb: 0.3, gord: 4.8 },
        { nome: 'Farelo de aveia', qtd: '25g (2 col. sopa)', kcal: 87, prot: 4.2, carb: 14.1, gord: 1.8 },
        { nome: 'Canela em pó', qtd: '2g', kcal: 5, prot: 0.1, carb: 1.6, gord: 0.0 },
        { nome: 'Fermento em pó', qtd: '3g', kcal: 3, prot: 0.0, carb: 0.8, gord: 0.0 }
      ]
    },
    {
      id: 'rec-15',
      titulo: 'Pasta de Amendoim Caseira Proteica com Cacau',
      categoria: 'Lanches Proteicos',
      tempo_preparo: '10 min',
      rendimento: '2 porções (30g cada)',
      instrucoes: 'Processe o amendoim torrado até virar pasta cremosa. Misture o Whey Protein de chocolate e o cacau até incorporar completamente.',
      alimentosList: [
        { nome: 'Amendoim torrado sem sal', qtd: '40g', kcal: 232, prot: 10.4, carb: 8.4, gord: 19.6 },
        { nome: 'Whey Protein Chocolate', qtd: '15g (1/2 scoop)', kcal: 60, prot: 12.0, carb: 1.0, gord: 0.9 },
        { nome: 'Cacau em pó 100%', qtd: '5g', kcal: 12, prot: 1.0, carb: 2.8, gord: 0.6 }
      ]
    }
  ];

  const _normalize = str => String(str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  window.RECEITAS_DATABASE = RECEITAS_DATABASE;

  window.ReceitasDB = {
    getAll() {
      return RECEITAS_DATABASE;
    },

    getCategories() {
      return ['Todas', 'Café da Manhã', 'Almoço / Jantar', 'Lanches Proteicos', 'Sucos & Shakes', 'Doces Fit'];
    },

    getById(id) {
      return RECEITAS_DATABASE.find(r => r.id === id) || null;
    },

    search(query, category = 'Todas') {
      const term = _normalize(query);
      return RECEITAS_DATABASE.filter(r => {
        const matchCat = category === 'Todas' || r.categoria === category;
        if (!matchCat) return false;
        if (!term) return true;

        const matchTitle = _normalize(r.titulo).includes(term);
        const matchInstr = _normalize(r.instrucoes).includes(term);
        const matchIngr = r.alimentosList && r.alimentosList.some(a => _normalize(a.nome).includes(term));

        return matchTitle || matchInstr || matchIngr;
      });
    },

    getSyncedRecipe(recipeIdOrObj) {
      let r = typeof recipeIdOrObj === 'string' ? this.getById(recipeIdOrObj) : recipeIdOrObj;
      if (!r) return null;

      const clone = JSON.parse(JSON.stringify(r));
      if (window.TacoDB && Array.isArray(clone.alimentosList)) {
        clone.alimentosList = clone.alimentosList.map(a => window.TacoDB.syncIngredient(a));
      }
      return clone;
    },

    calcMacros(recipe) {
      const synced = this.getSyncedRecipe(recipe) || recipe;
      let totKcal = 0, totCarb = 0, totProt = 0, totGord = 0;
      (synced.alimentosList || []).forEach(a => {
        totKcal += parseFloat(a.kcal) || 0;
        totCarb += parseFloat(a.carb) || 0;
        totProt += parseFloat(a.prot) || 0;
        totGord += parseFloat(a.gord) || 0;
      });
      return {
        kcal: Math.round(totKcal),
        carb: Math.round(totCarb * 10) / 10,
        prot: Math.round(totProt * 10) / 10,
        gord: Math.round(totGord * 10) / 10
      };
    }
  };
})();

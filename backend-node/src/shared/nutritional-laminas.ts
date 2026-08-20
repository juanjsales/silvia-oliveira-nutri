export interface NutritionalLamina {
  id: string;
  title: string;
  category: 'PRATICA' | 'COMPORTAMENTO' | 'ROTULOS' | 'HIGIENE' | 'HIDRATACAO' | 'SUBSTITUICAO';
  categoryLabel: string;
  summary: string;
  tips: string[];
  icon: string;
}

export const NUTRITIONAL_LAMINAS: NutritionalLamina[] = [
  {
    id: 'prato-ideal',
    title: 'Método do Prato Equilibrado',
    category: 'PRATICA',
    categoryLabel: 'Alimentação Prática',
    summary: 'Guia visual para montar um prato nutricionalmente completo e saciante em todas as principais refeições.',
    tips: [
      '50% do prato: Vegetais coloridos crus e cozidos (fibras, vitaminas e fitoquímicos).',
      '25% do prato: Proteínas de alto valor biológico (frango, peixe, ovos, tofu, leguminosas).',
      '25% do prato: Carboidratos complexos e raízes (arroz integral, mandioca, batata-doce, quinoa).',
      '1 fio de azeite de oliva extravirgem para absorção de vitaminas lipossolúveis (A, D, E, K).'
    ],
    icon: 'Salad',
  },
  {
    id: 'rotulos-alimentos',
    title: 'Guia Prático de Leitura de Rótulos',
    category: 'ROTULOS',
    categoryLabel: 'Educação Alimentar',
    summary: 'Aprenda a decifrar a lista de ingredientes e tabela nutricional para não cair em armadilhas.',
    tips: [
      'Ordem decrescente: O primeiro ingrediente da lista é sempre o que está em maior quantidade.',
      'Açúcar disfarçado: Atenção a xarope de milho, maltodextrina, sacarose, dextrose e néctar.',
      'Menos é mais: Prefira alimentos com menos de 5 ingredientes e sem nomes químicos desconhecidos.',
      'Gordura Trans Zero no rótulo pode conter gordura vegetal hidrogenada na lista de ingredientes.'
    ],
    icon: 'Tags',
  },
  {
    id: 'fome-saciedade',
    title: 'Escala de Fome & Saciedade (1 a 10)',
    category: 'COMPORTAMENTO',
    categoryLabel: 'Comportamento Alimentar',
    summary: 'Desenvolva a percepção dos seus sinais biológicos de fome física vs. fome emocional.',
    tips: [
      'Zona Ideal para Comer: Nível 3 a 4 (fome física moderada, sem urgência ou desespero).',
      'Zona Ideal para Parar: Nível 6 a 7 (satisfeito confortavelmente, com energia renovada).',
      'Coma devagar: O cérebro leva cerca de 20 minutos para processar os sinais hormonais de saciedade.',
      'Fome Emocional: Surge de repente para alimentos específicos (doces/gorduras) e não cessa após comer.'
    ],
    icon: 'Brain',
  },
  {
    id: 'hidratacao-correta',
    title: 'Guia de Hidratação Inteligente',
    category: 'HIDRATACAO',
    categoryLabel: 'Hidratação',
    summary: 'Como atingir sua meta diária de água com facilidade e monitorar a hidratação pela urina.',
    tips: [
      'Meta personalizada: Multiplique seu peso corporal por 35 ml (ex: 70 kg × 35 = 2.450 ml/dia).',
      'Monitore a urina: Deve estar em tom amarelo-palha claro (tons escuros indicam desidratação).',
      'Águas aromatizadas: Use hortelã, gengibre, rodelas de limão e canela em pau para variar o sabor.',
      'Não espere ter sede: A sensação de sede já é um sinal de desidratação celular em andamento.'
    ],
    icon: 'Droplets',
  },
  {
    id: 'substituicoes-praticas',
    title: 'Tabela de Substituições Saudáveis',
    category: 'SUBSTITUICAO',
    categoryLabel: 'Substituições',
    summary: 'Trocas simples para variar seu plano alimentar sem perder o equilíbrio calórico e nutricional.',
    tips: [
      'Arroz branco por arroz integral, quinoa, mandioca cozida ou batata-doce.',
      'Frituras por preparações assadas na grelha, forno ou airfryer com ervas naturais.',
      'Refrigerantes e sucos de caixinha por água com gás e limão espremido ou chá de hibisco.',
      'Doces refinados por frutas com canela, chocolate 70%+ cacau ou iogurte natural com frutas vermelhas.'
    ],
    icon: 'Repeat',
  },
  {
    id: 'higienizacao-hortifruti',
    title: 'Higienização Correta de Hortifrúti',
    category: 'HIGIENE',
    categoryLabel: 'Segurança Alimentar',
    summary: 'Passo a passo seguro para higienizar verduras, legumes e frutas sem riscos de contaminação.',
    tips: [
      'Lavagem prévia: Lave cada folha e fruto em água corrente para remover terra e sujidades.',
      'Solução clorada: 1 colher de sopa (10 ml) de água sanitária (ou hipoclorito a 2,5%) para cada 1 litro de água.',
      'Tempo de imersão: Deixe de molho por 15 minutos na solução clorada.',
      'Enxágue final: Enxágue abundantemente em água filtrada/potável e seque bem antes de guardar.'
    ],
    icon: 'Sparkles',
  },
  {
    id: 'gorduras-boas',
    title: 'Gorduras Boas & Anti-inflamatórias',
    category: 'PRATICA',
    categoryLabel: 'Nutrição Funcional',
    summary: 'Benefícios dos ácidos graxos essenciais para a saúde cardiovascular, cerebral e hormonal.',
    tips: [
      'Azeite de oliva extravirgem (acidez < 0,5%): Consuma cru por cima dos pratos prontos.',
      'Abacate e avocado: Ricos em ômega-9 e antioxidantes que promovem saciedade prolongada.',
      'Sementes funcionais: Chia e linhaça triturada fornecem ômega-3 vegetal (ALA) e fibras solúveis.',
      'Castanhas e nozes: 2 a 3 unidades de castanha-do-pará fornecem a dose diária necessária de selênio.'
    ],
    icon: 'HeartPulse',
  },
  {
    id: 'meal-prep-marmitas',
    title: 'Guia de Marmitas & Meal Prep Semanal',
    category: 'PRATICA',
    categoryLabel: 'Organização',
    summary: 'Como cozinhar uma vez e ter refeições nutritivas e saborosas para toda a semana.',
    tips: [
      'Planejamento no domingo: Escolha 2 fontes de proteína, 2 carboidratos e 3 legumes para a semana.',
      'Validade na geladeira: Preparações cozidas duram de 3 a 4 dias em potes herméticos de vidro.',
      'Congelamento seguro: Porcione antes de congelar; dura até 60 a 90 dias no freezer.',
      'Salada no pote: Coloque o molho no fundo, seguido de legumes firmes e folhas secas no topo.'
    ],
    icon: 'Boxes',
  },
  {
    id: 'fibras-no-dia', title: 'Fibras no Dia a Dia', category: 'PRATICA', categoryLabel: 'Saúde Intestinal',
    summary: 'Estratégias simples para aumentar fibras com variedade e adaptação gradual.',
    tips: ['Inclua frutas inteiras, legumes e verduras ao longo do dia.', 'Alterne feijão, lentilha, ervilha e grão-de-bico nas refeições.', 'Aumente as fibras aos poucos para favorecer a adaptação intestinal.', 'Associe o consumo de fibras a uma hidratação adequada.'], icon: 'Salad',
  },
  {
    id: 'acucar-bebidas', title: 'Açúcar nas Bebidas', category: 'ROTULOS', categoryLabel: 'Escolhas Conscientes',
    summary: 'Identifique açúcares adicionados e reduza bebidas adoçadas de forma progressiva.',
    tips: ['Confira açúcares adicionados e a porção informada no rótulo.', 'Observe nomes como sacarose, glicose, xaropes e maltodextrina.', 'Prefira água e bebidas sem açúcar na rotina.', 'Reduza gradualmente o açúcar de cafés, chás e preparações caseiras.'], icon: 'Tags',
  },
  {
    id: 'sodio-rotulos', title: 'Sódio: Onde Ele se Esconde', category: 'ROTULOS', categoryLabel: 'Saúde Cardiovascular',
    summary: 'Compare produtos e reconheça fontes frequentes de sódio além do saleiro.',
    tips: ['Compare o sódio por porção entre produtos semelhantes.', 'Atenção a embutidos, temperos prontos, molhos e macarrão instantâneo.', 'Use ervas, especiarias, alho, cebola e limão para realçar o sabor.', 'Considere também quantas porções serão realmente consumidas.'], icon: 'HeartPulse',
  },
  {
    id: 'lanche-equilibrado', title: 'Como Montar um Lanche Equilibrado', category: 'PRATICA', categoryLabel: 'Alimentação Prática',
    summary: 'Combine grupos alimentares para criar lanches práticos, variados e satisfatórios.',
    tips: ['Escolha uma fonte de carboidrato, como fruta, pão ou aveia.', 'Acrescente proteína, como iogurte, queijo, ovo ou pasta de leguminosas.', 'Inclua fibras ou gorduras boas com sementes, castanhas ou vegetais.', 'A quantidade deve respeitar sua fome, rotina e plano individual.'], icon: 'Boxes',
  },
  {
    id: 'comer-com-atencao', title: 'Comer com Atenção Plena', category: 'COMPORTAMENTO', categoryLabel: 'Comportamento Alimentar',
    summary: 'Crie pausas para perceber fome, sabor, satisfação e saciedade durante a refeição.',
    tips: ['Sempre que possível, sente-se e reduza distrações durante a refeição.', 'Observe aroma, textura e sabor antes de repetir automaticamente.', 'Faça uma pausa no meio da refeição para perceber sua saciedade.', 'Evite julgamentos: use a percepção como informação, não como cobrança.'], icon: 'Brain',
  },
  {
    id: 'planejamento-compras', title: 'Lista de Compras Inteligente', category: 'PRATICA', categoryLabel: 'Organização',
    summary: 'Planeje compras mais objetivas, econômicas e alinhadas às refeições da semana.',
    tips: ['Confira geladeira, freezer e despensa antes de criar a lista.', 'Planeje as principais refeições e anote apenas o necessário.', 'Organize a lista por setores para reduzir compras por impulso.', 'Priorize alimentos da estação e aproveitamento integral quando possível.'], icon: 'Boxes',
  },
  {
    id: 'conservacao-sobras', title: 'Conservação Segura de Sobras', category: 'HIGIENE', categoryLabel: 'Segurança Alimentar',
    summary: 'Cuidados essenciais para resfriar, armazenar e reaquecer preparações com segurança.',
    tips: ['Guarde as sobras em recipientes limpos, rasos e bem fechados.', 'Evite deixar preparações perecíveis por longos períodos em temperatura ambiente.', 'Identifique os potes com conteúdo e data de preparo.', 'Reaqueça apenas a porção que será consumida e descarte alimentos com sinais de alteração.'], icon: 'Sparkles',
  },
  {
    id: 'hidratacao-rotina', title: 'Hidratação na Rotina Corrida', category: 'HIDRATACAO', categoryLabel: 'Hidratação',
    summary: 'Use lembretes e pontos de apoio para distribuir líquidos ao longo do dia.',
    tips: ['Mantenha uma garrafa visível e acessível nos locais onde permanece mais tempo.', 'Associe pequenos goles a momentos da rotina, como acordar e fazer pausas.', 'Leve água em deslocamentos, atividades físicas e dias quentes.', 'Necessidades variam; siga a orientação individual quando houver restrição clínica.'], icon: 'Droplets',
  },
];

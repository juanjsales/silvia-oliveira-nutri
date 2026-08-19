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
];

export interface NutritionalLamina {
  id: string;
  title: string;
  category: 'PRATICA' | 'COMPORTAMENTO' | 'ROTULOS' | 'HIGIENE' | 'HIDRATACAO' | 'SUBSTITUICAO';
  categoryLabel: string;
  summary: string;
  tips: string[];
  icon: string;
}

const expanded=(id:string,title:string,category:NutritionalLamina['category'],categoryLabel:string,summary:string):NutritionalLamina=>({id,title,category,categoryLabel,summary,icon:category==='ROTULOS'?'Tags':category==='COMPORTAMENTO'?'Brain':'Salad',tips:['Use esta orientação como apoio ao plano alimentar individual.','Observe porções, frequência, tolerância e contexto clínico.','Priorize escolhas possíveis e mudanças graduais.','Consulte os detalhes e exemplos disponíveis no Portal do Paciente.']});
const EXPANDED_NUTRITIONAL_LAMINAS:NutritionalLamina[]=[
 expanded('grupos-alimentares','Conhecendo os Grupos Alimentares','PRATICA','Educação Alimentar','Funções dos principais grupos e combinações variadas.'),
 expanded('pratos-saudaveis-semana','Ideias de Pratos Saudáveis para a Semana','PRATICA','Alimentação Prática','Combinações simples para refeições equilibradas.'),
 expanded('lanches-saudaveis-semana','Ideias de Lanches para a Semana','PRATICA','Alimentação Prática','Lanches práticos com fibras e proteínas.'),
 expanded('ervas-especiarias','Ervas e Especiarias na Cozinha','PRATICA','Culinária Saudável','Sabores naturais para variar preparações.'),
 expanded('legumes-verduras','Como Incluir Mais Legumes e Verduras','PRATICA','Alimentação Prática','Estratégias graduais para aumentar variedade.'),
 expanded('cafe-manha-equilibrado','Como Montar um Café da Manhã Equilibrado','PRATICA','Alimentação Prática','Combinações para energia, proteína e fibras.'),
 expanded('frutas-acompanhamentos','Acompanhamentos para Comer com Frutas','PRATICA','Alimentação Prática','Complementos para refeições e lanches mais completos.'),
 expanded('alimentos-estacao','Frutas, Legumes e Verduras da Estação','PRATICA','Planejamento Alimentar','Sazonalidade para variar e economizar.'),
 expanded('anti-inflamatorios','Padrão Alimentar Anti-inflamatório','PRATICA','Nutrição Funcional','Hábitos alimentares associados à saúde metabólica.'),
 expanded('molhos-saudaveis','Molhos Caseiros para Saladas','PRATICA','Culinária Saudável','Molhos simples com controle de gordura e sódio.'),
 expanded('tipos-acucares','Tipos de Açúcares: O que Realmente Muda','ROTULOS','Educação Alimentar','Compare açúcares sem confundir origem com consumo livre.'),
 expanded('deficit-calorico','Déficit Calórico com Segurança','COMPORTAMENTO','Emagrecimento','Redução energética planejada sem dietas extremas.'),
 expanded('bebidas-alcoolicas','Bebidas Alcoólicas e Consumo Consciente','ROTULOS','Escolhas Conscientes','Impactos do álcool, das doses e dos acompanhamentos.'),
 expanded('bebidas-baixa-caloria','Escolhas de Bebidas no Emagrecimento','SUBSTITUICAO','Escolhas Conscientes','Compare bebidas dentro do planejamento individual.'),
 expanded('azeites-cozinha','Como Escolher Azeite para Cozinhar','ROTULOS','Culinária Saudável','Tipos, armazenamento e uso culinário.'),
 expanded('pre-treino','O que Comer Antes do Treino','PRATICA','Nutrição Esportiva','Refeição pré-treino conforme horário e tolerância.'),
 expanded('constipacao-intestinal','Estratégias para Constipação Intestinal','PRATICA','Saúde Intestinal','Fibras, líquidos, movimento e rotina intestinal.'),
 expanded('porcoes-maos','Porções com Medidas das Mãos','PRATICA','Educação Alimentar','Referências práticas quando não houver utensílios.'),
 expanded('whey-protein','Whey Protein: Tipos e Uso','ROTULOS','Suplementação','Diferenças gerais e critérios para suplementação.'),
 expanded('superavit-calorico','Superávit Calórico Planejado','PRATICA','Ganho de Peso','Aumento energético gradual e acompanhado.'),
 expanded('ganho-peso-saudavel','Estratégias para Ganho de Peso Saudável','PRATICA','Ganho de Peso','Mais densidade energética com qualidade nutricional.'),
 expanded('equilibrio-fim-semana','Como Equilibrar o Fim de Semana','COMPORTAMENTO','Comportamento Alimentar','Flexibilidade sem culpa ou compensação.'),
 expanded('erros-emagrecimento','Erros Comuns que Dificultam o Emagrecimento','COMPORTAMENTO','Emagrecimento','Padrões que prejudicam adesão e consistência.'),
 expanded('refeicao-livre','Como Funciona uma Refeição Flexível','COMPORTAMENTO','Comportamento Alimentar','Escolhas prazerosas sem prêmio ou descontrole.'),
 expanded('medidas-caseiras','Entendendo Medidas Caseiras','PRATICA','Educação Alimentar','Uso consistente de copos, xícaras e colheres.'),
 expanded('pao-tapioca','Pão ou Tapioca: Como Escolher','SUBSTITUICAO','Escolhas Conscientes','Compare contexto, porção, composição e combinação.'),
];

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
  { id:'medidas-antropometricas',title:'Como Acompanhar Medidas Corporais',category:'PRATICA',categoryLabel:'Avaliação Corporal',summary:'Orientações para repetir medidas de forma padronizada e acompanhar tendências sem ansiedade.',tips:['Use a mesma fita, posição corporal e horário sempre que possível.','Meça cintura, quadril, abdômen, braço, coxa e pescoço sem apertar a fita.','Registre a evolução em intervalos orientados, evitando medições diárias.','Interprete medidas junto com saúde, força, disposição e contexto clínico.'],icon:'Repeat' },
  { id:'escala-bristol',title:'Escala de Bristol & Saúde Intestinal',category:'COMPORTAMENTO',categoryLabel:'Saúde Intestinal',summary:'Guia visual para reconhecer o formato das fezes e conversar sobre hábitos intestinais.',tips:['Tipos 3 e 4 costumam representar consistência intestinal adequada.','Tipos 1 e 2 podem acompanhar constipação; observe água, fibras e rotina.','Tipos 6 e 7 indicam fezes amolecidas ou líquidas e merecem acompanhamento.','Sangue, dor persistente ou mudança prolongada exigem avaliação profissional.'],icon:'Boxes' },
  { id:'sono-apetite',title:'Sono, Apetite & Recuperação',category:'COMPORTAMENTO',categoryLabel:'Estilo de Vida',summary:'Entenda como a qualidade do sono influencia fome, escolhas alimentares e recuperação.',tips:['Mantenha horários de dormir e acordar tão regulares quanto possível.','Reduza cafeína no fim do dia e telas intensas próximo ao sono.','Planeje refeições para evitar chegar à noite com fome extrema.','Ronco intenso, pausas respiratórias e sonolência excessiva devem ser avaliados.'],icon:'Brain' },
  { id:'alimentacao-gestacao',title:'Alimentação Segura na Gestação',category:'HIGIENE',categoryLabel:'Gestação',summary:'Cuidados essenciais de segurança alimentar, hidratação e organização das refeições na gestação.',tips:['Evite carnes, ovos e pescados crus ou malpassados e leite não pasteurizado.','Higienize hortaliças e mantenha alimentos refrigerados adequadamente.','Distribua refeições conforme tolerância, náuseas e orientação individual.','Suplementos e ganho de peso devem seguir o acompanhamento pré-natal.'],icon:'HeartPulse' },
  { id:'alimentacao-infancia',title:'Prato Colorido para Crianças',category:'PRATICA',categoryLabel:'Infância',summary:'Estratégias respeitosas para ampliar variedade e autonomia alimentar na infância.',tips:['Ofereça variedade sem pressionar, ameaçar ou usar sobremesa como recompensa.','Inclua a criança no preparo e apresente o alimento repetidas vezes.','Mantenha rotina de refeições e limite distrações à mesa.','Respeite sinais de fome e saciedade e adapte cortes à segurança da idade.'],icon:'Salad' },
  { id:'nutricao-longevidade',title:'Nutrição para Longevidade Ativa',category:'PRATICA',categoryLabel:'Pessoa Idosa',summary:'Prioridades alimentares para preservar força, hidratação e autonomia ao envelhecer.',tips:['Distribua fontes de proteína ao longo do dia conforme orientação.','Facilite o acesso à água e observe alterações de sede e deglutição.','Valorize alimentos densos em nutrientes quando houver pouco apetite.','Perda de peso involuntária, fraqueza ou dificuldade para mastigar exigem avaliação.'],icon:'HeartPulse' },
  ...EXPANDED_NUTRITIONAL_LAMINAS,
];

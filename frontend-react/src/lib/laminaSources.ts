import type { NutritionalLamina } from './nutritionalLaminas';

export interface LaminaSource {
  institution: string;
  title: string;
  year: string;
  url: string;
}

const SOURCES: Record<string, LaminaSource> = {
  guia: {
    institution: 'Ministério da Saúde',
    title: 'Guia Alimentar para a População Brasileira — 2ª edição',
    year: '2014',
    url: 'https://www.gov.br/saude/pt-br/composicao/saps/promocao-da-saude/guias-alimentares/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf/view',
  },
  rotulagem: {
    institution: 'Anvisa',
    title: 'Rotulagem nutricional — RDC nº 429/2020 e IN nº 75/2020',
    year: '2020',
    url: 'https://www.gov.br/anvisa/pt-br/assuntos/alimentos/rotulagem/rotulagem-nutricional/',
  },
  higiene: {
    institution: 'Anvisa',
    title: 'Cartilha sobre Boas Práticas para Serviços de Alimentação — RDC nº 216/2004',
    year: '2004/2020',
    url: 'https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/manuais-guias-e-orientacoes/cartilha-boas-praticas-para-servicos-de-alimentacao.pdf',
  },
  crianca: {
    institution: 'Ministério da Saúde',
    title: 'Guia Alimentar para Crianças Brasileiras Menores de 2 Anos',
    year: '2019 (reimp. 2022)',
    url: 'https://www.gov.br/saude/pt-br/composicao/saps/promocao-da-saude/guias-alimentares/publicacoes/guia_da_crianca_2019.pdf/view',
  },
  gestante: {
    institution: 'Ministério da Saúde',
    title: 'Protocolo de cuidado pré-natal de baixo risco — planejamento terapêutico',
    year: 'atualizado',
    url: 'https://linhasdecuidado.saude.gov.br/portal/pre-natal-baixo-risco/unidade-de-atencao-primaria/planejamento-terapeutico/',
  },
  idoso: {
    institution: 'Ministério da Saúde',
    title: 'Caderneta Brasileira da Pessoa Idosa',
    year: '2026',
    url: 'https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/cadernetas-e-cartoes/caderneta-brasileira-da-pessoa-idosa/view',
  },
  hidratacao: {
    institution: 'European Food Safety Authority (EFSA)',
    title: 'Scientific Opinion on Dietary Reference Values for Water',
    year: '2010',
    url: 'https://www.efsa.europa.eu/en/efsajournal/pub/1459',
  },
  bristol: {
    institution: 'Heaton, K. W. et al.',
    title: 'Defecation frequency and timing, and stool form in the general population',
    year: '1992',
    url: 'https://pubmed.ncbi.nlm.nih.gov/1379343/',
  },
  antropometria: {
    institution: 'Ministério da Saúde',
    title: 'Orientações para coleta e análise de dados antropométricos em serviços de saúde — SISVAN',
    year: '2011',
    url: 'https://bvsms.saude.gov.br/bvs/publicacoes/orientacoes_coleta_analise_dados_antropometricos.pdf',
  },
  esporte: {
    institution: 'International Society of Sports Nutrition (ISSN)',
    title: 'Position stand: nutrient timing',
    year: '2017',
    url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0189-4',
  },
  proteina: {
    institution: 'International Society of Sports Nutrition (ISSN)',
    title: 'Position stand: protein and exercise',
    year: '2017',
    url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8',
  },
  alcool: {
    institution: 'Organização Mundial da Saúde (OMS)',
    title: 'No level of alcohol consumption is safe for our health',
    year: '2023',
    url: 'https://www.who.int/europe/news/item/04-01-2023-no-level-of-alcohol-consumption-is-safe-for-our-health',
  },
  sono: {
    institution: 'Sociedade Brasileira de Pediatria',
    title: 'Higiene do sono',
    year: '2021',
    url: 'https://www.sbp.com.br/fileadmin/user_upload/22962c-GPA-_Higiene_do_Sono.pdf',
  },
};

const BY_ID: Record<string, string[]> = {
  'rotulos-alimentos': ['rotulagem', 'guia'], 'acucar-bebidas': ['rotulagem', 'guia'],
  'sodio-rotulos': ['rotulagem', 'guia'], 'tipos-acucares': ['rotulagem', 'guia'],
  'whey-protein': ['rotulagem', 'proteina'], 'azeites-cozinha': ['rotulagem', 'guia'],
  'bebidas-alcoolicas': ['alcool', 'guia'], 'hidratacao-correta': ['hidratacao'],
  'hidratacao-rotina': ['hidratacao', 'guia'], 'higienizacao-hortifruti': ['higiene'],
  'conservacao-sobras': ['higiene'], 'meal-prep-marmitas': ['higiene', 'guia'],
  'alimentacao-gestacao': ['gestante', 'higiene'], 'alimentacao-infancia': ['crianca'],
  'nutricao-longevidade': ['idoso', 'guia'], 'escala-bristol': ['bristol'],
  'medidas-antropometricas': ['antropometria'], 'pre-treino': ['esporte'],
  'sono-apetite': ['sono'],
};

const BY_CATEGORY: Record<NutritionalLamina['category'], string[]> = {
  PRATICA: ['guia'], COMPORTAMENTO: ['guia'], ROTULOS: ['rotulagem', 'guia'],
  HIGIENE: ['higiene'], HIDRATACAO: ['hidratacao'], SUBSTITUICAO: ['guia'],
};

export function getLaminaSources(lamina: Pick<NutritionalLamina, 'id'> & Partial<Pick<NutritionalLamina, 'category'>>): LaminaSource[] {
  return (BY_ID[lamina.id] || (lamina.category ? BY_CATEGORY[lamina.category] : undefined) || ['guia']).map((key) => SOURCES[key]);
}

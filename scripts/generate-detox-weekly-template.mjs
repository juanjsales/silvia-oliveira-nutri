import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TACO = 'TACO/UNICAMP 4ª ed. e catálogo TACO curado do sistema';
const USDA = 'USDA FoodData Central';
const IBGE = 'IBGE POF 2008-2009 - Tabela de Medidas Referidas';

const food = {
  abacate:[96,6,1.2,8.4,TACO],abacaxi:[48,12.3,.5,.1,TACO],abobora:[48,10.8,1.4,.7,TACO],
  acerola:[33,8,.9,.2,TACO],aguaCoco:[19,3.7,.7,.2,TACO],alface:[11,1.7,1.3,.2,TACO],
  amendoas:[579,21.6,21.2,49.9,USDA],ameixaSeca:[240,63.9,2.2,.4,TACO],arrozIntegral:[124,25.8,2.6,1,TACO],
  atum:[116,0,25.5,1,TACO],aveia:[394,66.6,13.9,8.5,TACO],azeite:[884,0,0,100,TACO],
  banana:[98,26,1.3,.1,TACO],batataDoce:[77,18.4,.6,.1,TACO],beterraba:[43,9.6,1.6,.2,TACO],
  brocolis:[25,4.4,2.1,.3,TACO],castanhaCaju:[553,30.2,18.2,43.8,USDA],castanhaPara:[643,15.1,14.5,63.5,TACO],
  cenoura:[34,7.7,1.3,.2,TACO],coco:[354,15.2,3.3,33.5,USDA],couve:[27,4.3,2.9,.5,TACO],
  ervilha:[63,13.4,4.8,.4,TACO],feijaoCarioca:[76,13.6,4.8,.5,TACO],feijaoVermelho:[91,16.4,6.2,.5,USDA],
  frango:[159,0,32,2.5,TACO],gergelim:[573,23.4,17.7,49.7,TACO],gengibre:[80,17.8,1.8,.8,USDA],
  granola:[421,68.4,10,12.5,TACO],iogurte:[41,5.8,3.8,.3,TACO],laranja:[46,11.5,1,.1,TACO],
  lentilha:[93,16.3,6.3,.4,TACO],maca:[56,14.5,.3,.2,TACO],macadamia:[718,13.8,7.9,75.8,USDA],
  linhaca:[495,43.3,14.1,32.3,TACO],limao:[32,11.1,.9,.1,TACO],alhoPoro:[61,14.2,1.5,.3,USDA],
  couveFlor:[23,4.5,1.8,.5,USDA],graoBico:[120,20.1,7,2,TACO],paoIntegral:[247,49.9,9.4,3.7,TACO],sucoUva:[60,14.8,.4,.1,USDA],
  macarraoIntegral:[124,26.5,5.3,.5,TACO],mamao:[45,11.6,.5,.1,TACO],mandioquinha:[80,18.9,.9,.2,IBGE],
  manga:[60,15,.8,.4,TACO],melancia:[30,7.6,.6,.2,USDA],milho:[98,17.1,3.2,2.4,TACO],
  morango:[30,6.8,.9,.3,TACO],nozes:[620,13.7,14,59.4,TACO],ovoMexido:[196,1.1,12.8,15.3,TACO],
  pera:[57,15.2,.4,.1,USDA],peixe:[128,0,26,2.7,TACO],pistache:[560,27.2,20.2,45.3,USDA],
  pipoca:[448,70.3,9.9,15.9,TACO],queijoMinas:[264,3.2,17.4,20.2,TACO],ricota:[140,3.8,12.6,8.1,TACO],
  sementeAbobora:[559,10.7,30.2,49.1,USDA],sementeGirassol:[584,20,20.8,51.5,USDA],
  tapioca:[240,60,.4,.2,TACO],tomate:[15,3.1,1.1,.2,TACO],torradaIntegral:[407,74.6,11.3,7.5,TACO],
  uva:[53,13.6,.7,.2,TACO],yacon:[33,8.4,.4,.1,IBGE],
};

const round = value => Math.round(value * 10) / 10;
const ingredient = (name,key,grams,amountText,assumption,estimated=true) => {
  const [kcal,carbohydrate,protein,fat,source]=food[key];
  const factor=grams/100;
  return {id:`detox-${key}-${grams}-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,name,amount:grams,unit:key==='aguaCoco'?'ml':'g',amountText,
    macros:{kcal:round(kcal*factor),carbohydrate:round(carbohydrate*factor),protein:round(protein*factor),fat:round(fat*factor)},
    nutritionSource:source,estimated,assumption};
};
const zero = (name,amountText,assumption='Infusão sem açúcar; energia desprezível.') => ({id:`detox-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,name,amount:0,unit:'ml',amountText,macros:{kcal:0,carbohydrate:0,protein:0,fat:0},nutritionSource:'Preparação sem açúcar',estimated:true,assumption});
const meal=(dayOfWeek,title,time,items,notes='',substitutions=[])=>({id:`detox-${dayOfWeek}-${time.replace(':','')}-${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,dayOfWeek,title,time,items,notes,substitutions});
const salad=()=>[
  ingredient('Folhas verdes variadas','alface',60,'à vontade (estimativa: 60 g)','Porção operacional para cálculo; consumo real pode variar.'),
  ingredient('Tomate','tomate',50,'1/2 unidade média (50 g)','Medida caseira baseada em referência IBGE.'),
  ingredient('Azeite de oliva extravirgem','azeite',5,'1 colher de chá (5 ml)','Incluído para representar o tempero descrito no plano.'),
];
const fruitMix=(seedKey,seedName)=>[
  ingredient('Mamão papaia','mamao',50,'1/2 xícara (50 g)','Composição estimada da porção de frutas.'),
  ingredient('Maçã com casca','maca',50,'1/2 unidade pequena (50 g)','Composição estimada da porção de frutas.'),
  ingredient('Abacaxi','abacaxi',50,'1 fatia pequena (50 g)','Composição estimada da porção de frutas.'),
  ingredient(seedName,seedKey,20,'2 colheres de sopa rasas (20 g)','Peso padronizado para a medida caseira informada.'),
];
const greenJuice=(extra=[])=>[
  ingredient('Couve-manteiga crua','couve',40,'2 folhas médias (40 g)','Peso médio estimado pelas medidas caseiras do IBGE.'),
  ingredient('Maçã com casca','maca',100,'1 unidade média (100 g)','Peso comestível aproximado.'),
  ingredient('Gengibre fresco','gengibre',5,'1 rodela fina (5 g)','Peso estimado.'),...extra,
  zero('Água filtrada','200 ml','Não altera os macronutrientes.'),
];
const tapioca=(filling)=>[ingredient('Goma de tapioca hidratada','tapioca',50,'1 tapioca média - 50 g de goma','Porção-padrão explicitada para permitir cálculo.'),...filling];
const omelet=(extra=[])=>[ingredient('Ovos mexidos','ovoMexido',100,'2 unidades médias (100 g)','Peso comestível médio.'),...extra];
const lunchSalad=salad;

const meals=[
  // Segunda-feira
  meal(1,'Café da manhã','07:00',[...greenJuice(),...tapioca([ingredient('Banana-prata','banana',50,'1/2 unidade média (50 g)','Opção principal adotada para o cálculo.')])],'A alternativa com queijo permanece registrada como substituição.',[{option:'Queijo minas com orégano',equivalence:'30 g no lugar da banana; altera o perfil de carboidrato, proteína e gordura.'}]),
  meal(1,'Lanche da manhã','10:00',fruitMix('sementeAbobora','Semente de abóbora'),'“Porção de frutas” operacionalizada como 150 g de frutas variadas.'),
  meal(1,'Almoço','12:00',[ingredient('Arroz integral cozido','arrozIntegral',75,'3 colheres de sopa cheias (75 g)','Conversão baseada em medida referida do IBGE.'),ingredient('Feijão carioca cozido','feijaoCarioca',100,'1 concha média (100 g)','Conversão operacional baseada em medida referida.'),ingredient('Filé de peixe grelhado','peixe',100,'1 filé médio (100 g)','Peso-padrão para filé médio.'),ingredient('Legumes cozidos variados','cenoura',100,'4 colheres de sopa (100 g)','Representado por cenoura cozida/ralada para cálculo.'),...lunchSalad(),zero('Água com limão','200 ml','Limão usado apenas para sabor; valor energético desprezível na diluição.')]),
  meal(1,'Lanche da tarde I','14:00',[ingredient('Nozes','nozes',20,'5 unidades (20 g)','Peso médio estimado.'),ingredient('Castanha-do-pará','castanhaPara',5,'1 unidade (5 g)','Catálogo considera aproximadamente 20 unidades/100 g.')]),
  meal(1,'Lanche da tarde II','16:00',[ingredient('Suco de uva integral','sucoUva',150,'150 ml','Referência de suco integral; o rótulo da marca pode variar.'),ingredient('Couve-manteiga crua','couve',30,'3 cubos congelados (30 g)','Peso estimado para os cubos descritos.')]),
  meal(1,'Jantar','20:00',[...omelet(),ingredient('Arroz integral cozido','arrozIntegral',75,'3 colheres de sopa (75 g)','Conversão IBGE.'),...salad()]),
  meal(1,'Ceia','22:30',[ingredient('Maçã assada com canela','maca',100,'1 unidade média (100 g)','Sem açúcar adicionado.'),zero('Chá de camomila','200 ml')]),

  // Terça-feira
  meal(2,'Café da manhã','07:00',[ingredient('Pera','pera',130,'1 unidade média (130 g)','Peso comestível médio USDA/IBGE.'),ingredient('Granola','granola',20,'2 colheres de sopa (20 g)','Peso estimado.'),ingredient('Iogurte natural desnatado','iogurte',170,'1 pote (170 g)','Pote individual padrão.'),ingredient('Morango','morango',60,'5 unidades médias (60 g)','Peso médio estimado.'),zero('Infusão de hibisco','200 ml')]),
  meal(2,'Lanche da manhã','10:00',fruitMix('sementeGirassol','Semente de girassol'),'Porção de frutas padronizada em 150 g.'),
  meal(2,'Almoço','12:00',[ingredient('Mandioquinha cozida','mandioquinha',90,'3 colheres de sopa (90 g)','“Batata-salsa” interpretada como mandioquinha.'),ingredient('Grão-de-bico cozido','graoBico',75,'3 colheres de sopa (75 g)','Peso padronizado pela medida caseira.'),...omelet(),ingredient('Cenoura crua','cenoura',60,'2 colheres de sopa (60 g)','Medida estimada.'),ingredient('Beterraba crua','beterraba',60,'2 colheres de sopa (60 g)','Medida estimada.'),...salad(),ingredient('Abacaxi','abacaxi',80,'1 fatia média (80 g)','Peso médio estimado.')]),
  meal(2,'Lanche da tarde I','14:00',[ingredient('Laranja-pera','laranja',130,'1 unidade média (130 g)','Peso comestível médio.'),ingredient('Castanha-do-pará','castanhaPara',10,'2 unidades (10 g)','5 g por unidade.')]),
  meal(2,'Lanche da tarde II','16:00',[zero('Café sem açúcar','100 ml'),ingredient('Torrada integral','torradaIntegral',30,'3 unidades (30 g)','10 g por torrada.'),ingredient('Ricota fresca','ricota',45,'3 colheres de sopa de pasta (45 g)','Pasta sem adição de óleo.')]),
  meal(2,'Jantar','20:00',[...salad(),ingredient('Mandioquinha cozida','mandioquinha',120,'1 unidade pequena (120 g)','Porção-padrão pesquisada.'),ingredient('Atum em água','atum',80,'1/2 lata drenada (80 g)','Peso drenado aproximado.')]),
  meal(2,'Ceia','22:30',[ingredient('Ameixa-preta seca','ameixaSeca',10,'1 unidade (10 g)','Peso médio estimado.'),zero('Chá de melissa','200 ml')]),

  // Quarta-feira
  meal(3,'Café da manhã','07:00',[...omelet([ingredient('Aveia em flocos','aveia',15,'1 colher de sopa (15 g)','Peso estimado.')]),zero('Café sem açúcar','100 ml'),ingredient('Morango','morango',60,'5 unidades (60 g)','Frutas sortidas representadas por morango.'),ingredient('Pera','pera',65,'1/2 unidade (65 g)','Frutas sortidas.')]),
  meal(3,'Lanche da manhã','10:00',fruitMix('gergelim','Gergelim'),'Porção de frutas padronizada em 150 g.'),
  meal(3,'Almoço','12:00',[ingredient('Arroz integral cozido','arrozIntegral',75,'3 colheres de sopa (75 g)','Conversão IBGE.'),ingredient('Brócolis cozido','brocolis',50,'2 colheres de sopa (50 g)','Parte da preparação do arroz.'),ingredient('Ervilha cozida','ervilha',100,'4 colheres de sopa (100 g)','Com cenoura.'),ingredient('Cenoura','cenoura',40,'2 colheres de sopa (40 g)','Com a ervilha.'),ingredient('Purê de abóbora','abobora',90,'3 colheres de sopa (90 g)','Sem creme ou manteiga.'),...salad(),ingredient('Mamão papaia','mamao',150,'1/2 unidade pequena (150 g)','Peso comestível estimado.'),ingredient('Frango desfiado','frango',100,'1 porção (100 g)','Porção-padrão para proteína.')]),
  meal(3,'Lanche da tarde I','14:00',[ingredient('Pistache','pistache',5,'5 unidades sem casca (5 g)','Peso médio USDA.'),ingredient('Castanha-do-pará','castanhaPara',5,'1 unidade (5 g)','Peso médio.')]),
  meal(3,'Lanche da tarde II','16:00',[ingredient('Acerola','acerola',100,'1 copo de suco - 100 g de polpa','Sem açúcar; água não contabilizada.'),ingredient('Couve','couve',20,'2 cubos (20 g)','Peso estimado.'),ingredient('Gergelim','gergelim',10,'1 colher de sopa (10 g)','Peso estimado.')]),
  meal(3,'Jantar','20:00',[...salad(),ingredient('Abóbora cozida','abobora',180,'1 prato fundo de sopa - 180 g','Receita-padrão sem creme.'),ingredient('Gengibre','gengibre',5,'1 colher de chá (5 g)','Adicionado à sopa.'),ingredient('Azeite de oliva','azeite',5,'1 colher de chá (5 ml)','Adicionado à sopa.')]),
  meal(3,'Ceia','22:30',[ingredient('Pera','pera',130,'1 unidade média (130 g)','Peso comestível médio.'),zero('Chá de camomila','200 ml')]),

  // Quinta-feira
  meal(4,'Café da manhã','07:00',[ingredient('Melancia','melancia',150,'1 fatia média (150 g)','Base do suchá rosa.'),ingredient('Morango','morango',60,'5 unidades (60 g)','Base do suchá rosa.'),zero('Infusão de hibisco','200 ml'),...omelet([ingredient('Queijo minas frescal','queijoMinas',30,'1 fatia (30 g)','Recheio do omelete.')])],'Suchá rosa calculado sem açúcar adicionado.'),
  meal(4,'Lanche da manhã','10:00',fruitMix('sementeGirassol','Semente de girassol'),'Porção de frutas padronizada em 150 g.'),
  meal(4,'Almoço','12:00',[ingredient('Macarrão integral cozido','macarraoIntegral',120,'2 pegadores (120 g)','Peso referido aproximado.'),ingredient('Tomate','tomate',80,'1 unidade pequena (80 g)','Molho fresco.'),ingredient('Azeite','azeite',5,'1 colher de chá (5 ml)','Molho com alho e manjericão.'),...salad(),ingredient('Abacaxi','abacaxi',80,'1 fatia média (80 g)','Peso médio.'),ingredient('Almôndegas de frango','frango',100,'4 unidades pequenas (100 g)','Estimativa com peito de frango, sem farinha adicional.')]),
  meal(4,'Lanche da tarde I','14:00',[ingredient('Coco fresco','coco',40,'1/2 porção pequena (40 g)','O documento não define tamanho; porção operacional USDA.'),ingredient('Castanha-do-pará','castanhaPara',5,'1 unidade (5 g)','Peso médio.')]),
  meal(4,'Lanche da tarde II','16:00',[ingredient('Abacaxi','abacaxi',150,'1 copo de suco - 150 g de fruta','Sem açúcar; água não contabilizada.'),ingredient('Pão integral','paoIntegral',50,'2 fatias (50 g)','Substitui o “sanduíche - ver anexo”, ausente no PDF.'),ingredient('Ricota','ricota',40,'2 colheres de sopa (40 g)','Recheio-padrão estimado.'),ingredient('Tomate','tomate',30,'2 rodelas (30 g)','Recheio-padrão estimado.')],'O anexo do sanduíche não foi fornecido; composição marcada como estimativa para revisão.'),
  meal(4,'Jantar','20:00',[...salad(),ingredient('Arroz integral','arrozIntegral',100,'1 porção de risoto (100 g de arroz cozido)','Base estimada da preparação.'),ingredient('Legumes variados','cenoura',100,'1 xícara (100 g)','Representados por cenoura.'),ingredient('Azeite','azeite',5,'1 colher de chá (5 ml)','Gordura de preparo.')]),
  meal(4,'Ceia','22:30',[ingredient('Maçã assada com canela','maca',100,'1 unidade média (100 g)','Sem açúcar adicionado.'),zero('Chá de melissa','200 ml')]),

  // Sexta-feira
  meal(5,'Café da manhã','07:00',[...greenJuice([ingredient('Batata yacon','yacon',80,'1 unidade pequena (80 g)','Peso estimado; composição IBGE/TBCA.'),zero('Hortelã','folhas frescas')]),ingredient('Morango','morango',60,'5 unidades (60 g)','Frutas sortidas.'),ingredient('Manga','manga',80,'1/2 xícara (80 g)','Frutas sortidas.'),ingredient('Linhaça dourada','linhaca',10,'1 colher de sopa (10 g)','Peso padronizado pela medida caseira.')]),
  meal(5,'Lanche da manhã','10:00',fruitMix('sementeAbobora','Semente de abóbora'),'Porção de frutas padronizada em 150 g.'),
  meal(5,'Almoço','12:00',[ingredient('Arroz integral','arrozIntegral',75,'3 colheres de sopa (75 g)','Conversão IBGE.'),ingredient('Couve-flor cozida','couveFlor',50,'2 colheres de sopa (50 g)','Peso padronizado pela medida caseira.'),ingredient('Peixe ensopado','peixe',100,'1 filé médio (100 g)','Sem óleo adicional.'),ingredient('Legumes refogados','cenoura',90,'3 colheres de sopa (90 g)','Representados por cenoura.'),ingredient('Azeite','azeite',5,'1 colher de chá (5 ml)','Refogado.'),...salad(),zero('Água com limão','200 ml')]),
  meal(5,'Lanche da tarde I','14:00',[ingredient('Castanha de caju','castanhaCaju',8,'5 unidades (8 g)','Peso médio USDA.'),ingredient('Castanha-do-pará','castanhaPara',5,'1 unidade (5 g)','Peso médio.')]),
  meal(5,'Lanche da tarde II','16:00',[ingredient('Limão','limao',30,'Suco de 1 limão (30 g)','Peso comestível estimado.'),zero('Água','200 ml'),ingredient('Pipoca pronta','pipoca',25,'2 xícaras (25 g)','Sem manteiga; quantidade estimada.')]),
  meal(5,'Jantar','20:00',[...salad(),ingredient('Peito de frango assado','frango',100,'1 filé médio (100 g)','Sem pele.'),ingredient('Legumes assados','cenoura',120,'1 xícara (120 g)','Representados por cenoura.'),ingredient('Azeite','azeite',5,'1 colher de chá (5 ml)','Preparo dos legumes.')]),
  meal(5,'Ceia','22:30',[ingredient('Ameixa-preta seca','ameixaSeca',10,'1 unidade (10 g)','Peso médio.'),zero('Chá de camomila','200 ml')]),

  // Sábado
  meal(6,'Café da manhã','07:00',[ingredient('Cenoura','cenoura',80,'1 unidade pequena (80 g)','Base do suco amarelo.'),ingredient('Manga','manga',100,'1/2 manga (100 g)','Base do suco.'),ingredient('Linhaça','linhaca',10,'1 colher de sopa (10 g)','Peso padronizado pela medida caseira.'),ingredient('Água de coco','aguaCoco',200,'1 copo (200 ml)','Volume informado.'),...tapioca([ingredient('Morango','morango',60,'5 unidades (60 g)','Recheio.'),ingredient('Banana','banana',50,'1/2 unidade (50 g)','Recheio alternado com kiwi, não disponível no catálogo.')])]),
  meal(6,'Lanche da manhã','10:00',fruitMix('gergelim','Gergelim'),'Porção de frutas padronizada em 150 g.'),
  meal(6,'Almoço','12:00',[ingredient('Arroz integral','arrozIntegral',75,'3 colheres de sopa (75 g)','Conversão IBGE.'),ingredient('Alho-poró','alhoPoro',20,'2 colheres de sopa (20 g)','Peso padronizado pela medida caseira.'),ingredient('Lentilha cozida','lentilha',100,'1 concha (100 g)','Conversão operacional.'),ingredient('Peixe ensopado','peixe',100,'1 filé médio (100 g)','Com pimentão, cebola e tomate.'),ingredient('Tomate','tomate',60,'1/2 unidade (60 g)','Parte do ensopado.'),...salad(),ingredient('Abacaxi','abacaxi',80,'1 fatia média (80 g)','Peso médio.')]),
  meal(6,'Lanche da tarde I','14:00',[ingredient('Amêndoas','amendoas',6,'5 unidades (6 g)','Peso médio USDA.'),ingredient('Castanha-do-pará','castanhaPara',5,'1 unidade (5 g)','Peso médio.'),ingredient('Ameixa seca','ameixaSeca',30,'3 unidades (30 g)','Frutas secas representadas por ameixa.')]),
  meal(6,'Lanche da tarde II','16:00',[zero('Chá verde','200 ml'),...tapioca([ingredient('Geleia sem açúcar','morango',30,'1 colher de sopa (30 g)','Estimativa com morango puro; rótulo pode variar.')])]),
  meal(6,'Jantar','20:00',[...omelet(),...salad()]),
  meal(6,'Ceia','22:30',[ingredient('Pera','pera',130,'1 unidade média (130 g)','Peso médio.'),zero('Chá de melissa','200 ml')]),

  // Domingo
  meal(0,'Café da manhã','07:00',[...greenJuice(),...tapioca(omelet())]),
  meal(0,'Lanche da manhã','10:00',fruitMix('sementeAbobora','Semente de abóbora'),'Porção de frutas padronizada em 150 g.'),
  meal(0,'Almoço','12:00',[ingredient('Arroz integral','arrozIntegral',75,'3 colheres de sopa (75 g)','Conversão IBGE.'),ingredient('Milho cozido','milho',40,'2 colheres de sopa (40 g)','Misturado ao arroz.'),ingredient('Cenoura','cenoura',40,'2 colheres de sopa (40 g)','Misturada ao arroz.'),ingredient('Feijão vermelho','feijaoVermelho',100,'1 concha (100 g)','Conversão operacional.'),...omelet([ingredient('Tomate','tomate',40,'1/2 unidade pequena (40 g)','Legumes do omelete.')]),...salad(),ingredient('Abacaxi','abacaxi',80,'1/2 copo de suco - 80 g de fruta','Com hortelã; sem açúcar.')]),
  meal(0,'Lanche da tarde I','14:00',[ingredient('Macadâmia','macadamia',12,'5 unidades (12 g)','Peso médio USDA.'),ingredient('Castanha-do-pará','castanhaPara',5,'1 unidade (5 g)','Peso médio.'),ingredient('Ameixa seca','ameixaSeca',30,'3 unidades (30 g)','Frutas secas representadas por ameixa.')]),
  meal(0,'Lanche da tarde II','16:00',[...tapioca([ingredient('Tomate','tomate',80,'1 unidade pequena (80 g)','Cobertura.'),ingredient('Azeite','azeite',5,'1 colher de chá (5 ml)','Cobertura.'),ingredient('Gergelim','gergelim',10,'1 colher de sopa (10 g)','Cobertura.')])],'Temperar com manjericão.'),
  meal(0,'Jantar','20:00',[...salad(),ingredient('Cenoura cozida','cenoura',180,'1 prato fundo de creme - 180 g','Base sem creme de leite.'),ingredient('Gengibre','gengibre',5,'1 colher de chá (5 g)','Tempero.'),ingredient('Azeite','azeite',5,'1 colher de chá (5 ml)','Preparo.')]),
  meal(0,'Ceia','22:30',[ingredient('Amêndoas','amendoas',6,'5 unidades (6 g)','Peso médio USDA.'),zero('Chá de melissa','200 ml')]),
];

const sum=(items)=>items.reduce((total,item)=>({kcal:total.kcal+item.macros.kcal,protein:total.protein+item.macros.protein,carbohydrate:total.carbohydrate+item.macros.carbohydrate,fat:total.fat+item.macros.fat}),{kcal:0,protein:0,carbohydrate:0,fat:0});
const dailyNutrition=Object.fromEntries([1,2,3,4,5,6,0].map(day=>[String(day),Object.fromEntries(Object.entries(sum(meals.filter(meal=>meal.dayOfWeek===day).flatMap(meal=>meal.items))).map(([key,value])=>[key,round(value)]))]));
const dailyValues=Object.values(dailyNutrition);
const average=round(dailyValues.reduce((total,day)=>total+day.kcal,0)/dailyValues.length);
const content={schemaVersion:2,scheduleType:'WEEKLY',patientVisibility:'FULL',meals,dailyNutrition,
  targets:{mode:'RANGE',kcalMin:String(Math.floor(Math.min(...dailyValues.map(day=>day.kcal))/50)*50),kcalMax:String(Math.ceil(Math.max(...dailyValues.map(day=>day.kcal))/50)*50),proteinMin:'',proteinMax:''},
  orientations:[
    'Modelo semanal transcrito do arquivo Detox Silvia.pdf. “Detox” é o nome de origem do material e não representa alegação de desintoxicação ou tratamento.',
    'Valores nutricionais são estimativas calculadas a partir das quantidades explicitadas e das porções-padrão documentadas.',
    'Itens “à vontade”, preparações compostas e o sanduíche sem anexo devem ser revisados e personalizados pela nutricionista antes da publicação.',
    'Chás, café e sucos foram considerados sem açúcar adicionado.',
  ],
  nutritionMethod:{calculatedAt:'2026-08-27',sources:[
    {name:'TACO/UNICAMP 4ª edição',url:'https://www.gov.br/agricultura/pt-br/assuntos/inspecao/produtos-vegetal/legislacao-programas-nacionais-e-seguranca-dos-alimentos-1/legislacao/legislacao-vinhos-e-bebidas/tabela-brasileira-de-composicao-de-alimentos_taco_2011.pdf'},
    {name:'IBGE - Tabela de Medidas Referidas para os Alimentos Consumidos no Brasil',url:'https://biblioteca.ibge.gov.br/visualizacao/livros/liv50000.pdf'},
    {name:'USDA FoodData Central',url:'https://fdc.nal.usda.gov/'},
  ],notice:'Resultados calculados, sujeitos a variação por marca, maturação, rendimento, técnica culinária e tamanho real da porção.'}};

const json=JSON.stringify(content,null,2).replaceAll('$template$','$ template $');
const sql=`-- Generated by scripts/generate-detox-weekly-template.mjs\n-- Source document: Detox Silvia.pdf; nutritional values are calculated estimates.\nINSERT INTO meal_plan_templates(legacy_id,title,objective,target_kcal,content,active)\nVALUES(\n  'detox-silvia-weekly-v1',\n  'Plano semanal Detox Silvia',\n  'Modelo semanal de organização alimentar com sete refeições por dia. Requer revisão e personalização profissional antes da publicação.',\n  ${average},\n  $template$${json}$template$::jsonb,\n  true\n)\nON CONFLICT(legacy_id) DO UPDATE SET\n  title=excluded.title, objective=excluded.objective, target_kcal=excluded.target_kcal,\n  content=excluded.content, active=true, updated_at=now();\n`;
writeFileSync(resolve('backend-node/src/database/migrations/045_detox_silvia_weekly_template.sql'),sql,'utf8');
console.log(JSON.stringify({meals:meals.length,averageKcal:average,dailyNutrition},null,2));

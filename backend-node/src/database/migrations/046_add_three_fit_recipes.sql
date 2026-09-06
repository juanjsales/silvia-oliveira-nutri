WITH saved_recipe AS (
  INSERT INTO recipes(legacy_id,title,category,preparation_time,yield_text,instructions,active)
  VALUES(
    'receita_geleia_amora_fit',
    'Geleia de Amora Fit',
    'Doces e sobremesas',
    'Aproximadamente 35 minutos',
    '1 pote (aproximadamente 450 g)',
    E'1. Higienize as amoras e reúna os ingredientes.\n2. Coloque as amoras, a pasta de tâmaras e o suco de limão em uma panela média.\n3. Cozinhe em fogo médio, amassando as frutas e misturando os ingredientes.\n4. Quando ferver, reduza para fogo baixo e cozinhe lentamente, mexendo de vez em quando. Se necessário, acrescente pequenas quantidades de água para evitar que a mistura seque ou grude.\n5. Desligue quando a geleia estiver cremosa e ainda conservar um pouco de umidade; ela ficará mais consistente depois de fria. Ajuste a doçura, se desejar.\n6. Transfira para um pote de vidro limpo e seco, mantenha refrigerada e consuma em até 15 dias.\n\nOs valores nutricionais são estimados e podem variar conforme o adoçante utilizado.',
    true
  )
  ON CONFLICT(legacy_id) DO UPDATE SET
    title=excluded.title,category=excluded.category,preparation_time=excluded.preparation_time,
    yield_text=excluded.yield_text,instructions=excluded.instructions,active=true,updated_at=now()
  RETURNING id
), cleared AS (
  DELETE FROM recipe_ingredients WHERE recipe_id=(SELECT id FROM saved_recipe)
)
INSERT INTO recipe_ingredients(recipe_id,position,name_snapshot,amount_text,kcal,carbohydrate,protein,fat)
SELECT (SELECT id FROM saved_recipe),position,name,amount,kcal,carbohydrate,protein,fat
FROM (VALUES
  (1,'Amora','4 xícaras (aprox. 530 g)',228.0,50.9,7.4,2.6),
  (2,'Pasta de tâmaras','2 colheres de sopa (aprox. 40 g)',113.0,30.0,0.8,0.2),
  (3,'Suco de limão','1 colher de sopa (aprox. 15 ml)',3.0,1.0,0.1,0.0)
) AS ingredient(position,name,amount,kcal,carbohydrate,protein,fat);

WITH saved_recipe AS (
  INSERT INTO recipes(legacy_id,title,category,preparation_time,yield_text,instructions,active)
  VALUES(
    'receita_mousse_chocolate_fit',
    'Mousse de Chocolate Fit',
    'Doces e sobremesas',
    '15 minutos, mais tempo de geladeira',
    'Aproximadamente 4 porções',
    E'1. Reúna todos os ingredientes.\n2. Derreta o chocolate no micro-ondas, em intervalos curtos, ou em banho-maria. Deixe amornar.\n3. Corte o abacate, descarte o caroço e coloque a polpa no liquidificador.\n4. Adicione o chocolate derretido em temperatura ambiente e bata até obter um creme liso e homogêneo.\n5. Distribua em um refratário ou em porções individuais, decore com raspas de chocolate e leve à geladeira antes de servir.\n\nOs valores nutricionais são estimados e não incluem as raspas opcionais usadas na decoração.',
    true
  )
  ON CONFLICT(legacy_id) DO UPDATE SET
    title=excluded.title,category=excluded.category,preparation_time=excluded.preparation_time,
    yield_text=excluded.yield_text,instructions=excluded.instructions,active=true,updated_at=now()
  RETURNING id
), cleared AS (
  DELETE FROM recipe_ingredients WHERE recipe_id=(SELECT id FROM saved_recipe)
)
INSERT INTO recipe_ingredients(recipe_id,position,name_snapshot,amount_text,kcal,carbohydrate,protein,fat)
SELECT (SELECT id FROM saved_recipe),position,name,amount,kcal,carbohydrate,protein,fat
FROM (VALUES
  (1,'Chocolate meio amargo 50% cacau','200 g',1030.0,120.0,12.0,60.0),
  (2,'Abacate maduro','1 unidade (aprox. 300 g de polpa)',480.0,25.5,6.0,44.0),
  (3,'Raspas de chocolate','A gosto, para decorar',0.0,0.0,0.0,0.0)
) AS ingredient(position,name,amount,kcal,carbohydrate,protein,fat);

WITH saved_recipe AS (
  INSERT INTO recipes(legacy_id,title,category,preparation_time,yield_text,instructions,active)
  VALUES(
    'receita_brigadeiro_banana_cacau',
    'Brigadeiro de Banana com Cacau',
    'Doces e sobremesas',
    'Aproximadamente 25 minutos, mais 1 hora de geladeira',
    'Aproximadamente 12 unidades',
    E'1. Descasque as bananas e coloque-as em uma tigela média.\n2. Amasse bem com um garfo até obter um purê; para uma textura mais lisa, use liquidificador ou mixer.\n3. Acrescente o cacau em pó e misture até ficar homogêneo.\n4. Leve ao micro-ondas por 2 minutos, retire e mexa. Aqueça por mais 2 minutos.\n5. Transfira para um prato, deixe amornar e leve à geladeira por aproximadamente 1 hora para firmar.\n6. Unte levemente as mãos, modele as bolinhas e, se desejar, finalize com uma pequena quantidade adicional de cacau.\n\nOs valores nutricionais são estimados para duas bananas com aproximadamente 200 g de parte comestível e não incluem o cacau opcional da finalização.',
    true
  )
  ON CONFLICT(legacy_id) DO UPDATE SET
    title=excluded.title,category=excluded.category,preparation_time=excluded.preparation_time,
    yield_text=excluded.yield_text,instructions=excluded.instructions,active=true,updated_at=now()
  RETURNING id
), cleared AS (
  DELETE FROM recipe_ingredients WHERE recipe_id=(SELECT id FROM saved_recipe)
)
INSERT INTO recipe_ingredients(recipe_id,position,name_snapshot,amount_text,kcal,carbohydrate,protein,fat)
SELECT (SELECT id FROM saved_recipe),position,name,amount,kcal,carbohydrate,protein,fat
FROM (VALUES
  (1,'Banana madura','2 unidades (aprox. 200 g)',178.0,45.6,2.2,0.6),
  (2,'Cacau em pó 100%','4 colheres de sopa (aprox. 40 g)',91.0,23.2,7.8,5.5)
) AS ingredient(position,name,amount,kcal,carbohydrate,protein,fat);

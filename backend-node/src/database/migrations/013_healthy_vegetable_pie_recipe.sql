WITH saved_recipe AS (
  INSERT INTO recipes(legacy_id,title,category,preparation_time,yield_text,instructions,active)
  VALUES(
    'receita_torta_saudavel_legumes',
    'Torta Saudável de Legumes',
    'Tortas e refeições',
    'Aproximadamente 50 minutos',
    '1 forma média (aproximadamente 8 porções)',
    E'MASSA\nMisture a farinha de trigo integral, a aveia, o azeite, a água, a chia, o gergelim e o sal até formar uma massa homogênea. Leve à geladeira por 20 minutos. A farinha de trigo integral pode ser substituída por farinha de arroz integral.\n\nRECHEIO\nUse legumes variados e coloridos. Sugestão-base: talos de brócolis refogados com azeite, cenoura ralada e cebola roxa. Milho, espinafre e tomate podem ser acrescentados a gosto. Para aumentar a quantidade de proteína, adicione frango desfiado, atum ou sardinha.\n\nCREME DO RECHEIO\nMisture os ovos com o iogurte natural, sal, pimenta e temperos a gosto, como páprica, lemon pepper ou orégano.\n\nMONTAGEM E FORNO\n1. Forre uma forma média com a massa e modele as bordas.\n2. Para uma massa mais crocante, pré-asse por 10 minutos.\n3. Distribua os legumes refogados.\n4. Despeje o creme de ovos por cima.\n5. Finalize com queijo minas padrão ralado. Ricota também pode ser utilizada.\n6. Asse em forno preaquecido a 180 °C por aproximadamente 25 a 30 minutos, até dourar.\n\nSUBSTITUIÇÕES E DICAS\n- Sem lactose: utilize iogurte vegetal e substitua o queijo por levedura nutricional.\n- Mais proteína: acrescente frango desfiado ou atum ao recheio.\n- Os valores nutricionais são estimados para a receita-base e não incluem ingredientes extras opcionais.',
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
  (1,'Farinha de trigo integral','1 xícara (aprox. 120 g)',408.0,86.4,15.6,3.0),
  (2,'Aveia em flocos finos','1 xícara (aprox. 80 g)',315.0,53.0,13.5,5.5),
  (3,'Azeite de oliva','1/4 de xícara (aprox. 60 ml)',486.0,0.0,0.0,54.0),
  (4,'Semente de chia','1 colher de sopa (aprox. 12 g)',58.0,5.0,2.0,3.7),
  (5,'Gergelim torrado ou moído','1 colher de sopa (aprox. 10 g)',57.0,2.3,1.8,5.0),
  (6,'Legumes variados e coloridos','Aproximadamente 300 g',120.0,24.0,5.0,1.0),
  (7,'Ovo de galinha','3 unidades',210.0,1.5,18.0,14.0),
  (8,'Iogurte natural','1/2 xícara (aprox. 120 g)',73.0,5.6,4.2,4.0),
  (9,'Queijo minas padrão ralado','Aproximadamente 50 g',160.0,1.5,11.0,12.0),
  (10,'Água e temperos','1/4 de xícara de água, sal, pimenta e temperos',0.0,0.0,0.0,0.0)
) AS ingredient(position,name,amount,kcal,carbohydrate,protein,fat);

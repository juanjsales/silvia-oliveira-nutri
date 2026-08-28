import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

type Macros = { kcal: number; carbohydrate: number; protein: number; fat: number };
type TemplateContent = {
  schemaVersion: number;
  scheduleType: string;
  meals: Array<{ id: string; dayOfWeek: number; time: string; items: Array<{ macros: Macros }> }>;
  dailyNutrition: Record<string, Macros>;
  nutritionMethod: { sources: Array<{ name: string; url: string }>; notice: string };
};

const round = (value: number) => Math.round(value * 10) / 10;

test('Detox Silvia migration contains a coherent, reviewable seven-day template', async () => {
  const sql = await readFile(new URL('../src/database/migrations/045_detox_silvia_weekly_template.sql', import.meta.url), 'utf8');
  const payload = sql.match(/\$template\$([\s\S]+)\$template\$::jsonb/)?.[1];
  assert.ok(payload, 'migration must embed its content in a dollar-quoted JSONB value');
  const content = JSON.parse(payload) as TemplateContent;

  assert.equal(content.schemaVersion, 2);
  assert.equal(content.scheduleType, 'WEEKLY');
  assert.equal(content.meals.length, 49, 'the weekly model must have seven meals on each of seven days');
  assert.deepEqual([...new Set(content.meals.map(meal => meal.dayOfWeek))].sort(), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(new Set(content.meals.map(meal => meal.id)).size, content.meals.length, 'meal ids must be unique');

  for (const day of [0, 1, 2, 3, 4, 5, 6]) {
    const meals = content.meals.filter(meal => meal.dayOfWeek === day);
    assert.equal(meals.length, 7, `day ${day} must have seven meals`);
    assert.ok(meals.every(meal => /^\d{2}:\d{2}$/.test(meal.time) && meal.items.length > 0));
    const calculated = meals.flatMap(meal => meal.items).reduce<Macros>((sum, item) => ({
      kcal: sum.kcal + item.macros.kcal,
      carbohydrate: sum.carbohydrate + item.macros.carbohydrate,
      protein: sum.protein + item.macros.protein,
      fat: sum.fat + item.macros.fat,
    }), { kcal: 0, carbohydrate: 0, protein: 0, fat: 0 });
    for (const key of Object.keys(calculated) as Array<keyof Macros>) {
      assert.equal(round(calculated[key]), content.dailyNutrition[String(day)]![key], `${key} total must match on day ${day}`);
    }
  }

  assert.ok(content.nutritionMethod.sources.length >= 3);
  assert.ok(content.nutritionMethod.sources.every(source => source.name && /^https:\/\//.test(source.url)));
  assert.match(sql, /ON CONFLICT\(legacy_id\) DO UPDATE SET/);
  assert.match(sql, /Requer revisão e personalização profissional antes da publicação/);
});

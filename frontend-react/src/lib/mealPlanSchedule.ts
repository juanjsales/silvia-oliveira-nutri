export type PlanMealLike = {
  dayOfWeek?: number | string;
  [key: string]: unknown;
};

export const WEEK_DAYS = [
  { value: 1, short: 'Seg', label: 'Segunda-feira' },
  { value: 2, short: 'Ter', label: 'Terça-feira' },
  { value: 3, short: 'Qua', label: 'Quarta-feira' },
  { value: 4, short: 'Qui', label: 'Quinta-feira' },
  { value: 5, short: 'Sex', label: 'Sexta-feira' },
  { value: 6, short: 'Sáb', label: 'Sábado' },
  { value: 0, short: 'Dom', label: 'Domingo' },
] as const;

export function planMeals(content: Record<string, unknown> | undefined): PlanMealLike[] {
  if (!content) return [];
  const direct = Array.isArray(content.meals)
    ? content.meals
    : Array.isArray(content.refeicoes)
      ? content.refeicoes
      : [];
  if (direct.length) return direct as PlanMealLike[];
  if (!Array.isArray(content.days)) return [];
  return (content.days as Record<string, unknown>[]).flatMap(day => {
    const dayMeals = Array.isArray(day.meals) ? day.meals : [];
    const dayOfWeek = typeof day.dayOfWeek === 'string' || typeof day.dayOfWeek === 'number' ? day.dayOfWeek : undefined;
    return dayMeals.map(meal => ({ ...(meal as PlanMealLike), dayOfWeek }));
  });
}

export function availablePlanDays(meals: PlanMealLike[]) {
  const present = new Set(meals.map(meal => Number(meal.dayOfWeek)).filter(Number.isInteger));
  return WEEK_DAYS.filter(day => present.has(day.value));
}

export function currentPlanDay(meals: PlanMealLike[], now = new Date()) {
  const available = availablePlanDays(meals);
  if (!available.length) return null;
  return available.find(day => day.value === now.getDay())?.value ?? available[0]!.value;
}

export function mealsForDay<T extends PlanMealLike>(meals: T[], dayOfWeek: number | null): T[] {
  if (dayOfWeek === null || !availablePlanDays(meals).length) return meals;
  return meals.filter(meal => Number(meal.dayOfWeek) === dayOfWeek);
}

export function dayLabel(dayOfWeek: unknown) {
  return WEEK_DAYS.find(day => day.value === Number(dayOfWeek))?.label ?? null;
}

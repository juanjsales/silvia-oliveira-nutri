import { ArrowRight, Clock, Salad, Sparkles, Utensils } from "lucide-react";
import { useMemo } from "react";

type MealItem = {
  name?: string;
  nome?: string;
  amount?: string | number;
  quantidade?: string | number;
  qtd?: string | number;
  amountText?: string;
  unit?: string;
  unidade?: string;
};

type Meal = {
  id?: string;
  title?: string;
  titulo?: string;
  name?: string;
  nome?: string;
  time?: string;
  horario?: string;
  notes?: string;
  obs?: string;
  observacoes?: string;
  items?: MealItem[];
  alimentosList?: MealItem[];
  foods?: MealItem[];
};

type Plan = {
  id?: string;
  title?: string;
  status?: string;
  objective?: string;
  content?: {
    meals?: Meal[];
    refeicoes?: Meal[];
  };
};

function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2})[:hH](\d{2})?/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  if (isNaN(hours)) return null;
  return hours * 60 + minutes;
}

function getItemPortion(it: MealItem): string {
  if (it.amountText) return it.amountText;
  if (typeof it.qtd === "string" && it.qtd.trim()) return it.qtd;
  if (it.amount ?? it.qtd) {
    const val = it.amount ?? it.qtd;
    const unit = it.unit || it.unidade || "g";
    return `${val} ${unit}`.trim();
  }
  if (it.quantidade) {
    const unit = it.unit || it.unidade || "";
    return `${it.quantidade} ${unit}`.trim();
  }
  return "";
}

export function PortalCurrentMealCard({
  plan,
  onOpenMealPlan,
}: {
  plan?: Plan | null;
  onOpenMealPlan: () => void;
}) {
  const currentMealInfo = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutesOfDay = currentHour * 60 + now.getMinutes();

    let defaultPeriodTag = "Noite";
    let defaultSuggestedName = "Jantar";

    if (currentHour >= 5 && currentHour < 10) {
      defaultPeriodTag = "Manhã";
      defaultSuggestedName = "Café da Manhã";
    } else if (currentHour >= 10 && currentHour < 12) {
      defaultPeriodTag = "Manhã";
      defaultSuggestedName = "Lanche da Manhã";
    } else if (currentHour >= 12 && currentHour < 15) {
      defaultPeriodTag = "Almoço";
      defaultSuggestedName = "Almoço";
    } else if (currentHour >= 15 && currentHour < 18) {
      defaultPeriodTag = "Tarde";
      defaultSuggestedName = "Lanche da Tarde";
    } else if (currentHour >= 18 && currentHour < 22) {
      defaultPeriodTag = "Noite";
      defaultSuggestedName = "Jantar";
    } else {
      defaultPeriodTag = "Noite";
      defaultSuggestedName = "Ceia";
    }

    if (!plan?.content) {
      return { mealName: defaultSuggestedName, periodTag: defaultPeriodTag, items: [] };
    }

    const meals = plan.content.meals || plan.content.refeicoes || [];
    if (!meals.length) {
      return { mealName: defaultSuggestedName, periodTag: defaultPeriodTag, items: [] };
    }

    // 1. Tentar encontrar pelo horário mais próximo configurado no plano
    const mealsWithTime = meals
      .map((m, index) => ({
        meal: m,
        index,
        minutes: parseTimeToMinutes(m.time || m.horario),
      }))
      .filter((m): m is { meal: Meal; index: number; minutes: number } => m.minutes !== null);

    let selectedMeal: Meal | null = null;
    let periodTag = defaultPeriodTag;

    if (mealsWithTime.length > 0) {
      // Encontra a refeição cuja distância em minutos é a menor (considerando ciclo de 24h)
      let minDiff = Infinity;
      let closestMeal: Meal = mealsWithTime[0].meal;

      for (const item of mealsWithTime) {
        let diff = Math.abs(currentMinutesOfDay - item.minutes);
        // Trata a virada da meia-noite
        if (diff > 12 * 60) {
          diff = 24 * 60 - diff;
        }
        if (diff < minDiff) {
          minDiff = diff;
          closestMeal = item.meal;
        }
      }
      selectedMeal = closestMeal;
    }

    // 2. Se não encontrou por horário exato, busca por palavra-chave do período
    if (!selectedMeal) {
      const keywordsMap: Record<string, string[]> = {
        Manhã: ["café", "desjejum", "manhã", "colação", "matinal"],
        Almoço: ["almoço", "principal", "meio-dia"],
        Tarde: ["tarde", "lanche", "pré-treino", "merenda"],
        Noite: ["jantar", "janta", "noite", "ceia", "pós-treino"],
      };

      const targetKeywords = keywordsMap[defaultPeriodTag] || [defaultSuggestedName.toLowerCase()];
      selectedMeal = meals.find((m) => {
        const title = (m.title || m.titulo || m.name || m.nome || "").toLowerCase();
        return targetKeywords.some((kw) => title.includes(kw));
      }) || meals[0];
    }

    // Ajusta o periodTag com base no horário ou título da refeição encontrada
    const resolvedTitle = selectedMeal
      ? selectedMeal.title || selectedMeal.titulo || selectedMeal.name || selectedMeal.nome || defaultSuggestedName
      : defaultSuggestedName;

    const mealTimeMinutes = parseTimeToMinutes(selectedMeal?.time || selectedMeal?.horario);
    if (mealTimeMinutes !== null) {
      const mealHour = Math.floor(mealTimeMinutes / 60);
      if (mealHour >= 5 && mealHour < 12) periodTag = "Manhã";
      else if (mealHour >= 12 && mealHour < 15) periodTag = "Almoço";
      else if (mealHour >= 15 && mealHour < 18) periodTag = "Tarde";
      else periodTag = "Noite";
    }

    // Extrai itens da refeição
    const rawItems = selectedMeal ? selectedMeal.items || selectedMeal.alimentosList || selectedMeal.foods || [] : [];
    const items = rawItems
      .map((it) => {
        const name = it.name || it.nome || "";
        const portion = getItemPortion(it);
        return { name, portion };
      })
      .filter((it) => Boolean(it.name));

    return {
      mealName: resolvedTitle,
      periodTag,
      items,
    };
  }, [plan]);

  return (
    <div className="current-meal-card">
      <div className="current-meal-head">
        <div className="meal-badge-time">
          <Clock size={12} /> Refeição Sugerida · {currentMealInfo.periodTag}
        </div>
        <div className="meal-header-info">
          <div className="meal-title-row">
            <div className="meal-icon-pill">
              <Utensils size={15} />
            </div>
            <h3>{currentMealInfo.mealName}</h3>
          </div>
          <p>O que seu plano alimentar orienta para este momento:</p>
        </div>
      </div>

      <div className="meal-items-preview-list">
        {currentMealInfo.items.length > 0 ? (
          currentMealInfo.items.slice(0, 5).map((it, idx) => (
            <div key={idx} className="meal-item-preview-row">
              <span className="meal-dot" />
              <strong className="meal-item-name">{it.name}</strong>
              {it.portion && (
                <span className="meal-item-portion">
                  {it.portion}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="meal-empty-note">
            Consulte seu plano alimentar para conferir as opções desta refeição.
          </div>
        )}
      </div>

      <button
        type="button"
        className="see-full-plan-btn"
        onClick={onOpenMealPlan}
      >
        <span>Ver Plano Alimentar Completo</span>
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

import { ArrowRight, Clock, Salad, Sparkles, Utensils } from "lucide-react";
import { useMemo } from "react";

type MealItem = {
  name?: string;
  nome?: string;
  amount?: string;
  quantidade?: string;
  unit?: string;
  unidade?: string;
};

type Meal = {
  name?: string;
  nome?: string;
  time?: string;
  horario?: string;
  items?: MealItem[];
  alimentosList?: MealItem[];
};

type Plan = {
  id?: string;
  title?: string;
  content?: {
    meals?: Meal[];
    refeicoes?: Meal[];
  };
};

export function PortalCurrentMealCard({
  plan,
  onOpenMealPlan,
}: {
  plan?: Plan | null;
  onOpenMealPlan: () => void;
}) {
  const currentMealInfo = useMemo(() => {
    const hour = new Date().getHours();
    let suggestedName = "Almoço";
    let periodTag = "Meio-dia";

    if (hour >= 5 && hour < 10) {
      suggestedName = "Café da Manhã";
      periodTag = "Manhã";
    } else if (hour >= 10 && hour < 12) {
      suggestedName = "Lanche da Manhã";
      periodTag = "Manhã";
    } else if (hour >= 12 && hour < 15) {
      suggestedName = "Almoço";
      periodTag = "Almoço";
    } else if (hour >= 15 && hour < 18) {
      suggestedName = "Lanche da Tarde";
      periodTag = "Tarde";
    } else if (hour >= 18 && hour < 22) {
      suggestedName = "Jantar";
      periodTag = "Noite";
    } else {
      suggestedName = "Ceia";
      periodTag = "Noite";
    }

    if (!plan?.content) {
      return { mealName: suggestedName, periodTag, items: [] };
    }

    const meals = plan.content.meals || plan.content.refeicoes || [];
    // Busca a refeição que mais se aproxima do nome sugerido
    const foundMeal = meals.find((m) => {
      const name = (m.name || m.nome || "").toLowerCase();
      return (
        name.includes(suggestedName.toLowerCase()) ||
        suggestedName.toLowerCase().includes(name)
      );
    }) || meals[0];

    const rawItems = foundMeal ? foundMeal.items || foundMeal.alimentosList || [] : [];
    const items = rawItems.map((it) => {
      const name = it.name || it.nome || "";
      const amt = it.amount || it.quantidade || "";
      const unit = it.unit || it.unidade || "";
      return {
        name,
        portion: [amt, unit].filter(Boolean).join(" "),
      };
    }).filter((it) => Boolean(it.name));

    return {
      mealName: foundMeal ? foundMeal.name || foundMeal.nome || suggestedName : suggestedName,
      periodTag,
      items,
    };
  }, [plan]);

  return (
    <div className="current-meal-card">
      <div>
        <span className="meal-badge-time">
          <Clock size={12} /> Refeição Sugerida · {currentMealInfo.periodTag}
        </span>
        <div className="meal-header-info">
          <h3>{currentMealInfo.mealName}</h3>
          <p>O que seu plano alimentar orienta para este momento:</p>
        </div>
      </div>

      <div className="meal-items-preview-list">
        {currentMealInfo.items.length > 0 ? (
          currentMealInfo.items.slice(0, 4).map((it, idx) => (
            <div key={idx} className="meal-item-preview-row">
              <span className="meal-dot" />
              <strong style={{ fontSize: "0.82rem", color: "#1e293b" }}>{it.name}</strong>
              {it.portion && (
                <small style={{ color: "#64748b", marginLeft: "auto", fontSize: "0.74rem" }}>
                  {it.portion}
                </small>
              )}
            </div>
          ))
        ) : (
          <div style={{ color: "#64748b", fontSize: "0.82rem", padding: "6px 0" }}>
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

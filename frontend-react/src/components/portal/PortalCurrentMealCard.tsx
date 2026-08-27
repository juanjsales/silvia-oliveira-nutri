import { ArrowRight, ArrowRightLeft, Clock, Compass, MessageCircle, Sparkles, Utensils, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MealItem = {
  name?: string;
  nome?: string;
  amount?: string | number;
  quantidade?: string | number;
  qtd?: string | number;
  amountText?: string;
  unit?: string;
  unidade?: string;
  substitutions?: string[];
  substituicoes?: string[];
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
  const [rescueOpen, setRescueOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  useEffect(() => {
    if (!rescueOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRescueOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [rescueOpen]);

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
        const substitutions = it.substitutions || it.substituicoes || [];
        return { name, portion, substitutions };
      })
      .filter((it) => Boolean(it.name));

    return {
      mealName: resolvedTitle,
      periodTag,
      items,
    };
  }, [plan]);

  const availableSwaps = currentMealInfo.items.flatMap((item) =>
    item.substitutions.map((option) => ({ food: item.name, option })),
  );
  const scenarios = [
    { id: "missing", label: "Não encontrei um alimento" },
    { id: "different", label: "Quero variar hoje" },
    { id: "time", label: "Estou sem tempo" },
    { id: "outside", label: "Vou comer fora" },
  ];

  return (
    <div className="current-meal-card">
      <div className="current-meal-head">
        <div className="meal-badge-time">
          <Clock size={12} /> Agora · {currentMealInfo.periodTag}
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

      {availableSwaps.length > 0 && (
        <section className="meal-swap-preview" aria-label="Substituições liberadas para esta refeição">
          <div className="meal-swap-preview-head">
            <span><ArrowRightLeft size={14} /> Trocas liberadas</span>
            <small>{availableSwaps.length} {availableSwaps.length === 1 ? "opção" : "opções"}</small>
          </div>
          {availableSwaps.slice(0, 2).map((swap, index) => (
            <p key={`${swap.food}-${index}`}><strong>{swap.food}</strong><ArrowRight size={12} />{swap.option}</p>
          ))}
        </section>
      )}

      <button
        type="button"
        className="day-rescue-btn"
        onClick={() => { setSelectedScenario(null); setRescueOpen(true); }}
      >
        <Compass size={17} />
        <span><strong>Meu dia saiu do planejado</strong><small>Encontre uma saída dentro do seu plano</small></span>
        <ArrowRight size={15} />
      </button>

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

      {rescueOpen && (
        <div className="day-rescue-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setRescueOpen(false);
        }}>
          <section className="day-rescue-dialog" role="dialog" aria-modal="true" aria-labelledby="day-rescue-title">
            <header>
              <span className="day-rescue-icon"><Sparkles size={18} /></span>
              <div><small>Apoio para a vida real</small><h2 id="day-rescue-title">O que mudou no seu dia?</h2></div>
              <button type="button" onClick={() => setRescueOpen(false)} aria-label="Fechar"><X size={20} /></button>
            </header>

            {!selectedScenario ? (
              <div className="day-rescue-scenarios">
                <p>Escolha uma situação. Mostraremos somente opções já autorizadas no seu plano.</p>
                {scenarios.map((scenario) => (
                  <button key={scenario.id} type="button" onClick={() => setSelectedScenario(scenario.id)}>
                    {scenario.label}<ArrowRight size={15} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="day-rescue-result" aria-live="polite">
                <button type="button" className="day-rescue-back" onClick={() => setSelectedScenario(null)}>← Escolher outra situação</button>
                <span className="day-rescue-meal-label">Para {currentMealInfo.mealName}</span>
                {availableSwaps.length > 0 ? (
                  <>
                    <h3>Estas são as trocas registradas pela sua nutricionista</h3>
                    <div className="day-rescue-swap-list">
                      {availableSwaps.map((swap, index) => (
                        <div key={`${swap.food}-${swap.option}-${index}`}><strong>{swap.food}</strong><ArrowRightLeft size={15} /><span>{swap.option}</span></div>
                      ))}
                    </div>
                    <p className="day-rescue-safety">Mantenha as quantidades e orientações descritas no plano. Em caso de dúvida, confirme com sua nutricionista.</p>
                  </>
                ) : (
                  <div className="day-rescue-no-swap">
                    <MessageCircle size={22} />
                    <h3>Não há uma troca liberada para esta refeição</h3>
                    <p>Para cuidar da sua prescrição, não sugerimos alimentos fora do plano. Consulte o plano completo ou converse com sua nutricionista.</p>
                  </div>
                )}
                <div className="day-rescue-actions">
                  <button type="button" className="see-full-plan-btn" onClick={() => { setRescueOpen(false); onOpenMealPlan(); }}>Abrir meu plano</button>
                  <button type="button" className="day-rescue-close" onClick={() => setRescueOpen(false)}>Entendi</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

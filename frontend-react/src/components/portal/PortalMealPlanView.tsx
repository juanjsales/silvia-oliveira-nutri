import {
  ArrowRightLeft,
  Clock,
  Info,
  Printer,
  Salad,
  Sparkles,
  Utensils,
} from "lucide-react";
import { useState } from "react";

type MealItem = {
  name?: string;
  nome?: string;
  amount?: string;
  quantidade?: string;
  unit?: string;
  unidade?: string;
  substitutions?: string[];
  substituicoes?: string[];
};

type Meal = {
  name?: string;
  nome?: string;
  time?: string;
  horario?: string;
  notes?: string;
  observacoes?: string;
  items?: MealItem[];
  alimentosList?: MealItem[];
};

type Plan = {
  id?: string;
  title?: string;
  objective?: string;
  content?: {
    meals?: Meal[];
    refeicoes?: Meal[];
    orientations?: string[];
    orientacoes?: string[];
    targetKcal?: number;
  };
  publishedAt?: string;
};

const sentenceCase = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const normalized = trimmed === trimmed.toLocaleUpperCase('pt-BR') ? trimmed.toLocaleLowerCase('pt-BR') : trimmed;
  return normalized.charAt(0).toLocaleUpperCase('pt-BR') + normalized.slice(1);
};

export function PortalMealPlanView({ plan }: { plan?: Plan | null }) {
  const [selectedSubMeal, setSelectedSubMeal] = useState<number | null>(null);

  if (!plan?.content) {
    return (
      <section className="panel empty-state">
        <Salad size={40} style={{ color: "#94a3b8" }} />
        <h3>Nenhum plano alimentar publicado</h3>
        <p>Sua nutricionista ainda está elaborando seu plano personalizado. Assim que liberado, ele aparecerá aqui com todos os detalhes.</p>
      </section>
    );
  }

  const meals = plan.content.meals || plan.content.refeicoes || [];
  const orientations = plan.content.orientations || plan.content.orientacoes || [];

  return (
    <div className="portal-meal-plan-view">
      <section className="panel portal-plan-overview">
        <div className="portal-plan-overview-main">
          <span className="portal-plan-icon"><Salad size={21} /></span>
          <div>
            <span className="eyebrow">Plano alimentar vigente</span>
            <h2>{sentenceCase(plan.title || "Estratégia nutricional personalizada")}</h2>
            <p>
              {plan.objective || "Siga as orientações e horários sugeridos para atingir suas metas de saúde."}
            </p>
            <div className="portal-plan-meta">
              <span>{meals.length} {meals.length === 1 ? 'refeição planejada' : 'refeições planejadas'}</span>
              {plan.content.targetKcal ? <span>Referência: {plan.content.targetKcal} kcal/dia</span> : null}
              {plan.publishedAt ? <span>Atualizado em {new Date(plan.publishedAt).toLocaleDateString('pt-BR')}</span> : null}
            </div>
          </div>
        </div>
          {plan.id ? (
            <a
              className="secondary-button portal-plan-print"
              href={`/portal/plano/${plan.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <Printer size={16} /> Abrir versão para impressão
            </a>
          ) : (
            <button
              type="button"
              className="secondary-button portal-plan-print"
              onClick={() => window.print()}
            >
              <Printer size={16} /> Imprimir ou salvar em PDF
            </button>
          )}
      </section>

      <section className="portal-plan-meals" aria-label="Refeições do plano alimentar">
        {meals.map((meal: any, index: number) => {
          const mealName = sentenceCase(meal.title || meal.titulo || meal.name || meal.nome || `Refeição ${index + 1}`);
          const mealTime = meal.time || meal.horario;
          const items = meal.items || meal.alimentosList || meal.foods || [];
          const notes = meal.notes || meal.obs || meal.observacoes;
          const hasSubstitutions = items.some((item: MealItem) => (item.substitutions || item.substituicoes || []).length > 0);
          const substitutionsOpen = selectedSubMeal === index;

          return (
            <article key={index} className="panel portal-plan-meal-card">
              <header>
                <div className="portal-plan-meal-heading">
                  <div className="portal-plan-meal-icon">
                    <Utensils size={17} />
                  </div>
                  <div>
                    <h3>{mealName}</h3>
                    {mealTime && <small><Clock size={14} /> Horário sugerido: {mealTime}</small>}
                  </div>
                </div>
                <span className="portal-plan-item-count">
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </span>
              </header>

              <div className="portal-plan-food-list">
                {items.length ? items.map((it: any, itIdx: number) => {
                  const name = it.name || it.nome;
                  let portion = it.amountText || "";
                  if (!portion) {
                    if (typeof it.qtd === "string" && it.qtd.trim()) portion = it.qtd;
                    else if (it.amount ?? it.qtd) portion = `${it.amount ?? it.qtd} ${it.unit || it.unidade || "g"}`.trim();
                    else if (it.quantidade) portion = `${it.quantidade} ${it.unit || it.unidade || ""}`.trim();
                  }

                  return (
                    <div key={itIdx} className="portal-plan-food-row">
                      <span className="portal-plan-food-dot" aria-hidden="true" />
                      <strong>{name || 'Alimento não informado'}</strong>
                      {portion && <span className="portal-plan-portion">{portion}</span>}
                    </div>
                  );
                }) : <div className="portal-plan-meal-empty"><Info size={18} /><span>Nenhum alimento informado nesta refeição.</span></div>}
              </div>

              {notes && (
                <div className="portal-plan-note">
                  <Info size={16} /><span><strong>Orientação para esta refeição</strong>{notes}</span>
                </div>
              )}

              {hasSubstitutions && (
                <div className="portal-plan-substitutions">
                  <button type="button" className="portal-plan-substitution-toggle" onClick={() => setSelectedSubMeal(substitutionsOpen ? null : index)} aria-expanded={substitutionsOpen}>
                    <ArrowRightLeft size={16} /> {substitutionsOpen ? 'Ocultar substituições' : 'Ver opções de substituição'}
                  </button>
                  {substitutionsOpen && <div className="portal-plan-substitution-list">
                    {items.map((item: MealItem, itemIndex: number) => {
                      const options = item.substitutions || item.substituicoes || [];
                      if (!options.length) return null;
                      return <div key={itemIndex}><strong>{item.name || item.nome}</strong><span>{options.join(' · ')}</span></div>;
                    })}
                  </div>}
                </div>
              )}
            </article>
          );
        })}
        {!meals.length && <div className="panel portal-plan-empty"><Utensils size={28} /><strong>Plano sem refeições cadastradas</strong><p>Solicite à nutricionista a revisão do plano publicado.</p></div>}
      </section>

      {orientations.length > 0 && (
        <section className="panel portal-plan-guidance">
          <header><Sparkles size={19} /><div><h3>Orientações gerais</h3><p>Recomendações que complementam todas as refeições do plano.</p></div></header>
          <ul>
            {orientations.map((ori, i) => (
              <li key={i}>{ori}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

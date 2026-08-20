import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Download,
  Flame,
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* CABEÇALHO DO PLANO */}
      <section className="panel" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <span className="eyebrow">Plano Alimentar Ativo</span>
            <h2 style={{ margin: "4px 0 6px", fontSize: "1.4rem", color: "#1e293b" }}>{plan.title || "Estratégia Nutricional Personalizada"}</h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
              {plan.objective || "Siga as orientações e horários sugeridos para atingir suas metas de saúde."}
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => window.print()}
            style={{ fontSize: "0.8rem", padding: "8px 16px" }}
          >
            <Printer size={15} /> Imprimir / Salvar PDF
          </button>
        </div>
      </section>

      {/* LISTA DE REFEIÇÕES EM CARDS ELEGANTES */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {meals.map((meal: any, index: number) => {
          const mealName = meal.title || meal.titulo || meal.name || meal.nome || `Refeição ${index + 1}`;
          const mealTime = meal.time || meal.horario;
          const items = meal.items || meal.alimentosList || meal.foods || [];
          const notes = meal.notes || meal.obs || meal.observacoes;

          return (
            <article
              key={index}
              className="panel"
              style={{
                borderRadius: 18,
                padding: 22,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f0fdf4", color: "#166534", display: "grid", placeItems: "center" }}>
                    <Utensils size={17} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#1e293b" }}>{mealName}</h3>
                    {mealTime && <small style={{ color: "#64748b", fontSize: "0.74rem" }}>⏰ Horário sugerido: {mealTime}</small>}
                  </div>
                </div>

                <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#f8fafc", color: "#475569", padding: "3px 8px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </span>
              </div>

              {/* LISTA DE ALIMENTOS */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((it: any, itIdx: number) => {
                  const name = it.name || it.nome;
                  let portion = it.amountText || "";
                  if (!portion) {
                    if (typeof it.qtd === "string" && it.qtd.trim()) portion = it.qtd;
                    else if (it.amount ?? it.qtd) portion = `${it.amount ?? it.qtd} ${it.unit || it.unidade || "g"}`.trim();
                    else if (it.quantidade) portion = `${it.quantidade} ${it.unit || it.unidade || ""}`.trim();
                  }

                  return (
                    <div
                      key={itIdx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 12px",
                        background: "#fbfcfb",
                        border: "1px solid #f1f5f9",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                        <strong style={{ color: "#1e293b" }}>{name}</strong>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {portion && (
                          <span style={{ color: "#475569", fontWeight: 600, fontSize: "0.8rem", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6 }}>
                            {portion}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {notes && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: "#fefce8", border: "1px solid #fef08a", borderRadius: 8, fontSize: "0.78rem", color: "#854d0e" }}>
                  💡 <strong>Observação:</strong> {notes}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* ORIENTAÇÕES GERAIS */}
      {orientations.length > 0 && (
        <section className="panel" style={{ padding: 22, borderRadius: 18, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Sparkles size={18} style={{ color: "#166534" }} />
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#166534" }}>Diretrizes & Recomendações Gerais</h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, fontSize: "0.85rem", color: "#14532d" }}>
            {orientations.map((ori, i) => (
              <li key={i}>{ori}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

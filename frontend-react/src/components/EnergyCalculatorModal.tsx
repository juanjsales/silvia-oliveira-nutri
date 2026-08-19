import {
  Activity,
  Calculator,
  Check,
  ChevronRight,
  Flame,
  PieChart,
  Scale,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Gender = "FEMALE" | "MALE";
type Formula = "MIFFLIN" | "HARRIS_BENEDICT";
type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "VERY_ACTIVE" | "EXTRA_ACTIVE";
type Goal = "FAT_LOSS_MODERATE" | "FAT_LOSS_LIGHT" | "MAINTENANCE" | "HYPERTROPHY";

const activityFactors: Record<ActivityLevel, { label: string; factor: number; desc: string }> = {
  SEDENTARY: { label: "Sedentário", factor: 1.2, desc: "Pouco ou nenhum exercício diário (trabalho sentado)" },
  LIGHT: { label: "Levemente Ativo", factor: 1.375, desc: "Exercício leve 1 a 3 dias na semana" },
  MODERATE: { label: "Moderadamente Ativo", factor: 1.55, desc: "Exercício moderado 3 a 5 dias na semana" },
  VERY_ACTIVE: { label: "Muito Ativo", factor: 1.725, desc: "Exercício intenso 6 a 7 dias na semana" },
  EXTRA_ACTIVE: { label: "Extremamente Ativo", factor: 1.9, desc: "Treinos pesados diários ou atleta" },
};

const goalAdjustments: Record<Goal, { label: string; offsetKcal: number; desc: string }> = {
  FAT_LOSS_MODERATE: { label: "Emagrecimento Moderado", offsetKcal: -500, desc: "Déficit seguro de 500 kcal/dia" },
  FAT_LOSS_LIGHT: { label: "Emagrecimento Leve", offsetKcal: -300, desc: "Déficit suave de 300 kcal/dia" },
  MAINTENANCE: { label: "Manutenção do Peso", offsetKcal: 0, desc: "Balanço calórico neutro (eucalórico)" },
  HYPERTROPHY: { label: "Hipertrofia / Ganho de Massa", offsetKcal: 350, desc: "Superávit calórico controlado de +350 kcal/dia" },
};

interface EnergyCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  initialHeight?: number;
  initialAge?: number;
  initialGender?: Gender;
  onApplyResults?: (results: { tmb: number; vet: number; targetKcal: number; proteinGrams: number; carbsGrams: number; fatGrams: number }) => void;
}

export function EnergyCalculatorModal({
  isOpen,
  onClose,
  initialWeight = 70,
  initialHeight = 165,
  initialAge = 30,
  initialGender = "FEMALE",
  onApplyResults,
}: EnergyCalculatorModalProps) {
  const [weight, setWeight] = useState(initialWeight || 70);
  const [height, setHeight] = useState(initialHeight || 165);
  const [age, setAge] = useState(initialAge || 30);
  const [gender, setGender] = useState<Gender>(initialGender);
  const [formula, setFormula] = useState<Formula>("MIFFLIN");
  const [activity, setActivity] = useState<ActivityLevel>("MODERATE");
  const [goal, setGoal] = useState<Goal>("FAT_LOSS_MODERATE");
  const [proteinGPerKg, setProteinGPerKg] = useState(1.8);
  const [fatPercent, setFatPercent] = useState(25);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (initialWeight) setWeight(initialWeight);
    if (initialHeight) setHeight(initialHeight);
    if (initialAge) setAge(initialAge);
    if (initialGender) setGender(initialGender);
  }, [initialWeight, initialHeight, initialAge, initialGender, isOpen]);

  // Cálculo da TMB (Taxa Metabólica Basal)
  const tmb = useMemo(() => {
    const w = Number(weight) || 70;
    const h = Number(height) || 165;
    const a = Number(age) || 30;

    if (formula === "MIFFLIN") {
      // Mifflin-St Jeor
      if (gender === "MALE") {
        return Math.round(10 * w + 6.25 * h - 5 * a + 5);
      } else {
        return Math.round(10 * w + 6.25 * h - 5 * a - 161);
      }
    } else {
      // Harris-Benedict (Revisada)
      if (gender === "MALE") {
        return Math.round(88.362 + 13.397 * w + 4.799 * h - 5.677 * a);
      } else {
        return Math.round(447.593 + 9.247 * w + 3.098 * h - 4.33 * a);
      }
    }
  }, [weight, height, age, gender, formula]);

  // Gasto Energético Total (GET / VET)
  const vet = useMemo(() => {
    const factor = activityFactors[activity].factor;
    return Math.round(tmb * factor);
  }, [tmb, activity]);

  // Meta Calórica Alvo
  const targetKcal = useMemo(() => {
    const offset = goalAdjustments[goal].offsetKcal;
    return Math.max(1000, Math.round(vet + offset));
  }, [vet, goal]);

  // Distribuição de Macronutrientes
  const macros = useMemo(() => {
    const w = Number(weight) || 70;
    // 1. Proteínas (4 kcal/g)
    const proteinGrams = Math.round(w * proteinGPerKg);
    const proteinKcal = proteinGrams * 4;

    // 2. Gorduras (9 kcal/g)
    const fatKcal = Math.round(targetKcal * (fatPercent / 100));
    const fatGrams = Math.round(fatKcal / 9);

    // 3. Carboidratos (4 kcal/g) - Restante
    const remainingKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
    const carbsGrams = Math.round(remainingKcal / 4);

    const proteinPct = Math.round((proteinKcal / targetKcal) * 100);
    const fatPct = Math.round((fatKcal / targetKcal) * 100);
    const carbsPct = Math.max(0, 100 - proteinPct - fatPct);

    return {
      proteinGrams,
      proteinKcal,
      proteinPct,
      fatGrams,
      fatKcal,
      fatPct,
      carbsGrams,
      remainingKcal,
      carbsPct,
    };
  }, [weight, proteinGPerKg, fatPercent, targetKcal]);

  if (!isOpen) return null;

  function handleApply() {
    if (onApplyResults) {
      onApplyResults({
        tmb,
        vet,
        targetKcal,
        proteinGrams: macros.proteinGrams,
        carbsGrams: macros.carbsGrams,
        fatGrams: macros.fatGrams,
      });
      setApplied(true);
      setTimeout(() => {
        setApplied(false);
        onClose();
      }, 800);
    } else {
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="energy-calc-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <header className="calc-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="wizard-icon-badge" style={{ background: "#f0fdf4", color: "#166534" }}>
              <Calculator size={22} />
            </div>
            <div>
              <h3>Calculadora Científica de Gasto Energético (VET & TMB)</h3>
              <p>Calcule a taxa metabólica basal, gasto total e prescrição de macronutrientes.</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="calc-modal-body">
          {/* COLUNA ESQUERDA: PARÂMETROS BIOMÉTRICOS */}
          <div className="calc-params-col">
            <span className="calc-section-subtitle">1. Dados do Paciente</span>

            <div className="calc-gender-toggle">
              <button
                type="button"
                className={`gender-btn ${gender === "FEMALE" ? "active" : ""}`}
                onClick={() => setGender("FEMALE")}
              >
                Mulher (Feminino)
              </button>
              <button
                type="button"
                className={`gender-btn ${gender === "MALE" ? "active" : ""}`}
                onClick={() => setGender("MALE")}
              >
                Homem (Masculino)
              </button>
            </div>

            <div className="calc-fields-grid">
              <label>
                Peso Atual (kg)
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                />
              </label>
              <label>
                Altura (cm)
                <input
                  type="number"
                  min="80"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
              </label>
              <label>
                Idade (anos)
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                />
              </label>
              <label>
                Fórmula de TMB
                <select value={formula} onChange={(e) => setFormula(e.target.value as Formula)}>
                  <option value="MIFFLIN">Mifflin-St Jeor (Padrão Ouro)</option>
                  <option value="HARRIS_BENEDICT">Harris-Benedict (Revisada)</option>
                </select>
              </label>
            </div>

            <span className="calc-section-subtitle" style={{ marginTop: 14 }}>2. Nível de Atividade & Objetivo</span>

            <label className="wide-label">
              Nível de Atividade Física (Fator Atividade)
              <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}>
                {(Object.keys(activityFactors) as ActivityLevel[]).map((key) => {
                  const item = activityFactors[key];
                  return (
                    <option key={key} value={key}>
                      {item.label} (×{item.factor}) — {item.desc}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="wide-label">
              Objetivo Nutricional
              <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
                {(Object.keys(goalAdjustments) as Goal[]).map((key) => {
                  const item = goalAdjustments[key];
                  return (
                    <option key={key} value={key}>
                      {item.label} ({item.offsetKcal > 0 ? `+${item.offsetKcal}` : item.offsetKcal} kcal)
                    </option>
                  );
                })}
              </select>
            </label>

            <div className="calc-fields-grid" style={{ marginTop: 10 }}>
              <label>
                Proteína (g/kg)
                <input
                  type="number"
                  step="0.1"
                  min="0.8"
                  max="3.5"
                  value={proteinGPerKg}
                  onChange={(e) => setProteinGPerKg(Number(e.target.value))}
                />
              </label>
              <label>
                Gordura (% do VET)
                <input
                  type="number"
                  min="15"
                  max="50"
                  value={fatPercent}
                  onChange={(e) => setFatPercent(Number(e.target.value))}
                />
              </label>
            </div>
          </div>

          {/* COLUNA DIREITA: RESULTADOS CIENTÍFICOS & MACROS */}
          <div className="calc-results-col">
            <span className="calc-section-subtitle">3. Resultados do Balanço Energético</span>

            <div className="results-kpi-cards">
              <div className="result-kpi-box tmb">
                <span className="kpi-tag">Taxa Metabólica Basal</span>
                <strong>{tmb.toLocaleString("pt-BR")} kcal</strong>
                <small>Consumo do corpo em repouso absoluto</small>
              </div>

              <div className="result-kpi-box vet">
                <span className="kpi-tag">Gasto Total (GET / VET)</span>
                <strong>{vet.toLocaleString("pt-BR")} kcal</strong>
                <small>Com fator de atividade de ×{activityFactors[activity].factor}</small>
              </div>

              <div className="result-kpi-box target">
                <span className="kpi-tag">Meta Calórica Prescrita</span>
                <strong>{targetKcal.toLocaleString("pt-BR")} kcal/dia</strong>
                <small>{goalAdjustments[goal].label}</small>
              </div>
            </div>

            {/* DIVISÃO DE MACRONUTRIENTES */}
            <div className="macros-breakdown-card">
              <div className="macros-card-title">
                <PieChart size={16} />
                <strong>Distribuição Sugerida de Macronutrientes</strong>
              </div>

              <div className="macros-bars-wrap">
                <div className="macro-bar-item">
                  <div className="macro-labels">
                    <span className="macro-name prot">🥩 Proteínas ({proteinGPerKg} g/kg)</span>
                    <strong>{macros.proteinGrams}g ({macros.proteinPct}%)</strong>
                  </div>
                  <div className="macro-progress-track">
                    <div className="macro-progress-fill prot" style={{ width: `${macros.proteinPct}%` }} />
                  </div>
                </div>

                <div className="macro-bar-item">
                  <div className="macro-labels">
                    <span className="macro-name carb">🌾 Carboidratos</span>
                    <strong>{macros.carbsGrams}g ({macros.carbsPct}%)</strong>
                  </div>
                  <div className="macro-progress-track">
                    <div className="macro-progress-fill carb" style={{ width: `${macros.carbsPct}%` }} />
                  </div>
                </div>

                <div className="macro-bar-item">
                  <div className="macro-labels">
                    <span className="macro-name fat">🥑 Gorduras ({fatPercent}%)</span>
                    <strong>{macros.fatGrams}g ({macros.fatPct}%)</strong>
                  </div>
                  <div className="macro-progress-track">
                    <div className="macro-progress-fill fat" style={{ width: `${macros.fatPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÃO DE AÇÃO */}
            <div style={{ marginTop: "auto", paddingTop: 16 }}>
              <button
                type="button"
                className="primary-button apply-calc-btn"
                onClick={handleApply}
                style={{ width: "100%", justifyContent: "center", height: 46 }}
              >
                {applied ? <Check size={18} /> : <Zap size={18} />}
                <span>{applied ? "Meta Aplicada!" : "Aplicar Meta Calórica ao Atendimento"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

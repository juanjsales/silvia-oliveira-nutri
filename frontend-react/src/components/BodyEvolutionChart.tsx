import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  Flame,
  Info,
  LineChart,
  Minus,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

export type Measurement = {
  id?: string;
  measuredAt: string;
  weight?: number | null;
  bodyFat?: number | null;
  waist?: number | null;
  neck?: number | null;
  notes?: string | null;
};

type MetricType = "weight" | "bodyFat" | "waist" | "neck" | "leanMass";

interface MetricConfig {
  label: string;
  shortLabel: string;
  unit: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  icon: any;
  description: string;
  idealDirection: "down" | "up" | "neutral";
}

const metricConfigs: Record<MetricType, MetricConfig> = {
  weight: {
    label: "Peso Corporal",
    shortLabel: "Peso",
    unit: "kg",
    color: "#246342",
    gradientStart: "rgba(36, 99, 66, 0.28)",
    gradientEnd: "rgba(36, 99, 66, 0.0)",
    icon: Scale,
    description: "Massa corporal total aferida em balança de precisão",
    idealDirection: "down",
  },
  bodyFat: {
    label: "% de Gordura",
    shortLabel: "Gordura",
    unit: "%",
    color: "#d97706",
    gradientStart: "rgba(217, 119, 6, 0.28)",
    gradientEnd: "rgba(217, 119, 6, 0.0)",
    icon: Flame,
    description: "Percentual de gordura corporal por bioimpedância ou dobras",
    idealDirection: "down",
  },
  leanMass: {
    label: "Massa Magra Estimada",
    shortLabel: "Massa Magra",
    unit: "kg",
    color: "#2563eb",
    gradientStart: "rgba(37, 99, 235, 0.28)",
    gradientEnd: "rgba(37, 99, 235, 0.0)",
    icon: Activity,
    description: "Músculos, ossos e água corporal estimada",
    idealDirection: "up",
  },
  waist: {
    label: "Circunferência da Cintura",
    shortLabel: "Cintura",
    unit: "cm",
    color: "#0891b2",
    gradientStart: "rgba(8, 145, 178, 0.28)",
    gradientEnd: "rgba(8, 145, 178, 0.0)",
    icon: Activity,
    description: "Circunferência abdominal e risco cardiometabólico",
    idealDirection: "down",
  },
  neck: {
    label: "Circunferência do Pescoço",
    shortLabel: "Pescoço",
    unit: "cm",
    color: "#7c3aed",
    gradientStart: "rgba(124, 58, 237, 0.28)",
    gradientEnd: "rgba(124, 58, 237, 0.0)",
    icon: Activity,
    description: "Marcador antropométrico complementar de saúde",
    idealDirection: "neutral",
  },
};

type ValidPoint = {
  index: number;
  id: string;
  dateStr: string;
  fullDate: string;
  value: number;
  weight?: number | null;
  bodyFat?: number | null;
  waist?: number | null;
  neck?: number | null;
  notes?: string | null;
};

// Gera curva suave Bézier para o gráfico SVG
function createSmoothSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

export function BodyEvolutionChart({ rows = [] }: { rows: Measurement[] }) {
  const [activeMetric, setActiveMetric] = useState<MetricType>("weight");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Ordenar cronologicamente: do mais antigo para o mais recente para o gráfico
  const sorted = useMemo(() => {
    return [...rows]
      .filter((r) => r && r.measuredAt)
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  }, [rows]);

  // Lista reversa para a tabela histórica (mais recente no topo)
  const historyList = useMemo(() => {
    return [...sorted].reverse();
  }, [sorted]);

  const validData = useMemo<ValidPoint[]>(() => {
    const list: ValidPoint[] = [];
    sorted.forEach((r, index) => {
      let val: number | null = null;
      if (activeMetric === "leanMass") {
        if (r.weight != null && r.bodyFat != null) {
          val = Number((r.weight * (1 - r.bodyFat / 100)).toFixed(1));
        }
      } else {
        val = r[activeMetric] != null ? Number(r[activeMetric]) : null;
      }

      if (val !== null && !isNaN(val)) {
        const dateObj = new Date(r.measuredAt);
        const day = dateObj.toLocaleDateString("pt-BR", { day: "2-digit" });
        const month = dateObj.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");

        list.push({
          index,
          id: r.id || `m-${index}`,
          dateStr: `${day} ${month}`,
          fullDate: dateObj.toLocaleDateString("pt-BR"),
          value: val,
          weight: r.weight,
          bodyFat: r.bodyFat,
          waist: r.waist,
          neck: r.neck,
          notes: r.notes,
        });
      }
    });
    return list;
  }, [sorted, activeMetric]);

  const cfg = metricConfigs[activeMetric];

  // Métricas Executivas e Análise Estatística
  const stats = useMemo(() => {
    if (validData.length === 0) return null;
    const values = validData.map((d) => d.value);
    const first = values[0];
    const latest = values[values.length - 1];
    const diff = latest - first;
    const percentDiff = first > 0 ? (diff / first) * 100 : 0;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const firstDate = validData[0].fullDate;
    const latestDate = validData[validData.length - 1].fullDate;

    return {
      first,
      latest,
      diff,
      percentDiff,
      min,
      max,
      firstDate,
      latestDate,
      count: validData.length,
    };
  }, [validData]);

  // Dimensões do Gráfico SVG
  const svgWidth = 650;
  const svgHeight = 250;
  const paddingLeft = 45;
  const paddingRight = 35;
  const paddingTop = 40;
  const paddingBottom = 40;

  const points = useMemo(() => {
    if (validData.length < 2) return [];
    const values = validData.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const margin = (maxVal - minVal) * 0.15 || 1;
    const lowBound = Math.max(0, minVal - margin);
    const highBound = maxVal + margin;
    const valRange = highBound - lowBound || 1;

    return validData.map((d, i) => {
      const x = paddingLeft + (i / (validData.length - 1)) * (svgWidth - paddingLeft - paddingRight);
      const y = svgHeight - paddingBottom - ((d.value - lowBound) / valRange) * (svgHeight - paddingTop - paddingBottom);
      return { x, y, ...d, lowBound, highBound };
    });
  }, [validData]);

  const splinePathD = useMemo(() => {
    return createSmoothSplinePath(points);
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length < 2 || !splinePathD) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${splinePathD} L ${last.x} ${svgHeight - paddingBottom} L ${first.x} ${svgHeight - paddingBottom} Z`;
  }, [splinePathD, points]);

  const Icon = cfg.icon;

  return (
    <div className="evolution-suite-container">
      {/* ── HEADER DA PÁGINA DE EVOLUÇÃO ── */}
      <div className="evolution-hero-header">
        <div className="evolution-title-area">
          <span className="evolution-badge">
            <Sparkles size={13} /> Avaliação Antropométrica & Composição
          </span>
          <h2>Evolução Corporal</h2>
          <p>Acompanhe suas conquistas clínicas, alterações corporais e metas ao longo das consultas.</p>
        </div>

        {/* SELETOR DE MÉTRICAS */}
        <div className="evolution-metric-tabs">
          {(Object.keys(metricConfigs) as MetricType[]).map((key) => {
            const m = metricConfigs[key];
            const MetricIcon = m.icon;
            const isActive = activeMetric === key;
            return (
              <button
                key={key}
                type="button"
                className={`metric-tab-pill ${isActive ? "active" : ""}`}
                style={
                  isActive
                    ? {
                        background: m.color,
                        borderColor: m.color,
                        color: "#ffffff",
                        boxShadow: `0 4px 14px ${m.color}33`,
                      }
                    : undefined
                }
                onClick={() => {
                  setActiveMetric(key);
                  setHoveredIndex(null);
                }}
              >
                <MetricIcon size={14} />
                <span>{m.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CARDS DE KPIS EXECUTIVOS ── */}
      {stats && (
        <div className="evolution-kpis-grid">
          {/* CARD 1: MEDIÇÃO ATUAL */}
          <div className="evolution-kpi-card highlight">
            <div className="kpi-top-row">
              <span className="kpi-label">Aferição Atual</span>
              <span className="kpi-date-tag">{stats.latestDate}</span>
            </div>
            <div className="kpi-main-val" style={{ color: cfg.color }}>
              {stats.latest.toFixed(1)} <small>{cfg.unit}</small>
            </div>
            <span className="kpi-hint">Registrado na última consulta</span>
          </div>

          {/* CARD 2: PONTO DE PARTIDA */}
          <div className="evolution-kpi-card">
            <div className="kpi-top-row">
              <span className="kpi-label">Ponto de Partida</span>
              <span className="kpi-date-tag">{stats.firstDate}</span>
            </div>
            <div className="kpi-main-val">
              {stats.first.toFixed(1)} <small>{cfg.unit}</small>
            </div>
            <span className="kpi-hint">1ª consulta nutricional</span>
          </div>

          {/* CARD 3: VARIAÇÃO ACUMULADA */}
          <div className="evolution-kpi-card">
            <div className="kpi-top-row">
              <span className="kpi-label">Variação Total</span>
              <span className="kpi-count-tag">{stats.count} aferições</span>
            </div>
            <div
              className="kpi-main-val"
              style={{
                color:
                  stats.diff < 0
                    ? cfg.idealDirection === "down"
                      ? "#16a34a"
                      : "#2563eb"
                    : stats.diff > 0
                    ? cfg.idealDirection === "up"
                      ? "#16a34a"
                      : "#d97706"
                    : "#64748b",
              }}
            >
              {stats.diff < 0 ? (
                <ArrowDownRight size={22} />
              ) : stats.diff > 0 ? (
                <ArrowUpRight size={22} />
              ) : (
                <Minus size={22} />
              )}
              {stats.diff > 0 ? `+${stats.diff.toFixed(1)}` : stats.diff.toFixed(1)}{" "}
              <small>{cfg.unit}</small>
            </div>
            <span className="kpi-hint">
              {stats.percentDiff !== 0
                ? `${stats.percentDiff > 0 ? "+" : ""}${stats.percentDiff.toFixed(1)}% de mudança total`
                : "Sem alteração no período"}
            </span>
          </div>
        </div>
      )}

      {/* ── CARD PRINCIPAL DO GRÁFICO ── */}
      <div className="evolution-chart-box">
        <div className="chart-box-header">
          <div className="chart-info-left">
            <div className="chart-icon-box" style={{ background: `${cfg.color}14`, color: cfg.color }}>
              <Icon size={20} />
            </div>
            <div>
              <h3>Curva de {cfg.label}</h3>
              <p>{cfg.description}</p>
            </div>
          </div>
        </div>

        {validData.length >= 2 ? (
          <div className="chart-viewport-wrap">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="evolution-spline-svg"
              aria-label={`Gráfico de evolução de ${cfg.label}`}
            >
              <defs>
                <linearGradient id={`splineGrad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity="0.0" />
                </linearGradient>
                <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={cfg.color} floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Linhas Guia Horizontais */}
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={svgWidth - paddingRight}
                y2={paddingTop}
                stroke="#eef3ef"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={paddingLeft}
                y1={(svgHeight - paddingBottom + paddingTop) / 2}
                x2={svgWidth - paddingRight}
                y2={(svgHeight - paddingBottom + paddingTop) / 2}
                stroke="#eef3ef"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={paddingLeft}
                y1={svgHeight - paddingBottom}
                x2={svgWidth - paddingRight}
                y2={svgHeight - paddingBottom}
                stroke="#dce7df"
                strokeWidth="1.2"
              />

              {/* Área com Gradiente Suave */}
              <path d={areaD} fill={`url(#splineGrad-${activeMetric})`} />

              {/* Linha da Curva Suave Bézier */}
              <path
                d={splinePathD}
                fill="none"
                stroke={cfg.color}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pontos Interativos */}
              {points.map((p, i) => {
                const isHovered = hoveredIndex === i;
                const isLatest = i === points.length - 1;

                return (
                  <g
                    key={p.id}
                    className="evolution-point-group"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Anel Pulsante no Último Ponto */}
                    {isLatest && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="12"
                        fill="none"
                        stroke={cfg.color}
                        strokeWidth="1.5"
                        opacity="0.4"
                        className="latest-point-pulse"
                      />
                    )}

                    {/* Círculo Principal */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 7.5 : isLatest ? 6 : 5}
                      fill="#ffffff"
                      stroke={cfg.color}
                      strokeWidth={isHovered ? 3.5 : 2.5}
                      filter={isHovered || isLatest ? "url(#pointGlow)" : undefined}
                      style={{ transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
                    />

                    {/* Rótulo de Data no Eixo X */}
                    <text
                      x={p.x}
                      y={svgHeight - 14}
                      textAnchor="middle"
                      fontSize="10.5"
                      fill={isHovered || isLatest ? "#173b2b" : "#6f8577"}
                      fontWeight={isHovered || isLatest ? "750" : "600"}
                    >
                      {p.dateStr}
                    </text>

                    {/* Valor Rótulo Flutuante no Topo */}
                    <text
                      x={p.x}
                      y={p.y - 12}
                      textAnchor="middle"
                      fontSize="11.5"
                      fontWeight="800"
                      fill={isHovered ? cfg.color : "#173b2b"}
                    >
                      {p.value.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tooltip Dinâmico ao Passar o Cursor */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div
                className="evolution-floating-tooltip"
                style={{
                  left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                  top: `${(points[hoveredIndex].y / svgHeight) * 100}%`,
                }}
              >
                <div className="tooltip-date">
                  <Calendar size={11} /> {points[hoveredIndex].fullDate}
                </div>
                <div className="tooltip-value" style={{ color: cfg.color }}>
                  <strong>{points[hoveredIndex].value.toFixed(1)}</strong> {cfg.unit}
                </div>
                {points[hoveredIndex].notes && (
                  <div className="tooltip-note">
                    <Info size={10} /> {points[hoveredIndex].notes}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : validData.length === 1 ? (
          <div className="evolution-single-state">
            <div className="single-state-icon" style={{ background: `${cfg.color}14`, color: cfg.color }}>
              <Scale size={32} />
            </div>
            <h4>Primeira medição registrada: {validData[0].value} {cfg.unit}</h4>
            <p>
              Em sua próxima consulta de retorno, a nutricionista fará a nova aferição e o gráfico traçará a curva de
              evolução comparativa.
            </p>
          </div>
        ) : (
          <div className="evolution-empty-state">
            <LineChart size={40} />
            <h4>Nenhuma medição registrada para {cfg.label.toLowerCase()}</h4>
            <p>As avaliações antropométricas e bioimpedâncias realizadas em consulta serão exibidas aqui.</p>
          </div>
        )}
      </div>

      {/* ── TABELA HISTÓRICA DETALHADA DE TODAS AS CONSULTAS ── */}
      {historyList.length > 0 && (
        <div className="evolution-history-card">
          <div className="history-card-head">
            <div>
              <h3>Histórico Clínico de Aferições</h3>
              <p>Registro completo das avaliações realizadas nas consultas</p>
            </div>
            <span className="history-badge-count">{historyList.length} registro(s)</span>
          </div>

          <div className="history-table-wrap">
            <table className="evolution-table">
              <thead>
                <tr>
                  <th>Data da Consulta</th>
                  <th>Peso (kg)</th>
                  <th>Gordura (%)</th>
                  <th>Cintura (cm)</th>
                  <th>Pescoço (cm)</th>
                  <th>Observações da Nutricionista</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((item, idx) => {
                  const isLatest = idx === 0;
                  const isFirst = idx === historyList.length - 1;
                  const dateStr = new Date(item.measuredAt).toLocaleDateString("pt-BR");

                  return (
                    <tr key={item.id || idx} className={isLatest ? "latest-row" : ""}>
                      <td>
                        <div className="table-date-cell">
                          <strong>{dateStr}</strong>
                          {isLatest && <span className="table-tag latest">Última</span>}
                          {isFirst && historyList.length > 1 && (
                            <span className="table-tag first">Marco Inicial</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{item.weight != null ? `${Number(item.weight).toFixed(1)} kg` : "—"}</strong>
                      </td>
                      <td>{item.bodyFat != null ? `${Number(item.bodyFat).toFixed(1)}%` : "—"}</td>
                      <td>{item.waist != null ? `${Number(item.waist).toFixed(1)} cm` : "—"}</td>
                      <td>{item.neck != null ? `${Number(item.neck).toFixed(1)} cm` : "—"}</td>
                      <td className="table-notes-cell">
                        {item.notes ? (
                          <span className="note-text">
                            <FileText size={12} /> {item.notes}
                          </span>
                        ) : (
                          <span className="note-empty">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CARD DE FEEDBACK MOTIVACIONAL & CUIDADO ── */}
      {stats && stats.diff !== 0 && (
        <div className="evolution-insight-card">
          <div className="insight-icon">
            <Award size={24} />
          </div>
          <div className="insight-content">
            <h4>Seu Progresso em Foco</h4>
            <p>
              Desde sua primeira consulta ({stats.firstDate}), você apresentou uma variação de{" "}
              <strong>
                {stats.diff > 0 ? `+${stats.diff.toFixed(1)}` : stats.diff.toFixed(1)} {cfg.unit}
              </strong>{" "}
              em {cfg.label.toLowerCase()}. Lembre-se que transformações sustentáveis de composição corporal são
              construídas com consistência e acolhimento diário.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

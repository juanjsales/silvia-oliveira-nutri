import { Activity, ArrowDownRight, ArrowUpRight, Flame, LineChart, Minus, Scale } from "lucide-react";
import { useMemo, useState } from "react";

type Measurement = {
  id?: string;
  measuredAt: string;
  weight?: number | null;
  bodyFat?: number | null;
  waist?: number | null;
  notes?: string | null;
};

type MetricType = "weight" | "bodyFat" | "waist";

const metricConfig: Record<MetricType, { label: string; unit: string; color: string; icon: any }> = {
  weight: { label: "Peso Corporal", unit: "kg", color: "#16a34a", icon: Scale },
  bodyFat: { label: "% de Gordura", unit: "%", color: "#ea580c", icon: Flame },
  waist: { label: "Circunferência da Cintura", unit: "cm", color: "#2563eb", icon: Activity },
};

export function BodyEvolutionChart({ rows }: { rows: Measurement[] }) {
  const [activeMetric, setActiveMetric] = useState<MetricType>("weight");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Ordenar cronologicamente do mais antigo para o mais recente
  const sorted = useMemo(() => {
    return [...rows]
      .filter((r) => r.measuredAt)
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  }, [rows]);

  const validData = useMemo(() => {
    return sorted
      .map((r, index) => {
        const val = r[activeMetric];
        return {
          index,
          dateStr: new Date(r.measuredAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
          fullDate: new Date(r.measuredAt).toLocaleDateString("pt-BR"),
          value: val != null ? Number(val) : null,
          notes: r.notes,
        };
      })
      .filter((d): d is { index: number; dateStr: string; fullDate: string; value: number; notes?: string | null } => d.value !== null && !isNaN(d.value));
  }, [sorted, activeMetric]);

  const cfg = metricConfig[activeMetric];

  // Estatísticas e Variação
  const stats = useMemo(() => {
    if (validData.length === 0) return null;
    const values = validData.map((d) => d.value);
    const first = values[0];
    const latest = values[values.length - 1];
    const diff = latest - first;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { first, latest, diff, min, max };
  }, [validData]);

  // Cálculos para o SVG Chart
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 35;

  const points = useMemo(() => {
    if (validData.length < 2) return [];
    const values = validData.map((d) => d.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const valRange = maxVal - minVal || 1;

    return validData.map((d, i) => {
      const x = paddingX + (i / (validData.length - 1)) * (svgWidth - paddingX * 2);
      const y = svgHeight - paddingY - ((d.value - minVal) / valRange) * (svgHeight - paddingY * 2);
      return { x, y, ...d };
    });
  }, [validData]);

  const pathD = useMemo(() => {
    if (points.length < 2) return "";
    return points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length < 2) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${pathD} L ${last.x} ${svgHeight - paddingY} L ${first.x} ${svgHeight - paddingY} Z`;
  }, [pathD, points]);

  const Icon = cfg.icon;

  return (
    <div className="evolution-chart-card">
      <header className="chart-header">
        <div className="chart-title-wrap">
          <div className="metric-icon-badge" style={{ color: cfg.color, background: `${cfg.color}18` }}>
            <Icon size={20} />
          </div>
          <div>
            <h3>Evolução Corporal</h3>
            <p>Acompanhe suas conquistas e transformações ao longo das consultas</p>
          </div>
        </div>

        {/* SELETOR DE MÉTRICA */}
        <div className="metric-toggle-group">
          {(Object.keys(metricConfig) as MetricType[]).map((key) => {
            const m = metricConfig[key];
            return (
              <button
                key={key}
                type="button"
                className={`metric-toggle-btn ${activeMetric === key ? "active" : ""}`}
                style={activeMetric === key ? { background: m.color, borderColor: m.color, color: "#fff" } : undefined}
                onClick={() => {
                  setActiveMetric(key);
                  setHoveredPoint(null);
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* KPI SUMMARY CARDS */}
      {stats && (
        <div className="chart-kpis-bar">
          <div className="chart-kpi">
            <span>Última Medição</span>
            <strong>
              {stats.latest} {cfg.unit}
            </strong>
          </div>
          <div className="chart-kpi">
            <span>Início</span>
            <strong>
              {stats.first} {cfg.unit}
            </strong>
          </div>
          <div className="chart-kpi">
            <span>Variação Total</span>
            <strong
              style={{
                color:
                  stats.diff < 0
                    ? activeMetric === "weight" || activeMetric === "bodyFat"
                      ? "#16a34a"
                      : "#2563eb"
                    : stats.diff > 0
                    ? "#ea580c"
                    : "#64748b",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {stats.diff < 0 ? <ArrowDownRight size={16} /> : stats.diff > 0 ? <ArrowUpRight size={16} /> : <Minus size={16} />}
              {stats.diff > 0 ? `+${stats.diff.toFixed(1)}` : stats.diff.toFixed(1)} {cfg.unit}
            </strong>
          </div>
        </div>
      )}

      {/* GRÁFICO SVG RESPONSIVO */}
      {validData.length >= 2 ? (
        <div className="chart-svg-container">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="evolution-svg">
            <defs>
              <linearGradient id={`grad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cfg.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={cfg.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Linhas de Grade */}
            <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#e2e8f0" />

            {/* Área Sombreada */}
            <path d={areaD} fill={`url(#grad-${activeMetric})`} />

            {/* Linha da Curva */}
            <path d={pathD} fill="none" stroke={cfg.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Pontos de Medição */}
            {points.map((p, i) => {
              const isHovered = hoveredPoint === i;
              return (
                <g key={i} className="chart-point-group" onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 7 : 5}
                    fill="#ffffff"
                    stroke={cfg.color}
                    strokeWidth={isHovered ? 3.5 : 2.5}
                    style={{ transition: "all 0.15s ease", cursor: "pointer" }}
                  />
                  {/* Rótulo de Data no Eixo X */}
                  <text x={p.x} y={svgHeight - 12} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">
                    {p.dateStr}
                  </text>
                  {/* Rótulo de Valor Flutuante */}
                  <text
                    x={p.x}
                    y={p.y - 12}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill={isHovered ? cfg.color : "#1e293b"}
                  >
                    {p.value} {cfg.unit}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : validData.length === 1 ? (
        <div className="chart-single-point-notice">
          <Scale size={28} style={{ color: cfg.color }} />
          <strong>Primeira medição registrada: {validData[0].value} {cfg.unit}</strong>
          <p>Após sua próxima consulta, o gráfico traçará a curva comparativa de evolução.</p>
        </div>
      ) : (
        <div className="chart-empty-state">
          <LineChart size={36} />
          <strong>Nenhuma medição de {cfg.label.toLowerCase()} registrada ainda.</strong>
          <p>As medições aferidas nas consultas aparecerão automaticamente aqui.</p>
        </div>
      )}
    </div>
  );
}

import { Droplet, Droplets, Plus } from "lucide-react";
import { useState } from "react";

interface PortalWaterTrackerProps {
  currentLiters: number;
  goalLiters?: number;
  onAddWater: (liters: number) => Promise<void>;
}

export function PortalWaterTracker({
  currentLiters = 0,
  goalLiters = 2.5,
  onAddWater,
}: PortalWaterTrackerProps) {
  const [adding, setAdding] = useState(false);

  const percent = Math.min(100, Math.round((currentLiters / goalLiters) * 100));
  const strokeDashoffset = 283 - (283 * percent) / 100;

  async function handleAdd(amount: number) {
    if (adding) return;
    setAdding(true);
    try {
      await onAddWater(amount);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="water-tracker-card">
      <div className="water-card-header">
        <div className="water-card-title">
          <div className="water-icon-badge">
            <Droplets size={20} />
          </div>
          <div>
            <strong>Meta de Hidratação</strong>
            <small>Registre seu consumo de água hoje</small>
          </div>
        </div>
      </div>

      <div className="water-ring-layout">
        {/* SVG CIRCULAR PROGRESS RING */}
        <div className="water-svg-ring">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#0284c7"
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
            <text
              x="50"
              y="55"
              textAnchor="middle"
              fontSize="16"
              fontWeight="800"
              fill="#0284c7"
            >
              {percent}%
            </text>
          </svg>
        </div>

        <div className="water-ring-stats">
          <span className="water-current-val">
            {(currentLiters || 0).toFixed(2)} L
          </span>
          <span className="water-goal-val">
            Meta diária: {goalLiters.toFixed(1)} L ({percent}%)
          </span>
          <small style={{ color: percent >= 100 ? "#16a34a" : "#64748b", fontSize: "0.74rem", fontWeight: 600 }}>
            {percent >= 100 ? "🎉 Parabéns! Meta de hoje batida!" : `Faltam ${Math.max(0, goalLiters - currentLiters).toFixed(2)} L`}
          </small>
        </div>
      </div>

      <div className="water-quick-buttons">
        <button
          type="button"
          className="water-btn-add"
          disabled={adding}
          onClick={() => handleAdd(0.25)}
        >
          <Droplet size={14} /> +250 ml (Copo)
        </button>

        <button
          type="button"
          className="water-btn-add"
          disabled={adding}
          onClick={() => handleAdd(0.5)}
        >
          <Droplets size={14} /> +500 ml (Garrafa)
        </button>
      </div>
    </div>
  );
}

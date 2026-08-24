import { CheckCircle2, Droplet, Droplets, Sparkles } from "lucide-react";
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
  const isGoalReached = percent >= 100;

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
    <div className={`water-tracker-card ${isGoalReached ? 'water-goal-achieved' : ''}`}>
      <div className="water-card-header">
        <div className="water-card-title">
          <div className="water-icon-badge">
            <Droplets size={19} />
          </div>
          <div>
            <strong>Meta de Hidratação</strong>
            <small>Acompanhamento de consumo diário</small>
          </div>
        </div>
        {isGoalReached && (
          <span className="water-success-pill">
            <CheckCircle2 size={13} /> Concluída
          </span>
        )}
      </div>

      <div className="water-ring-layout">
        {/* SVG CIRCULAR PROGRESS RING */}
        <div className="water-svg-ring">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2f7352" />
                <stop offset="100%" stopColor="#5fa47e" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e6ede8"
              strokeWidth="7.5"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#waterGradient)"
              strokeWidth="7.5"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
            <text
              x="50"
              y="54"
              textAnchor="middle"
              fontSize="16"
              fontWeight="800"
              fill="#1b3d2c"
            >
              {percent}%
            </text>
          </svg>
        </div>

        <div className="water-ring-stats">
          <span className="water-current-val">
            {(currentLiters || 0).toFixed(2)} <small>L</small>
          </span>
          <span className="water-goal-val">
            Meta diária: {goalLiters.toFixed(1)} L
          </span>
          <div className="water-status-label">
            {isGoalReached ? (
              <span className="water-status-complete">
                <Sparkles size={12} /> Meta do dia alcançada!
              </span>
            ) : (
              <span className="water-status-pending">
                Faltam {Math.max(0, goalLiters - currentLiters).toFixed(2)} L
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="water-quick-buttons">
        <button
          type="button"
          className="water-btn-add"
          disabled={adding}
          onClick={() => handleAdd(0.25)}
        >
          <Droplet size={14} /> +250 ml <span className="btn-subtext">(Copo)</span>
        </button>

        <button
          type="button"
          className="water-btn-add"
          disabled={adding}
          onClick={() => handleAdd(0.5)}
        >
          <Droplets size={14} /> +500 ml <span className="btn-subtext">(Garrafa)</span>
        </button>
      </div>
    </div>
  );
}

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
      <div className="water-card-head">
        <div className={`water-badge-time ${isGoalReached ? 'badge-achieved' : ''}`}>
          {isGoalReached ? (
            <>
              <CheckCircle2 size={12} /> Meta Concluída ({percent}%)
            </>
          ) : (
            <>
              <Droplet size={12} /> Meta Diária · Hidratação
            </>
          )}
        </div>

        <div className="water-header-info">
          <div className="water-title-row">
            <div className="water-icon-pill">
              <Droplets size={16} />
            </div>
            <h3>Consumo de Água</h3>
          </div>
          <p>Registre sua hidratação e acompanhe a meta do dia:</p>
        </div>
      </div>

      <div className="water-ring-layout">
        {/* SVG CIRCULAR PROGRESS RING */}
        <div className="water-svg-ring">
          <svg viewBox="0 0 100 100" width="100%" height="100%" aria-label={`Progresso de água: ${percent}%`}>
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
              stroke="#e8efe9"
              strokeWidth="7"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#waterGradient)"
              strokeWidth="7"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text
              x="50"
              y="54"
              textAnchor="middle"
              fontSize="16"
              fontWeight="800"
              fill="#183b2b"
            >
              {percent}%
            </text>
          </svg>
        </div>

        <div className="water-ring-stats">
          <div className="water-values-row">
            <span className="water-current-val">
              {(currentLiters || 0).toFixed(2)} <small>L</small>
            </span>
            <span className="water-goal-tag">
              Meta: {goalLiters.toFixed(1)} L
            </span>
          </div>

          <div className="water-status-label">
            {isGoalReached ? (
              <span className="water-status-complete">
                <Sparkles size={13} /> Excelente! Meta diária atingida.
              </span>
            ) : (
              <span className="water-status-pending">
                Faltam <strong>{Math.max(0, goalLiters - currentLiters).toFixed(2)} L</strong> para sua meta
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

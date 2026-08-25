import { AlertTriangle, LogOut, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { ClinicMark, useClinic } from '../contexts/ClinicContext';
import './BrandWelcomeScreen.css';

export interface BrandWelcomeScreenProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  fading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onExit?: () => void;
}

export function BrandWelcomeScreen({
  title = 'Consultório Nutricional',
  subtitle = 'Nutrição e saúde',
  badge = 'Espaço de Cuidado & Bem-Estar',
  fading = false,
  error = false,
  onRetry,
  onExit,
}: BrandWelcomeScreenProps) {
  const clinic = useClinic();
  const displayTitle = error ? 'Não foi possível carregar as informações' : title;
  const displaySubtitle = error ? 'Verifique sua conexão ou tente novamente.' : subtitle;

  return (
    <div
      className={`brand-welcome-backdrop${error ? ' brand-welcome-error' : ''}${fading ? ' brand-welcome-fading' : ''}`}
      role={error ? 'alert' : 'status'}
      aria-live={error ? 'assertive' : 'polite'}
    >
      <div className="brand-welcome-ambient" aria-hidden="true" />

      <div className="brand-welcome-card">
        <div className="brand-welcome-orb" aria-hidden="true">
          <div className="brand-orb-ring ring-1" />
          <div className="brand-orb-ring ring-2" />
          <div className="brand-orb-core">
            {error ? (
              <AlertTriangle size={28} className="brand-error-icon" />
            ) : (
              <ClinicMark className="brand-welcome-logo" />
            )}
          </div>
          {!error && (
            <div className="brand-sparkle-dot top-right">
              <Sparkles size={14} />
            </div>
          )}
        </div>

        <div className="brand-welcome-text">
          <span className="brand-welcome-pill">
            <Sparkles size={12} /> {error ? 'Acesso Seguro' : badge}
          </span>
          <h1 className="brand-welcome-title">{displayTitle === 'Consultório Nutricional' ? clinic.clinicName : displayTitle}</h1>
          <p className="brand-welcome-sub">{displaySubtitle}</p>
        </div>

        {(onRetry || onExit) && (
          <div className="brand-welcome-actions">
            {onRetry && (
              <button type="button" className="primary-button" onClick={onRetry}>
                <RefreshCw size={16} /> Tentar novamente
              </button>
            )}
            {onExit && (
              <button type="button" className="secondary-button" onClick={onExit}>
                <LogOut size={16} /> Sair com segurança
              </button>
            )}
          </div>
        )}

        <div className="brand-welcome-footer">
          <ShieldCheck size={14} />
          <span>Ambiente seguro, individualizado e acolhedor</span>
        </div>
      </div>
    </div>
  );
}

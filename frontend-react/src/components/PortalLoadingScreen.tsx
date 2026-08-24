import { AlertTriangle, Heart, LogOut, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import '../portal-premium.css';

type PortalLoadingScreenProps = {
  message?: string;
  error?: boolean;
  onRetry?: () => void;
  onExit?: () => void;
};

export function PortalLoadingScreen({
  message = 'Preparando seu plano alimentar e suas orientações com todo o cuidado.',
  error = false,
  onRetry,
  onExit,
}: PortalLoadingScreenProps) {
  const title = error ? 'Não foi possível acessar seu portal' : 'Seja muito bem-vindo(a)';

  return (
    <main className={`portal-welcome-screen${error ? ' portal-welcome-error' : ''}`}>
      <div className="portal-welcome-ambient" aria-hidden="true" />
      
      <section
        className="portal-welcome-content"
        role={error ? 'alert' : 'status'}
        aria-live={error ? 'assertive' : 'polite'}
        aria-atomic="true"
        aria-labelledby="portal-welcome-title"
      >
        {error ? (
          <div className="portal-welcome-emblem error-emblem" aria-hidden="true">
            <AlertTriangle size={32} />
          </div>
        ) : (
          <div className="portal-welcome-zen-orb" aria-hidden="true">
            <div className="zen-breathing-ring ring-outer" />
            <div className="zen-breathing-ring ring-middle" />
            <div className="zen-center-circle">
              <Sparkles size={26} className="zen-icon" />
            </div>
            <div className="zen-orbital-spinner" />
          </div>
        )}

        <div className="portal-welcome-text-zone">
          <span className="portal-welcome-tag">
            {error ? (
              <>Acesso Protegido</>
            ) : (
              <>
                <Heart size={12} /> Espaço de Cuidado & Nutrição
              </>
            )}
          </span>
          <h1 id="portal-welcome-title">{title}</h1>
          <p>{message}</p>
        </div>

        {!error && (
          <div className="portal-welcome-progress" aria-hidden="true">
            <div className="portal-welcome-progress-bar" />
          </div>
        )}

        {(onRetry || onExit) && (
          <div className="portal-welcome-actions">
            {onRetry && (
              <button type="button" className="primary-button" onClick={onRetry}>
                <RefreshCw size={17} /> Tentar novamente
              </button>
            )}
            {onExit && (
              <button type="button" className="secondary-button" onClick={onExit}>
                <LogOut size={17} /> Sair com segurança
              </button>
            )}
          </div>
        )}

        <footer className="portal-welcome-footer">
          <ShieldCheck size={14} />
          <small>
            {error
              ? 'Seus dados permanecem seguros e protegidos.'
              : 'Ambiente seguro e confidencial para o seu acompanhamento nutricional.'}
          </small>
        </footer>
      </section>
    </main>
  );
}

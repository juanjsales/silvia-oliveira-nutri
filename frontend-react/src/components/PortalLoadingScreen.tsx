import { AlertTriangle, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import '../portal-premium.css';

type PortalLoadingScreenProps = {
  message?: string;
  error?: boolean;
  onRetry?: () => void;
  onExit?: () => void;
};

export function PortalLoadingScreen({
  message = 'Estamos organizando suas informações com segurança.',
  error = false,
  onRetry,
  onExit,
}: PortalLoadingScreenProps) {
  const title = error ? 'Não foi possível abrir seu portal' : 'Preparando seu portal';

  return (
    <main className={`portal-loading-screen${error ? ' portal-loading-screen-error' : ''}`}>
      <section
        className="portal-loading-card"
        role={error ? 'alert' : 'status'}
        aria-live={error ? 'assertive' : 'polite'}
        aria-atomic="true"
        aria-labelledby="portal-loading-title"
      >
        {error ? (
          <div className="portal-loading-brand" aria-hidden="true"><AlertTriangle /></div>
        ) : (
          <div className="portal-loading-visual" aria-hidden="true">
            <span className="portal-loading-aura ring-1" />
            <span className="portal-loading-aura ring-2" />
            <span className="portal-loading-aura ring-3" />
            <span className="portal-loading-spinner" />
            <span className="portal-loading-brand"><ShieldCheck /></span>
          </div>
        )}
        <span className="portal-loading-eyebrow">{error ? 'Acesso protegido' : 'Ambiente seguro'}</span>
        <h1 id="portal-loading-title">{title}</h1>
        <p>{message}</p>
        {!error && (
          <div className="portal-loading-progress-track" aria-hidden="true">
            <div className="portal-loading-progress-bar" />
          </div>
        )}
        {(onRetry || onExit) && (
          <div className="portal-loading-actions">
            {onRetry && <button type="button" className="primary-button" onClick={onRetry}><RefreshCw size={17} /> Tentar novamente</button>}
            {onExit && <button type="button" className="secondary-button" onClick={onExit}><LogOut size={17} /> Sair com segurança</button>}
          </div>
        )}
        <small>{error ? 'Se o problema continuar, verifique sua conexão e tente novamente em alguns instantes.' : 'Nenhuma informação clínica é exibida até a validação do acesso.'}</small>
      </section>
    </main>
  );
}

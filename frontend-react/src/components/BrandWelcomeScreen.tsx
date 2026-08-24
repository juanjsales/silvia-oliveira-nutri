import { Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import './BrandWelcomeScreen.css';

interface BrandWelcomeScreenProps {
  title?: string;
  subtitle?: string;
  badge?: string;
}

export function BrandWelcomeScreen({
  title = 'Dra. Silvia Oliveira Lemos',
  subtitle = 'Nutrição Clínica & Esportiva · Saúde Integrativa',
  badge = 'Espaço de Cuidado & Bem-Estar',
}: BrandWelcomeScreenProps) {
  return (
    <div className="brand-welcome-backdrop" role="status" aria-live="polite">
      <div className="brand-welcome-ambient" aria-hidden="true" />
      
      <div className="brand-welcome-card">
        <div className="brand-welcome-orb" aria-hidden="true">
          <div className="brand-orb-ring ring-1" />
          <div className="brand-orb-ring ring-2" />
          <div className="brand-orb-core">
            <Leaf size={28} className="brand-leaf-icon" />
          </div>
          <div className="brand-sparkle-dot top-right">
            <Sparkles size={14} />
          </div>
        </div>

        <div className="brand-welcome-text">
          <span className="brand-welcome-pill">
            <Sparkles size={12} /> {badge}
          </span>
          <h1 className="brand-welcome-title">{title}</h1>
          <p className="brand-welcome-sub">{subtitle}</p>
        </div>

        <div className="brand-welcome-bar-wrap" aria-hidden="true">
          <div className="brand-welcome-bar-fill" />
        </div>

        <div className="brand-welcome-footer">
          <ShieldCheck size={14} />
          <span>Ambiente seguro, individualizado e acolhedor</span>
        </div>
      </div>
    </div>
  );
}

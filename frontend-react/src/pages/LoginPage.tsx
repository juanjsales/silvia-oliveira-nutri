import { ArrowRight, CheckCircle2, Heart, Leaf, LockKeyhole, Sparkles } from 'lucide-react';
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../contexts/AuthContext';
import { ClinicMark, useClinic } from '../contexts/ClinicContext';

type LoginLocationState = { from?: string } | null;

function safeReturnPath(state: LoginLocationState) {
  const path = state?.from;
  return path?.startsWith('/') && !path.startsWith('//') ? path : null;
}

export function LoginPage() {
  const { user, login } = useAuth();
  const clinic = useClinic();
  const navigate = useNavigate();
  const location = useLocation();
  const identifierRef = useRef<HTMLInputElement>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [morphing, setMorphing] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  if (user && !morphing) return <Navigate to={user.role === 'PATIENT' ? '/portal' : '/painel'} replace />;

  function updateCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState('CapsLock'));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || morphing) return;
    setError('');
    setSubmitting(true);
    try {
      const authenticatedUser = await login(identifier.trim(), password);
      const returnPath = safeReturnPath(location.state as LoginLocationState);
      const targetPath = returnPath ?? (authenticatedUser.role === 'PATIENT' ? '/portal' : '/painel');

      if (authenticatedUser.role === 'PATIENT' && targetPath.startsWith('/portal')) {
        setMorphing(true);
        setTimeout(() => {
          navigate(targetPath, { replace: true });
        }, 720);
      } else {
        navigate(targetPath, { replace: true });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar. Tente novamente.');
      identifierRef.current?.focus();
      setSubmitting(false);
    }
  }

  return (
    <main className={`login-page ${morphing ? 'login-page-morphing' : ''}`}>
      <section className="login-story" aria-labelledby="login-story-title">
        <div className="story-glow" aria-hidden="true" />
        <div className="story-content">
          <div className="brand light"><ClinicMark /><div><strong>{clinic.clinicName}</strong><span>{clinic.specialty}</span></div></div>
          <div className="story-copy">
            <span className="eyebrow light-text">Cuidado que se organiza</span>
            <h1 id="login-story-title">Mais presença no atendimento.<br />Menos ruído na rotina.</h1>
            <p>Um espaço clínico pensado para acompanhar cada paciente com clareza, contexto e continuidade.</p>
            <div className="story-points" aria-label="Benefícios da plataforma">
              <span><CheckCircle2 aria-hidden="true" /> Jornada clínica em um só lugar</span>
              <span><CheckCircle2 aria-hidden="true" /> Dados protegidos e acessíveis</span>
            </div>
          </div>
          <div className="story-quote"><Leaf aria-hidden="true" /><p>“Cuidar bem também é tornar o complexo mais simples.”</p></div>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <form className={`login-card ${morphing ? 'morphing-to-portal' : ''}`} onSubmit={submit} aria-busy={submitting || morphing}>
          {morphing ? (
            <div className="morph-zen-stage" aria-live="polite">
              <div className="portal-welcome-zen-orb" aria-hidden="true">
                <div className="zen-breathing-ring ring-outer" />
                <div className="zen-breathing-ring ring-middle" />
                <div className="zen-center-circle">
                  <Sparkles size={28} className="zen-icon" />
                </div>
                <div className="zen-orbital-spinner" />
              </div>
              <span className="portal-welcome-tag">
                <Heart size={12} /> Espaço de Cuidado
              </span>
              <h2>Seja muito bem-vindo(a)</h2>
              <p>Preparando seu portal e suas orientações com carinho...</p>
              <div className="portal-welcome-progress" aria-hidden="true">
                <div className="portal-welcome-progress-bar" />
              </div>
            </div>
          ) : (
            <>
              <div className="mobile-login-brand"><ClinicMark /><strong>{clinic.clinicName}</strong></div>
              <header>
                <span className="eyebrow">Acesso ao portal</span>
                <h2 id="login-title">Bem-vindo ao seu espaço</h2>
                <p className="muted">Entre com seu e-mail ou CPF e sua senha para continuar.</p>
              </header>
              <label htmlFor="login-identifier">
                E-mail ou CPF
                <input ref={identifierRef} id="login-identifier" name="identifier" value={identifier} onChange={(event) => { setIdentifier(event.target.value); if (error) setError(''); }} autoComplete="username" autoCapitalize="none" spellCheck={false} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} disabled={submitting} required />
              </label>
              <label htmlFor="login-password">
                Senha
                <PasswordInput id="login-password" name="password" value={password} onChange={(event) => { setPassword(event.target.value); if (error) setError(''); }} onKeyDown={updateCapsLock} onKeyUp={updateCapsLock} onBlur={() => setCapsLock(false)} autoComplete="current-password" aria-invalid={Boolean(error)} aria-describedby={[error ? 'login-error' : '', capsLock ? 'caps-lock-warning' : ''].filter(Boolean).join(' ') || undefined} disabled={submitting} required />
              </label>
              {capsLock && <div id="caps-lock-warning" className="security-note" role="status">Caps Lock está ativado.</div>}
              {error && <div id="login-error" className="form-error" role="alert" aria-live="assertive">{error}</div>}
              <button className="primary-button login-submit" type="submit" disabled={submitting} aria-busy={submitting}>
                {submitting ? <><span className="spinner" aria-hidden="true" /> Entrando...</> : <>Entrar <ArrowRight aria-hidden="true" /></>}
              </button>
              <Link className="auth-back" to="/recuperar-senha">Esqueceu sua senha?</Link>
              <div className="security-note"><LockKeyhole aria-hidden="true" /> Acesso protegido e sessão segura.</div>
            </>
          )}
        </form>
      </section>
    </main>
  );
}

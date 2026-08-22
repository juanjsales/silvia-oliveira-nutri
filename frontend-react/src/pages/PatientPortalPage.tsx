import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  Droplets,
  FileText,
  FlaskConical,
  Goal,
  KeyRound,
  LineChart,
  LogOut,
  MessageCircle,
  Salad,
  Save,
  ShoppingBasket,
  Sparkles,
  UserRound,
  Utensils,
  Video,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTeleconsultation } from '../contexts/TeleconsultationContext';
import { api } from '../lib/api';
import { PwaInstallBanner } from '../components/PwaInstallBanner';
import { BodyEvolutionChart } from '../components/BodyEvolutionChart';
import { ShoppingListSection } from '../components/ShoppingListModal';
import { PortalBottomNav, type PortalTab } from '../components/portal/PortalBottomNav';
import { PortalWaterTracker } from '../components/portal/PortalWaterTracker';
import { PortalCurrentMealCard } from '../components/portal/PortalCurrentMealCard';
import { PortalMealPlanView } from '../components/portal/PortalMealPlanView';
import { PortalLaminasView } from '../components/portal/PortalLaminasView';
import { useToast } from '../components/ToastNotification';
import { formatAppointmentSchedule } from '../lib/formatters';
import '../portal-premium.css';

type Any = Record<string, any>;
type Tab = PortalTab;

const tabs: [Tab, string, React.ComponentType<{ size?: number } | Any>][] = [
  ['inicio', 'Início', Sparkles],
  ['plano', 'Meu Plano', Utensils],
  ['diario', 'Diário', Salad],
  ['laminas', 'Lâminas & Guias', BookOpen],
  ['exames', 'Exames', FlaskConical],
  ['evolucao', 'Evolução', LineChart],
  ['mensagens', 'Mensagens', MessageCircle],
  ['agenda', 'Agenda', CalendarDays],
  ['metas', 'Metas', Goal],
  ['compras', 'Compras', ShoppingBasket],
  ['financeiro', 'Financeiro', CreditCard],
  ['perfil', 'Perfil', UserRound],
];

export function PatientPortalPage() {
  const [data, setData] = useState<Any | null>(null);
  const [tab, setTab] = useState<Tab>('inicio');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('portal-font-scale') || 1));
  const [contrast, setContrast] = useState(() => localStorage.getItem('portal-contrast') === 'true');
  const notifRef = useRef<HTMLDivElement>(null);
  const prevActiveCallRef = useRef<string | null>(null);
  const knownNotificationIdsRef = useRef<Set<string> | null>(null);
  const loadSequenceRef = useRef(0);
  const { logout } = useAuth();
  const { showToast, dismissToastByKey } = useToast();
  const navigate = useNavigate();
  const { activeCall, isCallActiveFor, restoreCall } = useTeleconsultation();

  const load = useCallback(
    () => {
      const sequence = ++loadSequenceRef.current;
      return (
      api<{ data: Any }>('/api/portal/home')
        .then((r) => {
          if (sequence !== loadSequenceRef.current) return;
          const res = r.data;
          // Dispara alerta em tempo real se a nutricionista acabou de iniciar a chamada
          const activeEnc = res.activeConsultation;
          const currentCallId = activeEnc?.id || null;
          const alreadyInCurrentCall = isCallActiveFor(currentCallId, activeEnc?.appointmentId, activeEnc?.meetingUrl);
          if (alreadyInCurrentCall) dismissToastByKey('active-teleconsultation');
          if (currentCallId && !alreadyInCurrentCall && currentCallId !== prevActiveCallRef.current) {
            showToast({
              key: 'active-teleconsultation',
              title: '🎥 Teleconsulta Iniciada!',
              message: 'Dra. Silvia iniciou o seu atendimento. Clique para entrar na sala.',
              type: 'call',
              actionLabel: 'Entrar na Sala',
              onAction: () => navigate(activeEnc.meetingUrl || `/portal/video/${currentCallId}`),
              duration: 12000,
            });
          }
          if (!currentCallId) dismissToastByKey('active-teleconsultation');
          prevActiveCallRef.current = currentCallId;

          // Dispara alerta se chegaram novas notificações
          const currentIds = new Set<string>((res.notifications || []).filter((n: Any) => n.status === 'ACTIVE' && !n.readAt).map((n: Any) => n.id));
          if (knownNotificationIdsRef.current !== null) {
            const latest = (res.notifications || []).find((n: Any) => currentIds.has(n.id) && !knownNotificationIdsRef.current!.has(n.id));
            if (latest && !isCallActiveFor(latest.actionUrl)) {
              showToast({
                key: `patient-notification:${latest.id}`,
                title: latest.title,
                message: latest.body,
                type: latest.kind === 'MESSAGE' ? 'message' : 'info',
                duration: 7000,
              });
            }
          }
          knownNotificationIdsRef.current = currentIds;

          setData(res);
        })
        .catch((c) => { if (sequence === loadSequenceRef.current) setError(c instanceof Error ? c.message : 'Erro ao abrir portal.'); })
      );
    },
    [showToast, dismissToastByKey, navigate, isCallActiveFor],
  );

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!activeCall) {
      prevActiveCallRef.current = null;
      return;
    }
    dismissToastByKey('active-teleconsultation');
    const redundant = (data?.notifications || []).filter((notification: Any) =>
      notification.status === 'ACTIVE' && !notification.readAt && isCallActiveFor(notification.actionUrl),
    );
    redundant.forEach((notification: Any) => {
      void api(`/api/portal/notifications/${notification.id}/read`, { method: 'PATCH' });
    });
  }, [activeCall, data?.notifications, dismissToastByKey, isCallActiveFor]);

  useEffect(() => {
    localStorage.setItem('portal-font-scale', String(fontScale));
    localStorage.setItem('portal-contrast', String(contrast));
    document.documentElement.style.setProperty('--portal-scale', String(fontScale));
    document.body.classList.toggle('portal-high-contrast', contrast);
    return () => document.body.classList.remove('portal-high-contrast');
  }, [fontScale, contrast]);

  useEffect(() => {
    const handler = (event: Event) => setTab((event as CustomEvent<Tab>).detail);
    window.addEventListener('portal:tab', handler);
    return () => window.removeEventListener('portal:tab', handler);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  async function exit() {
    await logout();
    navigate('/login');
  }

  async function submit(path: string, body: Any) {
    setError('');
    setNotice('');
    try {
      const r = await api<{ message: string }>(path, { method: 'POST', body: JSON.stringify(body) });
      setNotice(r.message);
      await load();
    } catch (c) {
      setError(c instanceof Error ? c.message : 'Não foi possível concluir.');
    }
  }

  async function markNotificationRead(id: string) {
    try {
      await api(`/api/portal/notifications/${id}/read`, { method: 'PATCH' });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a notificação.'); }
  }
  async function markAllNotificationsRead() { await api('/api/portal/notifications/read-all',{method:'PATCH'}); await load(); }
  async function archiveNotification(id:string) { await api(`/api/portal/notifications/${id}/archive`,{method:'PATCH'}); await load(); }

  async function addQuickWater(amountLiters: number) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const existingEntry = data?.diary?.find((d: Any) => String(d.entryDate).slice(0, 10) === todayStr);
    const currentWater = existingEntry?.waterLiters || 0;
    const newTotal = +(currentWater + amountLiters).toFixed(2);

    try {
      await submit('/api/portal/diary', {
        entryDate: todayStr,
        waterLiters: newTotal,
        hunger: existingEntry?.hunger ?? 5,
        satiety: existingEntry?.satiety ?? 5,
        adherence: existingEntry?.adherence ?? 80,
      });
      setNotice(`+${amountLiters * 1000} ml de água registrado! Total hoje: ${newTotal} L`);
    } catch {
      setError('Erro ao registrar hidratação.');
    }
  }

  const activeTeleconsultation = useMemo(() => {
    return data?.activeConsultation || null;
  }, [data?.activeConsultation]);

  if (error && !data)
    return (
      <main className="patient-portal">
        <div className="form-error">{error}</div>
      </main>
    );

  if (!data)
    return (
      <div className="page-loader">
        <span className="spinner" />
        <p>Preparando seu portal...</p>
      </div>
    );

  const unreadNotifs = data.notifications?.filter((n: Any) => n.status === 'ACTIVE' && !n.readAt && !isCallActiveFor(n.actionUrl)) || [];
  const currentTeleconsultationIsOpen = Boolean(activeCall && activeTeleconsultation && isCallActiveFor(activeTeleconsultation.id, activeTeleconsultation.appointmentId, activeTeleconsultation.meetingUrl));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = data.patient.name.split(' ')[0];

  return (
    <main className="patient-portal-v2">
      {/* ── CABEÇALHO TIMBRADO OFICIAL DO PORTAL ── */}
      <header className="portal-header-v2">
        <div className="portal-brand-v2">
          <div className="portal-logo-avatar">
            {data.settings?.logoUrl ? (
              <img src={data.settings.logoUrl} alt="Logotipo" />
            ) : (
              <span>{data.settings?.clinicName?.[0] || 'N'}</span>
            )}
          </div>
          <div className="portal-brand-text">
            <strong>{data.settings?.clinicName || 'Consultório Nutricional'}</strong>
            <small>{data.settings?.professionalName} · Nutricionista</small>
          </div>
        </div>

        <div className="portal-header-actions">
          {/* SINO DE NOTIFICAÇÕES */}
          <div className="portal-notif-container" ref={notifRef}>
            <button
              type="button"
              className="portal-icon-btn"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="Notificações do paciente"
              title="Notificações"
            >
              <Bell size={18} />
              {unreadNotifs.length > 0 && <span className="notif-badge">{Math.min(unreadNotifs.length,99)}</span>}
            </button>

            {notifOpen && (
              <div className="portal-notif-dropdown">
                <header className="portal-notif-head">
                  <div><strong>Notificações</strong><small>{unreadNotifs.length ? `${unreadNotifs.length} não lida(s)` : 'Tudo em dia'}</small></div>
                  {unreadNotifs.length > 0 && <button className="notif-read-btn ghost-button" onClick={() => void markAllNotificationsRead()}>Marcar todas lidas</button>}
                  <button className="icon-button" aria-label="Fechar notificações" onClick={() => setNotifOpen(false)}>
                    <X size={15} />
                  </button>
                </header>
                <div className="portal-notif-items">
                  {data.notifications?.length ? (
                    data.notifications.map((n: Any) => (
                      <article key={n.id} className={`portal-notif-row ${!n.readAt && n.status==='ACTIVE' ? 'unread' : 'read'} ${n.status?.toLowerCase()}`}>
                        <div>
                          <strong>{n.title}</strong>
                          <p>{n.body}</p>
                          <small>{new Date(n.createdAt).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}{n.status==='RESOLVED'?' · Resolvida':''}</small>
                          <div className="portal-notif-actions">
                            {n.actionUrl && n.status==='ACTIVE' && <button className="notif-read-btn" onClick={()=>{setNotifOpen(false);if(isCallActiveFor(n.actionUrl))restoreCall();else navigate(n.actionUrl)}}>{isCallActiveFor(n.actionUrl)?'Voltar à chamada':'Abrir'}</button>}
                            {!n.readAt && <button className="notif-read-btn ghost-button" onClick={() => void markNotificationRead(n.id)}>Marcar lida</button>}
                            <button className="notif-read-btn ghost-button" onClick={() => void archiveNotification(n.id)}>Arquivar</button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="portal-notif-empty">Nenhuma notificação nova</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="portal-icon-btn"
            onClick={() => setTab('perfil')}
            title="Meu Perfil & Senha"
          >
            <UserRound size={18} />
          </button>

          <button type="button" className="portal-logout-btn" onClick={exit} title="Sair do portal com segurança">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      {/* ── BANNER DE RETOMADA IMEDIATA DE TELECONSULTA ── */}
      {activeTeleconsultation && !currentTeleconsultationIsOpen && (
        <aside className="portal-active-teleconsult-bar">
          <div className="active-teleconsult-info">
            <span className="teleconsult-live-pill">
              <span className="live-dot" /> AO VIVO
            </span>
            <div>
              <strong>Teleconsulta pronta para atendimento!</strong>
              <p>Sua sala virtual com a nutricionista está disponível. Clique para entrar ou reconectar.</p>
            </div>
          </div>
          <Link to={activeTeleconsultation.meetingUrl} className="primary-button join-live-btn">
            <Video size={16} /> Entrar na Sala
          </Link>
        </aside>
      )}

      {/* ── HERO BANNER DE SAUDAÇÃO ── */}
      <section className="portal-hero-card">
        <div className="hero-left">
          <span className="hero-greeting-tag">
            <Sparkles size={13} /> {greeting}, {firstName}!
          </span>
          <h1>Seu plano, diário e evolução em um só lugar.</h1>
          <p>{data.patient.objective || 'Acompanhe suas metas e orientações nutricionais individualizadas.'}</p>
        </div>
      </section>

      <PwaInstallBanner />

      {/* ── BARRA DE NAVEGAÇÃO NATIVA (DESKTOP PILLS + MOBILE BOTTOM BAR) ── */}
      <PortalBottomNav
        currentTab={tab}
        onChangeTab={(newTab) => setTab(newTab)}
        unreadCount={unreadNotifs.length}
      />

      {error && <div className="form-error">{error}</div>}
      {notice && (
        <div className="form-success">
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      <PortalContent
        tab={tab}
        setTab={setTab}
        data={data}
        submit={submit}
        reload={load}
        addQuickWater={addQuickWater}
      />
    </main>
  );
}

function PortalContent({
  tab,
  setTab,
  data,
  submit,
  reload,
  addQuickWater,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  data: Any;
  submit: (p: string, b: Any) => Promise<void>;
  reload: () => Promise<void> | void;
  addQuickWater: (l: number) => Promise<void>;
}) {
  const activePlan = data.plans?.find((p: Any) => p.status === 'PUBLISHED') || data.plans?.[0] || null;

  if (tab === 'inicio') return <PortalHome data={data} setTab={setTab} reload={reload} addQuickWater={addQuickWater} />;
  if (tab === 'plano') return <PortalMealPlanView plan={activePlan} />;
  if (tab === 'checkin') return <PreCheckin appointments={data.appointments} />;
  if (tab === 'perfil') return <Profile data={data.patient} submit={submit} />;
  if (tab === 'diario') return <Diary rows={data.diary} submit={submit} />;
  if (tab === 'exames') return <Exams rows={data.exams} submit={submit} />;
  if (tab === 'mensagens') return <Messages rows={data.messages} submit={submit} />;
  if (tab === 'agenda') return <Agenda appointments={data.appointments} requests={data.requests} submit={submit} />;
  if (tab === 'metas') return <Goals rows={data.goals} reload={reload} />;
  if (tab === 'evolucao') return <Evolution rows={data.measurements} />;
  if (tab === 'financeiro') return <Finance rows={data.finance} />;
  if (tab === 'compras') return <Shopping plans={data.plans} />;
  if (tab === 'laminas') return <PortalLaminasView />;
  return <Journey data={data} />;
}

const openPortalTab = (tab: Tab) => window.dispatchEvent(new CustomEvent<Tab>('portal:tab', { detail: tab }));

function PortalHome({
  data,
  setTab,
  reload,
  addQuickWater,
}: {
  data: Any;
  setTab: (t: Tab) => void;
  reload: () => Promise<void> | void;
  addQuickWater: (l: number) => Promise<void>;
}) {
  const { isCallActiveFor, restoreCall } = useTeleconsultation();
  const upcoming = data.appointments.filter(
    (a: Any) =>
      a.status !== 'COMPLETED' &&
      a.status !== 'CANCELLED' &&
      a.status !== 'ABSENT' &&
      (a.status === 'IN_PROGRESS' ||
        new Date(`${a.appointmentDate}T${a.appointmentTime}`) >= new Date(Date.now() - 30 * 60_000)),
  );
  const unread = data.notifications.filter((n: Any) => !n.readAt);
  const activeGoals = data.goals.filter((g: Any) => g.status !== 'COMPLETED');
  const latestPlan = data.plans?.find((p: Any) => p.status === 'PUBLISHED') || data.plans?.[0] || null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDiary = data.diary?.find((d: Any) => String(d.entryDate).slice(0, 10) === todayStr);

  return (
    <div className="portal-today-dashboard">
      {/* ── CARD DE PRÓXIMA CONSULTA COM AÇÃO IMEDIATA ── */}
      {upcoming[0] ? (
        <section className="portal-next-appointment-card">
          <div className="appt-left-info">
            <div className="appt-icon-box">
              <CalendarDays size={24} />
            </div>
            <div className="appt-details">
              <strong>{upcoming[0].appointmentType}</strong>
              <span>
                📅 {new Date(`${upcoming[0].appointmentDate}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} · {formatAppointmentSchedule(upcoming[0].appointmentTime, upcoming[0].durationMinutes)}
              </span>
              <small>Duração: {upcoming[0].durationMinutes} minutos</small>
            </div>
          </div>

          {isCallActiveFor(upcoming[0].id, upcoming[0].meetingUrl) ? (
            <button type="button" className="appt-video-btn" onClick={restoreCall}>
              <Video size={17} /> Voltar à chamada
            </button>
          ) : upcoming[0].meetingUrl ? (
            <Link className="appt-video-btn" to={upcoming[0].meetingUrl}>
              <Video size={17} /> Entrar na Sala Virtual
            </Link>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setTab('checkin')}
            >
              <ClipboardList size={16} /> Preparar Consulta
            </button>
          )}
        </section>
      ) : (
        <section className="portal-next-appointment-card" style={{ borderColor: '#e2e8f0' }}>
          <div className="appt-left-info">
            <div className="appt-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <CalendarDays size={24} />
            </div>
            <div className="appt-details">
              <strong>Agende seu próximo retorno</strong>
              <span style={{ color: '#64748b' }}>Mantenha seu acompanhamento em dia</span>
            </div>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setTab('agenda')}
          >
            Solicitar Horário <ArrowRight size={15} />
          </button>
        </section>
      )}

      {/* ── GRADE PRINCIPAL: ANEL DE ÁGUA + REFEIÇÃO DO MOMENTO ── */}
      <div className="today-widgets-grid">
        <PortalWaterTracker
          currentLiters={todayDiary?.waterLiters || 0}
          goalLiters={2.5}
          onAddWater={addQuickWater}
        />

        <PortalCurrentMealCard
          plan={latestPlan}
          onOpenMealPlan={() => setTab('plano')}
        />
      </div>

      {/* ── ATALHOS RÁPIDOS (QUICK ACTIONS) ── */}
      <section>
        <span className="control-section-title" style={{ marginBottom: 10, display: 'block' }}>
          Acesso Rápido
        </span>
        <div className="portal-quick-actions-grid">
          <div className="quick-action-card" onClick={() => setTab('plano')}>
            <div className="action-icon" style={{ background: '#f0fdf4', color: '#166534' }}>
              <Utensils size={18} />
            </div>
            <strong>Meu Plano</strong>
            <small>Ver todas as refeições</small>
          </div>

          <div className="quick-action-card" onClick={() => setTab('compras')}>
            <div className="action-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShoppingBasket size={18} />
            </div>
            <strong>Lista de Compras</strong>
            <small>Setores do supermercado</small>
          </div>

          <div className="quick-action-card" onClick={() => setTab('evolucao')}>
            <div className="action-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <LineChart size={18} />
            </div>
            <strong>Minha Evolução</strong>
            <small>Curva de peso e medidas</small>
          </div>

          <div className="quick-action-card" onClick={() => setTab('mensagens')}>
            <div className="action-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <MessageCircle size={18} />
            </div>
            <strong>Falar com a Nutri</strong>
            <small>Tirar dúvidas rápidas</small>
          </div>
        </div>
      </section>
    </div>
  );
}

function PreCheckin({ appointments }: { appointments: Any[] }) {
  const [history, setHistory] = useState<Any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const upcoming = appointments.filter(
    (a: Any) => new Date(`${a.appointmentDate}T${a.appointmentTime}`) >= new Date() && ['CONFIRMED', 'WAITING'].includes(a.status),
  );
  const loadHistory = useCallback(
    () =>
      api<{ data: Any[] }>('/api/portal/checkins')
        .then((r) => setHistory(r.data))
        .catch(() => setHistory([])),
    [],
  );
  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      d = new FormData(form);
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api('/api/portal/checkins', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: v(d, 'appointmentId'),
          answers: {
            improvements: v(d, 'improvements'),
            mainDifficulty: v(d, 'mainDifficulty'),
            medicationChanges: v(d, 'medicationChanges'),
            newSymptoms: v(d, 'newSymptoms'),
            adherence: Number(v(d, 'adherence')),
            examsCompleted: v(d, 'examsCompleted'),
            discussionTopics: v(d, 'discussionTopics'),
          },
        }),
      });
      setSuccess('Check-in enviado. Sua nutricionista poderá revisar as respostas antes da consulta.');
      form.reset();
      await loadHistory();
    } catch (c) {
      setError(c instanceof Error ? c.message : 'Não foi possível enviar o check-in.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="precheckin-layout">
      <form className="portal-form panel precheckin-form" onSubmit={send}>
        <header className="precheckin-heading">
          <span className="eyebrow">Antes da consulta</span>
          <h2>Como você está desde o último atendimento?</h2>
          <p>
            Essas respostas ajudam a organizar a conversa. Elas não substituem avaliação profissional nem entram
            automaticamente no prontuário.
          </p>
        </header>
        {upcoming.length ? (
          <>
            <label className="wide">
              Consulta
              <select name="appointmentId" required defaultValue={upcoming[0]?.id}>
                {upcoming.map((a: Any) => (
                  <option key={a.id} value={a.id}>
                    {portalDate(a.appointmentDate)} às {String(a.appointmentTime).slice(0, 5)} · {a.appointmentType}
                  </option>
                ))}
              </select>
            </label>
            <label className="wide">
              O que melhorou
              <textarea name="improvements" maxLength={1500} placeholder="Sono, disposição, alimentação, rotina..." />
            </label>
            <label className="wide">
              Principal dificuldade
              <textarea
                name="mainDifficulty"
                maxLength={1500}
                required
                placeholder="O que mais dificultou seguir as orientações?"
              />
            </label>
            <label>
              Mudanças de medicamentos
              <textarea name="medicationChanges" maxLength={1500} />
            </label>
            <label>
              Sintomas novos
              <textarea name="newSymptoms" maxLength={1500} />
            </label>
            <label>
              Adesão (0–10)
              <input name="adherence" type="number" min="0" max="10" required defaultValue="5" />
            </label>
            <label>
              Exames realizados
              <textarea name="examsCompleted" maxLength={1500} />
            </label>
            <label className="wide">
              Assuntos para a consulta
              <textarea name="discussionTopics" maxLength={1500} placeholder="O que você não quer esquecer de conversar?" />
            </label>
            {error && <div className="form-error wide">{error}</div>}
            {success && (
              <div className="form-success wide">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}
            <button className="primary-button" disabled={busy}>
              <Save size={16} /> {busy ? 'Enviando...' : 'Enviar check-in'}
            </button>
          </>
        ) : (
          <div className="precheckin-empty wide">
            <CalendarDays size={28} />
            <strong>Nenhuma consulta próxima encontrada</strong>
            <p>Quando uma consulta estiver confirmada, o questionário ficará disponível aqui.</p>
            <button type="button" className="secondary-button" onClick={() => openPortalTab('agenda')}>
              Solicitar consulta
            </button>
          </div>
        )}
      </form>
      <aside className="panel precheckin-history">
        <h2>Envios recentes</h2>
        {history.length ? (
          history.map((item) => (
            <article key={item.id}>
              <strong>{item.status === 'REVIEWED' ? 'Revisado pela nutricionista' : 'Aguardando revisão'}</strong>
              <span>Enviado em {new Date(item.submittedAt).toLocaleDateString('pt-BR')}</span>
            </article>
          ))
        ) : (
          <p>Nenhum check-in enviado ainda.</p>
        )}
      </aside>
    </section>
  );
}

function Form({ children, onSubmit, title }: { children: ReactNode; onSubmit: (d: FormData) => void; title: string }) {
  return (
    <form
      className="portal-form panel"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
        e.currentTarget.reset();
      }}
    >
      <h2>{title}</h2>
      {children}
      <button className="primary-button">
        <Save size={16} /> Salvar
      </button>
    </form>
  );
}

const v = (d: FormData, k: string) => String(d.get(k) || '');
const portalQuantity = (item: Any) =>
  item.amountText ||
  (typeof item.qtd === 'string'
    ? item.qtd
    : item.amount ?? item.qtd
      ? `${item.amount ?? item.qtd} ${item.unit || item.unidade || 'g'}`
      : '');

const portalDate = (value: string) => {
  const date = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')
    : 'Data não informada';
};

const requestStatus = (status: string) =>
  ({ PENDING: 'Aguardando confirmação', APPROVED: 'Agendada', DECLINED: 'Nova data necessária' })[status] || status;

function Profile({ data, submit }: { data: Any; submit: any }) {
  return (
    <Form
      title="Meus dados"
      onSubmit={(d) =>
        submit('/api/portal/profile', {
          whatsapp: v(d, 'whatsapp'),
          address: v(d, 'address'),
          emergencyContact: v(d, 'emergencyContact'),
          communicationPreference: v(d, 'communicationPreference'),
        })
      }
    >
      <label>
        Nome
        <input value={data.name} disabled />
      </label>
      <label>
        E-mail
        <input value={data.email || ''} disabled />
      </label>
      <label>
        WhatsApp
        <input name="whatsapp" defaultValue={data.whatsapp || ''} />
      </label>
      <label>
        Endereço
        <input name="address" defaultValue={data.address || ''} />
      </label>
      <label>
        Contato de emergência
        <input name="emergencyContact" defaultValue={data.emergencyContact || ''} />
      </label>
      <label>
        Preferência
        <select name="communicationPreference" defaultValue={data.communicationPreference || 'EMAIL'}>
          <option value="EMAIL">E-mail</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="BOTH">Ambos</option>
        </select>
      </label>
    </Form>
  );
}

function Diary({ rows, submit }: { rows: Any[]; submit: any }) {
  return (
    <PortalTwo>
      <Form
        title="Registrar meu dia"
        onSubmit={(d) =>
          submit('/api/portal/diary', {
            entryDate: v(d, 'date'),
            mealNotes: v(d, 'meal'),
            symptoms: v(d, 'symptoms'),
            hunger: Number(v(d, 'hunger')),
            satiety: Number(v(d, 'satiety')),
            waterLiters: Number(v(d, 'water')),
            adherence: Number(v(d, 'adherence')),
          })
        }
      >
        <label>
          Data
          <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>
        <label>
          Fome (0–10)
          <input name="hunger" type="number" min="0" max="10" defaultValue="5" />
        </label>
        <label>
          Saciedade (0–10)
          <input name="satiety" type="number" min="0" max="10" defaultValue="5" />
        </label>
        <label>
          Água (litros)
          <input name="water" type="number" min="0" step=".1" />
        </label>
        <label>
          Adesão ao plano (%)
          <input name="adherence" type="number" min="0" max="100" />
        </label>
        <label className="wide">
          Refeições
          <textarea name="meal" />
        </label>
        <label className="wide">
          Sintomas
          <textarea name="symptoms" />
        </label>
      </Form>
      <Cards
        rows={rows}
        render={(r: Any) => (
          <>
            <strong>{portalDate(r.entryDate)}</strong>
            <span>
              Água: {r.waterLiters || '—'} L · Adesão: {r.adherence ?? '—'}%
            </span>
            <p>{r.mealNotes || r.symptoms}</p>
          </>
        )}
      />
    </PortalTwo>
  );
}

function Exams({ rows, submit }: { rows: Any[]; submit: any }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      d = new FormData(form),
      file = d.get('file');
    if (!(file instanceof File) || !file.size) return;
    setBusy(true);
    setError('');
    try {
      const signed = await api<{ data: { path: string; signedUrl: string } }>(`/api/portal/exams/upload-url`, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size }),
      });
      const uploadBody = new FormData();
      uploadBody.append('cacheControl', '3600');
      uploadBody.append('', file);
      const sent = await fetch(signed.data.signedUrl, { method: 'PUT', headers: { 'x-upsert': 'false' }, body: uploadBody });
      if (!sent.ok) throw new Error('Falha ao transferir o arquivo.');
      await submit('/api/portal/exams', {
        title: v(d, 'title'),
        examDate: v(d, 'date') || undefined,
        filePath: signed.data.path,
        mimeType: file.type,
        fileSize: file.size,
        notes: v(d, 'notes'),
      });
      form.reset();
    } catch (c) {
      setError(c instanceof Error ? c.message : 'Não foi possível enviar o exame.');
    } finally {
      setBusy(false);
    }
  }
  async function open(id: string) {
    const r = await api<{ data: { url: string } }>(`/api/portal/exams/${id}/url`);
    window.open(r.data.url, '_blank', 'noopener,noreferrer');
  }
  return (
    <PortalTwo>
      <form className="portal-form panel" onSubmit={upload}>
        <h2>Enviar exame</h2>
        <label>
          Título
          <input name="title" required />
        </label>
        <label>
          Data
          <input name="date" type="date" />
        </label>
        <label className="wide">
          Arquivo privado
          <input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
          <small>PDF ou imagem, até 10 MB.</small>
        </label>
        <label className="wide">
          Observações
          <textarea name="notes" />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button" disabled={busy}>
          <Save size={16} /> {busy ? 'Enviando...' : 'Enviar com segurança'}
        </button>
      </form>
      <Cards
        rows={rows}
        render={(r: Any) => (
          <>
            <strong>{r.title}</strong>
            <span>{r.status === 'REVIEWED' ? 'Revisado' : 'Enviado'}</span>
            <button className="secondary-button" onClick={() => void open(r.id)}>
              Abrir arquivo
            </button>
          </>
        )}
      />
    </PortalTwo>
  );
}

function Messages({ rows, submit }: { rows: Any[]; submit: any }) {
  useEffect(() => {
    void api('/api/portal/messages/read', { method: 'PATCH' });
  }, []);
  const last = rows.at(-1);
  const waiting = last?.senderRole === 'PATIENT';
  return (
    <section className="portal-messages-layout">
      <div className="portal-messages panel">
        <header>
          <div>
            <h2>Mensagens seguras</h2>
            <p>Use este canal para assuntos relacionados ao seu acompanhamento.</p>
          </div>
          <span className={`message-status ${waiting ? 'waiting' : 'answered'}`}>
            {waiting ? 'Aguardando resposta' : 'Em dia'}
          </span>
        </header>
        <div>
          {rows.map((r) => {
            const match = String(r.body).match(/^\[([^\]]+)\]\s*/);
            return (
              <article className={r.senderRole === 'PATIENT' ? 'mine' : ''} key={r.id}>
                {match && <span className="message-category">{match[1]}</span>}
                <strong>{r.senderRole === 'PATIENT' ? 'Você' : 'Nutricionista'}</strong>
                <p>{String(r.body).replace(/^\[[^\]]+\]\s*/, '')}</p>
                <small>{new Date(r.createdAt).toLocaleString('pt-BR')}</small>
              </article>
            );
          })}
        </div>
      </div>
      <Form
        title="Nova mensagem"
        onSubmit={(d) => {
          const category = v(d, 'category');
          return submit('/api/portal/messages', { body: `[${category}] ${v(d, 'body')}` });
        }}
      >
        <label className="wide">
          Assunto
          <select name="category" required>
            <option value="Plano alimentar">Dúvida sobre o plano</option>
            <option value="Sintoma">Sintoma ou desconforto</option>
            <option value="Exame">Exames</option>
            <option value="Agendamento">Agendamento</option>
            <option value="Documento">Documento</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Outro">Outro assunto</option>
          </select>
        </label>
        <label className="wide">
          Mensagem
          <textarea name="body" required placeholder="Conte o que precisa com o máximo de clareza." />
        </label>
        <div className="message-expectation wide">
          <Clock3 size={16} />
          <span>
            <strong>Prazo esperado</strong>O consultório responderá conforme o horário de atendimento, normalmente em até 2
            dias úteis.
          </span>
        </div>
        <div className="message-emergency wide" role="note">
          <AlertTriangle size={16} />
          <span>
            <strong>Este canal não atende emergências.</strong>Em caso de sintomas graves ou risco imediato, procure um
            serviço de urgência.
          </span>
        </div>
      </Form>
    </section>
  );
}

function Requests({ rows, submit }: { rows: Any[]; submit: any }) {
  return (
    <PortalTwo>
      <Form
        title="Solicitar consulta"
        onSubmit={(d) =>
          submit('/api/portal/appointment-requests', {
            preferredDate: v(d, 'date'),
            preferredPeriod: v(d, 'period'),
            appointmentType: v(d, 'type'),
            notes: v(d, 'notes'),
          })
        }
      >
        <label>
          Data preferida
          <input name="date" type="date" min={new Date().toISOString().split('T')[0]} required />
        </label>
        <label>
          Período
          <select name="period">
            <option value="MORNING">Manhã</option>
            <option value="AFTERNOON">Tarde</option>
            <option value="EVENING">Noite</option>
          </select>
        </label>
        <label>
          Tipo
          <select name="type">
            <option>Consulta online</option>
            <option>Consulta presencial</option>
            <option>Retorno</option>
          </select>
        </label>
        <label className="wide">
          Observações
          <textarea name="notes" />
        </label>
      </Form>
      <Cards
        rows={rows}
        render={(r: Any) => (
          <>
            <strong>{portalDate(r.preferredDate)}</strong>
            <span>
              {r.appointmentType} · {requestStatus(r.status)}
            </span>
          </>
        )}
      />
    </PortalTwo>
  );
}

function Agenda({ appointments, requests, submit }: { appointments: Any[]; requests: Any[]; submit: any }) {
  const { isCallActiveFor, restoreCall } = useTeleconsultation();
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const upcoming = appointments
    .filter(
      (a) =>
        String(a.appointmentDate).slice(0, 10) >= localToday && ['CONFIRMED', 'WAITING', 'IN_PROGRESS'].includes(a.status),
    )
    .sort((a, b) => `${a.appointmentDate} ${a.appointmentTime}`.localeCompare(`${b.appointmentDate} ${b.appointmentTime}`));
  return (
    <>
      <Block icon={CalendarDays} title="Próximas consultas">
        {upcoming.length ? (
          upcoming.map((a) => (
            <article key={a.id}>
              <DateBox date={a.appointmentDate} />
              <div>
                <strong>{a.appointmentType}</strong>
                <span>
                  <Clock3 size={14} />
                  {formatAppointmentSchedule(a.appointmentTime, a.durationMinutes)}
                </span>
              </div>
              {isCallActiveFor(a.id, a.meetingUrl) ? (
                <button type="button" className="primary-button" onClick={restoreCall}>
                  <Video size={16} /> Voltar à chamada
                </button>
              ) : a.meetingUrl && (
                <Link className="primary-button" to={a.meetingUrl}>
                  <Video size={16} /> Entrar
                </Link>
              )}
            </article>
          ))
        ) : (
          <Empty />
        )}
      </Block>
      <Requests rows={requests} submit={submit} />
    </>
  );
}

function Goals({ rows, reload }: { rows: Any[]; reload: any }) {
  return (
    <Cards
      rows={rows}
      render={(r: Any) => (
        <>
          <strong>{r.title}</strong>
          <p>{r.description}</p>
          <span>{r.dueDate ? `Até ${new Date(`${r.dueDate}T12:00`).toLocaleDateString('pt-BR')}` : 'Sem prazo'}</span>
          <button
            className="secondary-button"
            onClick={async () => {
              await api(`/api/portal/goals/${r.id}`, { method: 'PATCH', body: JSON.stringify({ completed: r.status !== 'COMPLETED' }) });
              await reload();
            }}
          >
            {r.status === 'COMPLETED' ? 'Reabrir' : 'Concluir'}
          </button>
        </>
      )}
    />
  );
}

function Evolution({ rows }: { rows: Any[] }) {
  return <BodyEvolutionChart rows={rows as any} />;
}

function Finance({ rows }: { rows: Any[] }) {
  return (
    <Cards
      rows={rows}
      render={(r: Any) => (
        <>
          <strong>{r.description}</strong>
          <span>
            {Number(r.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {r.status}
          </span>
          <small>Vencimento: {new Date(`${r.dueDate}T12:00`).toLocaleDateString('pt-BR')}</small>
        </>
      )}
    />
  );
}

function Shopping({ plans }: { plans: Any[] }) {
  return <ShoppingListSection plans={plans} />;
}

function Journey({ data }: { data: Any }) {
  const events = [
    ...data.appointments.map((x: Any) => ({ date: x.appointmentDate, title: x.appointmentType, type: 'Consulta' })),
    ...data.plans.map((x: Any) => ({ date: x.updatedAt, title: x.title, type: 'Plano' })),
    ...data.documents.map((x: Any) => ({ date: x.issuedAt, title: x.title, type: 'Documento' })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return (
    <Cards
      rows={events}
      render={(r: Any) => (
        <>
          <strong>
            {r.type}: {r.title}
          </strong>
          <span>{new Date(r.date).toLocaleDateString('pt-BR')}</span>
        </>
      )}
    />
  );
}

function Block({ icon: Icon, title, children }: { icon: any; title: string; children: ReactNode }) {
  return (
    <section className="portal-block">
      <header>
        <Icon size={18} />
        <div>
          <h2>{title}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}

function PortalTwo({ children }: { children: ReactNode }) {
  return <div className="portal-two">{children}</div>;
}

function Cards({ rows, render }: { rows: Any[]; render: (r: Any) => ReactNode }) {
  return (
    <section className="panel portal-cards">
      {rows.length ? rows.map((r, i) => <article key={r.id || i}>{render(r)}</article>) : <Empty />}
    </section>
  );
}

function Empty() {
  return (
    <div className="portal-empty">
      <strong>Nenhuma informação disponível.</strong>
      <span>As novidades aparecerão aqui.</span>
    </div>
  );
}

function DateBox({ date }: { date: string }) {
  const d = new Date(`${date}T12:00`);
  return (
    <div className="portal-date">
      <strong>{d.getDate()}</strong>
      <span>{d.toLocaleDateString('pt-BR', { month: 'short' })}</span>
    </div>
  );
}

function Item({ title, sub, href }: { title: string; sub?: string; href: string }) {
  return (
    <article>
      <div className="plan-file">
        <FileText size={18} />
      </div>
      <div>
        <strong>{title}</strong>
        <span>{sub}</span>
      </div>
      <Link className="secondary-button" to={href}>
        Abrir
      </Link>
    </article>
  );
}

import {
  AlertTriangle,
  ArrowRight,
  Bell,
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
  Video,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

type Any = Record<string, any>;
type Tab =
  | 'inicio'
  | 'checkin'
  | 'jornada'
  | 'diario'
  | 'exames'
  | 'evolucao'
  | 'mensagens'
  | 'agenda'
  | 'metas'
  | 'compras'
  | 'financeiro'
  | 'perfil';

const tabs: [Tab, string, typeof UserRound][] = [
  ['inicio', 'Início', UserRound],
  ['checkin', 'Preparar consulta', ClipboardList],
  ['jornada', 'Jornada', ClipboardList],
  ['diario', 'Diário', Salad],
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
  const { logout } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(
    () =>
      api<{ data: Any }>('/api/portal/home')
        .then((r) => setData(r.data))
        .catch((c) => setError(c instanceof Error ? c.message : 'Erro ao abrir portal.')),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

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
    } catch {}
  }

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

  const unreadNotifs = data.notifications?.filter((n: Any) => !n.readAt) || [];

  return (
    <main className="patient-portal">
      <header className="patient-portal-header">
        <div className="portal-brand">
          {data.settings?.logoUrl ? (
            <img src={data.settings.logoUrl} alt="Logotipo" />
          ) : (
            <span>{data.settings?.clinicName?.[0] || 'N'}</span>
          )}
          <div>
            <strong>{data.settings?.clinicName || 'Portal Nutricional'}</strong>
            <small>{data.settings?.professionalName}</small>
          </div>
        </div>

        <div className="portal-header-actions">
          {/* Sino de Notificações Interativo */}
          <div className="portal-notif-container" ref={notifRef}>
            <button
              className={`portal-notif-trigger ${unreadNotifs.length > 0 ? 'has-unread' : ''}`}
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="Notificações do paciente"
              title="Notificações"
            >
              <Bell size={18} />
              {unreadNotifs.length > 0 && <span className="notif-badge">{unreadNotifs.length}</span>}
            </button>

            {notifOpen && (
              <div className="portal-notif-dropdown">
                <header className="portal-notif-head">
                  <strong>Notificações</strong>
                  <button className="icon-button" onClick={() => setNotifOpen(false)}>
                    <X size={15} />
                  </button>
                </header>
                <div className="portal-notif-items">
                  {data.notifications?.length ? (
                    data.notifications.map((n: Any) => (
                      <article key={n.id} className={`portal-notif-row ${!n.readAt ? 'unread' : 'read'}`}>
                        <div>
                          <strong>{n.title}</strong>
                          <p>{n.body}</p>
                          <small>{new Date(n.createdAt).toLocaleDateString('pt-BR')}</small>
                        </div>
                        {!n.readAt && (
                          <button
                            className="secondary-button notif-read-btn"
                            onClick={() => void markNotificationRead(n.id)}
                          >
                            Lida
                          </button>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="portal-notif-empty">Nenhuma notificação no momento.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link className="ghost-button" to="/portal/alterar-senha">
            <KeyRound size={16} /> Senha
          </Link>
          <button className="ghost-button" onClick={exit}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <section className="portal-welcome">
        <span>Olá, {data.patient.name.split(' ')[0]}</span>
        <h1>
          Seu cuidado nutricional,
          <br />
          sempre por perto.
        </h1>
        <p>{data.patient.objective || 'Acompanhe consultas e orientações preparadas para você.'}</p>
        {unreadNotifs.length > 0 && (
          <div className="portal-alert" onClick={() => setNotifOpen(true)} style={{ cursor: 'pointer' }}>
            <Bell size={16} /> Você tem {unreadNotifs.length} novidade(s) não lida(s). Clique para ver.
          </div>
        )}
      </section>

      <nav className="portal-tabs">
        {tabs.map(([key, label, Icon]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {error && <div className="form-error">{error}</div>}
      {notice && (
        <div className="form-success">
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      <PortalContent
        tab={tab}
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
  data,
  submit,
  reload,
  addQuickWater,
}: {
  tab: Tab;
  data: Any;
  submit: (p: string, b: Any) => Promise<void>;
  reload: () => Promise<void> | void;
  addQuickWater: (l: number) => Promise<void>;
}) {
  if (tab === 'inicio') return <PortalHome data={data} reload={reload} addQuickWater={addQuickWater} />;
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
  return <Journey data={data} />;
}

const openPortalTab = (tab: Tab) => window.dispatchEvent(new CustomEvent<Tab>('portal:tab', { detail: tab }));

function PortalHome({
  data,
  reload,
  addQuickWater,
}: {
  data: Any;
  reload: () => Promise<void> | void;
  addQuickWater: (l: number) => Promise<void>;
}) {
  const upcoming = data.appointments.filter(
    (a: Any) =>
      new Date(`${a.appointmentDate}T${a.appointmentTime}`) >= new Date() &&
      ['CONFIRMED', 'WAITING', 'IN_PROGRESS'].includes(a.status),
  );
  const unread = data.notifications.filter((n: Any) => !n.readAt);
  const activeGoals = data.goals.filter((g: Any) => g.status !== 'COMPLETED');
  const latestPlan = data.plans[0];
  const planMeals = latestPlan?.content?.meals || latestPlan?.content?.refeicoes || [];
  const planVisibility = latestPlan?.content?.patientVisibility || 'SUMMARY';
  const showPlanDetails = planVisibility !== 'HIDDEN';
  const showPlanNutrition = planVisibility === 'FULL';
  const latestMeasurement = data.measurements[0];

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDiary = data.diary?.find((d: Any) => String(d.entryDate).slice(0, 10) === todayStr);

  return (
    <section className="portal-home">
      <header className="portal-home-intro">
        <span>Visão de hoje</span>
        <h2>O essencial, sem procurar em várias telas</h2>
        <p>
          Comece pelas ações pendentes e consulte seu plano ou sua evolução quando precisar. Acessibilidade: Alt + ou Alt
          - ajusta o texto; Alt C ativa o alto contraste.
        </p>
      </header>

      <div className="portal-priority-grid">
        <section className="portal-question portal-question-now">
          <header>
            <div>
              <small>1</small>
              <h2>O que preciso fazer agora?</h2>
            </div>
            <span>{unread.length + activeGoals.length + (!upcoming.length ? 1 : 0)} pendência(s)</span>
          </header>

          <div className="portal-action-list">
            {/* Ação Rápida Interativa de Hidratação */}
            <article className="portal-quick-hydration">
              <div className="hydration-info">
                <Droplets size={20} className="water-drop" />
                <div>
                  <strong>Água hoje: {todayDiary?.waterLiters ? `${todayDiary.waterLiters} L` : '0 L'}</strong>
                  <small>Meta recomendada: 2.0 a 2.5 L</small>
                </div>
              </div>
              <div className="hydration-btns">
                <button
                  type="button"
                  className="quick-water-btn"
                  onClick={() => void addQuickWater(0.25)}
                  title="Adicionar 250ml de água"
                >
                  +250 ml
                </button>
                <button
                  type="button"
                  className="quick-water-btn"
                  onClick={() => void addQuickWater(0.5)}
                  title="Adicionar 500ml de água"
                >
                  +500 ml
                </button>
              </div>
            </article>

            {upcoming[0] ? (
              <article className="upcoming-appt-highlight">
                <DateBox date={upcoming[0].appointmentDate} />
                <div>
                  <strong>{upcoming[0].appointmentType}</strong>
                  <span>
                    <Clock3 size={14} />
                    {upcoming[0].appointmentTime.slice(0, 5)} · {upcoming[0].durationMinutes} min
                  </span>
                </div>
                {upcoming[0].meetingUrl && (
                  <Link className="primary-button pulse-button" to={upcoming[0].meetingUrl}>
                    <Video size={16} /> Entrar na Sala
                  </Link>
                )}
              </article>
            ) : (
              <button onClick={() => openPortalTab('agenda')}>
                <CalendarDays size={18} />
                <span>
                  <strong>Solicitar uma consulta</strong>
                  <small>Escolha a melhor data e período.</small>
                </span>
                <ArrowRight size={16} />
              </button>
            )}

            {upcoming[0] && (
              <button onClick={() => openPortalTab('checkin')}>
                <ClipboardList size={18} />
                <span>
                  <strong>Preparar minha consulta</strong>
                  <small>Conte como você está antes do atendimento.</small>
                </span>
                <ArrowRight size={16} />
              </button>
            )}

            {unread.slice(0, 2).map((n: Any) => (
              <article key={n.id} className="unread portal-notif-card-inline">
                <Bell size={18} />
                <div>
                  <strong>{n.title}</strong>
                  <span>{n.body}</span>
                </div>
                <button
                  className="secondary-button"
                  onClick={async () => {
                    await api(`/api/portal/notifications/${n.id}/read`, { method: 'PATCH' });
                    await reload();
                  }}
                >
                  Marcar lida
                </button>
              </article>
            ))}

            {activeGoals[0] && (
              <button onClick={() => openPortalTab('metas')}>
                <Goal size={18} />
                <span>
                  <strong>{activeGoals[0].title}</strong>
                  <small>
                    {activeGoals[0].dueDate ? `Prazo: ${portalDate(activeGoals[0].dueDate)}` : 'Meta em andamento'}
                  </small>
                </span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          <button className="portal-section-link" onClick={() => openPortalTab('agenda')}>
            Ver agenda completa <ArrowRight size={14} />
          </button>
        </section>

        <section className="portal-question portal-plan-card">
          <header>
            <div>
              <small>2</small>
              <h2>Meu plano nutricional</h2>
            </div>
            {latestPlan && <span>Plano vigente</span>}
          </header>
          {latestPlan ? (
            <div className="portal-plan-highlight">
              <div className="portal-plan-heading">
                <div className="portal-plan-icon">
                  <Salad size={22} />
                </div>
                <div>
                  <strong>{latestPlan.title}</strong>
                  <span>{latestPlan.objective || 'Orientações preparadas para a sua rotina.'}</span>
                </div>
              </div>
              <div className="portal-meal-preview">
                {planMeals.length ? (
                  planMeals.map((meal: Any, index: number) => {
                    const macro = (meal.items || meal.alimentosList || []).reduce(
                      (sum: Any, item: Any) => {
                        const m = item.macros || {};
                        return {
                          kcal: sum.kcal + Number(m.kcal ?? item.kcal ?? 0),
                          protein: sum.protein + Number(m.protein ?? item.prot ?? 0),
                          carbohydrate: sum.carbohydrate + Number(m.carbohydrate ?? item.carb ?? 0),
                          fat: sum.fat + Number(m.fat ?? item.gord ?? 0),
                        };
                      },
                      { kcal: 0, protein: 0, carbohydrate: 0, fat: 0 },
                    );
                    return (
                      <article key={meal.id || index}>
                        <time>{showPlanDetails ? meal.time || meal.horario || 'Flexível' : 'Conforme orientação'}</time>
                        <div>
                          <strong>{meal.title || meal.titulo || 'Refeição'}</strong>
                          <span>
                            {(meal.items || meal.alimentosList || [])
                              .map(
                                (item: Any) =>
                                  `${item.name || item.nome}${showPlanDetails && portalQuantity(item) ? ` (${portalQuantity(item)})` : ''}`,
                              )
                              .join(' · ') || 'Itens conforme orientação'}
                          </span>
                          {showPlanNutrition && (
                            <small>
                              {macro.kcal.toFixed(0)} kcal · P {macro.protein.toFixed(1)}g · C {macro.carbohydrate.toFixed(1)}g · G {macro.fat.toFixed(1)}g
                            </small>
                          )}
                          {(meal.notes || meal.obs) && <small>{meal.notes || meal.obs}</small>}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p>As refeições aparecerão assim que o plano for publicado.</p>
                )}
              </div>
              <Link className="portal-plan-details" to={`/portal/plano/${latestPlan.id}`}>
                Ver substituições e orientações <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <Empty />
          )}
          <div className="portal-quick-links">
            <button onClick={() => openPortalTab('compras')}>
              <ShoppingBasket size={16} /> Lista de compras
            </button>
            <button onClick={() => openPortalTab('exames')}>
              <FlaskConical size={16} /> Enviar exame
            </button>
            <button onClick={() => openPortalTab('mensagens')}>
              <MessageCircle size={16} /> Tirar uma dúvida
            </button>
          </div>
        </section>

        <section className="portal-question">
          <header>
            <div>
              <small>3</small>
              <h2>Como estou evoluindo?</h2>
            </div>
          </header>
          <div className="portal-progress-summary">
            {latestMeasurement ? (
              <>
                <strong>{latestMeasurement.weight || '—'} kg</strong>
                <span>Última medida em {portalDate(latestMeasurement.measuredAt)}</span>
              </>
            ) : (
              <>
                <strong>{activeGoals.length}</strong>
                <span>meta(s) em andamento</span>
              </>
            )}
          </div>
          <div className="portal-quick-links">
            <button onClick={() => openPortalTab('evolucao')}>
              <LineChart size={16} /> Ver evolução
            </button>
            <button onClick={() => openPortalTab('diario')}>
              <Salad size={16} /> Registrar meu dia
            </button>
            <button onClick={() => openPortalTab('jornada')}>
              <ClipboardList size={16} /> Ver jornada
            </button>
          </div>
        </section>
      </div>
    </section>
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
          <input name="date" type="date" required />
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
                  {String(a.appointmentTime).slice(0, 5)} · {a.durationMinutes} min
                </span>
              </div>
              {a.meetingUrl && (
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
  return (
    <section className="panel portal-evolution">
      <h2>Minha evolução</h2>
      {rows.length ? (
        <>
          <div className="evolution-bars">
            {rows.map((r) => (
              <div key={r.id}>
                <i style={{ height: `${Math.max(15, (r.weight || 0) * 1.7)}px` }} />
                <strong>{r.weight || '—'} kg</strong>
                <small>{new Date(`${r.measuredAt}T12:00`).toLocaleDateString('pt-BR')}</small>
              </div>
            ))}
          </div>
          <Cards
            rows={rows}
            render={(r: Any) => (
              <>
                <strong>{r.weight || '—'} kg</strong>
                <span>
                  Gordura: {r.bodyFat || '—'}% · Cintura: {r.waist || '—'} cm
                </span>
              </>
            )}
          />
        </>
      ) : (
        <Empty />
      )}
    </section>
  );
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
  const foods = useMemo(() => {
    const meals = plans[0]?.content?.meals || plans[0]?.content?.refeicoes || [];
    return meals
      .flatMap((m: Any) => m.items || m.alimentosList || [])
      .map((i: Any) => i.name || i.nome)
      .filter(Boolean)
      .filter((x: string, i: number, a: string[]) => a.indexOf(x) === i);
  }, [plans]);
  return (
    <section className="panel shopping-list">
      <h2>Lista de compras</h2>
      <p>Gerada a partir do plano publicado mais recente.</p>
      {foods.length ? (
        foods.map((f: string) => (
          <label key={f}>
            <input type="checkbox" />
            {f}
          </label>
        ))
      ) : (
        <Empty />
      )}
    </section>
  );
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

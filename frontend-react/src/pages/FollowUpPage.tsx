import { Activity, ArrowRight, BookOpen, Droplets, Flame, Plus, RefreshCw, Salad, Sparkles, Target, Utensils } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { availablePlanDays, planMeals } from '../lib/mealPlanSchedule';
import '../follow-up.css';

type Patient = { id: string; name: string };
type Diary = {
  id: string;
  entryDate: string;
  mealNotes?: string;
  symptoms?: string;
  hunger?: number;
  satiety?: number;
  waterLiters?: number;
  adherence?: number;
};
type Goal = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
};
type Measurement = {
  id: string;
  measuredAt: string;
  weight?: number;
  bodyFat?: number;
  waist?: number;
  neck?: number;
  visibleToPatient: boolean;
};
type ActivePlan = {
  id: string;
  title: string;
  objective?: string;
  content: Record<string, any>;
  publishedAt?: string;
  updatedAt?: string;
};
type FollowUp = {
  patient: Patient;
  diary: Diary[];
  goals: Goal[];
  measurements: Measurement[];
  encounters: { id: string; startedAt: string }[];
  activePlan?: ActivePlan | null;
};

type Macro = { kcal: number; protein: number; carbohydrate: number; fat: number };

function calcPlanTotals(content: Record<string, any> | undefined): { totals: Macro; mealsCount: number; targetText?: string } {
  if (!content) return { totals: { kcal: 0, protein: 0, carbohydrate: 0, fat: 0 }, mealsCount: 0 };
  const meals = planMeals(content) as any[];
  const days = availablePlanDays(meals);
  const totals = meals.reduce(
    (sum: Macro, meal: any) => {
      const items = Array.isArray(meal.items) ? meal.items : Array.isArray(meal.alimentosList) ? meal.alimentosList : [];
      const mealSum = items.reduce(
        (mSum: Macro, item: any) => {
          const m = item.macros || {};
          return {
            kcal: mSum.kcal + Number(m.kcal ?? item.kcal ?? 0),
            protein: mSum.protein + Number(m.protein ?? item.prot ?? 0),
            carbohydrate: mSum.carbohydrate + Number(m.carbohydrate ?? item.carb ?? 0),
            fat: mSum.fat + Number(m.fat ?? item.gord ?? 0),
          };
        },
        { kcal: 0, protein: 0, carbohydrate: 0, fat: 0 },
      );
      return {
        kcal: sum.kcal + mealSum.kcal,
        protein: sum.protein + mealSum.protein,
        carbohydrate: sum.carbohydrate + mealSum.carbohydrate,
        fat: sum.fat + mealSum.fat,
      };
    },
    { kcal: 0, protein: 0, carbohydrate: 0, fat: 0 },
  );
  if (days.length) {
    totals.kcal /= days.length;
    totals.protein /= days.length;
    totals.carbohydrate /= days.length;
    totals.fat /= days.length;
  }

  const targets = content.targets || {};
  let targetText: string | undefined;
  if (targets.kcalMin && targets.kcalMax) {
    targetText = `${targets.kcalMin} – ${targets.kcalMax} kcal`;
  } else if (targets.kcalMin || targets.kcalMax) {
    targetText = `Meta: ${targets.kcalMin || targets.kcalMax} kcal`;
  } else if (content.targetKcal) {
    targetText = `Meta: ${content.targetKcal} kcal`;
  }

  return { totals, mealsCount: days.length ? Math.round(meals.length / days.length) : meals.length, targetText };
}

const showDate = (v: string) => new Date(`${v}T12:00:00`).toLocaleDateString('pt-BR');
const optionalNumber = (v: FormDataEntryValue | null) => (v === '' || v == null ? undefined : Number(v));

export function FollowUpPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState<FollowUp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (id: string) => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api<{ data: FollowUp }>(`/api/follow-up/${id}`);
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar acompanhamento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api<{ data: Patient[] }>('/api/patients')
      .then((r) => {
        setPatients(r.data);
        const id = r.data[0]?.id || '';
        setSelected(id);
        if (id) void load(id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar pacientes.'))
      .finally(() => setLoading(false));
  }, [load]);

  const nutritionSummary = useMemo(() => {
    return calcPlanTotals(data?.activePlan?.content);
  }, [data?.activePlan]);

  const diaryStats = useMemo(() => {
    if (!data?.diary || data.diary.length === 0) return null;
    const entriesWithAdherence = data.diary.filter((d) => d.adherence != null);
    const entriesWithWater = data.diary.filter((d) => d.waterLiters != null && d.waterLiters > 0);
    const avgAdherence = entriesWithAdherence.length
      ? Math.round(entriesWithAdherence.reduce((acc, d) => acc + Number(d.adherence), 0) / entriesWithAdherence.length)
      : null;
    const avgWater = entriesWithWater.length
      ? (entriesWithWater.reduce((acc, d) => acc + Number(d.waterLiters), 0) / entriesWithWater.length).toFixed(1)
      : null;

    return {
      totalEntries: data.diary.length,
      avgAdherence,
      avgWater,
    };
  }, [data?.diary]);

  async function addGoal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setError('');
    try {
      await api(`/api/follow-up/${selected}/goals`, {
        method: 'POST',
        body: JSON.stringify({
          title: f.get('title'),
          description: f.get('description') || undefined,
          dueDate: f.get('dueDate') || undefined,
        }),
      });
      form.reset();
      setNotice('Meta publicada no portal do paciente.');
      await load(selected);
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Falha ao criar meta.');
    }
  }

  async function setStatus(id: string, status: Goal['status']) {
    try {
      await api(`/api/follow-up/goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load(selected);
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Falha ao atualizar meta.');
    }
  }

  async function addMeasure(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setError('');
    try {
      await api(`/api/follow-up/${selected}/measurements`, {
        method: 'POST',
        body: JSON.stringify({
          measuredAt: f.get('measuredAt'),
          weight: optionalNumber(f.get('weight')),
          bodyFat: optionalNumber(f.get('bodyFat')),
          waist: optionalNumber(f.get('waist')),
          neck: optionalNumber(f.get('neck')),
          notes: f.get('notes') || undefined,
          visibleToPatient: f.get('visibleToPatient') === 'on',
        }),
      });
      form.reset();
      setNotice('Medida registrada com sucesso.');
      await load(selected);
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Falha ao registrar medida.');
    }
  }

  async function importDiary(sourceId: string) {
    const encounter = data?.encounters[0];
    if (!encounter) {
      setError('Inicie um atendimento para incorporar o diário.');
      return;
    }
    setError('');
    try {
      await api(`/api/encounters/${encounter.id}/import-clinical`, {
        method: 'POST',
        body: JSON.stringify({ sourceType: 'DIARY', sourceId }),
      });
      setNotice('Registro incorporado à etapa Anotações do atendimento.');
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Falha ao incorporar o diário.');
    }
  }

  return (
    <section className="follow-up-page">
      <header className="follow-up-intro">
        <div>
          <span className="eyebrow">Acompanhamento Nutricional</span>
          <p>Monitore calorias diárias, adesão ao plano, diário e composição corporal.</p>
        </div>
        <div className="follow-up-patient-selector">
          <label>
            Paciente
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                void load(e.target.value);
              }}
            >
              <option value="">Selecione um paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-button" disabled={!selected || loading} onClick={() => void load(selected)}>
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>
      </header>

      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}

      {loading && !data ? (
        <div className="empty-state">
          <span className="spinner" />
          <strong>Carregando dados de acompanhamento...</strong>
        </div>
      ) : data ? (
        <>
          <section className="panel nutrition-calories-banner">
            <div className="banner-head">
              <div className="banner-title">
                <div className="banner-icon">
                  <Flame size={22} />
                </div>
                <div>
                  <span className="eyebrow">Estratégia Nutricional Vigente</span>
                  <h3>{data.activePlan ? data.activePlan.title : 'Nenhum plano alimentar publicado'}</h3>
                  <small>
                    {data.activePlan?.publishedAt
                      ? `Publicado em ${new Date(data.activePlan.publishedAt).toLocaleDateString('pt-BR')}`
                      : 'Crie e publique um plano alimentar para acompanhar as calorias calculadas.'}
                  </small>
                </div>
              </div>
              {data.activePlan && (
                <Link className="secondary-button" to={`/planos/${data.activePlan.id}`}>
                  <Salad size={16} /> Ver plano completo <ArrowRight size={14} />
                </Link>
              )}
            </div>

            <div className="calorie-metrics-grid">
              <article className="calorie-main-card">
                <span className="calorie-label">Calorias Diárias (VET Prescrito)</span>
                <div className="calorie-number">
                  <strong>{nutritionSummary.totals.kcal > 0 ? nutritionSummary.totals.kcal.toFixed(0) : '—'}</strong>
                  <span>kcal / dia</span>
                </div>
                {nutritionSummary.targetText && (
                  <small className="target-badge">{nutritionSummary.targetText}</small>
                )}
              </article>

              <article className="macro-breakdown-card">
                <span className="calorie-label">Macronutrientes Prescritos</span>
                <div className="macros-row">
                  <div className="macro-item">
                    <span className="macro-tag prot">P</span>
                    <strong>{nutritionSummary.totals.protein.toFixed(1)} g</strong>
                    <small>Proteínas</small>
                  </div>
                  <div className="macro-item">
                    <span className="macro-tag carb">C</span>
                    <strong>{nutritionSummary.totals.carbohydrate.toFixed(1)} g</strong>
                    <small>Carboidratos</small>
                  </div>
                  <div className="macro-item">
                    <span className="macro-tag fat">G</span>
                    <strong>{nutritionSummary.totals.fat.toFixed(1)} g</strong>
                    <small>Gorduras</small>
                  </div>
                </div>
              </article>

              <article className="habits-stats-card">
                <span className="calorie-label">Indicadores do Diário</span>
                <div className="habits-stats-row">
                  <div>
                    <strong>{diaryStats?.avgAdherence != null ? `${diaryStats.avgAdherence}%` : '—'}</strong>
                    <small>Adesão média</small>
                  </div>
                  <div>
                    <strong>{diaryStats?.avgWater != null ? `${diaryStats.avgWater} L` : '—'}</strong>
                    <small>Água / dia</small>
                  </div>
                  <div>
                    <strong>{diaryStats?.totalEntries || 0}</strong>
                    <small>Registros</small>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <div className="follow-up-grid">
            <article className="panel follow-up-diary-panel">
              <header className="follow-up-section-heading">
                <span className="follow-up-section-icon"><BookOpen size={20} /></span>
                <div>
                  <h2>Diário alimentar do paciente</h2>
                  <p>Registros recentes enviados pelo portal para apoiar a evolução clínica.</p>
                </div>
              </header>
              {data.diary.length ? (
                <div className="diary-list">
                  {data.diary.map((d) => (
                    <div className="diary-entry" key={d.id}>
                      <div className="diary-entry-header">
                        <strong>{showDate(d.entryDate)}</strong>
                        {d.adherence != null && (
                          <span className={`adherence-badge ${d.adherence >= 80 ? 'high' : d.adherence >= 50 ? 'medium' : 'low'}`}>
                            {d.adherence}% adesão
                          </span>
                        )}
                      </div>
                      {d.mealNotes && <p>{d.mealNotes}</p>}
                      {d.symptoms && (
                        <small className="symptoms-text">
                          <b>Sintomas / Observações:</b> {d.symptoms}
                        </small>
                      )}
                      <div className="entry-metrics">
                        <span>Fome: {d.hunger ?? '—'}/10</span>
                        <span>Saciedade: {d.satiety ?? '—'}/10</span>
                        <span>
                          <Droplets size={13} /> {d.waterLiters ?? '—'} L de água
                        </span>
                      </div>
                      <button
                        className="secondary-button import-btn"
                        type="button"
                        disabled={!data.encounters.length}
                        onClick={() => void importDiary(d.id)}
                        title={data.encounters.length ? 'Copiar para a evolução do atendimento aberto' : 'Abra um atendimento para incorporar'}
                      >
                        <Sparkles size={14} /> Incorporar à evolução
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact">
                  <BookOpen size={28} />
                  <div>
                    <strong>Nenhum registro no diário</strong>
                    <p>O paciente ainda não preencheu o diário alimentar no portal.</p>
                  </div>
                </div>
              )}
            </article>

            <div className="follow-up-side">
              <article className="panel follow-up-goals-panel">
                <header className="follow-up-section-heading">
                  <span className="follow-up-section-icon"><Target size={20} /></span>
                  <div>
                    <h2>Metas terapêuticas</h2>
                    <p>Defina objetivos claros, mensuráveis e visíveis no portal.</p>
                  </div>
                </header>
                <form className="compact-form" onSubmit={addGoal}>
                  <input name="title" required maxLength={160} placeholder="Nova meta (ex.: 2.5L de água por dia)" />
                  <textarea name="description" maxLength={1000} placeholder="Orientações e detalhes da meta (opcional)" />
                  <label>
                    Prazo
                    <input name="dueDate" type="date" />
                  </label>
                  <button className="primary-button">
                    <Plus size={16} /> Criar meta
                  </button>
                </form>
                <div className="simple-list">
                  {data.goals.filter((g) => g.status !== 'CANCELLED').length ? data.goals
                    .filter((g) => g.status !== 'CANCELLED')
                    .map((g) => (
                      <div key={g.id} className={`goal-card ${g.status.toLowerCase()}`}>
                        <span className="goal-card-content">
                          <small className={`goal-state ${g.status.toLowerCase()}`}>
                            {g.status === 'COMPLETED' ? 'Concluída' : 'Em acompanhamento'}
                          </small>
                          <strong>{g.title}</strong>
                          {g.description && <small>{g.description}</small>}
                          {g.dueDate && <small>Prazo: {showDate(g.dueDate)}</small>}
                        </span>
                        <select value={g.status} onChange={(e) => void setStatus(g.id, e.target.value as Goal['status'])}>
                          <option value="ACTIVE">Ativa</option>
                          <option value="COMPLETED">Concluída</option>
                          <option value="CANCELLED">Cancelar</option>
                        </select>
                      </div>
                    )) : (
                    <div className="follow-up-list-empty">
                      <Target size={22} />
                      <span><strong>Nenhuma meta ativa</strong><small>Crie uma meta para acompanhar o progresso do paciente.</small></span>
                    </div>
                  )}
                </div>
              </article>

              <article className="panel follow-up-measures-panel">
                <header className="follow-up-section-heading">
                  <span className="follow-up-section-icon"><Activity size={20} /></span>
                  <div>
                    <h2>Evolução corporal</h2>
                    <p>Registre medidas antropométricas e controle a visibilidade no portal.</p>
                  </div>
                </header>
                <form className="compact-form measure-form" onSubmit={addMeasure}>
                  <label>
                    Data da medição
                    <input name="measuredAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                  </label>
                  <input name="weight" type="number" step="0.01" min="0" placeholder="Peso (kg)" />
                  <input name="bodyFat" type="number" step="0.01" min="0" max="100" placeholder="Gordura (%)" />
                  <input name="waist" type="number" step="0.01" min="0" placeholder="Cintura (cm)" />
                  <input name="neck" type="number" step="0.01" min="0" max="200" placeholder="Pescoço (cm)" />
                  <input name="notes" maxLength={1000} placeholder="Observações da medida" />
                  <label className="check">
                    <input name="visibleToPatient" type="checkbox" defaultChecked /> Visível no portal do paciente
                  </label>
                  <button className="primary-button">
                    <Plus size={16} /> Registrar medida
                  </button>
                </form>
                <div className="simple-list">
                  {data.measurements.length ? data.measurements.map((m) => (
                    <div key={m.id}>
                      <span>
                        <strong>{showDate(m.measuredAt)}</strong>
                        <small>
                          {[
                            m.weight != null && `${m.weight} kg`,
                            m.bodyFat != null && `${m.bodyFat}% gordura`,
                            m.waist != null && `${m.waist} cm cintura`,
                            m.neck != null && `${m.neck} cm pescoço`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </small>
                      </span>
                      <small className={`badge ${m.visibleToPatient ? 'green' : 'gray'}`}>
                        {m.visibleToPatient ? 'Portal' : 'Privado'}
                      </small>
                    </div>
                  )) : (
                    <div className="follow-up-list-empty">
                      <Activity size={22} />
                      <span><strong>Nenhuma medição registrada</strong><small>As próximas medidas aparecerão neste histórico.</small></span>
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

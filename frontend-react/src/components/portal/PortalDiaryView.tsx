import {
  Calendar,
  Check,
  CheckCircle2,
  Droplet,
  Droplets,
  Flame,
  HeartPulse,
  Plus,
  Salad,
  Save,
  Smile,
  Sparkles,
  Utensils,
  Zap,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useClinic } from '../../contexts/ClinicContext';

type DiaryRow = {
  id?: string;
  entryDate: string;
  mealNotes?: string | null;
  symptoms?: string | null;
  hunger?: number | null;
  satiety?: number | null;
  waterLiters?: number | null;
  adherence?: number | null;
  createdAt?: string;
};

interface PortalDiaryViewProps {
  rows: DiaryRow[];
  submit: (path: string, body: Record<string, any>) => Promise<void>;
  addQuickWater?: (amount: number) => Promise<void>;
}

export function PortalDiaryView({ rows = [], submit }: PortalDiaryViewProps) {
  const clinic = useClinic();
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [saving, setSaving] = useState(false);

  // Busca se já existe registro para a data selecionada
  const existingForDate = useMemo(() => {
    return rows.find((r) => String(r.entryDate).slice(0, 10) === selectedDate);
  }, [rows, selectedDate]);

  // Estados do formulário
  const [mealNotes, setMealNotes] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [hunger, setHunger] = useState(5);
  const [satiety, setSatiety] = useState(5);
  const [waterLiters, setWaterLiters] = useState<number>(0);
  const [adherence, setAdherence] = useState<number>(85);

  // Sincroniza o form quando a data muda
  useMemo(() => {
    if (existingForDate) {
      setMealNotes(existingForDate.mealNotes || '');
      setSymptoms(existingForDate.symptoms || '');
      setHunger(existingForDate.hunger ?? 5);
      setSatiety(existingForDate.satiety ?? 5);
      setWaterLiters(existingForDate.waterLiters ? Number(existingForDate.waterLiters) : 0);
      setAdherence(existingForDate.adherence ?? 85);
    } else {
      setMealNotes('');
      setSymptoms('');
      setHunger(5);
      setSatiety(5);
      setWaterLiters(0);
      setAdherence(85);
    }
  }, [existingForDate]);

  // Estatísticas do diário
  const stats = useMemo(() => {
    if (!rows.length) return null;
    const totalDays = rows.length;
    const avgWater = rows.reduce((acc, r) => acc + (Number(r.waterLiters) || 0), 0) / totalDays;
    const validAdherence = rows.filter((r) => r.adherence != null);
    const avgAdherence = validAdherence.length
      ? Math.round(validAdherence.reduce((acc, r) => acc + (r.adherence || 0), 0) / validAdherence.length)
      : 0;

    return {
      totalDays,
      avgWater: avgWater.toFixed(1),
      avgAdherence,
    };
  }, [rows]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await submit('/api/portal/diary', {
        entryDate: selectedDate,
        mealNotes: mealNotes.trim() || undefined,
        symptoms: symptoms.trim() || undefined,
        hunger,
        satiety,
        waterLiters: waterLiters > 0 ? Number(waterLiters) : undefined,
        adherence,
      });
    } finally {
      setSaving(false);
    }
  }

  function addWaterToForm(amount: number) {
    setWaterLiters((prev) => +(prev + amount).toFixed(2));
  }

  const hungerLabel = hunger <= 3 ? 'Pouca fome' : hunger <= 7 ? 'Fome moderada' : 'Muita fome';
  const satietyLabel = satiety <= 3 ? 'Leve / Com fome' : satiety <= 7 ? 'Satisfeito' : 'Muito cheio';

  return (
    <div className="portal-diary-suite">
      {/* ── HEADER DA PÁGINA DO DIÁRIO ── */}
      <header className="diary-suite-header">
        <div className="diary-header-left">
          <span className="diary-badge-pill">
            <Sparkles size={13} /> Acompanhamento Diário & Hábitos
          </span>
          <h2>Diário de Alimentação & Bem-Estar</h2>
          <p>Registre suas refeições, sensações e hidratação para que {clinic.professionalName} acompanhe sua rotina.</p>
        </div>

        {stats && (
          <div className="diary-stats-summary">
            <div className="diary-stat-pill">
              <span className="stat-num">{stats.totalDays}</span>
              <span className="stat-label">Dias Registrados</span>
            </div>
            <div className="diary-stat-pill">
              <span className="stat-num">{stats.avgWater} L</span>
              <span className="stat-label">Média de Água/dia</span>
            </div>
            <div className="diary-stat-pill">
              <span className="stat-num">{stats.avgAdherence}%</span>
              <span className="stat-label">Adesão Média</span>
            </div>
          </div>
        )}
      </header>

      {/* ── GRID PRINCIPAL: FORMULÁRIO DO DIA + HISTÓRICO ── */}
      <div className="diary-main-grid">
        {/* FORMULÁRIO DE REGISTRO */}
        <section className="diary-form-card">
          <div className="diary-card-title-row">
            <div className="diary-card-icon">
              <Salad size={20} />
            </div>
            <div>
              <h3>Registro de {selectedDate === todayIso ? 'Hoje' : new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR')}</h3>
              <p>Preencha os dados do seu dia a dia</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="diary-inner-form">
            {/* LINHA DE DATA */}
            <div className="diary-field-group">
              <div className="diary-date-selector">
                <label className="diary-label">
                  <Calendar size={14} /> Data do Registro
                </label>
                <div className="diary-date-actions">
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayIso}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="diary-date-input"
                    required
                  />
                  {selectedDate !== todayIso && (
                    <button
                      type="button"
                      className="diary-btn-today"
                      onClick={() => setSelectedDate(todayIso)}
                    >
                      Ir para Hoje
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* CONSUMO DE ÁGUA */}
            <div className="diary-field-group">
              <label className="diary-label">
                <Droplets size={14} /> Consumo de Água (Litros)
              </label>
              <div className="diary-water-input-row">
                <div className="diary-water-val-box">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={waterLiters || ''}
                    placeholder="0.0"
                    onChange={(e) => setWaterLiters(Number(e.target.value))}
                    className="diary-water-num-input"
                  />
                  <span>Litros</span>
                </div>
                <div className="diary-water-quick-tags">
                  <button
                    type="button"
                    className="water-quick-chip"
                    onClick={() => addWaterToForm(0.25)}
                  >
                    <Plus size={12} /> 250ml
                  </button>
                  <button
                    type="button"
                    className="water-quick-chip"
                    onClick={() => addWaterToForm(0.5)}
                  >
                    <Plus size={12} /> 500ml
                  </button>
                </div>
              </div>
            </div>

            {/* ADESÃO AO PLANO ALIMENTAR */}
            <div className="diary-field-group">
              <label className="diary-label">
                <Zap size={14} /> Como foi sua adesão ao plano alimentar hoje?
              </label>
              <div className="adherence-presets-grid">
                {[
                  { val: 100, label: '100% Excelente' },
                  { val: 80, label: '80% Muito Bom' },
                  { val: 60, label: '60% Moderado' },
                  { val: 40, label: '40% Desafiador' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    className={`adherence-chip ${adherence === item.val ? 'active' : ''}`}
                    onClick={() => setAdherence(item.val)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FOME E SACIEDADE */}
            <div className="diary-sliders-grid">
              <div className="diary-slider-box">
                <div className="slider-label-row">
                  <span>Nível de Fome</span>
                  <strong>{hunger}/10 · {hungerLabel}</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={hunger}
                  onChange={(e) => setHunger(Number(e.target.value))}
                  className="diary-slider hunger-slider"
                />
              </div>

              <div className="diary-slider-box">
                <div className="slider-label-row">
                  <span>Nível de Saciedade</span>
                  <strong>{satiety}/10 · {satietyLabel}</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={satiety}
                  onChange={(e) => setSatiety(Number(e.target.value))}
                  className="diary-slider satiety-slider"
                />
              </div>
            </div>

            {/* REFEIÇÕES DO DIA */}
            <div className="diary-field-group">
              <label className="diary-label">
                <Utensils size={14} /> O que você consumiu hoje? (Refeições & Horários)
              </label>
              <textarea
                rows={3}
                value={mealNotes}
                onChange={(e) => setMealNotes(e.target.value)}
                placeholder="Ex.: Café: ovos mexidos e café sem açúcar · Almoço: arroz integral, frango e salada..."
                className="diary-textarea"
              />
            </div>

            {/* SINTOMAS & BEM-ESTAR */}
            <div className="diary-field-group">
              <label className="diary-label">
                <HeartPulse size={14} /> Sintomas, Disposição ou Digestão
              </label>
              <textarea
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Ex.: Boa energia durante o treino, sono restaurador, sem inchaço abdominal..."
                className="diary-textarea"
              />
            </div>

            <button type="submit" className="diary-submit-btn" disabled={saving}>
              <Save size={16} /> {saving ? 'Salvando diário...' : 'Salvar Registro do Dia'}
            </button>
          </form>
        </section>

        {/* HISTÓRICO DE DIAS ANTERIORES */}
        <section className="diary-history-card">
          <div className="diary-history-head">
            <div>
              <h3>Histórico do Diário</h3>
              <p>Últimos registros enviados ao consultório</p>
            </div>
            <span className="history-count-badge">{rows.length} dia(s)</span>
          </div>

          {rows.length === 0 ? (
            <div className="diary-history-empty">
              <Salad size={36} />
              <h4>Nenhum registro no diário ainda</h4>
              <p>Preencha o formulário ao lado para começar a registrar sua rotina diária.</p>
            </div>
          ) : (
            <div className="diary-history-timeline">
              {rows.map((row) => {
                const dateIso = String(row.entryDate).slice(0, 10);
                const isToday = dateIso === todayIso;
                const formattedDate = new Date(`${dateIso}T12:00:00`).toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                });

                return (
                  <article
                    key={row.id || dateIso}
                    className={`diary-history-item ${dateIso === selectedDate ? 'selected-date' : ''}`}
                    onClick={() => setSelectedDate(dateIso)}
                  >
                    <div className="history-item-top">
                      <div className="history-date-col">
                        <strong>{formattedDate}</strong>
                        {isToday && <span className="history-today-pill">Hoje</span>}
                      </div>

                      <div className="history-metrics-pills">
                        {row.waterLiters != null && (
                          <span className="history-water-pill">
                            <Droplet size={11} /> {Number(row.waterLiters).toFixed(1)} L
                          </span>
                        )}
                        {row.adherence != null && (
                          <span
                            className="history-adherence-pill"
                            style={{
                              background: row.adherence >= 80 ? '#eef7f2' : row.adherence >= 60 ? '#fef9c3' : '#fee2e2',
                              color: row.adherence >= 80 ? '#1b4d33' : row.adherence >= 60 ? '#854d0e' : '#991b1b',
                            }}
                          >
                            {row.adherence}% adesão
                          </span>
                        )}
                      </div>
                    </div>

                    {row.mealNotes && (
                      <p className="history-item-meals">
                        <Utensils size={12} /> {row.mealNotes}
                      </p>
                    )}

                    {row.symptoms && (
                      <p className="history-item-symptoms">
                        <HeartPulse size={12} /> {row.symptoms}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

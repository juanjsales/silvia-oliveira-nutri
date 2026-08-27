import { Check, Heart, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../lib/api';

type Feeling = 'EASY' | 'ADJUSTMENTS' | 'DIFFICULT' | 'NOT_TODAY';
type Checkin = { id: string; checkinDate: string; feeling: Feeling; reason: string | null };

const options: { value: Feeling; emoji: string; label: string }[] = [
  { value: 'EASY', emoji: '🌿', label: 'Leve' },
  { value: 'ADJUSTMENTS', emoji: '🧩', label: 'Com ajustes' },
  { value: 'DIFFICULT', emoji: '🌧️', label: 'Difícil' },
  { value: 'NOT_TODAY', emoji: '🫂', label: 'Hoje não deu' },
];

export function PortalDailyCheckin({ initial, onSaved }: { initial?: Checkin | null; onSaved?: () => void }) {
  const [feeling, setFeeling] = useState<Feeling | null>(initial?.feeling || null);
  const [reason, setReason] = useState(initial?.reason || '');
  const [editing, setEditing] = useState(!initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    if (!feeling || saving) return;
    setSaving(true); setError('');
    try {
      await api('/api/portal/daily-checkin', { method: 'PUT', body: JSON.stringify({ feeling, reason: reason || undefined }) });
      setEditing(false); onSaved?.();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível registrar agora.'); }
    finally { setSaving(false); }
  }

  const selected = options.find((option) => option.value === feeling);
  if (!editing && feeling) return <section className="portal-daily-checkin is-complete" aria-live="polite"><div className="daily-checkin-title"><span><Check size={18} /></span><div><strong>Obrigada por contar como está.</strong><p>{selected?.emoji} {selected?.label}. Cada dia conta, sem cobrança.</p></div></div><button type="button" onClick={() => setEditing(true)}>Ajustar resposta</button></section>;

  return <section className="portal-daily-checkin" aria-labelledby="daily-checkin-title"><header><span><Heart size={18} /></span><div><strong id="daily-checkin-title">Como está sendo seguir seu plano hoje?</strong><p>Um toque basta. Não existe resposta certa.</p></div></header><div className="daily-checkin-options">{options.map((option) => <button type="button" key={option.value} className={feeling === option.value ? 'selected' : ''} aria-pressed={feeling === option.value} onClick={() => setFeeling(option.value)}><span>{option.emoji}</span>{option.label}</button>)}</div>{feeling && <div className="daily-checkin-detail"><label htmlFor="daily-checkin-reason">Quer contar o principal motivo? <small>Opcional</small></label><input id="daily-checkin-reason" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex.: falta de tempo, fome, rotina diferente..." /><button type="button" disabled={saving} onClick={save}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} Salvar check-in</button></div>}{error && <p className="daily-checkin-error" role="alert">{error}</p>}</section>;
}

import { CheckCircle2, CircleDollarSign, Clock3, Plus, RotateCcw, WalletCards, X } from 'lucide-react';import{useCallback,useEffect,useMemo,useState,type FormEvent}from'react';import{api}from'../lib/api';
type Tx={id:string;patientId:string;patientName:string;description:string;amount:string;dueDate:string;paidAt?:string|null;paymentMethod?:string|null;status:'PENDING'|'PAID'|'OVERDUE'|'CANCELLED'|'REFUNDED';notes?:string|null;refundedAt?:string|null;refundReason?:string|null};type Patient={id:string;name:string};const today=new Date().toISOString().slice(0,10);
export function FinancePage() {
  const [items, setItems] = useState<Tx[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refunding, setRefunding] = useState<Tx | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [form, setForm] = useState({
    patientId: '',
    description: 'Consulta nutricional',
    amount: '',
    dueDate: today,
    paymentMethod: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        api<{ data: Tx[] }>('/api/finance'),
        api<{ data: Patient[] }>('/api/patients'),
      ]);
      setItems(r.data);
      setPatients(p.data);
    } catch (c) {
      setError(c instanceof Error ? c.message : 'Erro ao carregar financeiro.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sums = useMemo(
    () =>
      items.reduce(
        (a, t) => {
          const v = Number(t.amount);
          if (t.status === 'PAID') a.paid += v;
          if (t.status === 'PENDING') a.pending += v;
          if (t.status === 'OVERDUE') a.overdue += v;
          return a;
        },
        { paid: 0, pending: 0, overdue: 0 }
      ),
    [items]
  );

  async function create(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/finance', {
        method: 'POST',
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      setOpen(false);
      await load();
    } catch (c) {
      setError(c instanceof Error ? c.message : 'Erro ao lançar cobrança.');
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(t: Tx) {
    try {
      setError('');
      await api(`/api/finance/${t.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PAID', paidAt: new Date().toISOString() }),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível confirmar o recebimento.');
    }
  }

  async function refund(e: FormEvent) {
    e.preventDefault();
    if (!refunding) return;
    setSaving(true);
    setError('');
    try {
      await api(`/api/finance/${refunding.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason: refundReason }),
      });
      setRefunding(null);
      setRefundReason('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar o estorno.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-intro">
        <p>Acompanhe recebimentos e pendências vinculadas aos pacientes.</p>
        <button className="primary-button" onClick={() => setOpen(true)}>
          <Plus size={18} /> Novo lançamento
        </button>
      </div>

      <section className="finance-summary">
        <article>
          <WalletCards />
          <span>Recebido</span>
          <strong>{loading ? '...' : money(sums.paid)}</strong>
        </article>
        <article>
          <Clock3 />
          <span>Pendente</span>
          <strong>{loading ? '...' : money(sums.pending)}</strong>
        </article>
        <article className="overdue">
          <CircleDollarSign />
          <span>Vencido</span>
          <strong>{loading ? '...' : money(sums.overdue)}</strong>
        </article>
      </section>

      {error && <div className="form-error">{error}</div>}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Movimentações</span>
            <h3>Controle financeiro</h3>
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span className="spinner" />
            <strong style={{ color: 'var(--forest)' }}>Carregando lançamentos financeiros...</strong>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <CircleDollarSign size={36} color="#8aa996" />
            <strong>Nenhum lançamento financeiro registrado</strong>
            <p>Clique em "Novo lançamento" para registrar consultas ou honorários.</p>
          </div>
        ) : (
          <div className="finance-list">
            {items.map((t) => (
              <article key={t.id}>
                <div className={`finance-status ${t.status.toLowerCase()}`}>
                  <CircleDollarSign />
                </div>
                <div>
                  <strong>{t.description}</strong>
                  <span>
                    {t.patientName} · vencimento{' '}
                    {new Date(`${t.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <b>{money(Number(t.amount))}</b>
                <span className={`status ${t.status === 'PAID' ? 'active' : ''}`}>
                  {label(t.status)}
                </span>
                {t.status !== 'PAID' && t.status !== 'CANCELLED' && t.status !== 'REFUNDED' && (
                  <button className="secondary-button" onClick={() => void markPaid(t)}>
                    <CheckCircle2 size={16} /> Receber
                  </button>
                )}
                {t.status === 'PAID' && (
                  <button className="secondary-button" onClick={() => { setRefunding(t); setRefundReason(''); }}>
                    <RotateCcw size={16} /> Estornar
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {open && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <section className="modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">Financeiro</span>
                <h2>Novo lançamento</h2>
              </div>
              <button className="icon-button" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={create}>
              <div className="form-grid">
                <label className="full">
                  Paciente
                  <select
                    value={form.patientId}
                    onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                    required
                  >
                    <option value="">Selecione</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full">
                  Descrição
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Valor
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Vencimento
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Forma de pagamento
                  <input
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    placeholder="PIX, cartão..."
                  />
                </label>
                <label className="full">
                  Observações
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button className="primary-button" disabled={saving}>
                  {saving ? 'Salvando...' : 'Criar lançamento'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {refunding && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setRefunding(null); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="refund-title">
            <div className="modal-heading"><div><span className="eyebrow">Ação financeira auditável</span><h2 id="refund-title">Registrar estorno</h2></div><button className="icon-button" onClick={() => setRefunding(null)} aria-label="Fechar"><X size={18}/></button></div>
            <form onSubmit={refund}>
              <p>O lançamento de <strong>{money(Number(refunding.amount))}</strong> para {refunding.patientName} permanecerá no histórico como estornado.</p>
              <label>Motivo do estorno<textarea value={refundReason} onChange={(e)=>setRefundReason(e.target.value)} minLength={3} maxLength={1000} required placeholder="Ex.: pagamento devolvido após cancelamento acordado com o paciente."/></label>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setRefunding(null)}>Voltar</button><button className="primary-button" disabled={saving||refundReason.trim().length<3}>{saving?'Registrando...':'Confirmar estorno'}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
const money=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});const label=(s:Tx['status'])=>({PENDING:'Pendente',PAID:'Pago',OVERDUE:'Vencido',CANCELLED:'Cancelado',REFUNDED:'Estornado'}[s]);

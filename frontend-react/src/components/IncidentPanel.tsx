import { AlertTriangle, Check, CheckCircle2, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

type Incident = {
  id: string;
  requestId: string;
  method: string;
  route: string;
  errorName: string;
  errorCode?: string | null;
  occurredAt: string;
  resolvedAt?: string | null;
};

export function IncidentPanel() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingAll, setResolvingAll] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ data: Incident[] }>('/api/monitoring/incidents');
      setItems(res.data);
    } catch (c) {
      setError(c instanceof Error ? c.message : 'Não foi possível consultar incidentes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolve(id: string) {
    try {
      await api(`/api/monitoring/incidents/${id}/resolve`, { method: 'PATCH' });
      await load();
    } catch (c) {
      setError(c instanceof Error ? c.message : 'Erro ao resolver incidente.');
    }
  }

  async function resolveAll() {
    setResolvingAll(true);
    setError('');
    try {
      const res = await api<{ message: string }>('/api/monitoring/incidents/resolve-all', {
        method: 'POST',
      });
      setSuccessMsg(res.message);
      await load();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (c) {
      setError(c instanceof Error ? c.message : 'Erro ao resolver incidentes.');
    } finally {
      setResolvingAll(false);
    }
  }

  const open = items.filter((i) => !i.resolvedAt);

  return (
    <section className="panel settings-section incident-panel">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldAlert />
          <div>
            <h2>Saúde operacional</h2>
            <p>Registro de erros técnicos e tentativas anteriores de conexão (logs internos).</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {open.length > 0 && (
            <button
              type="button"
              className="secondary-button"
              onClick={resolveAll}
              disabled={resolvingAll || loading}
              style={{ fontSize: '0.78rem', padding: '6px 12px', color: '#166534', borderColor: '#bbf7d0', background: '#f0fdf4' }}
              title="Limpar todos os incidentes pendentes de uma vez"
            >
              <Check size={14} /> {resolvingAll ? 'Resolvendo...' : 'Marcar todos como resolvidos'}
            </button>
          )}

          <button
            type="button"
            className="icon-button"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Atualizar incidentes"
            title="Atualizar lista"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </header>

      {error && <div className="form-error">{error}</div>}
      {successMsg && (
        <div className="form-success">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {!error && (
        <div className={`incident-summary ${open.length ? 'attention' : 'healthy'}`}>
          {open.length ? <AlertTriangle /> : <CheckCircle2 />}
          <strong>
            {open.length
              ? `${open.length} evento(s) técnico(s) registrado(s) no histórico`
              : 'Sistema saudável · Nenhum incidente pendente'}
          </strong>
        </div>
      )}

      {open.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 12px' }}>
          💡 <strong>O que são esses eventos?</strong> São registros automáticos de erros passados (ex: testes de e-mail com senha incorreta, requisições antigas ou falhas temporárias de rede). Eles não bloqueiam o sistema e você pode clicar em <em>"Marcar todos como resolvidos"</em> acima para limpar a lista.
        </p>
      )}

      <div className="incident-list">
        {items.slice(0, 10).map((item) => (
          <article key={item.id} className={item.resolvedAt ? 'resolved' : ''}>
            <div>
              <strong>
                {item.method} {item.route}
              </strong>
              <span>
                {item.errorName}
                {item.errorCode ? ` · ${item.errorCode}` : ''} ·{' '}
                {new Date(item.occurredAt).toLocaleString('pt-BR')}
              </span>
              <small>Referência: {item.requestId}</small>
            </div>
            {!item.resolvedAt && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => void resolve(item.id)}
              >
                Marcar resolvido
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

import {
  CheckCircle2,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useConfirm } from "./ConfirmDialog";

type TableStat = {
  tableName: string;
  rowCount: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
};

type StorageStats = {
  dbSizeBytes: number;
  dbSizeFormatted: string;
  totalPatients: number;
  totalEncounters: number;
  totalExams: number;
  temporaryRowsCount: number;
  tablesStats: TableStat[];
};

type PruneResult = {
  sessionsPruned: number;
  tokensPruned: number;
  rateLimitsPruned: number;
  incidentsPruned: number;
  notificationsPruned: number;
  requestsPruned: number;
  outboxPruned: number;
  totalPruned: number;
  executedAt: string;
};

export function StorageMaintenancePanel() {
  const confirm = useConfirm();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pruning, setPruning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api<{ data: StorageStats }>("/api/monitoring/maintenance/stats");
      setStats(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao consultar métricas do banco.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  async function handlePrune() {
    if (!(await confirm({title:"Executar manutenção?",message:"Sessões expiradas, logs técnicos antigos e notificações lidas serão removidos conforme a política de retenção.",confirmLabel:"Executar limpeza",tone:"warning"}))) {
      return;
    }
    setPruning(true);
    setError("");
    setMessage("");
    try {
      const res = await api<{ message: string; data: PruneResult }>("/api/monitoring/maintenance/prune", {
        method: "POST",
      });
      setMessage(res.message);
      await loadStats();
      setTimeout(() => setMessage(""), 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao executar manutenção.");
    } finally {
      setPruning(false);
    }
  }

  return (
    <section className="panel settings-section maintenance-panel">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Database size={22} style={{ color: "#2563eb" }} />
          <div>
            <h2>Armazenamento & Manutenção do Banco</h2>
            <p>Monitore o consumo de espaço no Supabase e execute limpezas preventivas.</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="secondary-button"
            onClick={handlePrune}
            disabled={pruning || loading}
            style={{ color: "#166534", borderColor: "#bbf7d0", background: "#f0fdf4", fontSize: "0.8rem", padding: "6px 14px" }}
            title="Eliminar dados efêmeros e logs expirados"
          >
            <Trash2 size={15} /> {pruning ? "Otimizando..." : "Executar Faxina do Banco"}
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={() => void loadStats()}
            disabled={loading}
            title="Atualizar métricas"
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </header>

      {error && <div className="form-error">{error}</div>}
      {message && (
        <div className="form-success">
          <CheckCircle2 size={17} /> {message}
        </div>
      )}

      {stats && (
        <div className="storage-kpis-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, margin: "16px 0" }}>
          <div className="storage-kpi-card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
            <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Tamanho Atual do Banco</span>
            <strong style={{ display: "block", fontSize: "1.3rem", color: "#0f172a", marginTop: 4 }}>{stats.dbSizeFormatted}</strong>
            <small style={{ color: "#16a34a", fontSize: "0.72rem", fontWeight: 600 }}>Limite Free: 500 MB (Uso ~{((stats.dbSizeBytes / (500 * 1024 * 1024)) * 100).toFixed(1)}%)</small>
          </div>

          <div className="storage-kpi-card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
            <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Prontuários & Consultas</span>
            <strong style={{ display: "block", fontSize: "1.3rem", color: "#0f172a", marginTop: 4 }}>{stats.totalEncounters}</strong>
            <small style={{ color: "#64748b", fontSize: "0.72rem" }}>Distribuídos em {stats.totalPatients} pacientes</small>
          </div>

          <div className="storage-kpi-card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
            <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Exames em Anexo</span>
            <strong style={{ display: "block", fontSize: "1.3rem", color: "#0f172a", marginTop: 4 }}>{stats.totalExams}</strong>
            <small style={{ color: "#64748b", fontSize: "0.72rem" }}>Arquivos no Supabase Storage</small>
          </div>

          <div className="storage-kpi-card" style={{ background: stats.temporaryRowsCount > 0 ? "#fefce8" : "#f0fdf4", border: `1px solid ${stats.temporaryRowsCount > 0 ? "#fef08a" : "#bbf7d0"}`, borderRadius: 12, padding: "14px 16px" }}>
            <span style={{ fontSize: "0.74rem", color: stats.temporaryRowsCount > 0 ? "#854d0e" : "#166534", fontWeight: 700, textTransform: "uppercase" }}>Dados Efêmeros / Temporários</span>
            <strong style={{ display: "block", fontSize: "1.3rem", color: stats.temporaryRowsCount > 0 ? "#713f12" : "#14532d", marginTop: 4 }}>{stats.temporaryRowsCount}</strong>
            <small style={{ color: stats.temporaryRowsCount > 0 ? "#a16207" : "#15803d", fontSize: "0.72rem" }}>
              {stats.temporaryRowsCount > 0 ? "Prontos para serem limpos" : "Banco 100% otimizado"}
            </small>
          </div>
        </div>
      )}

      {stats && stats.tablesStats.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Tabelas Principais no Supabase:</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginTop: 8 }}>
            {stats.tablesStats.map((t) => (
              <div key={t.tableName} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "0.78rem", color: "#1e293b", display: "block" }}>{t.tableName}</strong>
                  <small style={{ fontSize: "0.68rem", color: "#64748b" }}>{t.rowCount} registros</small>
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: 6 }}>
                  {t.totalSizeFormatted}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

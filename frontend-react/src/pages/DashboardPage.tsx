import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  Plus,
  Salad,
  Sparkles,
  Stethoscope,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useClinic } from "../contexts/ClinicContext";
import { api } from "../lib/api";
import { PendingCheckinsPanel } from "../components/PendingCheckinsPanel";
type Summary = {
  monthRevenue: string;
  outstanding: string;
  overdue: string;
  patients: string;
  todayAppointments: string;
  openEncounters: string;
};
const money = (v: string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function DashboardPage() {
  const { user } = useAuth();
  const clinic = useClinic();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ data: Summary }>("/api/finance/summary")
      .then((r) => setData(r.data))
      .catch((c) =>
        setError(
          c instanceof Error ? c.message : "Erro ao carregar indicadores.",
        ),
      );
  }, []);
  const firstName = (clinic.professionalName || user?.name || "").
    replace(/^(dra?\.?|nutricionista)\s+/i, "").
    trim().
    split(/\s+/)[0] || "Profissional";
  return (
    <div className="dashboard-grid">
      <section className="welcome-card">
        <div>
          <span className="eyebrow light-text">Bom trabalho hoje</span>
          <h2>Olá, {firstName}.</h2>
          <p>
            Organize o cuidado com calma e tenha o histórico certo em cada
            decisão.
          </p>
          <div className="welcome-actions">
            <Link className="button-on-dark" to="/pacientes">
              <Plus /> Novo paciente
            </Link>
            <Link className="text-link-light" to="/atendimentos">
              Iniciar atendimento <ArrowRight />
            </Link>
          </div>
        </div>
        <Sparkles className="welcome-spark" />
      </section>
      {error && <div className="form-error">{error}</div>}
      <section className="summary-row dashboard-real">
        <Card
          icon={Users}
          tone="green"
          label="Pacientes ativos"
          value={data?.patients || "—"}
          detail="Em acompanhamento"
        />
        <Card
          icon={CalendarDays}
          tone="gold"
          label="Consultas hoje"
          value={data?.todayAppointments || "—"}
          detail="Agenda do dia"
        />
        <Card
          icon={ClipboardCheck}
          tone="rose"
          label="Atendimentos abertos"
          value={data?.openEncounters || "—"}
          detail="Prontuários em andamento"
        />
        <Card
          icon={WalletCards}
          tone="green"
          label="Receita no mês"
          value={data ? money(data.monthRevenue) : "—"}
          detail="Pagamentos confirmados"
        />
      </section>
      <PendingCheckinsPanel />
      <section className="panel span-two">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Visão financeira</span>
            <h3>Recebimentos e pendências</h3>
          </div>
          <Link className="text-link" to="/financeiro">
            Abrir financeiro <ArrowRight />
          </Link>
        </div>
        <div className="dashboard-finance">
          <article>
            <CircleDollarSign />
            <div>
              <span>Total a receber</span>
              <strong>{data ? money(data.outstanding) : "—"}</strong>
            </div>
          </article>
          <article className="overdue">
            <CalendarDays />
            <div>
              <span>Cobranças vencidas</span>
              <strong>{data?.overdue || "—"}</strong>
            </div>
          </article>
        </div>
      </section>
      <section className="panel dashboard-shortcuts" aria-labelledby="shortcuts-heading">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Ações rápidas</span>
            <h3 id="shortcuts-heading">Acessos diretos</h3>
          </div>
        </div>
        <div className="shortcut-actions-grid" role="list">
          <Link className="shortcut-card" to="/atendimentos" role="listitem" aria-label="Iniciar atendimento clínico">
            <div className="shortcut-icon green" aria-hidden="true">
              <Stethoscope size={20} />
            </div>
            <div>
              <strong>Iniciar atendimento</strong>
              <small>Abrir prontuário e anamnese</small>
            </div>
            <ArrowRight size={16} className="shortcut-arrow" aria-hidden="true" />
          </Link>
          <Link className="shortcut-card" to="/agenda" role="listitem" aria-label="Consultar agenda de consultas">
            <div className="shortcut-icon gold" aria-hidden="true">
              <CalendarDays size={20} />
            </div>
            <div>
              <strong>Consultar agenda</strong>
              <small>Horários e marcações</small>
            </div>
            <ArrowRight size={16} className="shortcut-arrow" aria-hidden="true" />
          </Link>
          <Link className="shortcut-card" to="/pacientes" role="listitem" aria-label="Cadastrar novo paciente">
            <div className="shortcut-icon rose" aria-hidden="true">
              <Users size={20} />
            </div>
            <div>
              <strong>Novo paciente</strong>
              <small>Cadastrar e gerenciar acessos</small>
            </div>
            <ArrowRight size={16} className="shortcut-arrow" aria-hidden="true" />
          </Link>
          <Link className="shortcut-card" to="/planos" role="listitem" aria-label="Acessar catálogo de planos e receitas">
            <div className="shortcut-icon green" aria-hidden="true">
              <Salad size={20} />
            </div>
            <div>
              <strong>Planos & Receitas</strong>
              <small>Tabela TACO e modelos</small>
            </div>
            <ArrowRight size={16} className="shortcut-arrow" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
function Card({
  icon: Icon,
  tone,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  tone: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="summary-card">
      <div className={`summary-icon ${tone}`}>
        <Icon />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

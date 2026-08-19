import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Filter,
  HeartPulse,
  KeyRound,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Patient = {
  id: string;
  name: string;
  cpf?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  birthDate?: string | null;
  objective?: string | null;
  active: boolean;
  createdAt: string;
  hasPortalAccess?: boolean;
};

type PatientForm = {
  name: string;
  cpf: string;
  email: string;
  whatsapp: string;
  birthDate: string;
  objective: string;
};

const emptyForm: PatientForm = {
  name: "",
  cpf: "",
  email: "",
  whatsapp: "",
  birthDate: "",
  objective: "",
};

const objectiveOptions = [
  "Emagrecimento e Definição",
  "Ganho de Massa Muscular (Hipertrofia)",
  "Reeducação Alimentar & Longevidade",
  "Melhora da Composição Corporal",
  "Nutrição Esportiva & Alta Performance",
  "Controle Glicêmico & Diabetes",
  "Saúde Cardiovascular & Perfil Lipídico",
  "Saúde Gastrointestinal & Microbiota",
  "Gestação, Pós-Parto & Lactação",
  "Alimentação Vegetariana / Vegana",
  "Saúde da Mulher & Equilíbrio Hormonal",
] as const;

const customObjective = "Outro objetivo personalizado";

type FilterTab = "ALL" | "PORTAL_ACTIVE" | "NO_PORTAL" | "HAS_PHONE";

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [objectiveChoice, setObjectiveChoice] = useState("");
  const [saving, setSaving] = useState(false);
  const [accessPatient, setAccessPatient] = useState<Patient | null>(null);
  const [accessMessage, setAccessMessage] = useState("");

  const load = useCallback(async (term = "") => {
    setLoading(true);
    setError("");
    try {
      const r = await api<{ data: Patient[] }>(
        `/api/patients${term ? `?q=${encodeURIComponent(term)}` : ""}`
      );
      setPatients(r.data);
    } catch (c) {
      setError(c instanceof Error ? c.message : "Erro ao carregar pacientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(query), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query, load]);

  // Cálculos de métricas rápidas
  const metrics = useMemo(() => {
    const total = patients.length;
    const withPortal = patients.filter((p) => p.hasPortalAccess).length;
    const withPhone = patients.filter((p) => p.whatsapp && p.whatsapp.trim().length > 0).length;
    return { total, withPortal, withPhone };
  }, [patients]);

  // Filtragem por abas
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (activeTab === "PORTAL_ACTIVE") return p.hasPortalAccess;
      if (activeTab === "NO_PORTAL") return !p.hasPortalAccess;
      if (activeTab === "HAS_PHONE") return p.whatsapp && p.whatsapp.trim().length > 0;
      return true;
    });
  }, [patients, activeTab]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setObjectiveChoice("");
    setDialogOpen(true);
  }

  function openEdit(p: Patient) {
    setEditing(p);
    setForm({
      name: p.name,
      cpf: p.cpf || "",
      email: p.email || "",
      whatsapp: p.whatsapp || "",
      birthDate: p.birthDate?.slice(0, 10) || "",
      objective: p.objective || "",
    });
    setObjectiveChoice(
      objectiveOptions.some((option) => option === p.objective)
        ? p.objective || ""
        : p.objective
        ? customObjective
        : ""
    );
    setDialogOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() || undefined])
    );
    try {
      await api(editing ? `/api/patients/${editing.id}` : "/api/patients", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setDialogOpen(false);
      await load(query);
    } catch (c) {
      setError(c instanceof Error ? c.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  function openAccess(p: Patient) {
    setAccessPatient(p);
    setAccessMessage("");
  }

  async function provision(e: FormEvent) {
    e.preventDefault();
    if (!accessPatient) return;
    setSaving(true);
    setAccessMessage("");
    try {
      const result = await api<{
        data: { emailSent: boolean; warning?: string | null };
      }>(`/api/patients/${accessPatient.id}/access`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setAccessMessage(
        result.data.emailSent
          ? `Convite seguro enviado com sucesso para ${accessPatient.email}!`
          : result.data.warning || "Não foi possível enviar o convite."
      );
      await load(query);
    } catch (c) {
      setAccessMessage(
        c instanceof Error ? c.message : "Não foi possível criar o acesso."
      );
    } finally {
      setSaving(false);
    }
  }

  function cleanPhoneForWhatsApp(phoneStr?: string | null) {
    if (!phoneStr) return "";
    const clean = phoneStr.replace(/\D/g, "");
    if (clean.length === 10 || clean.length === 11) {
      return `55${clean}`;
    }
    return clean;
  }

  return (
    <div className="patients-container-v2">
      {/* ── CABEÇALHO DA PÁGINA ── */}
      <div className="page-intro-v2">
        <div>
          <span className="eyebrow">Gestão de Pacientes</span>
          <h2>Prontuário & Acompanhamento</h2>
          <p>Consulte históricos, inicie atendimentos e gerencie o acesso ao Portal do Paciente.</p>
        </div>
        <button className="primary-button add-patient-btn" onClick={openCreate}>
          <UserPlus size={18} /> Novo Paciente
        </button>
      </div>

      {/* ── CARDS DE MÉTRICAS RÁPIDAS ── */}
      <div className="patient-metrics-row">
        <div className="patient-metric-card">
          <div className="metric-icon-wrap green">
            <Users size={22} />
          </div>
          <div>
            <span className="metric-label">Total de Pacientes</span>
            <strong className="metric-value">{loading ? "—" : metrics.total}</strong>
            <small className="metric-hint">Cadastrados no consultório</small>
          </div>
        </div>

        <div className="patient-metric-card">
          <div className="metric-icon-wrap emerald">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="metric-label">Com Portal Ativo</span>
            <strong className="metric-value">{loading ? "—" : metrics.withPortal}</strong>
            <small className="metric-hint">Acessando planos & diários</small>
          </div>
        </div>

        <div className="patient-metric-card">
          <div className="metric-icon-wrap gold">
            <MessageCircle size={22} />
          </div>
          <div>
            <span className="metric-label">Com WhatsApp Válido</span>
            <strong className="metric-value">{loading ? "—" : metrics.withPhone}</strong>
            <small className="metric-hint">Prontos para contato rápido</small>
          </div>
        </div>
      </div>

      {/* ── PAINEL PRINCIPAL DE PACIENTES ── */}
      <section className="panel patient-table-panel">
        {/* BARRA DE FERRAMENTAS & FILTROS */}
        <div className="patient-toolbar-v2">
          <div className="search-box-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar paciente por nome, CPF, e-mail ou WhatsApp..."
            />
            {query && (
              <button className="clear-search-btn" onClick={() => setQuery("")} title="Limpar busca">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="filter-chips-wrap">
            <button
              type="button"
              className={`filter-chip ${activeTab === "ALL" ? "active" : ""}`}
              onClick={() => setActiveTab("ALL")}
            >
              Todos ({metrics.total})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeTab === "PORTAL_ACTIVE" ? "active" : ""}`}
              onClick={() => setActiveTab("PORTAL_ACTIVE")}
            >
              Portal Ativo ({metrics.withPortal})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeTab === "NO_PORTAL" ? "active" : ""}`}
              onClick={() => setActiveTab("NO_PORTAL")}
            >
              Sem Acesso ({metrics.total - metrics.withPortal})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeTab === "HAS_PHONE" ? "active" : ""}`}
              onClick={() => setActiveTab("HAS_PHONE")}
            >
              Com WhatsApp ({metrics.withPhone})
            </button>
          </div>
        </div>

        {error && <div className="form-error" style={{ margin: "16px 20px" }}>{error}</div>}

        {/* LISTAGEM DE PACIENTES */}
        {loading ? (
          <div className="patient-empty-state">
            <span className="spinner" />
            <strong>Carregando prontuários...</strong>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="patient-empty-state">
            <div className="empty-icon-circle">
              <UserRound size={36} />
            </div>
            <strong>Nenhum paciente encontrado</strong>
            <p>
              {query
                ? `Nenhum resultado para a busca "${query}". Verifique a digitação ou limpe o filtro.`
                : "Cadastre o primeiro paciente do seu consultório para iniciar os atendimentos."}
            </p>
            <button className="primary-button" onClick={openCreate} style={{ marginTop: 12 }}>
              <Plus size={16} /> Cadastrar Paciente Agora
            </button>
          </div>
        ) : (
          <div className="patient-cards-grid">
            {filteredPatients.map((p) => {
              const waClean = cleanPhoneForWhatsApp(p.whatsapp);
              const initials = p.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0].toUpperCase())
                .join("");

              return (
                <article className="patient-card-v2" key={p.id}>
                  {/* CABEÇALHO DO CARD */}
                  <div className="card-top-row">
                    <div className="avatar-wrap">
                      <span className="avatar-initials">{initials || p.name.charAt(0)}</span>
                      {p.hasPortalAccess && <span className="portal-active-badge" title="Portal do paciente ativo" />}
                    </div>

                    <div className="patient-header-info">
                      <h3 className="patient-card-name" title={p.name}>
                        {p.name}
                      </h3>
                      <div className="patient-objective-tag" title={p.objective || "Objetivo não informado"}>
                        <Sparkles size={12} />
                        <span>{p.objective || "Objetivo não informado"}</span>
                      </div>
                    </div>

                    <div className="card-top-actions">
                      <button
                        className="card-quick-btn"
                        onClick={() => openEdit(p)}
                        title="Editar dados cadastrais"
                        aria-label="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </div>

                  {/* CONTATO & DETALHES */}
                  <div className="card-contact-row">
                    {p.email ? (
                      <div className="contact-item" title={p.email}>
                        <Mail size={14} className="contact-icon" />
                        <span>{p.email}</span>
                      </div>
                    ) : (
                      <div className="contact-item muted">
                        <Mail size={14} className="contact-icon" />
                        <span>Sem e-mail cadastrado</span>
                      </div>
                    )}

                    {p.whatsapp ? (
                      <div className="contact-item" title={p.whatsapp}>
                        <Phone size={14} className="contact-icon" />
                        <span>{p.whatsapp}</span>
                        {waClean && (
                          <a
                            href={`https://wa.me/${waClean}`}
                            target="_blank"
                            rel="noreferrer"
                            className="wa-link-btn"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle size={13} />
                          </a>
                        )}
                      </div>
                    ) : p.cpf ? (
                      <div className="contact-item" title={`CPF: ${p.cpf}`}>
                        <UserRound size={14} className="contact-icon" />
                        <span>CPF: {p.cpf}</span>
                      </div>
                    ) : (
                      <div className="contact-item muted">
                        <Phone size={14} className="contact-icon" />
                        <span>Sem telefone informado</span>
                      </div>
                    )}
                  </div>

                  {/* RODAPÉ DO CARD COM AÇÕES CLÍNICAS */}
                  <div className="card-footer-v2">
                    <div className="portal-status-pill">
                      <button
                        type="button"
                        className={`portal-status-btn ${p.hasPortalAccess ? "active" : ""}`}
                        onClick={() => openAccess(p)}
                        title="Gerenciar acesso ao portal do paciente"
                      >
                        <KeyRound size={13} />
                        <span>{p.hasPortalAccess ? "Portal Ativo" : "Liberar Portal"}</span>
                      </button>
                    </div>

                    <div className="clinical-action-btns">
                      <Link
                        className="btn-history-link"
                        to={`/pacientes/${p.id}/clinico`}
                        title="Histórico de evolução e exames"
                      >
                        <HeartPulse size={15} />
                        <span>Histórico</span>
                      </Link>

                      <Link
                        className="btn-start-care"
                        to={`/atendimentos?paciente=${p.id}`}
                        title="Abrir prontuário e iniciar consulta"
                      >
                        <Stethoscope size={15} />
                        <span>Atender</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── MODAL DE ACESSO AO PORTAL ── */}
      {accessPatient && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAccessPatient(null);
          }}
        >
          <section className="modal" style={{ maxWidth: 480 }}>
            <ModalHead
              eyebrow="Portal do Paciente"
              title={accessPatient.hasPortalAccess ? "Gerenciar Acesso" : "Liberar Acesso ao Portal"}
              close={() => setAccessPatient(null)}
            />
            <form onSubmit={provision} style={{ padding: "0 4px" }}>
              <div className="portal-access-info-box">
                <div className="access-user-badge">
                  <UserRound size={18} />
                  <div>
                    <strong>{accessPatient.name}</strong>
                    <span>{accessPatient.email || "⚠️ E-mail não cadastrado"}</span>
                  </div>
                </div>

                <p className="access-desc">
                  O paciente receberá um e-mail com um link seguro e temporário para cadastrar a própria senha e acessar os planos alimentares, receitas e diário.
                </p>
              </div>

              {accessMessage && (
                <div
                  className={
                    accessMessage.includes("sucesso") || accessMessage.includes("enviado")
                      ? "form-success"
                      : "form-error"
                  }
                  style={{ marginBottom: 14 }}
                >
                  <CheckCircle2 size={16} />
                  <span>{accessMessage}</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setAccessPatient(null)}
                >
                  Fechar
                </button>
                <button
                  className="primary-button"
                  disabled={saving || !accessPatient.email}
                  style={{ background: "#203528" }}
                >
                  {saving
                    ? "Enviando..."
                    : accessPatient.hasPortalAccess
                    ? "Reenviar Convite"
                    : "Enviar Convite de Acesso"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ── MODAL DE CADASTRO / EDIÇÃO DE PACIENTE ── */}
      {dialogOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDialogOpen(false);
          }}
        >
          <section className="modal" style={{ maxWidth: 620 }}>
            <ModalHead
              eyebrow="Ficha Cadastral"
              title={editing ? "Editar Dados do Paciente" : "Novo Paciente"}
              close={() => setDialogOpen(false)}
            />
            <form onSubmit={save}>
              <div className="form-grid">
                <label className="full">
                  Nome Completo *
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Maria Clara Souza"
                    required
                    minLength={2}
                  />
                </label>

                <label>
                  CPF
                  <input
                    type="text"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </label>

                <label>
                  Data de Nascimento
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  />
                </label>

                <label>
                  E-mail
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="paciente@email.com"
                  />
                  <small className="field-hint">Necessário para liberar o Portal do Paciente.</small>
                </label>

                <label>
                  WhatsApp / Telefone
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="(11) 99999-8888"
                  />
                </label>

                <label className="full">
                  Objetivo Nutricional Principal
                  <select
                    value={objectiveChoice}
                    onChange={(e) => {
                      const value = e.target.value;
                      setObjectiveChoice(value);
                      setForm({
                        ...form,
                        objective: value === customObjective ? "" : value,
                      });
                    }}
                  >
                    <option value="">Selecione o foco do acompanhamento</option>
                    {objectiveOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value={customObjective}>{customObjective}</option>
                  </select>
                </label>

                {objectiveChoice === customObjective && (
                  <label className="full">
                    Descreva o objetivo personalizado
                    <textarea
                      value={form.objective}
                      onChange={(e) => setForm({ ...form, objective: e.target.value })}
                      placeholder="Ex: Alívio de refluxo, preparação para maratona, melhora da ferritina..."
                      rows={3}
                      maxLength={500}
                    />
                  </label>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </button>
                <button className="primary-button" disabled={saving}>
                  {saving ? "Salvando..." : editing ? "Salvar Alterações" : "Cadastrar Paciente"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function ModalHead({
  eyebrow,
  title,
  close,
}: {
  eyebrow: string;
  title: string;
  close: () => void;
}) {
  return (
    <div className="modal-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <button className="icon-button" onClick={close} type="button" aria-label="Fechar">
        <X size={20} />
      </button>
    </div>
  );
}

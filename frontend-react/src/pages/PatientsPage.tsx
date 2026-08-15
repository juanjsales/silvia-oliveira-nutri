import { HeartPulse, KeyRound, Pencil, Plus, Search, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
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
  "Emagrecimento",
  "Ganho de massa muscular",
  "Reeducação alimentar",
  "Melhora da composição corporal",
  "Nutrição esportiva e performance",
  "Controle glicêmico e diabetes",
  "Saúde cardiovascular e colesterol",
  "Saúde gastrointestinal",
  "Gestação e amamentação",
  "Alimentação vegetariana ou vegana",
  "Qualidade de vida e prevenção",
] as const;
const customObjective = "Outro objetivo";
export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
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
        `/api/patients${term ? `?q=${encodeURIComponent(term)}` : ""}`,
      );
      setPatients(r.data);
    } catch (c) {
      setError(c instanceof Error ? c.message : "Erro ao carregar pacientes.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(query), query ? 350 : 0);
    return () => clearTimeout(timer);
  }, [query, load]);
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
          : "",
    );
    setDialogOpen(true);
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() || undefined]),
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
          ? `Convite seguro enviado para ${accessPatient.email}.`
          : result.data.warning || "Não foi possível enviar o convite.",
      );
      await load(query);
    } catch (c) {
      setAccessMessage(
        c instanceof Error ? c.message : "Não foi possível criar o acesso.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div>
      <div className="page-intro">
        <p>Consulte dados essenciais e mantenha o acompanhamento organizado.</p>
        <button className="primary-button" onClick={openCreate}>
          <Plus size={18} /> Novo paciente
        </button>
      </div>
      <section className="panel">
        <div className="patient-toolbar">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou CPF"
            />
          </label>
          <span className="result-count">
            {patients.length} {patients.length === 1 ? "paciente" : "pacientes"}
          </span>
        </div>
        {error && <div className="form-error">{error}</div>}
        {loading ? (
          <div className="empty-state">
            <span className="spinner" />
            <strong>Carregando pacientes...</strong>
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <UserRound size={34} />
            <strong>Nenhum paciente encontrado</strong>
            <p>Cadastre os dados essenciais para iniciar.</p>
          </div>
        ) : (
          <div className="patient-list">
            {patients.map((p) => (
              <article className="patient-row" key={p.id}>
                <div className="patient-avatar">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="patient-main">
                  <strong>{p.name}</strong>
                  <span>{p.objective || "Objetivo ainda não informado"}</span>
                </div>
                <div className="patient-contact">
                  <span>{p.email || "Sem e-mail"}</span>
                  <small>
                    {p.whatsapp || p.cpf || "Contato não informado"}
                  </small>
                </div>
                <span className={`status ${p.hasPortalAccess ? "active" : ""}`}>
                  {p.hasPortalAccess ? "Portal ativo" : "Sem acesso"}
                </span>
                <Link className="icon-button" to={`/pacientes/${p.id}/clinico`} title="Resumo clínico" aria-label={`Resumo clínico de ${p.name}`}>
                  <HeartPulse size={17} />
                </Link>
                <button
                  className="icon-button"
                  onClick={() => openAccess(p)}
                  title="Acesso ao portal"
                >
                  <KeyRound size={17} />
                </button>
                <button className="icon-button" onClick={() => openEdit(p)}>
                  <Pencil size={17} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      {accessPatient && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAccessPatient(null);
          }}
        >
          <section className="modal">
            <ModalHead
              eyebrow="Portal do paciente"
              title={
                accessPatient.hasPortalAccess
                  ? "Redefinir acesso"
                  : "Criar acesso"
              }
              close={() => setAccessPatient(null)}
            />
            <form onSubmit={provision}>
              <p className="muted">
                Login:{" "}
                <strong>
                  {accessPatient.email || "e-mail não cadastrado"}
                </strong>
              </p>
              <div className="inline-guidance"><KeyRound size={18}/><span>O paciente receberá um link temporário para escolher a própria senha. A senha atual não será alterada se o e-mail falhar.</span></div>
              {accessMessage && (
                <div
                  className={
                    accessMessage.startsWith("Acesso")
                      ? "form-success"
                      : "form-error"
                  }
                >
                  {accessMessage}
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
                >
                  {saving
                    ? "Salvando..."
                    : accessPatient.hasPortalAccess
                      ? "Enviar redefinição"
                      : "Enviar convite"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {dialogOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDialogOpen(false);
          }}
        >
          <section className="modal">
            <ModalHead
              eyebrow="Dados essenciais"
              title={editing ? "Editar paciente" : "Novo paciente"}
              close={() => setDialogOpen(false)}
            />
            <form onSubmit={save}>
              <div className="form-grid">
                <label className="full">
                  Nome completo
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    minLength={2}
                  />
                </label>
                <label>
                  CPF
                  <input
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  />
                </label>
                <label>
                  Data de nascimento
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) =>
                      setForm({ ...form, birthDate: e.target.value })
                    }
                  />
                </label>
                <label>
                  E-mail
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </label>
                <label>
                  WhatsApp
                  <input
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                  />
                </label>
                <label className="full">
                  Objetivo principal
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
                    <option value="">Selecione o objetivo principal</option>
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
                    Descreva o objetivo
                    <textarea
                      value={form.objective}
                      onChange={(e) =>
                        setForm({ ...form, objective: e.target.value })
                      }
                      placeholder="Ex.: melhorar sintomas específicos ou preparar-se para uma cirurgia"
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
                  {saving ? "Salvando..." : "Salvar paciente"}
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
      <button className="icon-button" onClick={close}>
        <X size={20} />
      </button>
    </div>
  );
}

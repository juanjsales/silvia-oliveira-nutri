import {
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  KeyRound,
  LockKeyhole,
  Mail,
  MessageCircle,
  Palette,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { SmtpSettings } from "../components/SmtpSettings";
import { ReadinessPanel } from "../components/ReadinessPanel";
import { IncidentPanel } from "../components/IncidentPanel";
import { PrivacyRequestsPanel } from "../components/PrivacyRequestsPanel";
import { PasswordInput } from "../components/PasswordInput";
import { SetupWizardModal } from "../components/SetupWizardModal";
import { capitalizePersonName } from "../lib/formatters";

type Settings = {
  clinicName: string;
  professionalName: string;
  crn: string;
  specialty: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  inPersonPrice: number;
  onlinePrice: number;
  defaultDurationMinutes: number;
  reminderMessage: string;
  followupMessage: string;
  documentFooter: string;
};

const defaults: Settings = {
  clinicName: "",
  professionalName: "",
  crn: "",
  specialty: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  logoUrl: "",
  primaryColor: "#203528",
  secondaryColor: "#8ca481",
  inPersonPrice: 280,
  onlinePrice: 250,
  defaultDurationMinutes: 60,
  reminderMessage: "",
  followupMessage: "",
  documentFooter: "",
};

type SettingsTab = "CLINIC" | "PRICING" | "MESSAGES" | "EMAIL" | "SECURITY" | "SUPPORT";

export function SettingsPage() {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<SettingsTab>("CLINIC");

  // Senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const loadSettings = () => {
    api<{ data: Settings }>("/api/settings")
      .then((r) => setForm({ ...defaults, ...r.data }))
      .catch((c) =>
        setError(
          c instanceof Error ? c.message : "Erro ao carregar configurações."
        )
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const profName = capitalizePersonName(form.professionalName);
      const result = await api<{ data: Settings }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          professionalName: profName,
          clinicName: form.clinicName || profName,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          logoUrl: form.logoUrl || undefined,
        }),
      });
      setForm({ ...defaults, ...result.data });
      setNotice("Configurações salvas e atualizadas com sucesso!");
      window.dispatchEvent(new CustomEvent("clinic-settings-updated"));
      setTimeout(() => setNotice(""), 5000);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível salvar."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (newPassword !== confirm) {
      setError("A confirmação da nova senha não confere.");
      return;
    }
    setSaving(true);
    try {
      await api("/api/settings/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setNotice("Senha alterada com sucesso.");
      setTimeout(() => setNotice(""), 5000);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível alterar a senha."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <section className="panel empty-state">
        <span className="spinner" />
        <strong>Carregando configurações...</strong>
      </section>
    );

  return (
    <div className="settings-page">
      {/* BANNER DE ASSISTENTE DE CONFIGURAÇÃO RÁPIDA */}
      <div className="wizard-banner-card">
        <div className="wizard-banner-text">
          <div className="wizard-icon-badge">
            <Sparkles size={22} />
          </div>
          <div>
            <strong>Assistente de Configuração do Consultório</strong>
            <span>Preencha seus dados, valores e e-mails guiados passo a passo.</span>
          </div>
        </div>
        <button
          type="button"
          className="wizard-banner-btn"
          onClick={() => setWizardOpen(true)}
        >
          <Sparkles size={16} /> Iniciar Assistente
        </button>
      </div>

      <SetupWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCompleted={() => {
          loadSettings();
          setNotice("Consultório configurado com sucesso pelo assistente!");
        }}
      />

      {error && <div className="form-error">{error}</div>}
      {notice && (
        <div className="form-success">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      )}

      {/* ABAS DE NAVEGAÇÃO DE CONFIGURAÇÕES */}
      <div className="settings-nav-tabs">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "CLINIC" ? "active" : ""}`}
          onClick={() => setActiveTab("CLINIC")}
        >
          <Stethoscope size={16} />
          <span>Meu Consultório</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "PRICING" ? "active" : ""}`}
          onClick={() => setActiveTab("PRICING")}
        >
          <DollarSign size={16} />
          <span>Valores & Sessões</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "MESSAGES" ? "active" : ""}`}
          onClick={() => setActiveTab("MESSAGES")}
        >
          <MessageCircle size={16} />
          <span>Mensagens WhatsApp</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "EMAIL" ? "active" : ""}`}
          onClick={() => setActiveTab("EMAIL")}
        >
          <Mail size={16} />
          <span>E-mails (Gmail)</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "SECURITY" ? "active" : ""}`}
          onClick={() => setActiveTab("SECURITY")}
        >
          <LockKeyhole size={16} />
          <span>Minha Senha</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn support-tab ${activeTab === "SUPPORT" ? "active" : ""}`}
          onClick={() => setActiveTab("SUPPORT")}
          title="Painel de Infraestrutura e Diagnóstico Técnico"
        >
          <Wrench size={16} />
          <span>Suporte Técnico</span>
        </button>
      </div>

      {/* ── ABA 1: IDENTIDADE PROFISSIONAL ── */}
      {activeTab === "CLINIC" && (
        <form onSubmit={save}>
          <section className="panel settings-section">
            <header>
              <Stethoscope />
              <div>
                <h2>Identidade do Consultório</h2>
                <p>Dados que aparecem nos planos alimentares, laudos em PDF e no Portal do Paciente.</p>
              </div>
            </header>
            <div className="settings-grid">
              <label>
                Nome Completo da Nutricionista *
                <input
                  value={form.professionalName}
                  onChange={(e) => set("professionalName", e.target.value)}
                  onBlur={() => set("professionalName", capitalizePersonName(form.professionalName))}
                  required
                />
              </label>
              <label>
                Registro Profissional (CRN) *
                <input
                  value={form.crn}
                  onChange={(e) => set("crn", e.target.value)}
                  required
                />
              </label>
              <label>
                Nome da Clínica / Consultório
                <input
                  value={form.clinicName}
                  onChange={(e) => set("clinicName", e.target.value)}
                />
              </label>
              <label>
                Especialidade Principal
                <input
                  value={form.specialty}
                  onChange={(e) => set("specialty", e.target.value)}
                  placeholder="Ex: Nutrição Esportiva e Clínica"
                />
              </label>
              <label>
                WhatsApp de Atendimento
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="(11) 99999-8888"
                />
              </label>
              <label>
                E-mail de Contato
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="contato@consultorio.com"
                />
              </label>
              <label className="wide">
                Endereço do Consultório
                <input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Av. Paulista, 1000 - Sala 42"
                />
              </label>
              <label>
                Cidade / Estado
                <input
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="São Paulo - SP"
                />
              </label>
              <label>
                URL do Logotipo (Opcional)
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => set("logoUrl", e.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>
          </section>

          <button className="primary-button settings-save" disabled={saving}>
            <Save size={18} />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </form>
      )}

      {/* ── ABA 2: CONSULTAS & VALORES ── */}
      {activeTab === "PRICING" && (
        <form onSubmit={save}>
          <section className="panel settings-section">
            <header>
              <Palette />
              <div>
                <h2>Valores e Padrões de Atendimento</h2>
                <p>Valores padrão sugeridos ao agendar novas consultas e rodapés oficiais.</p>
              </div>
            </header>
            <div className="settings-grid">
              <label>
                Valor Consulta Presencial (R$)
                <input
                  type="number"
                  min="0"
                  value={form.inPersonPrice}
                  onChange={(e) => set("inPersonPrice", Number(e.target.value))}
                />
              </label>
              <label>
                Valor Consulta Online / Teleconsulta (R$)
                <input
                  type="number"
                  min="0"
                  value={form.onlinePrice}
                  onChange={(e) => set("onlinePrice", Number(e.target.value))}
                />
              </label>
              <label>
                Duração Padrão da Consulta (minutos)
                <input
                  type="number"
                  min="15"
                  value={form.defaultDurationMinutes}
                  onChange={(e) =>
                    set("defaultDurationMinutes", Number(e.target.value))
                  }
                />
              </label>
              <label>
                Cor Principal do Sistema
                <div className="color-input">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)}
                  />
                  <input
                    value={form.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)}
                  />
                </div>
              </label>
              <label>
                Cor Secundária
                <div className="color-input">
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => set("secondaryColor", e.target.value)}
                  />
                  <input
                    value={form.secondaryColor}
                    onChange={(e) => set("secondaryColor", e.target.value)}
                  />
                </div>
              </label>
              <label className="wide">
                Texto do Rodapé nos Laudos & Prescrições A4
                <input
                  value={form.documentFooter}
                  onChange={(e) => set("documentFooter", e.target.value)}
                  placeholder="Ex: Documento emitido eletronicamente. Telefone: (11) 99999-8888"
                />
              </label>
            </div>
          </section>

          <button className="primary-button settings-save" disabled={saving}>
            <Save size={18} />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </form>
      )}

      {/* ── ABA 3: MENSAGENS WHATSAPP & MODELOS ── */}
      {activeTab === "MESSAGES" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <form onSubmit={save}>
            <section className="panel settings-section">
              <header>
                <MessageCircle />
                <div>
                  <h2>Modelos de Mensagem do Consultório</h2>
                  <p>
                    Personalize os textos automáticos enviados aos pacientes via WhatsApp e e-mail.
                  </p>
                </div>
              </header>

              {/* CHIPS DE VARIÁVEIS DISPONÍVEIS */}
              <div className="message-tags-banner">
                <span className="tags-title">📌 Variáveis dinâmicas para usar nos textos (clique para copiar):</span>
                <div className="tags-chips-list">
                  {[
                    { tag: "{NOME}", label: "Nome do Paciente" },
                    { tag: "{DATA}", label: "Data da Consulta" },
                    { tag: "{HORA}", label: "Horário da Consulta" },
                    { tag: "{LINK_CHAMADA}", label: "Link da Videochamada / Teleconsulta" },
                    { tag: "{LINK_PORTAL}", label: "Link do Portal do Paciente" },
                  ].map(({ tag, label }) => (
                    <button
                      key={tag}
                      type="button"
                      className="tag-chip-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(tag);
                        setNotice(`Tag ${tag} copiada! Cole no texto.`);
                        setTimeout(() => setNotice(""), 3000);
                      }}
                      title={`Copiar ${tag}`}
                    >
                      <code>{tag}</code>
                      <small>{label}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-grid" style={{ marginTop: 16 }}>
                {/* TEMPLATE 1: LEMBRETE DE CONSULTA */}
                <div className="message-card-block" style={{ gridColumn: "1 / -1" }}>
                  <div className="message-block-header">
                    <strong>📅 Lembrete / Confirmação de Consulta (Presencial & Online)</strong>
                    <div className="preset-quick-btns">
                      <button
                        type="button"
                        className="preset-pill-btn"
                        onClick={() =>
                          set(
                            "reminderMessage",
                            "Olá, {NOME}! 🎥 Sua teleconsulta nutricional está confirmada para {DATA} às {HORA}. Acesse a sala virtual da nossa chamada no link: {LINK_CHAMADA}. Até já!"
                          )
                        }
                        title="Modelo específico para consultas online com link da sala"
                      >
                        🎥 Teleconsulta (com Link da Sala)
                      </button>
                      <button
                        type="button"
                        className="preset-pill-btn"
                        onClick={() =>
                          set(
                            "reminderMessage",
                            "Olá, {NOME}! 🌿 Passando para lembrar da sua consulta nutricional amanhã, dia {DATA} às {HORA}. Caso precise remarcar, me avise com antecedência. Nos vemos em breve!"
                          )
                        }
                      >
                        Presencial Padrão
                      </button>
                      <button
                        type="button"
                        className="preset-pill-btn"
                        onClick={() =>
                          set(
                            "reminderMessage",
                            "Olá {NOME}, tudo bem? Confirmando sua consulta nutricional agendada para {DATA} às {HORA}. Por favor, confirme o recebimento desta mensagem. Abraços!"
                          )
                        }
                      >
                        Direto / Formal
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={form.reminderMessage}
                    onChange={(e) => set("reminderMessage", e.target.value)}
                    placeholder="Olá {NOME}, passando para confirmar sua consulta no dia {DATA} às {HORA}..."
                  />

                  {/* PRÉVIA ESTILO WHATSAPP */}
                  {form.reminderMessage && (
                    <div className="whatsapp-preview-wrap">
                      <span className="wa-preview-label">📱 Prévia de como o paciente receberá no WhatsApp:</span>
                      <div className="whatsapp-bubble">
                        <p>
                          {form.reminderMessage
                            .replace(/{NOME}/g, "Maria Clara")
                            .replace(/{DATA}/g, "24/08/2026")
                            .replace(/{HORA}/g, "15:30")}
                        </p>
                        <span className="wa-time">14:30 ✓✓</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* TEMPLATE 2: PÓS-CONSULTA & PLANO ALIMENTAR */}
                <div className="message-card-block" style={{ gridColumn: "1 / -1" }}>
                  <div className="message-block-header">
                    <strong>🥗 Mensagem Pós-Consulta (Envio de Plano Alimentar & Orientações)</strong>
                    <div className="preset-quick-btns">
                      <button
                        type="button"
                        className="preset-pill-btn"
                        onClick={() =>
                          set(
                            "followupMessage",
                            "Olá, {NOME}! 🥑 Foi excelente nossa consulta. Seu plano alimentar personalizado, metas e orientações já estão disponíveis no seu Portal do Paciente. Bom foco e qualquer dúvida estou por aqui!"
                          )
                        }
                      >
                        Carregar Sugestão Padrão
                      </button>
                      <button
                        type="button"
                        className="preset-pill-btn"
                        onClick={() =>
                          set(
                            "followupMessage",
                            "Olá {NOME}! Seu plano alimentar atualizado já foi liberado no portal. Lembre-se de registrar sua água e refeições no diário alimentar. Conte comigo para alcançar seus objetivos!"
                          )
                        }
                      >
                        Modelo com Incentivo ao Diário
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={form.followupMessage}
                    onChange={(e) => set("followupMessage", e.target.value)}
                    placeholder="Olá {NOME}, seu plano alimentar e orientações já estão disponíveis no Portal do Paciente!"
                  />

                  {/* PRÉVIA ESTILO WHATSAPP */}
                  {form.followupMessage && (
                    <div className="whatsapp-preview-wrap">
                      <span className="wa-preview-label">📱 Prévia de como o paciente receberá no WhatsApp:</span>
                      <div className="whatsapp-bubble">
                        <p>
                          {form.followupMessage
                            .replace(/{NOME}/g, "Maria Clara")
                            .replace(/{DATA}/g, "24/08/2026")
                            .replace(/{HORA}/g, "15:30")}
                        </p>
                        <span className="wa-time">16:45 ✓✓</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <button className="primary-button settings-save" disabled={saving} style={{ marginTop: 18 }}>
              <Save size={18} />
              {saving ? "Salvando..." : "Salvar Modelos de Mensagem"}
            </button>
          </form>
        </div>
      )}

      {/* ── ABA 4: E-MAILS & SMTP ── */}
      {activeTab === "EMAIL" && <SmtpSettings />}

      {/* ── ABA 5: MINHA SENHA ── */}
      {activeTab === "SECURITY" && (
        <form
          className="panel settings-section security-form"
          onSubmit={changePassword}
        >
          <header>
            <ShieldCheck />
            <div>
              <h2>Alterar Senha de Acesso</h2>
              <p>Escolha uma nova senha com pelo menos 12 caracteres.</p>
            </div>
          </header>
          <div className="settings-grid">
            <label>
              Senha Atual
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </label>
            <label>
              Nova Senha
              <PasswordInput
                minLength={12}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </label>
            <label>
              Confirmar Nova Senha
              <PasswordInput
                minLength={12}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </label>
          </div>
          <button className="secondary-button" style={{ marginTop: 16 }}>
            <LockKeyhole size={17} /> Salvar Nova Senha
          </button>
        </form>
      )}

      {/* ── ABA 6: SUPORTE TÉCNICO & DIAGNÓSTICO (ÁREA TÉCNICA) ── */}
      {activeTab === "SUPPORT" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="support-info-banner">
            <Wrench size={20} />
            <div>
              <strong>Área de Suporte & Diagnóstico de Infraestrutura</strong>
              <p>Esta área contém métricas de banco de dados, auditoria LGPD e logs operacionais para manutenção do sistema.</p>
            </div>
          </div>

          <ReadinessPanel />
          <IncidentPanel />
          <PrivacyRequestsPanel />
        </div>
      )}
    </div>
  );
}

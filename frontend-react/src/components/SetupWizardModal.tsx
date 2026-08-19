import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Mail,
  Palette,
  Phone,
  Rocket,
  Save,
  Send,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "../lib/api";

type WizardData = {
  clinicName: string;
  professionalName: string;
  crn: string;
  specialty: string;
  phone: string;
  email: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  inPersonPrice: number;
  onlinePrice: number;
  defaultDurationMinutes: number;
  // SMTP
  smtpEnabled: boolean;
  smtpUser: string;
  smtpPass: string;
};

const COLOR_PRESETS = [
  { name: "Verde Botânico (Padrão)", primary: "#203528", secondary: "#8ca481" },
  { name: "Terracota & Dourado", primary: "#2c1c18", secondary: "#c88d72" },
  { name: "Azul Clínico Sereno", primary: "#162836", secondary: "#63a3ca" },
  { name: "Lavanda & Eucalipto", primary: "#221d2e", secondary: "#9e91b8" },
  { name: "Esmeralda Vibrante", primary: "#0d2b1d", secondary: "#34d399" },
];

export function SetupWizardModal({
  isOpen,
  onClose,
  onCompleted,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const [data, setData] = useState<WizardData>({
    clinicName: "",
    professionalName: "",
    crn: "",
    specialty: "Nutrição Clínica & Esportiva",
    phone: "",
    email: "",
    city: "",
    primaryColor: "#203528",
    secondaryColor: "#8ca481",
    inPersonPrice: 280,
    onlinePrice: 250,
    defaultDurationMinutes: 60,
    smtpEnabled: false,
    smtpUser: "",
    smtpPass: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    api<{ data: any }>("/api/settings")
      .then((r) => {
        if (r.data) {
          setData((prev) => ({
            ...prev,
            clinicName: r.data.clinicName || "",
            professionalName: r.data.professionalName || "",
            crn: r.data.crn || "",
            specialty: r.data.specialty || "Nutrição Clínica & Esportiva",
            phone: r.data.phone || "",
            email: r.data.email || "",
            city: r.data.city || "",
            primaryColor: r.data.primaryColor || "#203528",
            secondaryColor: r.data.secondaryColor || "#8ca481",
            inPersonPrice: r.data.inPersonPrice || 280,
            onlinePrice: r.data.onlinePrice || 250,
            defaultDurationMinutes: r.data.defaultDurationMinutes || 60,
          }));
        }
      })
      .catch(() => {});

    api<{ data: any }>("/api/settings/smtp")
      .then((r) => {
        if (r.data) {
          setData((prev) => ({
            ...prev,
            smtpEnabled: Boolean(r.data.enabled),
            smtpUser: r.data.user || "",
          }));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleFinish() {
    setSaving(true);
    setError("");
    try {
      // 1. Salvar configurações principais
      await api("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          clinicName: data.clinicName || data.professionalName,
          professionalName: data.professionalName,
          crn: data.crn,
          specialty: data.specialty,
          phone: data.phone || undefined,
          email: data.email || undefined,
          city: data.city || undefined,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          inPersonPrice: Number(data.inPersonPrice),
          onlinePrice: Number(data.onlinePrice),
          defaultDurationMinutes: Number(data.defaultDurationMinutes),
        }),
      });

      // 2. Salvar SMTP se preenchido
      if (data.smtpEnabled && data.smtpUser && data.smtpPass) {
        await api("/api/settings/smtp", {
          method: "PUT",
          body: JSON.stringify({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            user: data.smtpUser,
            password: data.smtpPass.replace(/\s+/g, ""),
            from: `${data.professionalName || data.clinicName} <${data.smtpUser}>`,
            enabled: true,
          }),
        });
      }

      window.dispatchEvent(new CustomEvent("clinic-settings-updated"));
      onCompleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar assistente.");
    } finally {
      setSaving(false);
    }
  }

  async function testEmail() {
    if (!data.smtpUser || !data.smtpPass) {
      setError("Preencha o e-mail do Gmail e a Senha de App antes de testar.");
      return;
    }
    setTestingEmail(true);
    setError("");
    setTestEmailSuccess(false);
    try {
      // Salvar temporariamente para testar
      await api("/api/settings/smtp", {
        method: "PUT",
        body: JSON.stringify({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          user: data.smtpUser,
          password: data.smtpPass.replace(/\s+/g, ""),
          from: `${data.professionalName || data.clinicName || "Consultório"} <${data.smtpUser}>`,
          enabled: true,
        }),
      });

      await api("/api/settings/smtp/test", {
        method: "POST",
        body: JSON.stringify({ to: data.smtpUser }),
      });

      setTestEmailSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar e-mail de teste. Verifique a senha de app.");
    } finally {
      setTestingEmail(false);
    }
  }

  return (
    <div className="setup-wizard-backdrop" onClick={onClose}>
      <div className="setup-wizard-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER DO WIZARD */}
        <header className="setup-wizard-header">
          <div className="wizard-title-wrap">
            <div className="wizard-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>Assistente de Configuração do Consultório</h3>
              <p>Configure seu espaço clínico em menos de 2 minutos</p>
            </div>
          </div>
          <button className="wizard-close-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        {/* STEPPER PROGRESS */}
        <div className="wizard-stepper">
          <div className={`stepper-item ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
            <span className="stepper-bubble">{step > 1 ? <Check size={14} /> : "1"}</span>
            <span className="stepper-label">Identidade & Marca</span>
          </div>
          <div className="stepper-line" />
          <div className={`stepper-item ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
            <span className="stepper-bubble">{step > 2 ? <Check size={14} /> : "2"}</span>
            <span className="stepper-label">Consultas & Valores</span>
          </div>
          <div className="stepper-line" />
          <div className={`stepper-item ${step >= 3 ? "active" : ""} ${step > 3 ? "completed" : ""}`}>
            <span className="stepper-bubble">{step > 3 ? <Check size={14} /> : "3"}</span>
            <span className="stepper-label">E-mails & Avisos</span>
          </div>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <div className="wizard-body">
          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          {/* ── PASSO 1: IDENTIDADE ── */}
          {step === 1 && (
            <div className="wizard-step-content">
              <div className="wizard-step-intro">
                <Stethoscope size={22} className="intro-icon" />
                <div>
                  <h4>Seus Dados Profissionais</h4>
                  <p>Essas informações aparecerão automaticamente nos seus atestados, planos alimentares e no portal do paciente.</p>
                </div>
              </div>

              <div className="wizard-form-grid">
                <label>
                  Nome Completo da Nutricionista *
                  <input
                    type="text"
                    placeholder="Ex: Dra. Ana Beatriz Ferreira"
                    value={data.professionalName}
                    onChange={(e) => setData({ ...data, professionalName: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Número do CRN *
                  <input
                    type="text"
                    placeholder="Ex: CRN-3 12345"
                    value={data.crn}
                    onChange={(e) => setData({ ...data, crn: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Nome do Consultório / Marca
                  <input
                    type="text"
                    placeholder="Ex: Consultório Ana Ferreira Nutrição"
                    value={data.clinicName}
                    onChange={(e) => setData({ ...data, clinicName: e.target.value })}
                  />
                </label>

                <label>
                  Especialidade / Foco Clínico
                  <input
                    type="text"
                    placeholder="Ex: Nutrição Esportiva, Emagrecimento, Saúde da Mulher"
                    value={data.specialty}
                    onChange={(e) => setData({ ...data, specialty: e.target.value })}
                  />
                </label>

                <label>
                  Cidade / Estado
                  <input
                    type="text"
                    placeholder="Ex: São Paulo - SP"
                    value={data.city}
                    onChange={(e) => setData({ ...data, city: e.target.value })}
                  />
                </label>
              </div>

              <div className="preset-palettes-box">
                <span className="preset-title">
                  <Palette size={14} /> Paleta de Cores do Consultório:
                </span>
                <div className="preset-chips">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.name}
                      className={`preset-chip ${data.primaryColor === preset.primary ? "active" : ""}`}
                      onClick={() => setData({ ...data, primaryColor: preset.primary, secondaryColor: preset.secondary })}
                    >
                      <span className="color-dot" style={{ background: preset.primary }} />
                      <span className="color-dot" style={{ background: preset.secondary }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PASSO 2: CONSULTAS & VALORES ── */}
          {step === 2 && (
            <div className="wizard-step-content">
              <div className="wizard-step-intro">
                <Phone size={22} className="intro-icon" />
                <div>
                  <h4>Formato de Atendimento & Preços</h4>
                  <p>Configure os valores padrão das suas consultas e seu WhatsApp para os pacientes tirarem dúvidas.</p>
                </div>
              </div>

              <div className="wizard-form-grid">
                <label>
                  WhatsApp do Consultório
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-8888"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                  />
                  <small className="field-hint">Usado para agendamentos rápidos via WhatsApp.</small>
                </label>

                <label>
                  Duração Padrão da Consulta
                  <select
                    value={data.defaultDurationMinutes}
                    onChange={(e) => setData({ ...data, defaultDurationMinutes: Number(e.target.value) })}
                  >
                    <option value={45}>45 minutos</option>
                    <option value={50}>50 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={90}>90 minutos (1h 30min)</option>
                  </select>
                </label>

                <label>
                  Valor da Consulta Presencial (R$)
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="Ex: 280"
                    value={data.inPersonPrice}
                    onChange={(e) => setData({ ...data, inPersonPrice: Number(e.target.value) })}
                  />
                </label>

                <label>
                  Valor da Teleconsulta Online (R$)
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="Ex: 250"
                    value={data.onlinePrice}
                    onChange={(e) => setData({ ...data, onlinePrice: Number(e.target.value) })}
                  />
                </label>
              </div>

              <div className="wizard-tip-box">
                <strong>💡 Dica do Sistema:</strong> A teleconsulta com câmera HD ponta a ponta (WebRTC) já está 100% ativa no seu sistema, sem você precisar pagar nada por servidores de vídeo.
              </div>
            </div>
          )}

          {/* ── PASSO 3: E-MAILS & SMTP ── */}
          {step === 3 && (
            <div className="wizard-step-content">
              <div className="wizard-step-intro">
                <Mail size={22} className="intro-icon" />
                <div>
                  <h4>Envio de E-mails Automáticos</h4>
                  <p>Envie confirmações de consulta, lembretes e link do portal aos pacientes direto pelo seu Gmail (100% gratuito).</p>
                </div>
              </div>

              <div className="wizard-form-grid">
                <label className="wide">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      id="checkSmtp"
                      checked={data.smtpEnabled}
                      onChange={(e) => setData({ ...data, smtpEnabled: e.target.checked })}
                      style={{ width: "auto" }}
                    />
                    <strong style={{ cursor: "pointer" }} onClick={() => setData({ ...data, smtpEnabled: !data.smtpEnabled })}>
                      Ativar envio automático de e-mails via Gmail
                    </strong>
                  </div>
                </label>

                {data.smtpEnabled && (
                  <>
                    <label>
                      Seu E-mail Gmail
                      <input
                        type="email"
                        placeholder="seunome@gmail.com"
                        value={data.smtpUser}
                        onChange={(e) => setData({ ...data, smtpUser: e.target.value })}
                      />
                    </label>

                    <label>
                      Senha de App do Google (16 letras)
                      <input
                        type="password"
                        placeholder="ex: abcd efgh ijkl mnop"
                        value={data.smtpPass}
                        onChange={(e) => setData({ ...data, smtpPass: e.target.value })}
                      />
                    </label>

                    <div className="smtp-guide-banner">
                      <strong>Como pegar a Senha de App no Google (1 minuto):</strong>
                      <ol>
                        <li>Acesse sua conta Google em <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">myaccount.google.com/apppasswords <ExternalLink size={12} /></a></li>
                        <li>Digite o nome <em>"Consultório Nutricional"</em> e clique em <strong>Criar</strong>.</li>
                        <li>Copie o código amarelo de 16 letras gerado e cole no campo acima!</li>
                      </ol>
                    </div>

                    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={testEmail}
                        disabled={testingEmail || !data.smtpUser || !data.smtpPass}
                        style={{ fontSize: "0.82rem", padding: "8px 14px" }}
                      >
                        <Send size={14} /> {testingEmail ? "Enviando teste..." : "Testar E-mail Agora"}
                      </button>
                      {testEmailSuccess && (
                        <span style={{ color: "#34d399", fontSize: "0.82rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 size={16} /> E-mail de teste enviado com sucesso!
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {!data.smtpEnabled && (
                <div className="wizard-tip-box" style={{ background: "rgba(140,164,129,0.08)", borderColor: "rgba(140,164,129,0.2)" }}>
                  Você pode pular esta etapa e ativar os e-mails mais tarde a qualquer momento na aba <strong>Configurações</strong>.
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER COM BOTÕES DE NAVEGAÇÃO */}
        <footer className="setup-wizard-footer">
          {step > 1 ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setStep(step - 1)}
              disabled={saving}
            >
              <ChevronLeft size={16} /> Voltar
            </button>
          ) : (
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            {step < 3 ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (step === 1 && !data.professionalName) {
                    setError("Informe o nome da nutricionista para continuar.");
                    return;
                  }
                  setError("");
                  setStep(step + 1);
                }}
              >
                Próximo Passo <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={handleFinish}
                disabled={saving}
                style={{ background: "#2563eb", borderColor: "#2563eb" }}
              >
                <Rocket size={16} /> {saving ? "Salvando..." : "Concluir e Abrir Consultório"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

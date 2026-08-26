import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  Image as ImageIcon,
  MapPin,
  Palette,
  Phone,
  Rocket,
  Send,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { capitalizePersonName } from "../lib/formatters";
import { addressLine, formatPostalCode, lookupPostalCode } from "../lib/postalCode";
import { useConfirm } from "./ConfirmDialog";

type WizardData = {
  clinicName: string;
  professionalName: string;
  crn: string;
  specialty: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  logoUrl: string;
  portraitUrl: string;
  fullBodyUrl: string;
  consultationImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  inPersonPrice: number;
  onlinePrice: number;
  defaultDurationMinutes: number;
  reminderMessage: string;
  followupMessage: string;
  documentFooter: string;
  // SMTP
  smtpEnabled: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpPasswordConfigured: boolean;
};

const COLOR_PRESETS = [
  { name: "Verde Botânico (Padrão)", primary: "#203528", secondary: "#8ca481" },
  { name: "Terracota & Dourado", primary: "#2c1c18", secondary: "#c88d72" },
  { name: "Azul Clínico Sereno", primary: "#162836", secondary: "#63a3ca" },
  { name: "Lavanda & Eucalipto", primary: "#221d2e", secondary: "#9e91b8" },
  { name: "Esmeralda Vibrante", primary: "#0d2b1d", secondary: "#34d399" },
];
const comparable = (value: WizardData) => JSON.stringify({ ...value, smtpPass: undefined, hasDraftPassword: Boolean(value.smtpPass) });
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validOptionalUrl = (value: string) => !value.trim() || (() => { try { return new URL(value).protocol === "https:"; } catch { return false; } })();

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [lookingUpPostalCode, setLookingUpPostalCode] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState(false);
  const [error, setError] = useState("");
  const baselineRef = useRef("");
  const closeRequestRef = useRef<() => void>(() => undefined);
  const confirm = useConfirm();

  const [data, setData] = useState<WizardData>({
    clinicName: "",
    professionalName: "",
    crn: "",
    specialty: "Nutrição Clínica & Esportiva",
    phone: "",
    email: "",
    city: "",
    address: "",
    logoUrl: "",
    portraitUrl: "",
    fullBodyUrl: "",
    consultationImageUrl: "",
    primaryColor: "#203528",
    secondaryColor: "#8ca481",
    inPersonPrice: 280,
    onlinePrice: 250,
    defaultDurationMinutes: 60,
    reminderMessage: "Sua consulta está confirmada. Em caso de imprevisto, avise com antecedência.",
    followupMessage: "Olá! Como você está se adaptando às orientações combinadas na consulta?",
    documentFooter: "Documento emitido eletronicamente pelo consultório nutricional.",
    smtpEnabled: false,
    smtpUser: "",
    smtpPass: "",
    smtpPasswordConfigured: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    baselineRef.current = "";
    setStep(1); setError(""); setTestEmailSuccess(false); setLoading(true);
    Promise.all([
      api<{ data: Partial<WizardData> }>("/api/settings"),
      api<{ data: { enabled?: boolean; user?: string; passwordConfigured?: boolean } }>("/api/settings/smtp"),
    ]).then(([settings, smtp]) => {
      if (!active) return;
      setData((previous) => {
        const next: WizardData = {
          ...previous,
          ...settings.data,
          clinicName: settings.data.clinicName || "",
          professionalName: settings.data.professionalName || "",
          crn: settings.data.crn || "",
          specialty: settings.data.specialty || "Nutrição Clínica & Esportiva",
          phone: settings.data.phone || "",
          email: settings.data.email || "",
          city: settings.data.city || "",
          address: settings.data.address || "",
          logoUrl: settings.data.logoUrl || "",
          portraitUrl: settings.data.portraitUrl || "",
          fullBodyUrl: settings.data.fullBodyUrl || "",
          consultationImageUrl: settings.data.consultationImageUrl || "",
          inPersonPrice: settings.data.inPersonPrice ?? 280,
          onlinePrice: settings.data.onlinePrice ?? 250,
          defaultDurationMinutes: settings.data.defaultDurationMinutes ?? 60,
          smtpEnabled: Boolean(smtp.data?.enabled),
          smtpUser: smtp.data?.user || "",
          smtpPass: "",
          smtpPasswordConfigured: Boolean(smtp.data?.passwordConfigured),
        };
        baselineRef.current = comparable(next);
        return next;
      });
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as configurações atuais.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRequestRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const dirty = Boolean(baselineRef.current) && comparable(data) !== baselineRef.current;
  async function requestClose() {
    if (saving || testingEmail) return;
    if (dirty && !(await confirm({ title: "Sair sem salvar?", message: "As alterações feitas no assistente serão descartadas.", confirmLabel: "Descartar alterações", tone: "warning" }))) return;
    setData((current) => ({ ...current, smtpPass: "" }));
    onClose();
  }
  closeRequestRef.current = () => { void requestClose(); };

  function validateStep(target = step) {
    if (target === 1) {
      if (data.professionalName.trim().length < 2) return "Informe o nome completo da nutricionista.";
      if (data.crn.trim().length < 2) return "Informe o número do CRN.";
      if (!data.specialty.trim()) return "Informe a especialidade ou foco clínico.";
      if (data.email && !validEmail(data.email)) return "Informe um e-mail profissional válido.";
      if (![data.logoUrl, data.portraitUrl, data.fullBodyUrl, data.consultationImageUrl].every(validOptionalUrl)) return "As imagens devem usar endereços HTTPS válidos.";
    }
    if (target === 2) {
      if (data.inPersonPrice < 0 || data.onlinePrice < 0) return "Os valores das consultas não podem ser negativos.";
      if (data.defaultDurationMinutes < 15) return "A duração da consulta deve ser de pelo menos 15 minutos.";
    }
    if (target === 3 && data.smtpEnabled) {
      if (!validEmail(data.smtpUser)) return "Informe o e-mail que será usado nos envios.";
      if (!data.smtpPass && !data.smtpPasswordConfigured) return "Informe a senha de aplicativo para ativar os e-mails.";
    }
    return "";
  }

  async function fillAddressFromPostalCode() {
    setLookingUpPostalCode(true);
    setError("");
    try {
      const { data: address } = await lookupPostalCode(postalCode);
      setData((current) => ({
        ...current,
        address: addressLine(address) || current.address,
        city: `${address.city} - ${address.state}`,
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível consultar o CEP.");
    } finally {
      setLookingUpPostalCode(false);
    }
  }

  async function handleFinish() {
    const validationError = validateStep(1) || validateStep(2) || validateStep(3);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError("");
    try {
      const profName = capitalizePersonName(data.professionalName);
      // 1. Salvar configurações principais
      await api("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          clinicName: data.clinicName || profName,
          professionalName: profName,
          crn: data.crn,
          specialty: data.specialty,
          phone: data.phone || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          city: data.city || undefined,
          logoUrl: data.logoUrl || undefined,
          portraitUrl: data.portraitUrl || undefined,
          fullBodyUrl: data.fullBodyUrl || undefined,
          consultationImageUrl: data.consultationImageUrl || undefined,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          inPersonPrice: Number(data.inPersonPrice),
          onlinePrice: Number(data.onlinePrice),
          defaultDurationMinutes: Number(data.defaultDurationMinutes),
          reminderMessage: data.reminderMessage,
          followupMessage: data.followupMessage,
          documentFooter: data.documentFooter,
        }),
      });

      // 2. Atualizar SMTP preservando a senha já configurada quando não houver uma nova.
      if (data.smtpUser && (data.smtpPasswordConfigured || data.smtpPass)) {
        const cleanEmail = data.smtpUser.trim().toLowerCase();
        const cleanPass = data.smtpPass.replace(/\s+/g, "");
        await api("/api/settings/smtp", {
          method: "PUT",
          body: JSON.stringify({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            user: cleanEmail,
            password: cleanPass || undefined,
            from: `${profName || "Consultório"} <${cleanEmail}>`,
            enabled: data.smtpEnabled,
          }),
        });
      }

      window.dispatchEvent(new CustomEvent("clinic-settings-updated"));
      baselineRef.current = comparable({ ...data, professionalName: profName, smtpPass: "", smtpPasswordConfigured: data.smtpPasswordConfigured || Boolean(data.smtpPass) });
      setData((current) => ({ ...current, professionalName: profName, smtpPass: "", smtpPasswordConfigured: current.smtpPasswordConfigured || Boolean(current.smtpPass) }));
      onCompleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar assistente.");
    } finally {
      setSaving(false);
    }
  }

  async function testEmail() {
    const cleanEmail = data.smtpUser.trim().toLowerCase();
    const cleanPass = data.smtpPass.replace(/\s+/g, "");
    if (!validEmail(cleanEmail) || (!cleanPass && !data.smtpPasswordConfigured)) {
      setError("Informe um e-mail válido e uma senha de aplicativo antes de testar.");
      return;
    }
    setTestingEmail(true);
    setError("");
    setTestEmailSuccess(false);
    try {
      const endpoint = cleanPass ? "/api/settings/smtp/test-draft" : "/api/settings/smtp/test";
      await api<{ message: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify(cleanPass ? {
          host: "smtp.gmail.com", port: 587, secure: false, user: cleanEmail, password: cleanPass,
          from: `${data.professionalName || data.clinicName || "Consultório"} <${cleanEmail}>`, to: cleanEmail,
        } : { to: cleanEmail }),
      });

      setTestEmailSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar e-mail de teste. Verifique se o e-mail e a senha de app de 16 letras estão corretos.");
    } finally {
      setTestingEmail(false);
    }
  }

  return (
    <div className="setup-wizard-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) void requestClose(); }}>
      <section className="setup-wizard-modal" role="dialog" aria-modal="true" aria-labelledby="setup-wizard-title" aria-busy={loading || saving} onMouseDown={(e) => e.stopPropagation()}>
        {/* HEADER DO WIZARD */}
        <header className="setup-wizard-header">
          <div className="wizard-title-wrap">
            <div className="wizard-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 id="setup-wizard-title">Assistente de Configuração do Consultório</h3>
              <p>Revise identidade, atendimento e comunicações com segurança</p>
            </div>
          </div>
          <button type="button" className="wizard-close-btn" onClick={() => void requestClose()} aria-label="Fechar assistente" autoFocus>
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
          {loading && <div className="wizard-loading" role="status"><span className="spinner"/><strong>Carregando configurações atuais...</strong></div>}
          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          {/* ── PASSO 1: IDENTIDADE ── */}
          {!loading && step === 1 && (
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
                  CEP
                  <span className="field-action-row">
                    <input inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={postalCode} onChange={(e) => setPostalCode(formatPostalCode(e.target.value))}/>
                    <button type="button" className="secondary-button" onClick={() => void fillAddressFromPostalCode()} disabled={lookingUpPostalCode || postalCode.replace(/\D/g, "").length !== 8}>
                      <MapPin size={15}/>{lookingUpPostalCode ? "Buscando..." : "Buscar"}
                    </button>
                  </span>
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

                <label>
                  E-mail profissional
                  <input type="email" placeholder="contato@consultorio.com.br" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
                </label>

                <label className="wide">
                  <span className="wizard-label-icon"><MapPin size={14}/> Endereço do consultório</span>
                  <input type="text" placeholder="Rua, número, complemento e bairro" value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} />
                </label>

                <details className="wizard-visual-details wide">
                  <summary><ImageIcon size={16}/> Logo e imagens da página pública <span>Opcional</span></summary>
                  <div className="wizard-visual-grid">
                    <label>Logotipo<input type="url" placeholder="https://.../logo.svg" value={data.logoUrl} onChange={(e) => setData({ ...data, logoUrl: e.target.value })}/></label>
                    <label>Foto principal<input type="url" placeholder="https://.../foto-principal.webp" value={data.portraitUrl} onChange={(e) => setData({ ...data, portraitUrl: e.target.value })}/></label>
                    <label>Foto da seção Sobre<input type="url" placeholder="https://.../foto-sobre.webp" value={data.fullBodyUrl} onChange={(e) => setData({ ...data, fullBodyUrl: e.target.value })}/></label>
                    <label>Foto da consulta<input type="url" placeholder="https://.../consulta.webp" value={data.consultationImageUrl} onChange={(e) => setData({ ...data, consultationImageUrl: e.target.value })}/></label>
                  </div>
                  <small>Use endereços HTTPS. Campos vazios mantêm as imagens padrão do sistema.</small>
                </details>
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
          {!loading && step === 2 && (
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
                <strong>Teleconsulta integrada:</strong> O sistema utiliza WebRTC para chamadas entre os participantes. A qualidade de áudio e vídeo depende da conexão e das permissões do dispositivo.
              </div>
            </div>
          )}

          {/* ── PASSO 3: E-MAILS & SMTP ── */}
          {!loading && step === 3 && (
            <div className="wizard-step-content">
              <div className="wizard-step-intro">
                <Mail size={22} className="intro-icon" />
                <div>
                  <h4>Envio de E-mails Automáticos</h4>
                  <p>Conecte uma conta de envio para confirmações, lembretes e orientações. O teste não armazena uma nova senha.</p>
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
                        onChange={(e) => { setTestEmailSuccess(false); setData({ ...data, smtpUser: e.target.value }); }}
                      />
                    </label>

                    <label>
                      Senha de App do Google (16 letras)
                      <input
                        type="password"
                        placeholder={data.smtpPasswordConfigured ? "Senha já protegida · preencha somente para trocar" : "ex: abcd efgh ijkl mnop"}
                        value={data.smtpPass}
                        onChange={(e) => { setTestEmailSuccess(false); setData({ ...data, smtpPass: e.target.value }); }}
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
                      disabled={testingEmail || !data.smtpUser || (!data.smtpPass && !data.smtpPasswordConfigured)}
                        style={{ fontSize: "0.82rem", padding: "8px 14px" }}
                      >
                        <Send size={14} /> {testingEmail ? "Enviando teste..." : "Testar conexão"}
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
            <button type="button" className="ghost-button" onClick={() => void requestClose()}>
              Cancelar
            </button>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            {step < 3 ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  const validationError = validateStep(step);
                  if (validationError) { setError(validationError); return; }
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
      </section>
    </div>
  );
}

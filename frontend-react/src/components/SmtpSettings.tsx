import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Save,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlink,
  UserCheck,
  Video,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { PasswordInput } from "./PasswordInput";

type Smtp = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  enabled: boolean;
  passwordConfigured: boolean;
};

const initial: Smtp = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  user: "",
  from: "",
  enabled: false,
  passwordConfigured: false,
};

type EmailTemplateKey =
  | "INVITATION"
  | "APPOINTMENT_IN_PERSON"
  | "APPOINTMENT_ONLINE"
  | "REMINDER"
  | "RESCHEDULE"
  | "PASSWORD_RESET"
  | "PRIVACY_ALERT";

export function SmtpSettings() {
  const [form, setForm] = useState(initial);
  const [password, setPassword] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplateKey>("INVITATION");

  const loadSmtp = () => {
    api<{ data: Smtp }>("/api/settings/smtp")
      .then((r) => {
        if (r.data && r.data.user) {
          setForm({ ...initial, ...r.data });
          setTestEmail(r.data.user || r.data.from || "");
        } else {
          setForm(initial);
        }
      })
      .catch((c) =>
        setError(c instanceof Error ? c.message : "Erro ao carregar SMTP.")
      );
  };

  useEffect(() => {
    loadSmtp();
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const cleanUser = form.user.trim().toLowerCase();
      const cleanFrom = form.from.trim() || cleanUser;
      const cleanPass = password ? password.replace(/\s+/g, "") : undefined;

      const r = await api<{ message: string }>("/api/settings/smtp", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          user: cleanUser,
          from: cleanFrom,
          password: cleanPass,
        }),
      });
      setMessage(r.message);
      setPassword("");
      setForm((x) => ({
        ...x,
        passwordConfigured: x.passwordConfigured || Boolean(cleanPass),
      }));
    } catch (c) {
      setError(c instanceof Error ? c.message : "Não foi possível salvar o SMTP.");
    } finally {
      setBusy(false);
    }
  }

  async function removeSmtp() {
    if (
      !window.confirm(
        "Tem certeza que deseja desconectar o e-mail do consultório? Os envios automáticos de confirmação ficarão desativados até você reconectar."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await api<{ message: string }>("/api/settings/smtp", {
        method: "DELETE",
      });
      setMessage(r.message);
      setForm(initial);
      setPassword("");
      setTestEmail("");
    } catch (c) {
      setError(
        c instanceof Error ? c.message : "Erro ao desconectar e-mail."
      );
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (!testEmail) {
      setError("Informe o e-mail para envio de teste.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await api<{ message: string }>("/api/settings/smtp/test", {
        method: "POST",
        body: JSON.stringify({ to: testEmail.trim().toLowerCase() }),
      });
      setMessage(r.message);
    } catch (c) {
      setError(c instanceof Error ? c.message : "Falha no teste de envio.");
    } finally {
      setBusy(false);
    }
  }

  // DEFINIÇÃO DOS TEMPLATES PARA PRÉ-VISUALIZAÇÃO
  const templates: Record<
    EmailTemplateKey,
    {
      title: string;
      icon: React.ReactNode;
      subject: string;
      tag: string;
      preheader: string;
      body: React.ReactNode;
      btnText?: string;
      btnLink?: string;
    }
  > = {
    INVITATION: {
      title: "Convite & Ativação do Portal",
      icon: <UserCheck size={16} />,
      tag: "Ao liberar acesso a novo paciente",
      subject: "Ative seu acesso — Portal Nutricional",
      preheader: "Você recebeu acesso ao seu portal de acompanhamento nutricional.",
      body: (
        <>
          <p>Olá, <strong>Maria Clara Souza</strong>!</p>
          <p>
            Você recebeu acesso exclusivo ao seu <strong>Portal do Paciente</strong>.
            Por lá você poderá acompanhar seu plano alimentar atualizado, registrar suas
            refeições no diário, consultar laudos, receitas e metas clínicas.
          </p>
          <p>
            Para criar sua senha de acesso e ativar sua conta, clique no botão abaixo:
          </p>
        </>
      ),
      btnText: "Definir Minha Senha e Acessar",
      btnLink: "#",
    },
    APPOINTMENT_IN_PERSON: {
      title: "Confirmação de Consulta Presencial",
      icon: <Calendar size={16} />,
      tag: "Ao criar consulta presencial na Agenda",
      subject: "Consulta nutricional agendada · 24 de Agosto às 15:00",
      preheader: "Sua consulta presencial foi confirmada com sucesso.",
      body: (
        <>
          <p>Olá, <strong>Maria Clara Souza</strong>!</p>
          <p>Sua consulta nutricional presencial está confirmada com os seguintes dados:</p>
          <div className="email-details-card">
            <div><strong>📅 Data:</strong> 24 de Agosto de 2026</div>
            <div><strong>⏰ Horário:</strong> 15:00</div>
            <div><strong>🏥 Modalidade:</strong> Consulta Presencial</div>
            <div><strong>⏱️ Duração:</strong> 60 minutos</div>
            <div><strong>📍 Endereço:</strong> Av. Paulista, 1000 - Sala 42, São Paulo - SP</div>
          </div>
          <p>Caso necessite remarcar, solicitamos aviso prévio com 24h de antecedência.</p>
        </>
      ),
      btnText: "Acessar Meus Agendamentos",
      btnLink: "#",
    },
    APPOINTMENT_ONLINE: {
      title: "Confirmação de Teleconsulta (Online)",
      icon: <Video size={16} />,
      tag: "Ao agendar consulta online",
      subject: "🎥 Teleconsulta confirmada + Link da Sala Virtual · 24 de Agosto às 15:00",
      preheader: "Seu link exclusivo para a chamada de vídeo está disponível.",
      body: (
        <>
          <p>Olá, <strong>Maria Clara Souza</strong>!</p>
          <p>Sua <strong>teleconsulta nutricional online</strong> está confirmada!</p>
          <div className="email-details-card highlight">
            <div><strong>📅 Data:</strong> 24 de Agosto de 2026 às 15:00</div>
            <div><strong>🎥 Sala Virtual:</strong> Link exclusivo com câmera e microfone</div>
            <div><strong>💡 Dica:</strong> Conecte-se 5 minutos antes em local silencioso com fones de ouvido.</div>
          </div>
          <p>Clique no botão abaixo no horário da sua consulta para entrar na sala virtual:</p>
        </>
      ),
      btnText: "Entrar na Videochamada da Consulta",
      btnLink: "#",
    },
    REMINDER: {
      title: "Lembrete de Consulta (Véspera)",
      icon: <Clock size={16} />,
      tag: "24h antes da consulta",
      subject: "Lembrete: sua consulta nutricional é amanhã às 15:00",
      preheader: "Passando para lembrar do seu horário nutricional.",
      body: (
        <>
          <p>Olá, <strong>Maria Clara Souza</strong>!</p>
          <p>
            Lembramos que sua consulta nutricional está agendada para <strong>amanhã, 24 de Agosto às 15:00</strong>.
          </p>
          <p>
            Por favor, lembre-se de trazer seus exames laboratoriais recentes e o registro dos últimos dias do diário alimentar.
          </p>
        </>
      ),
      btnText: "Confirmar Presença no Portal",
      btnLink: "#",
    },
    RESCHEDULE: {
      title: "Reagendamento ou Cancelamento",
      icon: <RefreshCw size={16} />,
      tag: "Ao alterar horário ou cancelar",
      subject: "Atualização no horário da sua consulta nutricional",
      preheader: "Houve uma alteração na data ou horário da sua consulta.",
      body: (
        <>
          <p>Olá, <strong>Maria Clara Souza</strong>!</p>
          <p>Informamos que sua consulta foi reagendada para o seguinte horário:</p>
          <div className="email-details-card">
            <div><strong>📅 Nova Data:</strong> 28 de Agosto de 2026</div>
            <div><strong>⏰ Novo Horário:</strong> 16:30</div>
            <div><strong>🏥 Modalidade:</strong> Consulta Presencial</div>
          </div>
          <p>Acesse o portal para confirmar sua disponibilidade na nova data.</p>
        </>
      ),
      btnText: "Ver Detalhes no Portal",
      btnLink: "#",
    },
    PASSWORD_RESET: {
      title: "Recuperação de Senha",
      icon: <Lock size={16} />,
      tag: "Ao clicar em 'Esqueci minha senha'",
      subject: "Redefinição de senha — Portal Nutricional",
      preheader: "Instruções para redefinir sua senha de acesso.",
      body: (
        <>
          <p>Olá!</p>
          <p>
            Recebemos uma solicitação para redefinir a senha da sua conta no Portal Nutricional.
          </p>
          <p>
            Este link é seguro e expira em <strong>30 minutos</strong> por motivos de segurança:
          </p>
        </>
      ),
      btnText: "Redefinir Minha Senha com Segurança",
      btnLink: "#",
    },
    PRIVACY_ALERT: {
      title: "Alerta de Privacidade LGPD (Para a Nutricionista)",
      icon: <ShieldAlert size={16} />,
      tag: "Quando um paciente pede exclusão/cópia",
      subject: "🚨 [LGPD] Nova Solicitação de Privacidade: Exclusão de Dados — Maria Clara Souza",
      preheader: "Uma nova solicitação legal foi registrada no portal.",
      body: (
        <>
          <p>Olá, <strong>Doutora</strong>!</p>
          <p>Uma nova solicitação de privacidade (LGPD) foi registrada por um paciente:</p>
          <div className="email-details-card">
            <div><strong>👤 Paciente:</strong> Maria Clara Souza (maria@email.com)</div>
            <div><strong>📋 Tipo de Pedido:</strong> Eliminação / Exclusão de Dados</div>
            <div><strong>📝 Detalhes:</strong> Paciente solicitou arquivamento de histórico.</div>
            <div><strong>⏱️ Data/Hora:</strong> 19/08/2026 às 14:20</div>
          </div>
          <p>Acesse a aba <em>Suporte Técnico &gt; Solicitações de Privacidade</em> para responder dentro do prazo legal.</p>
        </>
      ),
      btnText: "Revisar Solicitação no Painel",
      btnLink: "#",
    },
  };

  const currentTpl = templates[selectedTemplate];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── PAINEL DE CONFIGURAÇÃO SMTP ── */}
      <section className="panel settings-section smtp-settings">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Mail />
            <div>
              <h2>E-mails do Consultório (Gmail / SMTP)</h2>
              <p>Envie confirmações, lembretes de consulta e convites do Portal do Paciente.</p>
            </div>
          </div>

          {form.user && (
            <button
              type="button"
              className="secondary-button"
              onClick={removeSmtp}
              disabled={busy}
              style={{ color: "#b91c1c", borderColor: "#fecaca", background: "#fef2f2", fontSize: "0.8rem", padding: "6px 12px" }}
              title="Desconectar este e-mail do sistema"
            >
              <Unlink size={15} /> Desconectar E-mail
            </button>
          )}
        </header>

        {error && <div className="form-error">{error}</div>}
        {message && (
          <div className="form-success">
            <CheckCircle2 size={17} />
            {message}
          </div>
        )}

        <form onSubmit={save}>
          <div className="settings-grid">
            <label>
              Seu E-mail Gmail
              <input
                type="email"
                value={form.user}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    user: val,
                    from: form.from ? form.from : val,
                  });
                  if (!testEmail) setTestEmail(val);
                }}
                placeholder="seuemail@gmail.com"
                required
              />
            </label>

            <label>
              Senha de App do Google (16 letras)
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder={
                  form.passwordConfigured
                    ? "Senha protegida — deixe vazio para manter"
                    : "ex: abcd efgh ijkl mnop"
                }
                required={!form.passwordConfigured}
              />
            </label>

            <div className="smtp-guide-banner" style={{ gridColumn: "1 / -1" }}>
              <strong>Como pegar a Senha de App gratuita no Google (1 minuto):</strong>
              <ol>
                <li>
                  Acesse:{" "}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                  >
                    myaccount.google.com/apppasswords <ExternalLink size={12} />
                  </a>
                </li>
                <li>
                  Crie um app com o nome <em>"Consultório Nutricional"</em>.
                </li>
                <li>Copie a senha de 16 letras gerada e cole no campo acima.</li>
              </ol>
            </div>

            <label className="wide">
              Nome de Exibição / Remetente
              <input
                type="text"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                placeholder="Ex: Dra. Silvia Oliveira <consultorio@gmail.com>"
                required
              />
              <small style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 4 }}>
                Como seu nome aparecerá para os pacientes na caixa de entrada.
              </small>
            </label>

            {/* TOGGLE CONFIGURAÇÕES AVANÇADAS */}
            <div style={{ gridColumn: "1 / -1", margin: "4px 0" }}>
              <button
                type="button"
                className="text-link"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{ fontSize: "0.78rem" }}
              >
                {showAdvanced ? "Ocultar configurações avançadas de servidor" : "⚙️ Exibir configurações avançadas de servidor (Host / Porta / SSL)"}
              </button>
            </div>

            {showAdvanced && (
              <>
                <label>
                  Servidor SMTP (Host)
                  <input
                    value={form.host}
                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    required
                  />
                </label>

                <label>
                  Porta
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={form.port}
                    onChange={(e) =>
                      setForm({ ...form, port: Number(e.target.value) })
                    }
                    required
                  />
                </label>

                <label>
                  Segurança
                  <select
                    value={form.secure ? "ssl" : "starttls"}
                    onChange={(e) =>
                      setForm({ ...form, secure: e.target.value === "ssl" })
                    }
                  >
                    <option value="starttls">STARTTLS (Porta 587 - Padrão)</option>
                    <option value="ssl">SSL/TLS (Porta 465)</option>
                  </select>
                </label>
              </>
            )}

            <label className="smtp-toggle" style={{ gridColumn: "1 / -1" }}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              <span>
                <strong>Ativar envio de e-mails automáticos pelo consultório</strong>
                <small>Lembretes de consulta e convites do portal serão disparados por este e-mail.</small>
              </span>
            </label>
          </div>

          <div className="smtp-actions">
            <span>
              <ShieldCheck size={16} /> A senha é criptografada no banco e nunca é exposta.
            </span>
            <button className="primary-button" disabled={busy}>
              <Save size={16} /> {busy ? "Salvando..." : "Salvar E-mail"}
            </button>
          </div>
        </form>

        {form.user && (
          <div className="smtp-test" style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #f1f5f9" }}>
            <label style={{ flex: 1 }}>
              Testar Envio de E-mail
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              onClick={test}
              disabled={busy || !testEmail}
              style={{ alignSelf: "flex-end" }}
            >
              <Send size={15} /> {busy ? "Testando..." : "Enviar Teste"}
            </button>
          </div>
        )}
      </section>

      {/* ── PAINEL DE PRÉ-VISUALIZAÇÃO DE MODELOS DE E-MAILS ── */}
      <section className="panel email-templates-preview-section">
        <header className="email-preview-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="wizard-icon-badge" style={{ background: "#eef5f0", color: "#203528" }}>
              <Eye size={20} />
            </div>
            <div>
              <h3>Modelos de E-mails do Sistema</h3>
              <p>Veja como cada e-mail automático timbrado chega na caixa de entrada dos seus pacientes.</p>
            </div>
          </div>
        </header>

        <div className="email-templates-layout">
          {/* LISTA LATERAL DE TEMPLATES */}
          <div className="template-nav-list">
            {(Object.keys(templates) as EmailTemplateKey[]).map((key) => {
              const item = templates[key];
              const isSelected = selectedTemplate === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`template-nav-btn ${isSelected ? "active" : ""}`}
                  onClick={() => setSelectedTemplate(key)}
                >
                  <div className="tpl-icon">{item.icon}</div>
                  <div className="tpl-info">
                    <strong>{item.title}</strong>
                    <small>{item.tag}</small>
                  </div>
                </button>
              );
            })}
          </div>

          {/* SIMULADOR DE CAIXA DE ENTRADA (MOCKUP DE E-MAIL) */}
          <div className="email-inbox-mockup">
            <div className="inbox-window-header">
              <div className="window-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <span className="window-title">Caixa de Entrada · Visualização de E-mail</span>
            </div>

            <div className="email-meta-header">
              <div className="meta-line">
                <span className="meta-label">De:</span>
                <span className="meta-value from">{form.from || "Dra. Silvia Oliveira <consultorio@gmail.com>"}</span>
              </div>
              <div className="meta-line">
                <span className="meta-label">Para:</span>
                <span className="meta-value to">Maria Clara Souza &lt;maria.clara@exemplo.com&gt;</span>
              </div>
              <div className="meta-line">
                <span className="meta-label">Assunto:</span>
                <strong className="meta-value subject">{currentTpl.subject}</strong>
              </div>
            </div>

            {/* CORPO DO E-MAIL TIMBRADO */}
            <div className="email-body-render">
              <div className="email-brand-card">
                {/* CABEÇALHO DO E-MAIL */}
                <div className="email-brand-top">
                  <div className="email-logo-mark">
                    <svg viewBox="0 0 100 100" width="32" height="32">
                      <circle cx="50" cy="50" r="48" fill="#203528" stroke="#8ca481" strokeWidth="3" />
                      <path d="M 50 18 Q 72 40 50 82 Q 28 40 50 18 Z" fill="#8ca481" />
                      <path d="M 50 18 L 50 82" stroke="#203528" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <strong className="email-clinic-name">Consultório Nutricional</strong>
                    <span className="email-clinic-sub">Portal do Paciente & Atendimento Clínico</span>
                  </div>
                </div>

                {/* CONTEÚDO PRINCIPAL */}
                <div className="email-content-text">
                  {currentTpl.body}

                  {currentTpl.btnText && (
                    <div style={{ textAlign: "center", margin: "24px 0 16px" }}>
                      <a href={currentTpl.btnLink} className="email-action-cta" onClick={(e) => e.preventDefault()}>
                        {currentTpl.btnText}
                      </a>
                    </div>
                  )}
                </div>

                {/* RODAPÉ DO E-MAIL */}
                <div className="email-footer-sign">
                  <p>
                    Este é um e-mail automático do seu consultório de nutrição. Por favor, não responda diretamente a este e-mail.
                  </p>
                  <span>© 2026 Consultório Nutricional · Todos os direitos reservados.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

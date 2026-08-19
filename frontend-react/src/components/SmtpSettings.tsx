import {
  CheckCircle2,
  ExternalLink,
  Mail,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Unlink,
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

export function SmtpSettings() {
  const [form, setForm] = useState(initial);
  const [password, setPassword] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const isConfigured = form.enabled && form.user;

  return (
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
  );
}

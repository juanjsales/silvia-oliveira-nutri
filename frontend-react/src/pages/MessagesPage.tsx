import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api } from '../lib/api';

type Conversation = {
  patientId: string;
  patientName: string;
  email?: string;
  whatsapp?: string;
  lastMessage: string;
  lastSenderRole: 'PATIENT' | 'ADMIN';
  lastMessageAt: string;
  unreadCount: number;
};

type Message = {
  id: string;
  senderRole: 'PATIENT' | 'ADMIN';
  body: string;
  readAt?: string | null;
  createdAt: string;
};

type Thread = {
  patient: { id: string; name: string; email?: string; whatsapp?: string };
  messages: Message[];
};

const clean = (body: string) => body.replace(/^\[[^\]]+\]\s*/, '');
const category = (body: string) => body.match(/^\[([^\]]+)\]\s*/)?.[1];

export function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<{ data: Conversation[] }>('/api/messages');
      setConversations(result.data);
      if (!selected && result.data.length > 0) {
        setSelected(result.data[0].patientId);
      }
    } catch (c) {
      setError(
        c instanceof Error ? c.message : 'Não foi possível carregar as conversas.'
      );
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const loadThread = useCallback(async (patientId: string) => {
    try {
      const result = await api<{ data: Thread }>(`/api/messages/${patientId}`);
      setThread(result.data);
      setConversations((current) =>
        current.map((item) =>
          item.patientId === patientId ? { ...item, unreadCount: 0 } : item
        )
      );
    } catch (c) {
      setError(
        c instanceof Error ? c.message : 'Não foi possível abrir a conversa.'
      );
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selected) {
      void loadThread(selected);
    }
  }, [selected, loadThread]);

  useEffect(() => {
    if (thread?.messages) {
      scrollToBottom();
    }
  }, [thread?.messages]);

  const filtered = useMemo(
    () =>
      conversations.filter(
        (item) =>
          item.patientName.toLowerCase().includes(query.toLowerCase()) ||
          item.email?.toLowerCase().includes(query.toLowerCase())
      ),
    [conversations, query]
  );

  const currentPatient = useMemo(() => {
    return conversations.find((c) => c.patientId === selected);
  }, [conversations, selected]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !replyText.trim()) return;
    setSending(true);
    setError('');
    setNotice('');
    try {
      await api(`/api/messages/${selected}`, {
        method: 'POST',
        body: JSON.stringify({ body: replyText.trim() }),
      });
      setReplyText('');
      setNotice('Mensagem enviada com sucesso ao Portal do Paciente!');
      setTimeout(() => setNotice(''), 4000);
      await Promise.all([loadThread(selected), loadList()]);
    } catch (c) {
      setError(
        c instanceof Error ? c.message : 'Não foi possível enviar a resposta.'
      );
    } finally {
      setSending(false);
    }
  }

  function cleanPhone(phone?: string | null) {
    if (!phone) return '';
    const num = phone.replace(/\D/g, '');
    return num.length === 10 || num.length === 11 ? `55${num}` : num;
  }

  return (
    <div className="professional-messages-v2">
      {/* ── CABEÇALHO ── */}
      <div className="page-intro-v2">
        <div>
          <span className="eyebrow">Canal Direto com Pacientes</span>
          <h2>Central de Mensagens & Dúvidas</h2>
          <p>
            Comunicação segura e criptografada integrada ao Portal do Paciente.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void loadList()}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Atualizar Mensagens
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}
      {notice && (
        <div className="form-success">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}

      {/* ── WORKSPACE DE MENSAGENS ── */}
      <div className={`messages-workspace-v2 ${showMobileChat ? 'show-chat-mobile' : ''}`}>
        {/* LISTA LATERAL DE CONVERSAS */}
        <aside className="panel conversation-list-panel">
          <div className="conversation-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por paciente ou e-mail..."
            />
            {query && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="conversation-items-scroll">
            {loading ? (
              <div className="empty-state">
                <span className="spinner" />
                <small>Carregando conversas...</small>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <MessageCircle size={32} />
                <strong>Nenhuma mensagem</strong>
                <p>As mensagens enviadas pelos pacientes pelo portal aparecerão aqui.</p>
              </div>
            ) : (
              filtered.map((item) => {
                const initials = item.patientName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0].toUpperCase())
                  .join('');

                return (
                  <button
                    key={item.patientId}
                    type="button"
                    className={`conversation-item-card ${
                      selected === item.patientId ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelected(item.patientId);
                      setShowMobileChat(true);
                    }}
                  >
                    <div className="conv-avatar">
                      <span>{initials || item.patientName.charAt(0)}</span>
                    </div>

                    <div className="conv-content">
                      <div className="conv-top-line">
                        <strong className="conv-patient-name">{item.patientName}</strong>
                        <time className="conv-time">
                          {new Date(item.lastMessageAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </time>
                      </div>
                      <p className="conv-preview-text">{clean(item.lastMessage)}</p>
                    </div>

                    {item.unreadCount > 0 && (
                      <span className="unread-badge-pill">{item.unreadCount}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ÁREA PRINCIPAL DO CHAT */}
        <main className="panel thread-chat-panel">
          {thread && currentPatient ? (
            <>
              {/* CABEÇALHO DO CHAT */}
              <header className="thread-header-v2">
                <button
                  type="button"
                  className="mobile-back-btn"
                  onClick={() => setShowMobileChat(false)}
                  title="Voltar para a lista de conversas"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="thread-user-badge">
                  <div className="thread-avatar">
                    {thread.patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{thread.patient.name}</strong>
                    <span>Canal Protegido do Paciente · Online</span>
                  </div>
                </div>

                <div className="thread-actions-right">
                  {currentPatient.whatsapp && (
                    <a
                      href={`https://wa.me/${cleanPhone(currentPatient.whatsapp)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="thread-action-link"
                      title="Abrir WhatsApp"
                    >
                      <Phone size={15} />
                      <span className="hide-mobile">WhatsApp</span>
                    </a>
                  )}
                  {currentPatient.email && (
                    <a
                      href={`mailto:${currentPatient.email}`}
                      className="thread-action-link"
                      title="Enviar E-mail"
                    >
                      <Mail size={15} />
                      <span className="hide-mobile">E-mail</span>
                    </a>
                  )}
                </div>
              </header>

              {/* HISTÓRICO DE MENSAGENS */}
              <div className="thread-messages-scroll">
                {thread.messages.length === 0 ? (
                  <div className="empty-state">
                    <MessageCircle size={32} />
                    <p>Inicie a conversa enviando uma orientação abaixo.</p>
                  </div>
                ) : (
                  thread.messages.map((message) => {
                    const isMe = message.senderRole === 'ADMIN';
                    const cat = category(message.body);

                    return (
                      <article
                        key={message.id}
                        className={`chat-bubble-row ${isMe ? 'mine' : 'theirs'}`}
                      >
                        <div className="chat-bubble">
                          {cat && <span className="category-pill">{cat}</span>}
                          <strong className="chat-sender-name">
                            {isMe ? 'Você (Nutricionista)' : thread.patient.name}
                          </strong>
                          <p className="chat-body-text">{clean(message.body)}</p>
                          <time className="chat-timestamp">
                            {new Date(message.createdAt).toLocaleString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </time>
                        </div>
                      </article>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* FORMULÁRIO DE RESPOSTA */}
              <form className="thread-reply-form" onSubmit={send}>
                <div className="quick-suggestions-bar">
                  <span className="suggestions-title">💡 Respostas rápidas:</span>
                  <button
                    type="button"
                    className="quick-chip-btn"
                    onClick={() =>
                      setReplyText(
                        'Olá! Recebi sua dúvida e vou analisar seu caso. Te retorno em breve!'
                      )
                    }
                  >
                    Vou analisar
                  </button>
                  <button
                    type="button"
                    className="quick-chip-btn"
                    onClick={() =>
                      setReplyText(
                        'Excelente progresso! Continue mantendo o plano alimentar e a hidratação.'
                      )
                    }
                  >
                    Parabéns pelo foco
                  </button>
                  <button
                    type="button"
                    className="quick-chip-btn"
                    onClick={() =>
                      setReplyText(
                        'Atualizei seu plano alimentar e receitas no portal. Dê uma olhada!'
                      )
                    }
                  >
                    Plano atualizado
                  </button>
                </div>

                <div className="reply-input-wrap">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                    maxLength={2000}
                    placeholder={`Escreva sua orientação para ${thread.patient.name}...`}
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="primary-button send-msg-btn"
                    disabled={sending || !replyText.trim()}
                  >
                    <Send size={16} />
                    <span>{sending ? 'Enviando...' : 'Enviar'}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="empty-state select-conversation-empty">
              <MessageCircle size={44} />
              <strong>Selecione um paciente</strong>
              <p>Escolha uma conversa na lista ao lado para responder e enviar orientações.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

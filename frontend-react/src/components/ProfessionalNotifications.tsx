import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileSearch,
  MessageCircle,
  Stethoscope,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './ToastNotification';
import { api } from '../lib/api';

type NotificationItem = {
  id: string;
  type: 'APPOINTMENT' | 'CHECKIN' | 'EXAM' | 'MESSAGE' | 'FINANCE';
  title: string;
  detail: string;
  timestamp: string;
  link: string;
  actionText: string;
  read: boolean;
};

export function ProfessionalNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const prevCountRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const notifs: NotificationItem[] = [];

      // 1. Check-ins pendentes
      try {
        const checkinsRes = await api<{ data: any[] }>('/api/clinical/checkins/pending');
        if (Array.isArray(checkinsRes.data)) {
          checkinsRes.data.forEach((c) => {
            notifs.push({
              id: `checkin-${c.id}`,
              type: 'CHECKIN',
              title: `Check-in enviado por ${c.patientName}`,
              detail: c.answers?.mainDifficulty
                ? `Dificuldade: ${c.answers.mainDifficulty}`
                : 'Respostas pré-consulta prontas para revisão.',
              timestamp: c.submittedAt || new Date().toISOString(),
              link: `/pacientes/${c.patientId}/clinico`,
              actionText: 'Revisar',
              read: false,
            });
          });
        }
      } catch {}

      // 2. Consultas do dia
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const apptsRes = await api<{ data: any[] }>(`/api/appointments?from=${todayStr}&to=${todayStr}`);
        if (Array.isArray(apptsRes.data)) {
          apptsRes.data
            .filter((a) => ['CONFIRMED', 'WAITING'].includes(a.status))
            .forEach((a) => {
              notifs.push({
                id: `appt-${a.id}`,
                type: 'APPOINTMENT',
                title: `Consulta hoje: ${a.patientName}`,
                detail: `${String(a.appointmentTime).slice(0, 5)} · ${a.appointmentType || 'Consulta'}`,
                timestamp: `${a.appointmentDate}T${a.appointmentTime}`,
                link: a.meetingUrl ? `/atendimentos?video=true` : `/atendimentos`,
                actionText: 'Atender',
                read: false,
              });
            });
        }
      } catch {}

      // 3. Indicadores Financeiros de cobranças vencidas
      try {
        const finRes = await api<{ data: any }>('/api/finance/summary');
        if (finRes.data?.overdue && Number(finRes.data.overdue) > 0) {
          notifs.push({
            id: 'finance-overdue',
            type: 'FINANCE',
            title: 'Cobranças vencidas',
            detail: `${finRes.data.overdue} pagamento(s) pendente(s) aguardando regularização.`,
            timestamp: new Date().toISOString(),
            link: '/financeiro',
            actionText: 'Ver financeiro',
            read: false,
          });
        }
      } catch {}

      // Ordena por data mais recente
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Dispara toast para o profissional se houver novos check-ins ou alertas
      if (prevCountRef.current !== null && notifs.length > prevCountRef.current) {
        const latest = notifs[0];
        if (latest) {
          showToast({
            title: latest.title,
            message: latest.detail,
            type: latest.type === 'APPOINTMENT' ? 'call' : 'info',
            actionLabel: latest.actionText,
            onAction: () => navigate(latest.link),
            duration: 8000,
          });
        }
      }
      prevCountRef.current = notifs.length;

      setItems(notifs);
    } catch {
      // Ignora falhas de conexão suavemente
    } finally {
      setLoading(false);
    }
  }, [showToast, navigate]);

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => void loadNotifications(), 8000); // Polling inteligente a cada 8s
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Fechar popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = items.filter((i) => !i.read).length;

  function markAllAsRead() {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  function dismiss(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleAction(item: NotificationItem) {
    setIsOpen(false);
    navigate(item.link);
  }

  const iconMap = {
    APPOINTMENT: <CalendarDays size={17} className="notif-icon green" />,
    CHECKIN: <ClipboardCheck size={17} className="notif-icon gold" />,
    EXAM: <FileSearch size={17} className="notif-icon blue" />,
    MESSAGE: <MessageCircle size={17} className="notif-icon rose" />,
    FINANCE: <CircleDollarSign size={17} className="notif-icon rose" />,
  };

  return (
    <div className="notif-container" ref={dropdownRef}>
      <button
        className={`notif-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Abrir central de notificações"
        title="Central de notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-popover">
          <header className="notif-header">
            <div>
              <strong>Notificações</strong>
              <span className="notif-subtext">
                {unreadCount > 0 ? `${unreadCount} alerta(s) pendente(s)` : 'Tudo em dia'}
              </span>
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button className="notif-text-btn" onClick={markAllAsRead}>
                  <CheckCircle2 size={13} /> Marcar lidas
                </button>
              )}
              <button className="icon-button" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="notif-list">
            {loading && items.length === 0 ? (
              <div className="notif-loading">Carregando alertas...</div>
            ) : items.length === 0 ? (
              <div className="notif-empty">
                <CheckCircle2 size={24} />
                <p>Nenhuma notificação no momento.</p>
                <small>Consultas e novos check-ins aparecerão aqui.</small>
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className={`notif-card ${item.read ? 'read' : 'unread'}`}>
                  <div className="notif-card-icon">{iconMap[item.type]}</div>
                  <div className="notif-card-body">
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <div className="notif-card-footer">
                      <button className="notif-action-btn" onClick={() => handleAction(item)}>
                        {item.actionText} →
                      </button>
                      <button
                        className="notif-dismiss-btn"
                        onClick={() => dismiss(item.id)}
                        title="Dispensar alerta"
                      >
                        Dispensar
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

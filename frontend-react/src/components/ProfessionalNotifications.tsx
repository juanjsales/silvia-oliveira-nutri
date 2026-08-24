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
import { useTeleconsultation } from '../contexts/TeleconsultationContext';

type NotificationItem = {
  id: string;
  type: 'APPOINTMENT' | 'APPOINTMENT_REQUEST' | 'CHECKIN' | 'EXAM' | 'MESSAGE' | 'FINANCE' | 'PRIVACY';
  title: string;
  detail: string;
  timestamp: string;
  link: string;
  actionText: string;
  read: boolean;
  priority: 'LOW'|'NORMAL'|'HIGH'|'URGENT';
  status: 'ACTIVE'|'RESOLVED'|'ARCHIVED';
};

export function ProfessionalNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isCallActiveFor, restoreCall } = useTeleconsultation();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response=await api<{data:{id:string;type:NotificationItem['type'];title:string;detail:string;createdAt:string;link:string|null;readAt:string|null;priority:NotificationItem['priority'];status:NotificationItem['status']}[]}>('/api/notifications');
      const notifs:NotificationItem[]=response.data.map(item=>({...item,timestamp:item.createdAt,link:item.link||'/atendimentos',actionText:'Abrir',read:Boolean(item.readAt)}));

      // A identidade do item, e não a contagem total, evita repetir toast quando
      // outro alerta some ou a ordem muda durante o polling.
      const currentIds = new Set(notifs.map((item) => item.id));
      if (knownIdsRef.current !== null) {
        const latest = notifs.find((item) => !knownIdsRef.current!.has(item.id) && !isCallActiveFor(item.link));
        if (latest) {
          showToast({
            title: latest.title,
            message: latest.detail,
            type: ['APPOINTMENT', 'APPOINTMENT_REQUEST'].includes(latest.type) ? 'call' : 'info',
            actionLabel: latest.actionText,
            onAction: () => navigate(latest.link),
            duration: 8000,
          });
        }
      }
      knownIdsRef.current = currentIds;

      setItems(notifs);
      setError('');
    } catch {
      setError('Não foi possível atualizar as notificações. Verifique sua conexão e tente novamente.');
      showToast({title:'Notificações indisponíveis',message:'Não foi possível atualizar a central. Tentaremos novamente.',type:'info',key:'professional-notifications-error'});
    } finally {
      setLoading(false);
    }
  }, [showToast, navigate, isCallActiveFor]);

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

  useEffect(() => {
    if (!isOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const unreadCount = items.filter((i) => !i.read && !isCallActiveFor(i.link)).length;

  async function markAllAsRead() {
    setBusyId('all');
    try {
      await api('/api/notifications/read-all',{method:'PATCH'});
      await loadNotifications();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível marcar as notificações como lidas.');
    } finally { setBusyId(null); }
  }

  async function dismiss(id: string) {
    setBusyId(id);
    try {
      await api(`/api/notifications/${id}/archive`,{method:'PATCH'});
      await loadNotifications();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível arquivar a notificação.');
    } finally { setBusyId(null); }
  }
  async function markRead(id:string){
    setBusyId(id);
    try {
      await api(`/api/notifications/${id}/read`,{method:'PATCH'});
      await loadNotifications();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a notificação.');
    } finally { setBusyId(null); }
  }

  function handleAction(item: NotificationItem) {
    void api(`/api/notifications/${item.id}/read`,{method:'PATCH'}).catch(() => undefined);
    setIsOpen(false);
    if (isCallActiveFor(item.link)) {
      restoreCall();
      return;
    }
    navigate(item.link);
  }

  const iconMap = {
    APPOINTMENT: <CalendarDays size={17} className="notif-icon green" />,
    APPOINTMENT_REQUEST: <CalendarDays size={17} className="notif-icon gold" />,
    CHECKIN: <ClipboardCheck size={17} className="notif-icon gold" />,
    EXAM: <FileSearch size={17} className="notif-icon blue" />,
    MESSAGE: <MessageCircle size={17} className="notif-icon rose" />,
    FINANCE: <CircleDollarSign size={17} className="notif-icon rose" />,
    PRIVACY: <FileSearch size={17} className="notif-icon blue" />,
  };

  return (
    <div className="notif-container" ref={dropdownRef}>
      <button
        ref={triggerRef}
        className={`notif-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={unreadCount ? `Abrir central de notificações, ${unreadCount} não lida${unreadCount === 1 ? '' : 's'}` : 'Abrir central de notificações, nenhuma não lida'}
        aria-expanded={isOpen}
        aria-controls="professional-notifications-popover"
        aria-haspopup="dialog"
        title="Central de notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="notif-badge" aria-hidden="true">{Math.min(unreadCount, 99)}{unreadCount > 99 ? '+' : ''}</span>}
      </button>

      {isOpen && (
        <div className="notif-popover" id="professional-notifications-popover" role="dialog" aria-modal="false" aria-label="Central de notificações">
          <header className="notif-header">
            <div>
              <strong>Notificações</strong>
              <span className="notif-subtext">
                {unreadCount > 0 ? `${unreadCount} alerta(s) pendente(s)` : 'Tudo em dia'}
              </span>
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button className="notif-text-btn" onClick={() => void markAllAsRead()} disabled={busyId !== null}>
                  <CheckCircle2 size={13} /> Marcar lidas
                </button>
              )}
              <button className="icon-button" aria-label="Fechar notificações" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="sr-only" role="status" aria-live="polite">{loading ? 'Atualizando notificações.' : `${unreadCount} notificação${unreadCount === 1 ? '' : 'ões'} não lida${unreadCount === 1 ? '' : 's'}.`}</div>
          {error && <div className="notif-inline-error" role="alert"><span>{error}</span><button type="button" onClick={() => void loadNotifications()} disabled={loading}>Tentar novamente</button></div>}

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
                <article key={item.id} className={`notif-card ${item.read ? 'read' : 'unread'} priority-${item.priority.toLowerCase()}`}>
                  <div className="notif-card-icon">{iconMap[item.type]}</div>
                  <div className="notif-card-body">
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <time className="notif-time" dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</time>
                    <div className="notif-card-footer">
                      <button className="notif-action-btn" onClick={() => handleAction(item)}>
                        {isCallActiveFor(item.link) ? 'Voltar à chamada' : item.actionText} →
                      </button>
                      {!item.read && <button className="notif-dismiss-btn" disabled={busyId !== null} onClick={() => void markRead(item.id)}>Marcar lida</button>}
                      <button
                        className="notif-dismiss-btn"
                        onClick={() => void dismiss(item.id)}
                        disabled={busyId !== null}
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

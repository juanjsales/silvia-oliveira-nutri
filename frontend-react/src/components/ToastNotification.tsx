import { CheckCircle2, MessageCircle, Sparkles, Video, X } from 'lucide-react';
import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { sounds } from '../lib/sound';

export type ToastType = 'info' | 'success' | 'call' | 'message';

export type ToastItem = {
  id: string;
  title: string;
  message: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

type ToastContextType = {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: ToastItem = { ...item, id };

    setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Mantém no máximo 4 toasts simultâneos

    // Toca som apropriado
    if (item.type === 'call') {
      sounds.playCallAlert();
    } else if (item.type === 'message' || item.type === 'info') {
      sounds.playNotification();
    } else if (item.type === 'success') {
      sounds.playBroadcastSync();
    }

    const duration = item.duration ?? 6000;
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="toast-portal-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <aside
            key={toast.id}
            className={`toast-banner toast-${toast.type || 'info'}`}
            role="alert"
          >
            <div className="toast-icon-wrap">
              {toast.type === 'call' ? (
                <Video size={18} />
              ) : toast.type === 'message' ? (
                <MessageCircle size={18} />
              ) : toast.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <Sparkles size={18} />
              )}
            </div>

            <div className="toast-content">
              <strong className="toast-title">{toast.title}</strong>
              <p className="toast-message">{toast.message}</p>
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  className="toast-action-btn"
                  onClick={() => {
                    toast.onAction?.();
                    dismissToast(toast.id);
                  }}
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>

            <button
              type="button"
              className="toast-close-btn"
              onClick={() => dismissToast(toast.id)}
              aria-label="Fechar notificação"
            >
              <X size={14} />
            </button>
          </aside>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return ctx;
}

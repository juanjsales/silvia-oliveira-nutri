import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type ConfirmTone = 'default' | 'warning' | 'destructive';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type PendingConfirmation = ConfirmOptions & { resolve: (accepted: boolean) => void };
type ConfirmContextValue = { confirm: (options: ConfirmOptions) => Promise<boolean> };

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback((accepted: boolean) => {
    setPending((current) => {
      current?.resolve(accepted);
      return null;
    });
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    setPending((current) => {
      current?.resolve(false);
      return { ...options, resolve };
    });
  }), []);

  useEffect(() => {
    if (!pending) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => confirmButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close, pending]);

  const tone = pending?.tone ?? 'default';
  const Icon = tone === 'destructive' ? ShieldAlert : tone === 'warning' ? AlertTriangle : Info;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close(false)}>
          <section className={`confirm-dialog confirm-${tone}`} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
            <header className="confirm-header">
              <span className="confirm-icon" aria-hidden="true"><Icon size={22} /></span>
              <div>
                <h2 id="confirm-title">{pending.title}</h2>
                <p id="confirm-message">{pending.message}</p>
              </div>
              <button type="button" className="confirm-close" onClick={() => close(false)} aria-label="Fechar confirmação"><X size={18} /></button>
            </header>
            <footer className="confirm-actions">
              <button type="button" className="secondary-button" onClick={() => close(false)}>{pending.cancelLabel ?? 'Cancelar'}</button>
              <button ref={confirmButtonRef} type="button" className={tone === 'destructive' ? 'danger-button' : 'primary-button'} onClick={() => close(true)}>{pending.confirmLabel ?? 'Confirmar'}</button>
            </footer>
          </section>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const value = useContext(ConfirmContext);
  if (!value) throw new Error('useConfirm deve ser usado dentro de ConfirmProvider');
  return value.confirm;
}

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type ActiveCall = {
  appointmentId?: string | null;
  encounterId?: string | null;
  sessionId?: string | null;
  roomToken: string;
  patientName: string;
  roomUrl: string;
  role: 'ADMIN' | 'PATIENT';
  startedAt: number;
  returnPath: string;
};

type TeleconsultationContextType = {
  activeCall: ActiveCall | null;
  isMinimized: boolean;
  startCall: (call: Omit<ActiveCall, 'startedAt'>) => void;
  minimizeCall: () => void;
  restoreCall: () => void;
  endCall: () => void;
  isCallActiveFor: (...identifiers: Array<string | null | undefined>) => boolean;
};

const TeleconsultationContext = createContext<TeleconsultationContextType | null>(null);

export function TeleconsultationProvider({ children }: { children: ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(() => {
    // Tokens de entrada são efêmeros e nunca devem sobreviver a uma recarga.
    sessionStorage.removeItem('global_active_call');
    return null;
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    return sessionStorage.getItem('global_call_minimized') === 'true';
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeCall) {
      sessionStorage.setItem('global_call_minimized', String(isMinimized));
    } else {
      sessionStorage.removeItem('global_active_call');
      sessionStorage.removeItem('global_call_minimized');
    }
  }, [activeCall, isMinimized]);

  // Se o usuário estiver na rota de tela cheia correspondente à chamada, desativa o modo minimizado
  useEffect(() => {
    if (!activeCall) return;

    const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
    const isPatientVideoRoute = normalizedPath === '/portal/video' || normalizedPath.startsWith('/portal/video/');
    const searchParams = new URLSearchParams(location.search);
    const isEncounterSplitOpen = normalizedPath === '/atendimentos' && searchParams.get('video') === 'true';

    if (activeCall.role === 'PATIENT' && isPatientVideoRoute) {
      setIsMinimized(false);
    } else if (activeCall.role === 'ADMIN' && isEncounterSplitOpen) {
      setIsMinimized(false);
    } else {
      // Se saiu da consulta ativa específica ou fechou o split lateral, minimiza automaticamente para o miniplayer flutuante
      setIsMinimized(true);
    }
  }, [location.pathname, location.search, activeCall]);

  const startCall = useCallback((call: Omit<ActiveCall, 'startedAt'>) => {
    setActiveCall((current) => {
      const sameCall = current && Boolean(
        ((call.sessionId && current.sessionId === call.sessionId) ||
          (call.appointmentId && current.appointmentId === call.appointmentId) ||
          (call.encounterId && current.encounterId === call.encounterId) ||
          current.roomToken === call.roomToken),
      );

      // Reabrir a tela principal não pode substituir a URL efêmera nem reiniciar
      // o relógio da conexão que já está viva no player global.
      return current && sameCall
        ? { ...current, returnPath: call.returnPath, patientName: call.patientName, sessionId: current.sessionId || call.sessionId }
        : { ...call, startedAt: Date.now() };
    });
    setIsMinimized(false);
  }, []);

  const minimizeCall = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const restoreCall = useCallback(() => {
    if (!activeCall) return;
    setIsMinimized(false);
    navigate(activeCall.returnPath);
  }, [activeCall, navigate]);

  const endCall = useCallback(() => {
    setActiveCall(null);
    setIsMinimized(false);
    sessionStorage.removeItem('global_active_call');
    sessionStorage.removeItem('global_call_minimized');
  }, []);

  const isCallActiveFor = useCallback((...identifiers: Array<string | null | undefined>) => {
    if (!activeCall) return false;
    const callIds = [activeCall.appointmentId, activeCall.encounterId, activeCall.sessionId, activeCall.roomToken]
      .filter((value): value is string => Boolean(value));
    return identifiers.some((candidate) => Boolean(candidate) && callIds.some((id) => candidate === id || candidate!.includes(id)));
  }, [activeCall]);

  return (
    <TeleconsultationContext.Provider
      value={{
        activeCall,
        isMinimized,
        startCall,
        minimizeCall,
        restoreCall,
        endCall,
        isCallActiveFor,
      }}
    >
      {children}
    </TeleconsultationContext.Provider>
  );
}

export function useTeleconsultation() {
  const context = useContext(TeleconsultationContext);
  if (!context) {
    throw new Error('useTeleconsultation deve ser usado dentro de um TeleconsultationProvider');
  }
  return context;
}

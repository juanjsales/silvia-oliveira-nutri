import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type ActiveCall = {
  appointmentId?: string | null;
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

    const isPatientVideoRoute = location.pathname.startsWith('/portal/video');
    const searchParams = new URLSearchParams(location.search);
    const isEncounterSplitOpen = location.pathname === '/atendimentos' && searchParams.get('video') === 'true';

    if (activeCall.role === 'PATIENT' && isPatientVideoRoute) {
      setIsMinimized(false);
    } else if (activeCall.role === 'ADMIN' && isEncounterSplitOpen) {
      setIsMinimized(false);
    } else {
      // Se saiu da consulta ativa específica ou fechou o split lateral, minimiza automaticamente para o miniplayer flutuante
      setIsMinimized(true);
    }
  }, [location.pathname, location.search, activeCall]);

  function startCall(call: Omit<ActiveCall, 'startedAt'>) {
    const fullCall: ActiveCall = {
      ...call,
      startedAt: Date.now(),
    };
    setActiveCall(fullCall);
    setIsMinimized(false);
  }

  function minimizeCall() {
    setIsMinimized(true);
  }

  function restoreCall() {
    if (!activeCall) return;
    setIsMinimized(false);
    navigate(activeCall.returnPath);
  }

  function endCall() {
    setActiveCall(null);
    setIsMinimized(false);
    sessionStorage.removeItem('global_active_call');
    sessionStorage.removeItem('global_call_minimized');
  }

  return (
    <TeleconsultationContext.Provider
      value={{
        activeCall,
        isMinimized,
        startCall,
        minimizeCall,
        restoreCall,
        endCall,
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

import {
  BookOpen,
  Maximize2,
  Minimize2,
  PhoneOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTeleconsultation } from '../contexts/TeleconsultationContext';
import { LaminasModal } from './LaminasModal';
import { api } from '../lib/api';

export function FloatingCallWidget() {
  const { activeCall, isMinimized, restoreCall, endCall } = useTeleconsultation();
  const [elapsed, setElapsed] = useState('00:00');
  const [reconnecting, setReconnecting] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [laminasOpen, setLaminasOpen] = useState(false);
  const [frameSource, setFrameSource] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isMinimized) {
      setFrameSource('');
      return () => { cancelled = true; };
    }
    if (!activeCall?.appointmentId) {
      setFrameSource(activeCall?.roomUrl || '');
      return () => { cancelled = true; };
    }
    setFrameSource('');
    api<{ data: { roomUrl: string } }>(`/api/video/appointments/${activeCall.appointmentId}/access`, { method: 'POST' })
      .then((response) => {
        if (!cancelled) setFrameSource(response.data.roomUrl);
      })
      .catch(() => {
        if (!cancelled) setFrameSource('');
      });
    return () => { cancelled = true; };
  }, [activeCall?.appointmentId, activeCall?.roomUrl, iframeKey, isMinimized]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      if (!event.data || event.data.type !== 'TELECONSULT_CALL_ENDED' || event.data.version !== 1) return;
      if (activeCall?.role === 'ADMIN' && activeCall.sessionId) {
        void api(`/api/video/sessions/${activeCall.sessionId}/end`, {
          method: 'POST', body: JSON.stringify({ reason: 'COMPLETED' }),
        }).finally(endCall);
      } else {
        endCall();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [activeCall?.role, activeCall?.sessionId, endCall]);

  useEffect(() => {
    if (!activeCall) return;
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - activeCall.startedAt) / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      setElapsed(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeCall]);

  // Monitora se o atendimento foi finalizado ou descartado para fechar o miniplayer na hora
  useEffect(() => {
    if (!activeCall) return;
    const targetId = activeCall.appointmentId || activeCall.roomToken;
    if (!targetId) return;

    const checkInterval = window.setInterval(async () => {
      try {
        if (activeCall.role === 'PATIENT') {
          await api(`/api/video/appointments/${targetId}/access`, { method: 'POST' });
        } else {
          const res = await api<{ data: { activeEncounter: any } }>('/api/encounters/live-status');
          if (!res.data.activeEncounter) {
            endCall();
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('finalizada') || msg.includes('cancelada') || msg.includes('não encontrada') || msg.includes('aguarde') || msg.includes('Aguarde') || msg.includes('iniciar')) {
          endCall();
        }
      }
    }, 2500);

    return () => window.clearInterval(checkInterval);
  }, [activeCall, endCall]);

  if (!activeCall || !isMinimized) {
    return null;
  }

  // A localização da rota é traduzida para isMinimized pelo contexto. O widget não
  // repete regras de URL, evitando divergências entre portal, atendimento e PiP.
  function handleReconnect() {
    setReconnecting(true);
    setIframeKey((k) => k + 1);
    setTimeout(() => setReconnecting(false), 1200);
  }

  function handleHangup() {
    if (!activeCall) return;
    const call = activeCall;
    const prompt = call.role === 'ADMIN'
      ? 'Encerrar a sala para todos os participantes? O prontuário continuará aberto.'
      : 'Deseja sair da teleconsulta? A consulta continuará disponível enquanto a nutricionista estiver na sala.';
    if (window.confirm(prompt)) {
      if (call.role === 'ADMIN' && call.sessionId) {
        void api(`/api/video/sessions/${call.sessionId}/end`, {
          method: 'POST', body: JSON.stringify({ reason: 'COMPLETED' }),
        }).finally(endCall);
      } else {
        endCall();
      }
    }
  }

  return (
    <>
      <aside
        className={`persistent-video-container pip-mode ${collapsed ? 'collapsed' : ''}`}
      >
        <header className="pip-header">
          <div className="pip-title" onClick={restoreCall} title="Clique para voltar para a tela cheia">
            <span className="live-dot" />
            <div className="pip-info">
              <strong>{activeCall.role === 'ADMIN' ? activeCall.patientName : 'Dra. Silvia Oliveira'}</strong>
              <small>Teleconsulta ativa · {elapsed}</small>
            </div>
          </div>

          <div className="pip-actions">
            {activeCall.role === 'ADMIN' && (
              <button
                type="button"
                className="pip-icon-btn"
                onClick={() => setLaminasOpen(true)}
                title="Abrir Lâminas Educativas A4"
                style={{ color: '#2d6a4f' }}
              >
                <BookOpen size={14} />
              </button>
            )}

            <button
              type="button"
              className="pip-icon-btn"
              onClick={handleReconnect}
              disabled={reconnecting}
              title="Reconectar áudio/vídeo"
            >
              <RefreshCw size={14} className={reconnecting ? 'spin' : ''} />
            </button>

            <button
              type="button"
              className="pip-icon-btn"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expandir miniplayer' : 'Recolher miniplayer'}
            >
              {collapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>

            <button
              type="button"
              className="pip-icon-btn restore-btn"
              onClick={restoreCall}
              title="Voltar para a tela da consulta"
            >
              <Maximize2 size={15} />
            </button>

            <button
              type="button"
              className="pip-icon-btn hangup-btn"
              onClick={handleHangup}
              title={activeCall.role === 'ADMIN' ? 'Encerrar sala para todos' : 'Sair da chamada'}
            >
              <PhoneOff size={14} />
            </button>
          </div>
        </header>

        <div className="persistent-video-frame">
          {frameSource ? <iframe
            ref={iframeRef}
            key={iframeKey}
            src={frameSource}
            title="Teleconsulta Nutricional"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
          /> : <div className="video-frame-status" role="status">Revalidando acesso seguro...</div>}
          {!collapsed && (
            <button type="button" className="pip-overlay-hint" onClick={restoreCall} title="Voltar para a tela do atendimento">
              <Sparkles size={13} />
              <span>Voltar ao atendimento</span>
            </button>
          )}
        </div>
      </aside>

      <LaminasModal
        isOpen={laminasOpen}
        onClose={() => setLaminasOpen(false)}
        patientName={activeCall.patientName}
        onBroadcast={async (lamina) => {
          const targetId = activeCall.appointmentId || activeCall.roomToken;
          if (!targetId) return;
          try {
            await api(`/api/video/appointments/${targetId}/broadcast`, {
              method: 'POST',
              body: JSON.stringify({
                activeTab: 'lamina',
                customTitle: lamina.title,
                customNote: lamina.summary,
                laminaData: {
                  id: lamina.id,
                  title: lamina.title,
                  summary: lamina.summary,
                  tips: lamina.tips,
                  categoryLabel: lamina.categoryLabel,
                  icon: lamina.icon,
                },
              }),
            });
          } catch {}
        }}
      />
    </>
  );
}

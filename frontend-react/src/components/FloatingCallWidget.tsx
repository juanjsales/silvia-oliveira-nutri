import {
  ExternalLink,
  Maximize2,
  Minimize2,
  PhoneOff,
  RefreshCw,
  Sparkles,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTeleconsultation } from '../contexts/TeleconsultationContext';

export function FloatingCallWidget() {
  const { activeCall, isMinimized, restoreCall, endCall } = useTeleconsultation();
  const [elapsed, setElapsed] = useState('00:00');
  const [reconnecting, setReconnecting] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [collapsed, setCollapsed] = useState(false);

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

  if (!activeCall || !isMinimized) {
    return null;
  }

  function handleReconnect() {
    setReconnecting(true);
    setIframeKey((k) => k + 1);
    setTimeout(() => setReconnecting(false), 1200);
  }

  function handleHangup() {
    if (window.confirm('Deseja realmente encerrar a teleconsulta?')) {
      endCall();
    }
  }

  return (
    <aside className={`floating-call-pip ${collapsed ? 'collapsed' : ''}`}>
      <header className="pip-header">
        <div className="pip-title" onClick={restoreCall} title="Clique para voltar para a tela cheia">
          <span className="live-dot" />
          <div className="pip-info">
            <strong>{activeCall.role === 'ADMIN' ? activeCall.patientName : 'Dra. Silvia Oliveira'}</strong>
            <small>Teleconsulta ativa · {elapsed}</small>
          </div>
        </div>

        <div className="pip-actions">
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
            title="Encerrar chamada"
          >
            <PhoneOff size={14} />
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="pip-video-body">
          <iframe
            key={iframeKey}
            src={activeCall.roomUrl}
            title="Miniplayer de Teleconsulta"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
          />
          <div className="pip-overlay-hint" onClick={restoreCall}>
            <span><Sparkles size={13} /> Clique para voltar ao atendimento</span>
          </div>
        </div>
      )}
    </aside>
  );
}

import {
  BookOpen,
  Maximize2,
  Minimize2,
  PhoneOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTeleconsultation } from '../contexts/TeleconsultationContext';
import { LaminasModal } from './LaminasModal';
import { api } from '../lib/api';

export function FloatingCallWidget() {
  const { activeCall, isMinimized, restoreCall, endCall } = useTeleconsultation();
  const location = useLocation();
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

  if (!activeCall) {
    return null;
  }

  const isPatientVideoRoute = location.pathname.startsWith('/portal/video');
  const isEncounterRoute = location.pathname.startsWith('/atendimentos');

  // Se estiver na tela nativa com o vídeo aberto (atendimentos ou portal/video),
  // não renderiza o miniplayer flutuante para evitar duplicidade de vídeo e áudio.
  if (isEncounterRoute || isPatientVideoRoute) {
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

  const [laminasOpen, setLaminasOpen] = useState(false);

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
              title="Encerrar chamada"
            >
              <PhoneOff size={14} />
            </button>
          </div>
        </header>

        <div className="persistent-video-frame">
          <iframe
            key={iframeKey}
            src={activeCall.roomUrl}
            title="Teleconsulta Nutricional"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
          />
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
        onBroadcast={activeCall.appointmentId ? async (laminaId, laminaTitle) => {
          try {
            await api(`/api/video/appointments/${activeCall.appointmentId}/broadcast`, {
              method: 'POST',
              body: JSON.stringify({
                activeTab: laminaId === 'prato-ideal' ? 'prato' : laminaId === 'fome-saciedade' ? 'fome' : 'medidas',
                customTitle: laminaTitle,
              }),
            });
          } catch {}
        } : undefined}
      />
    </>
  );
}



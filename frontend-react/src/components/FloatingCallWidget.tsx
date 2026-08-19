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
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTeleconsultation } from '../contexts/TeleconsultationContext';

export function FloatingCallWidget() {
  const { activeCall, isMinimized, restoreCall, endCall } = useTeleconsultation();
  const location = useLocation();
  const [elapsed, setElapsed] = useState('00:00');
  const [reconnecting, setReconnecting] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [dockSlot, setDockSlot] = useState<HTMLElement | null>(null);

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

  const isPatientVideoRoute = location.pathname.startsWith('/portal/video');
  const isEncounterRoute = location.pathname.startsWith('/atendimentos');
  const isDockedPatient = !isMinimized && isPatientVideoRoute && activeCall?.role === 'PATIENT';
  const isDockedEncounter = !isMinimized && isEncounterRoute && activeCall?.role === 'ADMIN';

  useEffect(() => {
    if (isDockedPatient) {
      const el = document.getElementById('patient-video-slot');
      setDockSlot(el);
    } else if (isDockedEncounter) {
      const el = document.getElementById('encounter-video-slot');
      setDockSlot(el);
    } else {
      setDockSlot(null);
    }
  }, [isDockedPatient, isDockedEncounter, location.pathname, isMinimized]);

  if (!activeCall) {
    return null;
  }

  const isPip = !dockSlot;

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

  const videoElement = (
    <aside
      className={`persistent-video-container ${
        dockSlot ? 'docked-in-page' : 'pip-mode'
      } ${collapsed && isPip ? 'collapsed' : ''}`}
    >
      {isPip && (
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
      )}

      <div className="persistent-video-frame">
        <iframe
          key={iframeKey}
          src={activeCall.roomUrl}
          title="Teleconsulta Nutricional"
          allow="camera; microphone; fullscreen; display-capture; autoplay"
        />
        {isPip && !collapsed && (
          <div className="pip-overlay-hint" onClick={restoreCall}>
            <span><Sparkles size={13} /> Clique para voltar ao atendimento</span>
          </div>
        )}
      </div>
    </aside>
  );

  if (dockSlot) {
    return createPortal(videoElement, dockSlot);
  }

  return videoElement;
}



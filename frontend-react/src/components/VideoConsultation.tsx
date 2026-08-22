import {
  BookOpen,
  Check,
  ExternalLink,
  Maximize2,
  Minimize2,
  PhoneOff,
  RefreshCw,
  Send,
  Sparkles,
  Video,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTeleconsultation } from '../contexts/TeleconsultationContext';
import { LaminasModal } from './LaminasModal';
import { type NutritionalLamina } from '../lib/nutritionalLaminas';
import { api } from '../lib/api';

type BroadcastTab = 'lamina';

type Props = {
  encounterId?: string | null;
  appointmentId?: string | null;
  roomToken: string;
  patientName: string;
  appointmentTime?: string | null;
  durationMinutes?: number | null;
  sections?: Record<string, any>;
  onClose: () => void;
};

export function VideoConsultation({ encounterId, appointmentId, roomToken, patientName, appointmentTime, durationMinutes, onClose }: Props) {
  const { startCall, minimizeCall, endCall } = useTeleconsultation();
  const [expanded, setExpanded] = useState(false);
  const [startedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState('00:00');
  const [source, setSource] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [iframeKey, setIframeKey] = useState(1);
  const [reconnecting, setReconnecting] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastTab | null>(null);
  const [broadcastingNotice, setBroadcastingNotice] = useState('');
  const [showBroadcastMenu, setShowBroadcastMenu] = useState(true);
  const [laminasOpen, setLaminasOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    setError('');
    setSource('');
    const accessTargetId = appointmentId || encounterId;
    if (!accessTargetId) {
      setSource('');
      setError('Não foi possível identificar o atendimento para abrir a sala segura.');
      return;
    }
    api<{ data: { roomUrl: string; sessionId?: string } }>(`/api/video/appointments/${accessTargetId}/access`, { method: 'POST' })
      .then((response) => {
        setSource(response.data.roomUrl);
        setSessionId(response.data.sessionId || '');
      })
      .catch((cause) => {
        setSource('');
        setError(cause instanceof Error ? cause.message : 'Não foi possível autorizar a sala. Tente novamente.');
      });
  }, [appointmentId, encounterId, roomToken, appointmentTime, durationMinutes, iframeKey]);

  useEffect(() => {
    if (source) {
      const returnTarget = encounterId
        ? `/atendimentos?id=${encodeURIComponent(encounterId)}&video=true`
        : appointmentId
        ? `/atendimentos?agendamento=${encodeURIComponent(appointmentId)}&video=true`
        : '/atendimentos';

      startCall({
        appointmentId: appointmentId || encounterId,
        encounterId,
        sessionId,
        roomToken,
        patientName,
        roomUrl: source,
        role: 'ADMIN',
        returnPath: returnTarget,
      });
    }
  }, [source, sessionId, encounterId, appointmentId, roomToken, patientName, startCall]);

  async function finishForEveryone() {
    if (sessionId) {
      await api(`/api/video/sessions/${sessionId}/end`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'COMPLETED' }),
      }).catch(() => undefined);
    }
    endCall();
    onClose();
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      if (!event.data || event.data.type !== 'TELECONSULT_CALL_ENDED' || event.data.version !== 1) return;
      void finishForEveryone();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sessionId, endCall, onClose]);

  function handleReconnect() {
    setReconnecting(true);
    setIframeKey((prev) => prev + 1);
    setTimeout(() => setReconnecting(false), 1200);
  }

  const targetBroadcastId = appointmentId || encounterId;

  async function broadcastLaminaToPatient(lamina: NutritionalLamina) {
    if (!targetBroadcastId) return;
    setActiveBroadcast('lamina');

    try {
      await api(`/api/video/appointments/${targetBroadcastId}/broadcast`, {
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
      setBroadcastingNotice(`Transmitindo Lâmina: ${lamina.title}`);
      setTimeout(() => setBroadcastingNotice(''), 3500);
    } catch {
      // Ignora
    }
  }

  return (
    <aside className={`video-consultation ${expanded ? 'expanded' : ''}`}>
      <header>
        <div>
          <span className="live-dot" />
          <strong>Teleconsulta (Split)</strong>
          <small>{patientName}</small>
        </div>
        <time>{elapsed}</time>
        <div className="video-header-btns">
          <button
            type="button"
            className="icon-button video-reconnect"
            onClick={handleReconnect}
            disabled={reconnecting}
            title="Reconectar vídeo e áudio"
          >
            <RefreshCw size={15} className={reconnecting ? 'spin' : ''} />
          </button>
          <button 
            type="button"
            className="icon-button video-expand" 
            onClick={() => setExpanded(!expanded)} 
            aria-label={expanded ? 'Reduzir vídeo' : 'Ampliar vídeo'}
            title={expanded ? 'Restaurar modo split' : 'Expandir vídeo'}
          >
            {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </header>

      {/* ── BARRA DE COMANDO DA APRESENTAÇÃO AO PACIENTE ── */}
      {(appointmentId || encounterId) && (
        <div className="video-broadcast-bar">
          <div className="broadcast-bar-head">
            <span className="broadcast-tag">
              <Sparkles size={13} /> Materiais para o paciente
            </span>
            {broadcastingNotice && (
              <span className="broadcast-live-notice">
                <Check size={12} /> {broadcastingNotice}
              </span>
            )}
            <button
              type="button"
              className="broadcast-toggle-collapse"
              onClick={() => setShowBroadcastMenu(!showBroadcastMenu)}
            >
              {showBroadcastMenu ? 'Ocultar' : 'Mostrar opções'}
            </button>
          </div>

          {showBroadcastMenu && (
            <div className="broadcast-library-guide">
              <div className="broadcast-guide-steps" aria-label="Como compartilhar uma lâmina">
                <span><b>1</b> Abra a biblioteca</span>
                <span><b>2</b> Escolha o conteúdo</span>
                <span><b>3</b> Transmita ao paciente</span>
              </div>
              <button
                type="button"
                className={`broadcast-btn broadcast-library-btn ${activeBroadcast === 'lamina' ? 'active' : ''}`}
                onClick={() => setLaminasOpen(true)}
                title="Abrir biblioteca de lâminas educativas"
              >
                <BookOpen size={14} /> Abrir lâminas educativas
              </button>
            </div>
          )}
        </div>
      )}

      <div className="video-frame" id="encounter-video-slot">
        {error ? (
          <div className="video-frame-status">
            <strong>Sala indisponível</strong>
            <span>{error}</span>
          </div>
        ) : !source ? (
          <div className="video-frame-status">
            <span className="spinner" />
            <span>Conectando à sala segura...</span>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={source}
            title="Teleconsulta Nutricional"
            allow="camera; microphone; display-capture; autoplay; fullscreen"
          />
        )}
      </div>

      <footer>
        <div className="video-footer-info">
          <small>Sala individual com acesso validado pelo portal</small>
        </div>
        <div className="video-footer-actions">
          {source && (
            <a 
              className="video-popout" 
              href={source} 
              target="_blank" 
              rel="noreferrer" 
              title="Abrir em nova aba / janela flutuante"
            >
              <ExternalLink size={15} />
            </a>
          )}
          <button
            type="button"
            className="video-minimize-btn secondary-button"
            aria-label="Minimizar teleconsulta"
            onClick={() => {
              minimizeCall();
              onClose();
            }}
            title="Recolher para o miniplayer flutuante (continua ouvindo e vendo o paciente)"
            style={{ fontSize: '0.72rem', padding: '6px 10px', gap: '5px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Minimize2 size={14} />
            <span>Minimizar</span>
          </button>
          <button
            type="button"
            className="hangup"
            aria-label="Encerrar teleconsulta para todos"
            onClick={() => {
              if (window.confirm('Deseja realmente encerrar a teleconsulta?')) {
                void finishForEveryone();
              }
            }}
            title="Encerrar a sala para todos os participantes"
          >
            <PhoneOff size={15} />
            <span>Encerrar para todos</span>
          </button>
        </div>
      </footer>

      <LaminasModal
        isOpen={laminasOpen}
        onClose={() => setLaminasOpen(false)}
        patientName={patientName}
        onBroadcast={(lamina) => {
          void broadcastLaminaToPatient(lamina);
        }}
      />
    </aside>
  );
}

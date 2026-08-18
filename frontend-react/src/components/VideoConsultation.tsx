import { Check, Copy, ExternalLink, Maximize2, Minimize2, PhoneOff, Video, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Props = {
  appointmentId?: string | null;
  roomToken: string;
  patientName: string;
  onClose: () => void;
};

export function VideoConsultation({ appointmentId, roomToken, patientName, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [startedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState('00:00');
  const [source, setSource] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    setError('');
    if (!appointmentId) {
      setSource(`https://meet.jit.si/nutri-${encodeURIComponent(roomToken)}`);
      return;
    }
    api<{ data: { roomUrl: string } }>(`/api/video/appointments/${appointmentId}/access`, { method: 'POST' })
      .then((response) => setSource(response.data.roomUrl))
      .catch((cause) => {
        // Fallback direto caso a consulta ainda não esteja com status IN_PROGRESS na API
        setSource(`https://meet.jit.si/nutri-${encodeURIComponent(roomToken)}`);
      });
  }, [appointmentId, roomToken]);

  const patientUrl = appointmentId 
    ? `${window.location.origin}/portal` 
    : `https://meet.jit.si/nutri-${encodeURIComponent(roomToken)}`;

  const directRoomUrl = source || `https://meet.jit.si/nutri-${encodeURIComponent(roomToken)}`;

  function copyPatientLink() {
    navigator.clipboard.writeText(directRoomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => undefined);
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
            className="icon-button video-copy-link" 
            onClick={copyPatientLink} 
            title="Copiar link da sala para enviar ao paciente"
          >
            {copied ? <Check size={16} color="#38c777" /> : <Copy size={16} />}
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

      <div className="video-frame">
        {error ? (
          <div className="video-frame-status">
            <strong>Sala indisponível</strong>
            <span>{error}</span>
          </div>
        ) : source ? (
          <iframe 
            src={source} 
            title={`Teleconsulta com ${patientName}`} 
            allow="camera; microphone; fullscreen; display-capture; autoplay" 
          />
        ) : (
          <div className="video-frame-status">
            <span className="spinner" />
            <span>Conectando à sala segura...</span>
          </div>
        )}
      </div>

      <footer>
        <div className="video-footer-info">
          {copied ? (
            <span className="copied-badge"><Check size={13} /> Link copiado!</span>
          ) : (
            <small>Sala moderada com acesso criptografado</small>
          )}
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
              <ExternalLink size={16} />
            </a>
          )}
          <button type="button" className="hangup" onClick={onClose} title="Ocultar split de vídeo">
            <PhoneOff size={16} />
            <span>Fechar split</span>
          </button>
        </div>
      </footer>
    </aside>
  );
}


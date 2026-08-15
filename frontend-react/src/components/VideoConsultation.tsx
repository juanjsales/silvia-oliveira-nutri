import { ExternalLink, Maximize2, Minimize2, PhoneOff } from 'lucide-react';
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
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a sala.'));
  }, [appointmentId, roomToken]);

  return <aside className={`video-consultation ${expanded ? 'expanded' : ''}`}>
    <header>
      <div><span className="live-dot"/><strong>Teleconsulta</strong><small>{patientName}</small></div>
      <time>{elapsed}</time>
      <button className="icon-button video-expand" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Reduzir vídeo' : 'Ampliar vídeo'}>{expanded ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>
    </header>
    <div className="video-frame">
      {error ? <div className="video-frame-status"><strong>Sala indisponível</strong><span>{error}</span></div> : source ? <iframe src={source} title={`Teleconsulta com ${patientName}`} allow="camera; microphone; fullscreen; display-capture; autoplay"/> : <div className="video-frame-status"><span className="spinner"/><span>Preparando a mesma sala do paciente...</span></div>}
    </div>
    <footer>
      <small>Paciente e nutricionista usam a sala vinculada a este agendamento.</small>
      {source && <a className="video-popout" href={source} target="_blank" rel="noreferrer" title="Abrir chamada em nova janela"><ExternalLink size={17}/></a>}
      <button className="hangup" onClick={onClose}><PhoneOff size={18}/><span>Encerrar painel</span></button>
    </footer>
  </aside>;
}

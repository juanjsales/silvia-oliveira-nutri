import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Maximize2,
  Minimize2,
  PhoneOff,
  PieChart,
  RefreshCw,
  Ruler,
  Scale,
  Send,
  Smile,
  Sparkles,
  Target,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTeleconsultation } from '../contexts/TeleconsultationContext';
import { LaminasModal } from './LaminasModal';
import { api } from '../lib/api';

type BroadcastTab = 'medidas' | 'fome' | 'prato' | 'bristol' | 'metas' | 'avaliacao' | 'conduta';

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

export function VideoConsultation({ encounterId, appointmentId, roomToken, patientName, appointmentTime, durationMinutes, sections, onClose }: Props) {
  const { startCall, minimizeCall, endCall } = useTeleconsultation();
  const [expanded, setExpanded] = useState(false);
  const [startedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState('00:00');
  const [source, setSource] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [iframeKey, setIframeKey] = useState(1);
  const [reconnecting, setReconnecting] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastTab | null>('medidas');
  const [broadcastingNotice, setBroadcastingNotice] = useState('');
  const [showBroadcastMenu, setShowBroadcastMenu] = useState(true);
  const [laminasOpen, setLaminasOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    setError('');
    const timeParam = appointmentTime ? `&time=${encodeURIComponent(appointmentTime)}` : '';
    const durParam = durationMinutes ? `&duration=${encodeURIComponent(durationMinutes)}` : '';

    if (!appointmentId) {
      const url = `/videocall.html?room=${encodeURIComponent('nutri-' + roomToken)}&name=${encodeURIComponent('Dra. Silvia Oliveira Lemos')}&role=moderator&minimal=true${timeParam}${durParam}`;
      setSource(url);
      return;
    }
    api<{ data: { roomUrl: string } }>(`/api/video/appointments/${appointmentId}/access`, { method: 'POST' })
      .then((response) => {
        const base = response.data.roomUrl;
        const separator = base.includes('?') ? '&' : '?';
        setSource(`${base}${separator}time=${encodeURIComponent(appointmentTime || '')}&duration=${encodeURIComponent(durationMinutes || 60)}`);
      })
      .catch(() => {
        const url = `/videocall.html?room=${encodeURIComponent('nutri-' + roomToken)}&name=${encodeURIComponent('Dra. Silvia Oliveira Lemos')}&role=moderator&minimal=true${timeParam}${durParam}`;
        setSource(url);
      });
  }, [appointmentId, roomToken, appointmentTime, durationMinutes]);

  useEffect(() => {
    if (source) {
      const returnTarget = encounterId
        ? `/atendimentos?id=${encodeURIComponent(encounterId)}`
        : appointmentId
        ? `/atendimentos?agendamento=${encodeURIComponent(appointmentId)}`
        : '/atendimentos';

      startCall({
        appointmentId,
        roomToken,
        patientName,
        roomUrl: source,
        role: 'ADMIN',
        returnPath: returnTarget,
      });
    }
  }, [source, encounterId, appointmentId, roomToken, patientName]);

  const directRoomUrl = source || `${window.location.origin}/videocall.html?room=${encodeURIComponent('nutri-' + roomToken)}&name=${encodeURIComponent(patientName)}&role=participant`;

  function copyPatientLink() {
    navigator.clipboard.writeText(directRoomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => undefined);
  }

  function handleReconnect() {
    setReconnecting(true);
    setIframeKey((prev) => prev + 1);
    setTimeout(() => setReconnecting(false), 1200);
  }

  async function broadcastToPatient(tab: BroadcastTab, label: string) {
    if (!appointmentId) return;
    setActiveBroadcast(tab);

    const assessment = sections?.assessment || {};
    const conduct = sections?.conduct || {};
    const followup = sections?.followup || {};

    const weightNum = parseFloat(String(assessment.weight || ''));
    const heightNum = parseFloat(String(assessment.height || '')) / 100;
    const bmiCalc = weightNum > 0 && heightNum > 0 ? (weightNum / (heightNum * heightNum)).toFixed(1) : undefined;

    const clinicalData = {
      weight: assessment.weight ? `${assessment.weight} kg` : undefined,
      height: assessment.height ? `${assessment.height} cm` : undefined,
      bmi: bmiCalc,
      bodyFat: assessment.bodyFat ? `${assessment.bodyFat}%` : undefined,
      goals: conduct.goals || followup.nextGoal || undefined,
      guidance: conduct.guidance || undefined,
      dietRating: followup.dietRating || undefined,
    };

    try {
      await api(`/api/video/appointments/${appointmentId}/broadcast`, {
        method: 'POST',
        body: JSON.stringify({
          activeTab: tab,
          clinicalData,
        }),
      });
      setBroadcastingNotice(`Transmitindo: ${label}`);
      setTimeout(() => setBroadcastingNotice(''), 3000);
    } catch {
      // Ignora falhas de broadcast silenciosamente
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

      {/* ── BARRA DE COMANDO DA APRESENTAÇÃO AO PACIENTE ── */}
      {appointmentId && (
        <div className="video-broadcast-bar">
          <div className="broadcast-bar-head">
            <span className="broadcast-tag">
              <Sparkles size={13} /> Transmitir ao Paciente:
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
            <div className="broadcast-actions-row">
              <button
                type="button"
                className={`broadcast-btn ${activeBroadcast === 'medidas' ? 'active' : ''}`}
                onClick={() => broadcastToPatient('medidas', 'Guia de Medidas')}
                title="Mostrar como tirar medidas com a fita métrica"
              >
                <Ruler size={13} /> Medidas
              </button>

              <button
                type="button"
                className={`broadcast-btn ${activeBroadcast === 'fome' ? 'active' : ''}`}
                onClick={() => broadcastToPatient('fome', 'Escala de Fome & Saciedade')}
                title="Mostrar escala de fome de 1 a 10"
              >
                <Smile size={13} /> Fome (1-10)
              </button>

              <button
                type="button"
                className={`broadcast-btn ${activeBroadcast === 'prato' ? 'active' : ''}`}
                onClick={() => broadcastToPatient('prato', 'Prato Saudável')}
                title="Mostrar proporções de macronutrientes"
              >
                <PieChart size={13} /> Prato Ideal
              </button>

              <button
                type="button"
                className={`broadcast-btn ${activeBroadcast === 'bristol' ? 'active' : ''}`}
                onClick={() => broadcastToPatient('bristol', 'Escala de Bristol')}
                title="Mostrar escala de fezes de Bristol"
              >
                <Layers size={13} /> Bristol
              </button>

              <button
                type="button"
                className={`broadcast-btn ${activeBroadcast === 'metas' ? 'active' : ''}`}
                onClick={() => broadcastToPatient('metas', 'Metas da Consulta')}
                title="Transmitir as metas digitadas no prontuário"
              >
                <Target size={13} /> Metas
              </button>

              <button
                type="button"
                className={`broadcast-btn ${activeBroadcast === 'avaliacao' ? 'active' : ''}`}
                onClick={() => broadcastToPatient('avaliacao', 'Avaliação Corporal & IMC')}
                title="Transmitir peso, altura e IMC calculados"
              >
                <Scale size={13} /> Avaliação
              </button>

              <button
                type="button"
                className="broadcast-btn"
                onClick={() => setLaminasOpen(true)}
                title="Ver e Imprimir Lâminas Educativas A4"
                style={{ background: 'rgba(45, 106, 79, 0.15)', borderColor: 'var(--forest)', color: 'var(--forest)', fontWeight: 700 }}
              >
                <BookOpen size={13} /> Lâminas A4
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
            key={iframeKey}
            src={source}
            title="Teleconsulta Nutricional"
            allow="camera; microphone; display-capture; autoplay; fullscreen"
            allowFullScreen
          />
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
          <button type="button" className="hangup" onClick={() => { endCall(); onClose(); }} title="Ocultar split de vídeo">
            <PhoneOff size={16} />
            <span>Fechar split</span>
          </button>
        </div>
      </footer>

      <LaminasModal
        isOpen={laminasOpen}
        onClose={() => setLaminasOpen(false)}
        patientName={patientName}
        onBroadcast={(laminaId, laminaTitle) => {
          const mappedTab: BroadcastTab = laminaId === 'prato-ideal' ? 'prato' : laminaId === 'fome-saciedade' ? 'fome' : 'medidas';
          void broadcastToPatient(mappedTab, laminaTitle);
        }}
      />
    </aside>
  );
}


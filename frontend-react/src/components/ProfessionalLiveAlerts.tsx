import { CalendarDays, Clock3, Sparkles, Stethoscope, Video, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTeleconsultation } from '../contexts/TeleconsultationContext';
import { useToast } from './ToastNotification';
import { api } from '../lib/api';

type ActiveEncounter = {
  id: string;
  patientId: string;
  patientName: string;
  startedAt: string;
  appointmentId: string | null;
  appointmentType: string | null;
  videoRoomToken: string;
};

type TodayAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  appointmentType: string;
  status: string;
};

type LiveStatusData = {
  activeEncounter: ActiveEncounter | null;
  todayAppointments: TodayAppointment[];
};

export function ProfessionalLiveAlerts() {
  const [data, setData] = useState<LiveStatusData | null>(null);
  const [dismissedApptId, setDismissedApptId] = useState<string | null>(null);
  const notifiedThresholdsRef = useRef<Set<string>>(new Set());
  const { showToast } = useToast();
  const { restoreCall, activeCall } = useTeleconsultation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchLiveStatus = async () => {
      try {
        const res = await api<{ data: LiveStatusData }>('/api/encounters/live-status');
        if (!mounted) return;
        setData(res.data);

        // Verifica consultas prestes a acontecer hoje
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        res.data.todayAppointments.forEach((appt) => {
          if (res.data.activeEncounter?.appointmentId === appt.id) return;
          const [h, m] = String(appt.appointmentTime).slice(0, 5).split(':').map(Number);
          if (isNaN(h) || isNaN(m)) return;
          const apptTotalMinutes = h * 60 + m;
          const diff = apptTotalMinutes - currentTotalMinutes;

          // Limiar de 15 minutos
          const key15 = `15min_${appt.id}`;
          if (diff > 0 && diff <= 15 && !notifiedThresholdsRef.current.has(key15)) {
            notifiedThresholdsRef.current.add(key15);
            showToast({
              title: `⏰ Consulta em ${diff} minutos!`,
              message: `${appt.patientName} (${appt.appointmentType || 'Consulta'}) às ${appt.appointmentTime.slice(0, 5)}.`,
              type: 'info',
              actionLabel: 'Abrir Atendimento',
              onAction: () => navigate(`/atendimentos?paciente=${appt.patientId}&agendamento=${appt.id}`),
              duration: 9000,
            });
          }

          // Limiar de início imediato (0 a 3 minutos ou horário já chegado)
          const keyNow = `now_${appt.id}`;
          if (diff <= 1 && diff >= -15 && !notifiedThresholdsRef.current.has(keyNow)) {
            notifiedThresholdsRef.current.add(keyNow);
            showToast({
              title: `🔔 Horário da Consulta!`,
              message: `Consulta de ${appt.patientName} agendada para ${appt.appointmentTime.slice(0, 5)} está no horário.`,
              type: 'call',
              actionLabel: 'Iniciar Agora',
              onAction: () => navigate(`/atendimentos?paciente=${appt.patientId}&agendamento=${appt.id}&video=true`),
              duration: 12000,
            });
          }
        });
      } catch {
        // Silencioso em caso de conexão instável
      }
    };

    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 8000); // Polling a cada 8 segundos

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [showToast, navigate]);

  if (!data) return null;

  const currentEncounterId = new URLSearchParams(location.search).get('id');
  const isCurrentlyInEncounter = location.pathname === '/atendimentos' && Boolean(currentEncounterId && data.activeEncounter?.id === currentEncounterId);

  // 1. Prioridade: Atendimento Ativo em Andamento (quando a nutricionista não estiver na tela exata daquele atendimento)
  if (data.activeEncounter && !isCurrentlyInEncounter) {
    const enc = data.activeEncounter;
    return (
      <aside className="pro-live-top-banner in-progress-banner">
        <div className="pro-live-info">
          <span className="pro-live-pulse-dot" />
          <div>
            <strong>Atendimento clínico em andamento</strong>
            <span>
              Paciente: <b>{enc.patientName}</b> · {enc.appointmentType || 'Consulta Nutricional'}
            </span>
          </div>
        </div>
        <div className="pro-live-actions">
          <button
            type="button"
            className="pro-live-action-btn primary"
            onClick={() => navigate(`/atendimentos?id=${enc.id}&video=true`)}
          >
            <Stethoscope size={15} /> Continuar Atendimento
          </button>
        </div>
      </aside>
    );
  }

  // 2. Próxima consulta hoje (prestes a acontecer em até 35 minutos)
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  const imminent = data.todayAppointments.find((appt) => {
    if (appt.id === dismissedApptId) return false;
    if (data.activeEncounter?.appointmentId === appt.id) return false;
    const [h, m] = String(appt.appointmentTime).slice(0, 5).split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return false;
    const apptTotalMinutes = h * 60 + m;
    const diff = apptTotalMinutes - currentTotalMinutes;
    return diff <= 35 && diff >= -20; // de 35 min antes até 20 min depois do horário
  });

  if (imminent) {
    const [h, m] = String(imminent.appointmentTime).slice(0, 5).split(':').map(Number);
    const diff = h * 60 + m - currentTotalMinutes;
    const timingText =
      diff > 0
        ? `começa em ${diff} minuto${diff > 1 ? 's' : ''}`
        : diff === 0
        ? 'está no horário agora'
        : `iniciou há ${Math.abs(diff)} min`;

    return (
      <aside className="pro-live-top-banner imminent-banner">
        <div className="pro-live-info">
          <span className="pro-imminent-clock-icon">
            <Clock3 size={15} />
          </span>
          <div>
            <strong>Próxima consulta hoje ({timingText})</strong>
            <span>
              <b>{imminent.patientName}</b> · {imminent.appointmentTime.slice(0, 5)} ({imminent.appointmentType || 'Consulta'})
            </span>
          </div>
        </div>
        <div className="pro-live-actions">
          <button
            type="button"
            className="pro-live-action-btn gold"
            onClick={() => navigate(`/atendimentos?paciente=${imminent.patientId}&agendamento=${imminent.id}&video=true`)}
          >
            <Video size={14} /> Atender
          </button>
          <button
            type="button"
            className="pro-live-close-btn"
            onClick={() => setDismissedApptId(imminent.id)}
            title="Dispensar aviso por enquanto"
          >
            <X size={14} />
          </button>
        </div>
      </aside>
    );
  }

  return null;
}

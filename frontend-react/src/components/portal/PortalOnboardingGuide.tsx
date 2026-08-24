import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Compass,
  FileUp,
  Sparkles,
  Utensils,
} from 'lucide-react';
import type { PortalTab } from './PortalBottomNav';

interface PortalOnboardingGuideProps {
  onNavigateTab: (tab: PortalTab) => void;
  hasAppointment?: boolean;
  hasCheckin?: boolean;
  hasExams?: boolean;
  hasPlan?: boolean;
  professionalName?: string;
}

export function PortalOnboardingGuide({
  onNavigateTab,
  hasAppointment = false,
  hasCheckin = false,
  hasExams = false,
  hasPlan = false,
  professionalName = 'sua nutricionista',
}: PortalOnboardingGuideProps) {
  const steps = [
    {
      id: 'appointment',
      title: 'Agendar sua consulta inicial',
      description: hasAppointment
        ? 'Consulta solicitada ou agendada com sucesso.'
        : 'Escolha o melhor dia e horário para seu primeiro atendimento com ' + professionalName + '.',
      tab: 'agenda' as PortalTab,
      completed: hasAppointment,
      actionText: hasAppointment ? 'Ver agendamento' : 'Escolher horário',
      icon: CalendarDays,
    },
    {
      id: 'checkin',
      title: 'Preencher o pré-check-in',
      description: hasCheckin
        ? 'Informações prévias enviadas para análise clínica.'
        : 'Conte seus hábitos, rotina e objetivos para que possamos preparar sua consulta com antecedência.',
      tab: 'checkin' as PortalTab,
      completed: hasCheckin,
      actionText: hasCheckin ? 'Revisar respostas' : 'Preencher agora',
      icon: ClipboardList,
    },
    {
      id: 'exams',
      title: 'Anexar exames recentes',
      description: hasExams
        ? 'Exames laboratoriais enviados com sucesso.'
        : 'Se você possui exames de sangue ou laudos recentes, envie-os em PDF ou foto para avaliação.',
      tab: 'exames' as PortalTab,
      completed: hasExams,
      actionText: hasExams ? 'Ver exames' : 'Enviar arquivos',
      icon: FileUp,
    },
    {
      id: 'plan',
      title: 'Receber seu plano alimentar',
      description: hasPlan
        ? 'Seu plano alimentar personalizado já está disponível!'
        : 'Após a consulta, seu plano alimentar completo, metas e lista de compras ficarão ativos aqui.',
      tab: 'plano' as PortalTab,
      completed: hasPlan,
      actionText: hasPlan ? 'Abrir meu plano' : 'Disponível após a consulta',
      icon: Utensils,
      isFinalStep: true,
    },
  ];

  const completedCount = [hasAppointment, hasCheckin, hasExams, hasPlan].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <section className="portal-onboarding-card" aria-labelledby="onboarding-guide-title">
      <header className="onboarding-card-head">
        <div className="onboarding-head-left">
          <div className="onboarding-icon-badge">
            <Compass size={22} />
          </div>
          <div>
            <div className="onboarding-tag-row">
              <span className="onboarding-tag">
                <Sparkles size={12} /> Primeiros Passos
              </span>
              <span className="onboarding-count-pill">
                {completedCount} de {steps.length} concluídos
              </span>
            </div>
            <h2 id="onboarding-guide-title">Sua Jornada Nutricional Começa Aqui</h2>
            <p>
              Siga estas etapas para que possamos preparar o seu atendimento e seu plano com o máximo de cuidado.
            </p>
          </div>
        </div>

        <div className="onboarding-progress-indicator">
          <div className="onboarding-progress-bar-bg">
            <div
              className="onboarding-progress-bar-fill"
              style={{ width: `${Math.max(12, progressPercent)}%` }}
            />
          </div>
          <span className="onboarding-progress-percent">{progressPercent}% do início</span>
        </div>
      </header>

      <div className="onboarding-steps-list">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isDone = step.completed;

          return (
            <article
              key={step.id}
              className={`onboarding-step-row ${isDone ? 'step-completed' : ''}`}
            >
              <div className="step-number-box">
                {isDone ? (
                  <CheckCircle2 size={20} className="step-check-icon" />
                ) : (
                  <span className="step-num">{index + 1}</span>
                )}
              </div>

              <div className="step-content-box">
                <div className="step-title-line">
                  <Icon size={16} className="step-type-icon" />
                  <strong>{step.title}</strong>
                </div>
                <p>{step.description}</p>
              </div>

              <div className="step-action-box">
                {step.isFinalStep && !isDone ? (
                  <span className="step-pending-tag">Aguardando consulta</span>
                ) : (
                  <button
                    type="button"
                    className={`step-action-btn ${isDone ? 'done-btn' : 'active-btn'}`}
                    onClick={() => onNavigateTab(step.tab)}
                  >
                    <span>{step.actionText}</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

import { BrandWelcomeScreen } from './BrandWelcomeScreen';
import { useClinic } from '../contexts/ClinicContext';

type PortalLoadingScreenProps = {
  message?: string;
  error?: boolean;
  fading?: boolean;
  onRetry?: () => void;
  onExit?: () => void;
};

export function PortalLoadingScreen({
  message = 'Nutrição Clínica & Esportiva · Saúde Integrativa',
  error = false,
  fading = false,
  onRetry,
  onExit,
}: PortalLoadingScreenProps) {
  const clinic = useClinic();
  return (
    <BrandWelcomeScreen
      title={clinic.clinicName}
      subtitle={message}
      badge="Espaço de Cuidado & Bem-Estar"
      error={error}
      fading={fading}
      onRetry={onRetry}
      onExit={onExit}
    />
  );
}

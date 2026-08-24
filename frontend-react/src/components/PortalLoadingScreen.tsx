import { BrandWelcomeScreen } from './BrandWelcomeScreen';

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
  return (
    <BrandWelcomeScreen
      title="Dra. Silvia Oliveira Lemos"
      subtitle={message}
      badge="Espaço de Cuidado & Bem-Estar"
      error={error}
      fading={fading}
      onRetry={onRetry}
      onExit={onExit}
    />
  );
}

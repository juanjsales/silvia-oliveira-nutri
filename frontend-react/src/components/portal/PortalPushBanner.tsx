import { Bell, BellRing, Check, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPushPermission, isPushSupported, isSubscribedToPush, subscribeToPush, unsubscribeFromPush } from '../../lib/push';
import { useToast } from '../ToastNotification';

export function PortalPushBanner() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('portal_push_banner_dismissed') === 'true');
  const { showToast } = useToast();

  useEffect(() => {
    const isSupp = isPushSupported();
    setSupported(isSupp);
    if (isSupp) {
      void isSubscribedToPush().then((isSub) => {
        setSubscribed(isSub);
      });
    }
  }, []);

  if (!supported || dismissed || subscribed) {
    return null;
  }

  const permission = getPushPermission();
  if (permission === 'denied') {
    return null;
  }

  async function handleEnable() {
    setLoading(true);
    const result = await subscribeToPush();
    setLoading(false);

    if (result.success) {
      setSubscribed(true);
      showToast({
        title: 'Notificações ativadas!',
        message: 'Você receberá lembretes de consultas e avisos de novos planos no seu celular.',
        type: 'success',
      });
    } else if (result.error) {
      showToast({
        title: 'Não foi possível ativar',
        message: result.error,
        type: 'warning',
      });
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('portal_push_banner_dismissed', 'true');
  }

  return (
    <div className="portal-push-banner">
      <div className="push-banner-content">
        <div className="push-banner-icon">
          <BellRing size={20} />
        </div>
        <div className="push-banner-text">
          <strong>Receba avisos de consultas e dietas no seu celular</strong>
          <p>Ative as notificações para ser lembrado de teleconsultas, mensagens e novos planos alimentares.</p>
        </div>
      </div>
      <div className="push-banner-actions">
        <button
          type="button"
          className="push-banner-btn-enable"
          onClick={() => void handleEnable()}
          disabled={loading}
        >
          {loading ? 'Ativando...' : 'Ativar Notificações'}
        </button>
        <button
          type="button"
          className="push-banner-btn-close"
          onClick={handleDismiss}
          aria-label="Agora não"
          title="Fechar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function PortalPushSettingToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const isSupp = isPushSupported();
    setSupported(isSupp);
    if (isSupp) {
      void isSubscribedToPush().then((isSub) => setSubscribed(isSub));
    }
  }, []);

  if (!supported) {
    return (
      <div className="push-setting-card unsupported">
        <Bell size={18} />
        <div>
          <strong>Notificações no Dispositivo</strong>
          <p>Este navegador ou modo de navegação não suporta notificações push em segundo plano.</p>
        </div>
      </div>
    );
  }

  async function togglePush() {
    setLoading(true);
    if (subscribed) {
      await unsubscribeFromPush();
      setSubscribed(false);
      showToast({
        title: 'Notificações desativadas',
        message: 'Você não receberá mais avisos push neste dispositivo.',
        type: 'info',
      });
    } else {
      const result = await subscribeToPush();
      if (result.success) {
        setSubscribed(true);
        showToast({
          title: 'Notificações ativadas!',
          message: 'Lembretes de consultas e dietas habilitados com sucesso.',
          type: 'success',
        });
      } else {
        showToast({
          title: 'Atenção',
          message: result.error || 'Não foi possível habilitar notificações.',
          type: 'warning',
        });
      }
    }
    setLoading(false);
  }

  return (
    <div className={`push-setting-card ${subscribed ? 'active' : ''}`}>
      <div className="push-setting-info">
        <div className="push-setting-icon">
          {subscribed ? <BellRing size={20} /> : <Bell size={20} />}
        </div>
        <div>
          <strong>Notificações Push no Celular / Computador</strong>
          <p>
            {subscribed
              ? 'Ativas neste dispositivo. Você será avisado de teleconsultas, dietas e mensagens.'
              : 'Desativadas. Clique para ativar lembretes em tempo real diretamente na tela do seu aparelho.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        className={`push-toggle-btn ${subscribed ? 'btn-disable' : 'btn-enable'}`}
        onClick={() => void togglePush()}
        disabled={loading}
      >
        {loading ? 'Processando...' : subscribed ? 'Desativar' : 'Ativar'}
      </button>
    </div>
  );
}

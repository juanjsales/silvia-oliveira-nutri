import { Download, Smartphone, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verifica se já está rodando em modo standalone (PWA instalado)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone
    ) {
      setIsInstalled(true);
      return;
    }

    // Detecta iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isInstalled || isDismissed) return null;
  if (!deferredPrompt && !isIos) return null;

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  }

  return (
    <>
      <div className="pwa-install-banner">
        <div className="pwa-banner-left">
          <div className="pwa-app-icon">
            <Smartphone size={20} />
          </div>
          <div className="pwa-banner-text">
            <strong>Instale o App no seu Celular</strong>
            <span>Acesse seu plano e diário direto da tela inicial com 1 toque.</span>
          </div>
        </div>

        <div className="pwa-banner-right">
          <button
            type="button"
            className="pwa-install-btn"
            onClick={handleInstallClick}
          >
            <Download size={15} /> Instalar Aplicativo
          </button>
          <button
            type="button"
            className="pwa-close-btn"
            onClick={() => setIsDismissed(true)}
            aria-label="Fechar banner de instalação"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {showIosGuide && (
        <div className="modal-backdrop" onClick={() => setShowIosGuide(false)}>
          <div className="ios-pwa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ios-modal-header">
              <Sparkles size={20} style={{ color: "#203528" }} />
              <h3>Como instalar no seu iPhone / iPad</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowIosGuide(false)}
              >
                <X size={18} />
              </button>
            </div>
            <ol className="ios-steps-list">
              <li>
                Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima ⎋ na barra do Safari).
              </li>
              <li>
                Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (ícone com sinal de ➕).
              </li>
              <li>
                Toque em <strong>"Adicionar"</strong> no canto superior direito.
              </li>
            </ol>
            <p className="ios-modal-footer">
              Pronto! O ícone do consultório aparecerá como um aplicativo junto com seus outros apps.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

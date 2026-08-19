import {
  CalendarDays,
  CreditCard,
  FlaskConical,
  Goal,
  LineChart,
  Menu,
  MessageCircle,
  Salad,
  ShoppingBasket,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import { useState } from "react";

export type PortalTab =
  | "inicio"
  | "plano"
  | "checkin"
  | "jornada"
  | "diario"
  | "exames"
  | "evolucao"
  | "mensagens"
  | "agenda"
  | "metas"
  | "compras"
  | "financeiro"
  | "perfil";

interface PortalBottomNavProps {
  currentTab: PortalTab;
  onChangeTab: (tab: PortalTab) => void;
  unreadCount?: number;
}

export function PortalBottomNav({
  currentTab,
  onChangeTab,
  unreadCount = 0,
}: PortalBottomNavProps) {
  const [showMoreModal, setShowMoreModal] = useState(false);

  const desktopTabs: { key: PortalTab; label: string; icon: any }[] = [
    { key: "inicio", label: "Início", icon: UserRound },
    { key: "plano", label: "Meu Plano", icon: Utensils },
    { key: "diario", label: "Diário & Água", icon: Salad },
    { key: "evolucao", label: "Evolução", icon: LineChart },
    { key: "compras", label: "Lista de Compras", icon: ShoppingBasket },
    { key: "agenda", label: "Agenda", icon: CalendarDays },
    { key: "mensagens", label: "Mensagens", icon: MessageCircle },
    { key: "exames", label: "Exames", icon: FlaskConical },
    { key: "metas", label: "Metas", icon: Goal },
    { key: "financeiro", label: "Financeiro", icon: CreditCard },
    { key: "perfil", label: "Meu Perfil", icon: UserRound },
  ];

  return (
    <>
      {/* ── DESKTOP NAVIGATION PILLS (>= 768px) ── */}
      <nav className="portal-desktop-nav" aria-label="Navegação do Portal">
        {desktopTabs.map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`portal-nav-pill ${isActive ? "active" : ""}`}
              onClick={() => onChangeTab(t.key)}
            >
              <Icon size={16} />
              <span>{t.label}</span>
              {t.key === "mensagens" && unreadCount > 0 && (
                <span style={{ background: "#ef4444", color: "#fff", fontSize: "0.65rem", padding: "1px 6px", borderRadius: 999 }}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── MOBILE BOTTOM NAVIGATION BAR (< 768px) ── */}
      <nav className="portal-bottom-nav" aria-label="Navegação Mobile">
        <button
          type="button"
          className={`bottom-nav-item ${currentTab === "inicio" ? "active" : ""}`}
          onClick={() => onChangeTab("inicio")}
        >
          <UserRound size={20} />
          <span>Início</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${currentTab === "plano" ? "active" : ""}`}
          onClick={() => onChangeTab("plano")}
        >
          <Utensils size={20} />
          <span>Plano</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${currentTab === "diario" ? "active" : ""}`}
          onClick={() => onChangeTab("diario")}
        >
          <Salad size={20} />
          <span>Diário</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${currentTab === "evolucao" ? "active" : ""}`}
          onClick={() => onChangeTab("evolucao")}
        >
          <LineChart size={20} />
          <span>Evolução</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${!["inicio", "plano", "diario", "evolucao"].includes(currentTab) ? "active" : ""}`}
          onClick={() => setShowMoreModal(true)}
        >
          <Menu size={20} />
          <span>Mais</span>
        </button>
      </nav>

      {/* ── MODAL "MAIS OPÇÕES" NO MOBILE ── */}
      {showMoreModal && (
        <div className="modal-backdrop" onClick={() => setShowMoreModal(false)}>
          <div className="ios-pwa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ios-modal-header">
              <h3 style={{ fontSize: "1.1rem" }}>Mais Recursos</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowMoreModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="portal-more-menu-grid">
              <button
                type="button"
                className="more-menu-btn"
                onClick={() => {
                  onChangeTab("compras");
                  setShowMoreModal(false);
                }}
              >
                <ShoppingBasket size={20} style={{ color: "#16a34a" }} />
                <div>
                  <strong>Lista de Compras</strong>
                  <small>Por setores do mercado</small>
                </div>
              </button>

              <button
                type="button"
                className="more-menu-btn"
                onClick={() => {
                  onChangeTab("agenda");
                  setShowMoreModal(false);
                }}
              >
                <CalendarDays size={20} style={{ color: "#2563eb" }} />
                <div>
                  <strong>Agenda</strong>
                  <small>Consultas e retornos</small>
                </div>
              </button>

              <button
                type="button"
                className="more-menu-btn"
                onClick={() => {
                  onChangeTab("mensagens");
                  setShowMoreModal(false);
                }}
              >
                <MessageCircle size={20} style={{ color: "#d97706" }} />
                <div>
                  <strong>Mensagens</strong>
                  <small>Falar com a nutricionista</small>
                </div>
              </button>

              <button
                type="button"
                className="more-menu-btn"
                onClick={() => {
                  onChangeTab("exames");
                  setShowMoreModal(false);
                }}
              >
                <FlaskConical size={20} style={{ color: "#7c3aed" }} />
                <div>
                  <strong>Exames</strong>
                  <small>Laudos e PDFs</small>
                </div>
              </button>

              <button
                type="button"
                className="more-menu-btn"
                onClick={() => {
                  onChangeTab("metas");
                  setShowMoreModal(false);
                }}
              >
                <Goal size={20} style={{ color: "#ea580c" }} />
                <div>
                  <strong>Metas</strong>
                  <small>Objetivos terapêuticos</small>
                </div>
              </button>

              <button
                type="button"
                className="more-menu-btn"
                onClick={() => {
                  onChangeTab("financeiro");
                  setShowMoreModal(false);
                }}
              >
                <CreditCard size={20} style={{ color: "#059669" }} />
                <div>
                  <strong>Financeiro</strong>
                  <small>Pagamentos e recibos</small>
                </div>
              </button>

              <button
                type="button"
                className="more-menu-btn"
                onClick={() => {
                  onChangeTab("perfil");
                  setShowMoreModal(false);
                }}
                style={{ gridColumn: "1 / -1" }}
              >
                <UserRound size={20} style={{ color: "#475569" }} />
                <div>
                  <strong>Meu Perfil & Senha</strong>
                  <small>Dados cadastrais e privacidade</small>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

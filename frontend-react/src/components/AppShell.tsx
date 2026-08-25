import { Activity, CalendarDays, ChevronLeft, CircleDollarSign, FileSearch, FileText, LayoutDashboard, LogOut, Menu, MessageCircle, Salad, Settings, Stethoscope, Users, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClinicMark, useClinic } from '../contexts/ClinicContext';
import { ProfessionalNotifications } from './ProfessionalNotifications';
import { ProfessionalLiveAlerts } from './ProfessionalLiveAlerts';
import { RouteTransition } from './RouteTransition';

const navigation = [
  { to: '/painel', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/pacientes', label: 'Pacientes', icon: Users },
  { to: '/agenda', label: 'Agenda & Atendimentos', icon: CalendarDays },
  { to: '/mensagens', label: 'Mensagens', icon: MessageCircle },
  { to: '/acompanhamento', label: 'Acompanhamento', icon: Activity },
  { to: '/exames', label: 'Exames recebidos', icon: FileSearch },
  { to: '/planos', label: 'Planos e receitas', icon: Salad },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/financeiro', label: 'Financeiro', icon: CircleDollarSign },
  { to: '/configuracoes', label: 'Configurações', icon: Settings }
];

export function AppShell() {
  const [open, setOpen] = useState(false); const { user, logout } = useAuth(); const clinic = useClinic(); const navigate = useNavigate(); const location = useLocation();
  const title = navigation.find(item => item.to === location.pathname)?.label ?? 'Portal Nutricional';
  async function handleLogout() { await logout(); navigate('/login'); }
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="brand"><ClinicMark/><div className="brand-copy"><strong>{clinic.clinicName}</strong><span>{clinic.specialty}</span></div><button className="icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20}/></button></div>
      <div className="sidebar-nav-label">Navegação</div>
      <nav aria-label="Navegação principal">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}><span className="sidebar-nav-icon"><Icon size={19}/></span><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-profile"><div className="avatar">{(user?.name || user?.email || clinic.professionalName).charAt(0).toUpperCase()}</div><div><strong>{user?.name || clinic.professionalName}</strong><span>{user?.email || clinic.specialty}</span></div><button className="icon-button" onClick={handleLogout} aria-label="Sair"><LogOut size={18}/></button></div>
    </aside>
    {open && <button className="sidebar-backdrop" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={21}/></button>
          <div><span className="eyebrow">Espaço profissional</span><h1>{title}</h1></div>
        </div>
        <div className="topbar-actions">
          <ProfessionalNotifications />
          <button className="ghost-button" onClick={() => history.back()}><ChevronLeft size={17}/> Voltar</button>
        </div>
      </header>
      <div className="content">
        <ProfessionalLiveAlerts />
        <RouteTransition><Outlet /></RouteTransition>
      </div>
    </main>
  </div>;
}

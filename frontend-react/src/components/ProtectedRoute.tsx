import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PortalLoadingScreen } from './PortalLoadingScreen';

export function ProtectedRoute() {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return location.pathname.startsWith('/portal')
    ? <PortalLoadingScreen message="Validando seu acesso seguro…" />
    : <div className="route-loading" role="status" aria-live="polite">Carregando página...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

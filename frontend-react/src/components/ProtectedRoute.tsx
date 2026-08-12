import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return <div className="page-loader"><span className="loader-mark">N</span><p>Preparando seu espaço...</p></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

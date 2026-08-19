import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return (
    <div className="page-loader">
      <div className="loader-mark brand-mark-svg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r="48" fill="#203528" stroke="#8ca481" strokeWidth="3"/>
          <path d="M 50 18 Q 72 40 50 82 Q 28 40 50 18 Z" fill="#8ca481" />
          <path d="M 50 18 L 50 82" stroke="#203528" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 50 42 Q 62 34 68 32" stroke="#203528" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M 50 55 Q 38 47 32 45" stroke="#203528" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="68" cy="32" r="2.5" fill="#203528" />
          <circle cx="32" cy="45" r="2.5" fill="#203528" />
        </svg>
      </div>
      <p>Preparando seu espaço...</p>
    </div>
  );
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

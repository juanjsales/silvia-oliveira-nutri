import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export function RoleRoute({role}:{role:'ADMIN'|'PATIENT'}){const{user}=useAuth();return user?.role===role?<Outlet/>:<Navigate to={user?.role==='PATIENT'?'/portal':'/'} replace/>}

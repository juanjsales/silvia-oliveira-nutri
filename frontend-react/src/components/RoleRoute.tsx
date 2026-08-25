import { Navigate, Outlet } from 'react-router-dom';
import { RouteTransition } from './RouteTransition';
import { useAuth } from '../contexts/AuthContext';
export function RoleRoute({role,transition=false}:{role:'ADMIN'|'PATIENT';transition?:boolean}){const{user}=useAuth();if(user?.role!==role)return <Navigate to={user?.role==='PATIENT'?'/portal':'/painel'} replace/>;return transition?<RouteTransition/>:<Outlet/>}

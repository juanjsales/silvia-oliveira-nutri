import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { RoleRoute } from '../components/RoleRoute';
import { BrandWelcomeScreen } from '../components/BrandWelcomeScreen';
import '../platform-accessibility.css';

const LoginPage=lazy(()=>import('../pages/LoginPage').then(module=>({default:module.LoginPage})));
const PlatformPage=lazy(()=>import('../pages/PlatformPage').then(module=>({default:module.PlatformPage})));
const PlatformTenantPage=lazy(()=>import('../pages/PlatformPage').then(module=>({default:module.PlatformTenantPage})));
const PlatformOnboardingPage=lazy(()=>import('../pages/PlatformOnboardingPage').then(module=>({default:module.PlatformOnboardingPage})));

export function App(){return <Suspense fallback={<BrandWelcomeScreen/>}><Routes>
  <Route path="/login" element={<LoginPage/>}/>
  <Route element={<ProtectedRoute/>}><Route element={<RoleRoute role="ADMIN"/>}>
    <Route path="/plataforma" element={<PlatformPage/>}/>
    <Route path="/plataforma/tenants/:tenantId" element={<PlatformTenantPage/>}/>
    <Route path="/plataforma/tenants/:tenantId/onboarding" element={<PlatformOnboardingPage/>}/>
  </Route></Route>
  <Route path="*" element={<Navigate to="/plataforma" replace/>}/>
</Routes></Suspense>}

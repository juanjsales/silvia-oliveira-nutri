import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AppShell } from '../components/AppShell';
import { RoleRoute } from '../components/RoleRoute';
import { TeleconsultationProvider } from '../contexts/TeleconsultationContext';
import { ToastProvider } from '../components/ToastNotification';
import { FloatingCallWidget } from '../components/FloatingCallWidget';
import { ConfirmProvider } from '../components/ConfirmDialog';

const ClinicalOverviewPage = lazy(() => import('../pages/ClinicalOverviewPage').then(module => ({ default: module.ClinicalOverviewPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const DocumentsPage = lazy(() => import('../pages/DocumentsPage').then(module => ({ default: module.DocumentsPage })));
const EncounterPage = lazy(() => import('../pages/EncounterPage').then(module => ({ default: module.EncounterPage })));
const FinancePage = lazy(() => import('../pages/FinancePage').then(module => ({ default: module.FinancePage })));
const FollowUpPage = lazy(() => import('../pages/FollowUpPage').then(module => ({ default: module.FollowUpPage })));
const HomePage = lazy(() => import('../pages/HomePage').then(module => ({ default: module.HomePage })));
const IssuedDocumentPage = lazy(() => import('../pages/IssuedDocumentPage').then(module => ({ default: module.IssuedDocumentPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then(module => ({ default: module.LoginPage })));
const MealPlanEditorPage = lazy(() => import('../pages/MealPlanEditorPage').then(module => ({ default: module.MealPlanEditorPage })));
const MessagesPage = lazy(() => import('../pages/MessagesPage').then(module => ({ default: module.MessagesPage })));
const NutritionLibraryPage = lazy(() => import('../pages/NutritionLibraryPage').then(module => ({ default: module.NutritionLibraryPage })));
const PasswordChangePage = lazy(() => import('../pages/PasswordChangePage').then(module => ({ default: module.PasswordChangePage })));
const PasswordRecoveryPage = lazy(() => import('../pages/PasswordRecoveryPage').then(module => ({ default: module.PasswordRecoveryPage })));
const PasswordResetPage = lazy(() => import('../pages/PasswordResetPage').then(module => ({ default: module.PasswordResetPage })));
const PatientAppointmentsPage = lazy(() => import('../pages/PatientAppointmentsPage').then(module => ({ default: module.PatientAppointmentsPage })));
const PatientDocumentPage = lazy(() => import('../pages/PatientDocumentPage').then(module => ({ default: module.PatientDocumentPage })));
const PatientExamsPage = lazy(() => import('../pages/PatientExamsPage').then(module => ({ default: module.PatientExamsPage })));
const PatientPlanPage = lazy(() => import('../pages/PatientPlanPage').then(module => ({ default: module.PatientPlanPage })));
const PatientPortalPage = lazy(() => import('../pages/PatientPortalPage').then(module => ({ default: module.PatientPortalPage })));
const PatientVideoPage = lazy(() => import('../pages/PatientVideoPage').then(module => ({ default: module.PatientVideoPage })));
const PatientsPage = lazy(() => import('../pages/PatientsPage').then(module => ({ default: module.PatientsPage })));
const PlanDocumentPage = lazy(() => import('../pages/PlanDocumentPage').then(module => ({ default: module.PlanDocumentPage })));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage').then(module => ({ default: module.PrivacyPage })));
const PublicPrivacyPage = lazy(() => import('../pages/PublicPrivacyPage').then(module => ({ default: module.PublicPrivacyPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(module => ({ default: module.SettingsPage })));

function RouteFallback() {
  return <div className="route-loading" role="status" aria-live="polite">Carregando página...</div>;
}

export function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <TeleconsultationProvider>
        <FloatingCallWidget />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacidade" element={<PublicPrivacyPage />} />
        <Route path="/recuperar-senha" element={<PasswordRecoveryPage />} />
        <Route path="/redefinir-senha" element={<PasswordResetPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="PATIENT" />}>
            <Route path="portal" element={<PatientPortalPage />} />
            <Route path="portal/consultas" element={<PatientAppointmentsPage />} />
            <Route path="portal/privacidade" element={<PrivacyPage />} />
            <Route path="portal/alterar-senha" element={<PasswordChangePage />} />
            <Route path="portal/video/:id" element={<PatientVideoPage />} />
            <Route path="portal/plano/:id" element={<PatientPlanPage />} />
            <Route path="portal/documento/:id" element={<PatientDocumentPage />} />
          </Route>
          <Route element={<RoleRoute role="ADMIN" />}>
            <Route
              path="embed/planos/:id"
              element={
                <div className="embedded-route">
                  <MealPlanEditorPage />
                </div>
              }
            />
            <Route path="documentos/plano/:id" element={<PlanDocumentPage />} />
            <Route path="documentos/emitidos/:id" element={<IssuedDocumentPage />} />
            <Route element={<AppShell />}>
              <Route path="painel" element={<DashboardPage />} />
              <Route path="pacientes" element={<PatientsPage />} />
              <Route path="pacientes/:patientId/clinico" element={<ClinicalOverviewPage />} />
              <Route path="agenda" element={<EncounterPage />} />
              <Route path="atendimentos" element={<EncounterPage />} />
              <Route path="mensagens" element={<MessagesPage />} />
              <Route path="acompanhamento" element={<FollowUpPage />} />
              <Route path="exames" element={<PatientExamsPage />} />
              <Route path="planos" element={<NutritionLibraryPage />} />
              <Route path="planos/:id" element={<MealPlanEditorPage />} />
              <Route path="documentos" element={<DocumentsPage />} />
              <Route path="documentos/emissoes" element={<Navigate to="/documentos?tab=emitidos" replace />} />
              <Route path="financeiro" element={<FinancePage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </TeleconsultationProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AppShell } from '../components/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { PatientsPage } from '../pages/PatientsPage';
import { AgendaPage } from '../pages/AgendaPage';
import { EncounterPage } from '../pages/EncounterPage';
import { NutritionLibraryPage } from '../pages/NutritionLibraryPage';
import { MealPlanEditorPage } from '../pages/MealPlanEditorPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { SettingsPage } from '../pages/SettingsPage';
import { PlanDocumentPage } from '../pages/PlanDocumentPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { RoleRoute } from '../components/RoleRoute';
import { PatientPortalPage } from '../pages/PatientPortalPage';
import { PatientPlanPage } from '../pages/PatientPlanPage';
import { FinancePage } from '../pages/FinancePage';
import { DocumentIssuesPage } from '../pages/DocumentIssuesPage';
import { IssuedDocumentPage } from '../pages/IssuedDocumentPage';
import { PatientDocumentPage } from '../pages/PatientDocumentPage';
import { PasswordRecoveryPage } from '../pages/PasswordRecoveryPage';
import { PasswordResetPage } from '../pages/PasswordResetPage';
import { PasswordChangePage } from '../pages/PasswordChangePage';
import { PatientVideoPage } from '../pages/PatientVideoPage';
import { HomePage } from '../pages/HomePage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { PatientAppointmentsPage } from '../pages/PatientAppointmentsPage';
import { ClinicalOverviewPage } from '../pages/ClinicalOverviewPage';
import { MessagesPage } from '../pages/MessagesPage';
import { FollowUpPage } from '../pages/FollowUpPage';
import { PatientExamsPage } from '../pages/PatientExamsPage';
import { TeleconsultationProvider } from '../contexts/TeleconsultationContext';
import { ToastProvider } from '../components/ToastNotification';
import { FloatingCallWidget } from '../components/FloatingCallWidget';

export function App() {
  return (
    <ToastProvider>
      <TeleconsultationProvider>
        <FloatingCallWidget />
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-senha" element={<PasswordRecoveryPage />} />
        <Route path="/redefinir-senha" element={<PasswordResetPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="PATIENT" />}>
            <Route
              path="portal"
              element={
                <>
                  <PatientPortalPage />
                  <div className="portal-floating-actions">
                    <Link to="/portal/consultas">Confirmar consultas</Link>
                    <Link to="/portal/privacidade">Privacidade e meus dados</Link>
                  </div>
                </>
              }
            />
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
    </TeleconsultationProvider>
    </ToastProvider>
  );
}


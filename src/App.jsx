import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import OfflineNotice from "./pages/OfflineNotice";
import RegisterPage from "./pages/register/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";

import ProtectedRoute from "./routes/ProtectedRoute";
import PermissionRoute from "./routes/PermissionRoute";
import HomeRedirect from "./routes/HomeRedirect";
import OldLinkRedirect from "./routes/OldLinkRedirect";
import AppLayout from "./layouts/AppLayout";
import { BRANCH_SETTINGS_TICKS } from "./config/navItems";

// Branch pages
import ReceptionDashboard from "./pages/reception/Dashboard";
import PatientsPage from "./pages/patients/PatientsPage";
import AddPatient from "./pages/patients/AddPatient";
import EditPatient from "./pages/patients/EditPatient";
import PatientFolderPage from "./pages/patients/PatientFolderPage";

import AppointmentsPage from "./pages/appointments/AppointmentsPage";
import AddAppointment from "./pages/appointments/AddAppointment";
import EditAppointment from "./pages/appointments/EditAppointment";
import AppointmentsCalendarPage from "./pages/appointments/AppointmentsCalendarPage";

import PaymentHistory from "./pages/history/PaymentHistory";
import ReportsPage from "./pages/reports/ReportsPage";
import SessionsPage from './pages/sessions/SessionsPage'
import TreatmentPlanPage from './pages/treatment_plan/TreatmentPlanPage'
import RemindersPage from './pages/reminders/RemindersPage'
import FeedbackPage from './pages/feedback/FeedbackPage'
import FeedbackResultsPage from './pages/feedback/FeedbackResultsPage'
import PublicFeedbackForm from './pages/public/PublicFeedbackForm'

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorReport from './pages/doctor/DoctorReport'
import ApptsPerDoctor from './pages/doctor/ApptsPerDoctor'
import TenantSettingsPage from "./pages/settings/TenantSettings";
import BranchSettingsPage from "./pages/settings/BranchSettings";
import RolesPermissionsPage from "./pages/settings/RolesPermissionsPage";
import WorksPage from "./pages/works/WorksPage";
import LabsPage from "./pages/labs/LabsPage";

// Clinic (owner) pages
import TenantDashboard from "./pages/tenant/Dashboard";
import BranchDashboard from "./pages/branch/BranchDashboard";
import TenantBranches from "./pages/tenant/Branches";
import TenantUsers from "./pages/tenant/Users";
import AuditLogPage from "./pages/audit/AuditLogPage";
import AppearanceSettingsPage from "./pages/settings/AppearanceSettingsPage";
import DesignPage from "./pages/settings/DesignPage";

// Admin Platform pages
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import PlansPage from "./pages/admin/Plans";
import FeaturesPage from "./pages/admin/Features";
import SubscriptionRequestsPage from "./pages/admin/SubscriptionRequests";
import RegistrationsPage from "./pages/admin/Registrations";
import AnnouncementsPage from "./pages/admin/Announcements";

// a page that needs ANY of these ticks
const need = (ticks, page) => <PermissionRoute requiredPermission={ticks}>{page}</PermissionRoute>;

export default function App() {
  return (
    <>
      <OfflineNotice />

      <Routes>

        {/* ===================== PUBLIC ===================== */}
        {/* Static clinic QR feedback (walk-in, anonymous) */}
        <Route path="/feedback/clinic/:tenantId/:branchId" element={<PublicFeedbackForm />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Public patient feedback form (opened via the WhatsApp link, no auth) */}
        <Route path="/feedback/:token" element={<PublicFeedbackForm />} />

        {/* Own profile — any logged-in user */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* old home link + old role-based links keep working */}
        <Route path="/dashboard" element={<Navigate to="/home" replace />} />
        {["/reception/*", "/reception", "/branch/*", "/branch", "/doctor/*", "/doctor", "/tenant/*", "/tenant"].map((p) => (
          <Route key={p} path={p} element={<OldLinkRedirect />} />
        ))}

        {/* ===================== THE APP (every clinic user, pages follow their ticks) ===================== */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<HomeRedirect />} />

          {/* dashboards */}
          <Route path="/overview" element={need("view_clinic_dashboard", <TenantDashboard />)} />
          <Route path="/branch-overview" element={need("view_branch_dashboard", <BranchDashboard />)} />
          <Route path="/front-desk" element={need("view_front_desk", <ReceptionDashboard />)} />
          <Route path="/my-day" element={need("view_my_day", <DoctorDashboard />)} />
          <Route path="/my-appointments" element={need("view_my_day", <ApptsPerDoctor />)} />
          <Route path="/my-report" element={need("view_own_report", <DoctorReport />)} />

          {/* branch pages */}
          <Route path="/patients" element={need("view_patient", <PatientsPage />)} />
          <Route path="/patients/add" element={need("create_patient", <AddPatient />)} />
          <Route path="/patients/:patientId/edit" element={need("update_patient", <EditPatient />)} />
          <Route path="/patients/:patientId" element={need("view_patient", <PatientFolderPage />)} />

          <Route path="/appointments" element={need("view_appointment", <AppointmentsPage />)} />
          <Route path="/appointments/calendar" element={need("view_appointment", <AppointmentsCalendarPage />)} />
          <Route path="/appointments/add" element={need("create_appointment", <AddAppointment />)} />
          <Route path="/appointments/:appointmentId/edit" element={need("update_appointment", <EditAppointment />)} />
          <Route path="/appointments/reminders" element={need("send_reminders", <RemindersPage />)} />
          <Route path="/appointments/feedback" element={need("send_reminders", <FeedbackPage />)} />

          <Route path="/sessions" element={need("view_session", <SessionsPage />)} />
          <Route path="/treatment_plan" element={need("manage_tp", <TreatmentPlanPage />)} />
          <Route path="/history" element={need("view_payment", <PaymentHistory />)} />
          <Route path="/reports" element={need("view_reports", <ReportsPage />)} />
          <Route path="/settings/branch" element={need(BRANCH_SETTINGS_TICKS, <BranchSettingsPage />)} />
          <Route path="/settings/roles" element={need("manage_permissions", <RolesPermissionsPage />)} />
          <Route path="/works" element={need("manage_works", <WorksPage />)} />
          <Route path="/lab" element={need("manage_lab", <LabsPage />)} />
          <Route path="/settings" element={<AppearanceSettingsPage />} />
          <Route path="/design" element={<DesignPage />} />

          {/* clinic pages (owner) */}
          <Route path="/clinic/branches" element={need("manage_branches", <TenantBranches />)} />
          <Route path="/clinic/users" element={need("manage_users", <TenantUsers />)} />
          <Route path="/clinic/settings" element={need("manage_tenant_settings", <TenantSettingsPage />)} />
          <Route path="/clinic/feedback" element={need("view_feedback", <FeedbackResultsPage />)} />
          <Route path="/clinic/audit" element={need("view_audit_log", <AuditLogPage />)} />
        </Route>

        {/* ===================== PLATFORM ADMIN ===================== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <PermissionRoute requiredPermission="manage_system">
                <AdminLayout />
              </PermissionRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="features" element={<FeaturesPage />} />
          <Route path="subscriptions" element={<SubscriptionRequestsPage />} />
          <Route path="registrations" element={<RegistrationsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="design" element={<DesignPage />} />
        </Route>

        {/* ===================== FALLBACK ===================== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 10000,
          error: {
            style: { background: '#fff', color: '#dc2626', border: '1px solid #fecaca' },
          },
          success: {
            duration: 4000,
            style: { background: '#fff', color: '#15803d', border: '1px solid #bbf7d0' },
          },
        }}
      />
    </>
  );
}

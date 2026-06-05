import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import OfflineNotice from "./pages/OfflineNotice";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import PermissionRoute from "./routes/PermissionRoute";
import ReceptionLayout from "./layouts/ReceptionLayout";
import DoctorLayout from "./layouts/DoctorLayout";

// Reception pages
import ReceptionDashboard from "./pages/reception/Dashboard";
import PatientsPage from "./pages/patients/PatientsPage";
import AddPatient from "./pages/patients/AddPatient";
import EditPatient from "./pages/patients/EditPatient";
import PatientFolderPage from "./pages/patients/PatientFolderPage";

import AppointmentsPage from "./pages/appointments/AppointmentsPage";
import AddAppointment from "./pages/appointments/AddAppointment";
import EditAppointment from "./pages/appointments/EditAppointment";

import PaymentHistory from "./pages/history/PaymentHistory";
import ReportsPage from "./pages/reports/ReportsPage";
import SessionsPage from './pages/sessions/SessionsPage'
import TreatmentPlanPage from './pages/treatment_plan/TreatmentPlanPage'

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import ApptsPerDoctor from './pages/doctor/ApptsPerDoctor'
import TenantSettingsPage from "./pages/settings/TenantSettings";
import BranchSettingsPage from "./pages/settings/BranchSettings";

// Tenant pages
import TenantLayout from "./layouts/TenantLayout";
import BranchManagerLayout from "./layouts/BranchManagerLayout";
import TenantDashboard from "./pages/tenant/Dashboard";
import TenantBranches from "./pages/tenant/Branches";
import TenantUsers from "./pages/tenant/Users";

// Admin Platform pages
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import PlansPage from "./pages/admin/Plans";
import FeaturesPage from "./pages/admin/Features";

export default function App() {
  return (
    <>
      <OfflineNotice />

      <Routes>

        {/* ===================== PUBLIC ===================== */}
        <Route path="/" element={<Login />} />

        {/* Role home redirect */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* ===================== TENANT ADMIN ===================== */}
        <Route
          path="/tenant"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["tenant_manager"]}>
                <TenantLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<TenantDashboard />} />
          <Route path="branches" element={<TenantBranches />} />
          <Route path="settings" element={<TenantSettingsPage />} />
          <Route path="users" element={<TenantUsers />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        {/* ===================== BRANCH MANAGER ===================== */}
        <Route
          path="/branch"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["branch_manager", "tenant_manager"]}>
                <BranchManagerLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<ReceptionDashboard />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/add" element={<AddPatient />} />
          <Route path="patients/:patientId/edit" element={<EditPatient />} />
          <Route path="patients/:patientId" element={<PatientFolderPage />} />

          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/add" element={<AddAppointment />} />
          <Route path="appointments/:appointmentId/edit" element={<EditAppointment />} />

          <Route path="sessions" element={<SessionsPage />} />
          <Route path="treatment_plan" element={<TreatmentPlanPage />} />
          <Route path="history" element={<PaymentHistory />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings/branch" element={<BranchSettingsPage />} />
        </Route>

        {/* ===================== RECEPTION ===================== */}
        <Route
          path="/reception"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["reception"]}>
                <ReceptionLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<ReceptionDashboard />} />

          <Route path="patients" element={<PermissionRoute requiredPermission="view_patient"><PatientsPage /></PermissionRoute>} />
          <Route path="patients/add" element={<PermissionRoute requiredPermission="create_patient"><AddPatient /></PermissionRoute>} />
          <Route path="patients/:patientId/edit" element={<PermissionRoute requiredPermission="update_patient"><EditPatient /></PermissionRoute>} />
          <Route path="patients/:patientId" element={<PermissionRoute requiredPermission="view_patient"><PatientFolderPage /></PermissionRoute>} />

          <Route path="appointments" element={<PermissionRoute requiredPermission="view_appointment"><AppointmentsPage /></PermissionRoute>} />
          <Route path="appointments/add" element={<PermissionRoute requiredPermission="create_appointment"><AddAppointment /></PermissionRoute>} />
          <Route path="appointments/:appointmentId/edit" element={<PermissionRoute requiredPermission="update_appointment"><EditAppointment /></PermissionRoute>} />

          <Route path="history" element={<PermissionRoute requiredPermission="view_payment"><PaymentHistory /></PermissionRoute>} />

          {/* Reception allowed */}
          <Route path="reports" element={<PermissionRoute requiredPermission="view_reports"><ReportsPage /></PermissionRoute>} />
          <Route path="sessions" element={<PermissionRoute requiredPermission="view_session"><SessionsPage /></PermissionRoute>} />
          <Route path="treatment_plan" element={<PermissionRoute requiredPermission="manage_tp"><TreatmentPlanPage /></PermissionRoute>} />
          <Route path="settings/branch" element={
            <RoleRoute allowedRoles={["branch_manager"]}>
              <BranchSettingsPage />
            </RoleRoute>
          } />
        </Route>

        {/* ===================== DOCTOR ===================== */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["doctor"]}>
                <DoctorLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />
          <Route path="appts_per_doc" element={<ApptsPerDoctor />} />
        </Route>

        {/* ===================== PLATFORM ADMIN ===================== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              {/* Assuming 'platform_admin' role exists or we check permission */}
              <RoleRoute allowedRoles={["platform_admin"]}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="features" element={<FeaturesPage />} />
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

/* =========================================================
   /dashboard -> role based redirect
   ========================================================= */
function DashboardRedirect() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !role) return <Navigate to="/" replace />;

  if (role === 'platform_admin') return <Navigate to="/admin" replace />;

  if (role === 'tenant_manager') return <Navigate to="/tenant" replace />;

  if (role === "branch_manager") return <Navigate to="/branch" replace />;

  if (role === "reception") return <Navigate to="/reception" replace />;

  // doctor
  return <Navigate to="/doctor" replace />;
}

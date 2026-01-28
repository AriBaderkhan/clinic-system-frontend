import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import OfflineNotice from "./pages/OfflineNotice";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

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

          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/add" element={<AddPatient />} />
          <Route path="patients/:patientId/edit" element={<EditPatient />} />
          <Route path="patients/:patientId" element={<PatientFolderPage />} />

          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/add" element={<AddAppointment />} />
          <Route path="appointments/:appointmentId/edit" element={<EditAppointment />} />

          <Route path="history" element={<PaymentHistory />} />

          {/* Reception allowed */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="treatment_plan" element={<TreatmentPlanPage />} />
        </Route>

        {/* ===================== DOCTOR ===================== */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["doctor", "super_doctor"]}>
                <DoctorLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />

          {/* super_doctor only */}
          <Route
            path="reports"
            element={
              <RoleRoute allowedRoles={["super_doctor"]}>
                <ReportsPage />
              </RoleRoute>
            }
          />
          <Route
            path="appts_per_doc"
            element={
              <RoleRoute allowedRoles={["super_doctor", "doctor"]}>
                <ApptsPerDoctor />
              </RoleRoute>
            }
          />
        </Route>

        {/* ===================== FALLBACK ===================== */}
        <Route path="*" element={<NotFound />} />
      </Routes>

    </>
  );
}

/* =========================================================
   /dashboard -> role based redirect
   ========================================================= */
function DashboardRedirect() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // ✅ you have this

  if (!token || !role) return <Navigate to="/" replace />;

  if (role === "reception") return <Navigate to="/reception" replace />;

  // doctor OR super_doctor
  return <Navigate to="/doctor" replace />;
}

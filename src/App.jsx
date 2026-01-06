// import { Routes, Route } from "react-router-dom";

// import Login from "./pages/Login";
// import Dashboard from "./pages/reception/Dashboard";

// import NotFound from "./pages/NotFound";
// import DashboardLayout from "./layouts/ReceptionLayout";
// import ProtectedRoute from "./routes/ProtectedRoute"
// import RoleRoute from "./routes/RoleRoute";

// import PatientsPage from "./pages/patients/PatientsPage";
// import AddPatient from "./pages/patients/AddPatient";
// import EditPatient from "./pages/patients/EditPatient";
// import PatientFolderPage from "./pages/patients/PatientFolderPage";

// import AppointmentPage from "./pages/appointments/AppointmentsPage";
// import AddAppointment from "./pages/appointments/AddAppointment";
// import EditAppointment from "./pages/appointments/EditAppointment";
// // import shpwAppointment from './pages/appointments/appointmentDetails'

// import PaymentHistory from "./pages/history/PaymentHistory";

// import ReportsPage from "./pages/reports/ReportsPage";


// // in your routes file





// function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Login />} />
//       <Route path="/dashboard" element={<ProtectedRoute> <DashboardLayout /> </ProtectedRoute>}>
//         <Route index element={<Dashboard />} />
//         <Route
//           path="patients"
//           element={
//             <RoleRoute allowedRoles={["reception"]}>
//               <PatientsPage />
//             </RoleRoute>
//           }
//         />
//         <Route
//           path="patients/add"
//           element={
//             <RoleRoute allowedRoles={["reception"]}>
//               <AddPatient />
//             </RoleRoute>
//           }
//         />
//         <Route
//           path="patients/:patientId/edit"
//           element={
//             <RoleRoute allowedRoles={["reception"]}>
//               <EditPatient />
//             </RoleRoute>
//           }
//         />
//         <Route
//           path="appointments"
//           element={
//             <RoleRoute allowedRoles={["reception"]}>
//               <AppointmentPage />
//             </RoleRoute>
//           }
//         />
//         <Route
//           path="appointments/add"
//           element={
//             <RoleRoute allowedRoles={["reception"]}>
//               <AddAppointment />
//             </RoleRoute>
//           }
//         />
//         <Route
//           path="appointments/:appointmentId/edit"
//           element={
//             <RoleRoute allowedRoles={["reception"]}>
//               <EditAppointment />
//             </RoleRoute>
//           }
//         />

//         <Route
//           path="history"
//           element={
//             <RoleRoute allowedRoles={["reception"]}>
//               <PaymentHistory />
//             </RoleRoute>
//           }
//         />

//         <Route
//           path="/dashboard/patients/:patientId"
//           element={
//             <RoleRoute allowedRoles={["reception"]}>
//               <PatientFolderPage />
//             </RoleRoute>
//           }
//         />



//         <Route path="/dashboard/reports" element={<RoleRoute allowedRoles={["reception","super_doctor"]}>
//           <ReportsPage />
//         </RoleRoute>} />


//       </Route>
//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   );
// }

// export default App;

// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

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

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import ApptsPerDoctor from './pages/doctor/ApptsPerDoctor'

export default function App() {
  return (
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
            <RoleRoute allowedRoles={["super_doctor","doctor"]}>
              <ApptsPerDoctor />
            </RoleRoute>
          }
        />
      </Route>

      {/* ===================== FALLBACK ===================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
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

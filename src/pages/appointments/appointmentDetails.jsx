// // src/pages/appointments/AppointmentPage.jsx
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import useAppointments from "../../hooks/useAppointments";
// import AppointmentStatusModal from "../../components/appointments/AppointmentStatusModal";
// import AppointmentDetailsModal from "../../components/appointments/AppointmentDetailsModal";
// import appointmentApi from "../../api/appointmentApi";

// function AppointmentPage() {
//   const navigate = useNavigate();
//   const { appointments, isLoading, error, refresh } = useAppointments();

//   const [selectedForStatus, setSelectedForStatus] = useState(null);
//   const [selectedForDetails, setSelectedForDetails] = useState(null);
//   const [actionError, setActionError] = useState("");

//   const handleDelete = async (id) => {
//     const confirmDelete = window.confirm(
//       "Are you sure you want to delete this appointment?"
//     );
//     if (!confirmDelete) return;

//     try {
//       setActionError("");
//       await appointmentApi.deleteAppointment(id);
//       await refresh();
//     } catch (err) {
//       console.error("Failed to delete appointment:", err);
//       const msg =
//         err?.response?.data?.message ||
//         "Could not delete appointment. Please try again.";
//       setActionError(msg);
//     }
//   };

//   const handleEdit = (id) => {
//     navigate(`/dashboard/appointments/${id}/edit`);
//   };

//   return (
//     <div className="space-y-6">
//       {/* Modals */}
//       {selectedForStatus && (
//         <AppointmentStatusModal
//           appointment={selectedForStatus}
//           onClose={() => setSelectedForStatus(null)}
//           onUpdated={refresh}
//         />
//       )}

//       {selectedForDetails && (
//         <AppointmentDetailsModal
//           appointment={selectedForDetails}
//           onClose={() => setSelectedForDetails(null)}
//         />
//       )}

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-lg font-semibold text-slate-900">
//             Appointments
//           </h1>
//           <p className="text-xs text-slate-500">
//             Manage Crown Dental Clinic appointments. View records, update
//             status, and handle follow-ups.
//           </p>
//         </div>

//         <button
//           type="button"
//           onClick={() => navigate("/dashboard/appointments/add")}
//           className="rounded-lg bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
//         >
//           + Add Appointment
//         </button>
//       </div>

//       {/* Content card */}
//       <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
//         {/* Top bar */}
//         <div className="mb-4 flex items-center justify-between gap-3">
//           <div className="text-xs text-slate-500">
//             {isLoading
//               ? "Loading appointments…"
//               : `Total appointments: ${appointments.length}`}
//           </div>
//           <button
//             type="button"
//             onClick={refresh}
//             className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
//           >
//             Refresh
//           </button>
//         </div>

//         {/* Error from fetch */}
//         {error && (
//           <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
//             {error}
//           </div>
//         )}

//         {/* Error from actions (delete etc.) */}
//         {actionError && (
//           <div className="mb-3 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
//             {actionError}
//           </div>
//         )}

//         {/* Empty state */}
//         {!isLoading && !error && appointments.length === 0 && (
//           <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
//             No appointments found. Click &quot;Add Appointment&quot; to create
//             the first record.
//           </div>
//         )}

//         {/* Table */}
//         {appointments.length > 0 && (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-left text-sm">
//               <thead>
//                 <tr className="border-b border-slate-200 text-xs text-slate-500">
//                   <th className="px-3 py-2 font-medium">Patient Name</th>
//                   <th className="px-3 py-2 font-medium">Patient Phone</th>
//                   <th className="px-3 py-2 font-medium">Doctor</th>
//                   <th className="px-3 py-2 font-medium">
//                     Appointment Date/Time
//                   </th>
//                   <th className="px-3 py-2 font-medium">Appointment Type</th>
//                   <th className="px-3 py-2 font-medium">Status</th>
//                   <th className="px-3 py-2 font-medium text-right">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {appointments.map((a) => {
//                   const id = a.id ?? a.appointment_id;

//                   return (
//                     <tr
//                       key={id}
//                       className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
//                     >
//                       {/* Patient name clickable for details */}
//                       <td className="px-3 py-2 text-slate-800">
//                         <button
//                           type="button"
//                           onClick={() => setSelectedForDetails(a)}
//                           className="text-left text-xs font-medium text-slate-800 hover:underline"
//                         >
//                           {a.patient_name}
//                         </button>
//                       </td>

//                       <td className="px-3 py-2 text-slate-700">
//                         {a.patient_phone}
//                       </td>

//                       <td className="px-3 py-2 text-slate-700 capitalize">
//                         {a.doctor_name}
//                       </td>

//                       <td className="px-3 py-2 text-slate-700">
//                         {a.scheduled_start
//                           ? new Date(a.scheduled_start).toLocaleString()
//                           : "-"}
//                       </td>

//                       <td className="px-3 py-2 text-slate-700">
//                         {a.appointment_type}
//                         {a.is_walk_in && (
//                           <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
//                             walk-in
//                           </span>
//                         )}
//                       </td>

//                       {/* Status button opens status modal */}
//                       <td className="px-3 py-2 text-slate-700">
//                         <button
//                           type="button"
//                           onClick={() => setSelectedForStatus(a)}
//                           className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] capitalize text-slate-700 hover:bg-slate-100"
//                         >
//                           {a.status}
//                         </button>
//                       </td>

//                       {/* Actions */}
//                       <td className="px-3 py-2">
//                         <div className="flex items-center justify-end gap-2 text-xs">
//                           <button
//                             type="button"
//                             onClick={() => setSelectedForDetails(a)}
//                             className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
//                           >
//                             View
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => handleEdit(id)}
//                             className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
//                           >
//                             Edit
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => handleDelete(id)}
//                             className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-[11px] text-red-600 hover:bg-red-100"
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default shpwAppointment;

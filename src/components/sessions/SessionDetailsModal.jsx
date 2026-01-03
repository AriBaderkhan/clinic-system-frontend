// src/components/sessions/SessionDetailsModal.jsx
import useSessionDetails from "../../hooks/useSessionDetails";

function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const datePart = d.toLocaleDateString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timePart = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart}`;
}

function SessionDetailsModal({ sessionId, onClose }) {
  const { details, isLoading, error, reload } = useSessionDetails(
    sessionId,
    true
  );

  if (!sessionId) return null;

  const session = details?.session;
  const worksSummary = details?.works_summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Session Details
            </h2>
            <p className="text-xs text-slate-500">
              Full view for this session: works, totals, patient and doctor
              info.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reload}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
          {/* Loading / error */}
          {isLoading && (
            <p className="text-xs text-slate-500">Loading session details…</p>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {!isLoading && !error && !session && (
            <p className="text-xs text-slate-500">
              Session details not available.
            </p>
          )}

          {!isLoading && !error && session && (
            <>
              {/* Patient + Doctor + Appointment */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-medium text-slate-500">
                    Patient
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {session.patient.full_name}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    {session.patient.phone}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-medium text-slate-500">
                    Doctor
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {session.doctor.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Session ID: {session.session_id}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-medium text-slate-500">
                    Appointment
                  </p>
                  <p className="mt-1 text-[12px] text-slate-800">
                    {formatDateTime(session.appointment.start_time)}
                  </p>
                  <p className="text-[11px] text-slate-500 capitalize">
                    Status: {session.appointment.status}
                  </p>
                </div>
              </div>

              {/* Totals */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-medium text-slate-500">
                    Minimum Total
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {session.totals.min_total.toLocaleString("en-US")} IQD
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-medium text-slate-500">
                    Final Total
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {session.totals.total.toLocaleString("en-US")} IQD
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-medium text-slate-500">
                    Paid
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {session.totals.total_paid.toLocaleString("en-US")} IQD
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {session.totals.is_paid ? "Paid" : "Unpaid"}
                  </p>
                </div>
              </div>

              {/* Notes / Next Plan */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-medium text-slate-500">
                    Doctor notes
                  </p>
                  <p className="mt-1 text-[13px] text-slate-800 whitespace-pre-line">
                    {session.plan.notes || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-medium text-slate-500">
                    Next plan
                  </p>
                  <p className="mt-1 text-[13px] text-slate-800 whitespace-pre-line">
                    {session.plan.next_plan || "-"}
                  </p>
                </div>
              </div>

              {/* Works summary */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Works summary
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Grouped by work type: quantity, teeth and total price.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                    {worksSummary?.works?.length || 0} items
                  </span>
                </div>

                {(!worksSummary || worksSummary.works.length === 0) && (
                  <p className="text-xs text-slate-500">
                    No works recorded for this session.
                  </p>
                )}

                {worksSummary && worksSummary.works.length > 0 && (
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-500">
                          <th className="px-3 py-2 font-medium text-[#1DB954]">
                            Work
                          </th>
                          <th className="px-3 py-2 font-medium text-[#1DB954]">
                            Quantity
                          </th>
                          <th className="px-3 py-2 font-medium text-[#1DB954]">
                            Teeth
                          </th>
                          <th className="px-3 py-2 font-medium text-[#1DB954]">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {worksSummary.works.map((w, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="px-3 py-2 text-slate-800">
                              {w.work_name}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {w.quantity}x
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {w.teeth && w.teeth.length > 0
                                ? w.teeth.join(", ")
                                : "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-800">
                              {Number(w.total_price || 0).toLocaleString(
                                "en-US"
                              )}{" "}
                              IQD
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SessionDetailsModal;

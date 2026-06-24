import useSessionDetails from "../../hooks/useSessionDetails";
import { useSettings } from "../../context/SettingContext";
import TeethDiagram, { worksToTeeth } from "./TeethDiagram";
import CaseImagesGrid from "./CaseImagesGrid";
import PrescriptionEditor from "../prescriptions/PrescriptionEditor";

export default function SessionDetailsModal({ sessionId, onClose }) {
  const { formatDateTime, formatMoney } = useSettings();
  const { details, isLoading, error, refresh } = useSessionDetails(sessionId, true);

  if (!sessionId) return null;

  const session = details?.session;
  const worksSummary = details?.works_summary;
  const images = details?.images || [];
  const rxItems = session?.prescription?.items || [];
  const { teeth: markedTeeth, labels: toothLabels } = worksToTeeth(worksSummary?.works);
  const noToothWorks = (worksSummary?.works || []).filter((w) => !w.teeth || w.teeth.length === 0);
  const hasWorks = worksSummary?.works?.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[96vh] w-full max-w-7xl flex-col rounded-2xl bg-white shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-4 sm:px-5 py-3 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Session Details</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Works, totals, patient and doctor info.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={refresh} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100">Refresh</button>
            <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-200">Close</button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading session details…</div>
        ) : error ? (
          <div className="m-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
        ) : !session ? (
          <div className="p-6 text-sm text-slate-500">Session details not available.</div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {/* Complaint (from booking) — full width on top */}
            {session.appointment?.complaint && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">⚠ Complaint</p>
                <p className="mt-0.5 whitespace-pre-line break-words text-[13px] font-medium text-slate-800">{session.appointment.complaint}</p>
              </div>
            )}

            {/* Patient medical info — blood type / allergies / chronic diseases */}
            {(session.patient?.blood_type || session.patient?.allergies || session.patient?.chronic_diseases) && (
              <div className="grid gap-2 sm:grid-cols-3">
                {session.patient.blood_type && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Blood type</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">{session.patient.blood_type}</p>
                  </div>
                )}
                {session.patient.allergies && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">⚠ Allergies</p>
                    <p className="mt-0.5 text-[13px] font-medium text-slate-800">{session.patient.allergies}</p>
                  </div>
                )}
                {session.patient.chronic_diseases && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Chronic diseases</p>
                    <p className="mt-0.5 text-[13px] font-medium text-slate-800">{session.patient.chronic_diseases}</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes — above all, full width */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-medium text-slate-500">Doctor notes</p>
                <p className="mt-1 min-h-[36px] text-[13px] text-slate-800 whitespace-pre-line break-words">{session.plan.notes || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-medium text-slate-500">Next plan</p>
                <p className="mt-1 min-h-[36px] text-[13px] text-slate-800 whitespace-pre-line break-words">{session.plan.next_plan || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-medium text-slate-500">Payment note</p>
                <p className="mt-1 min-h-[36px] text-[13px] text-slate-800 whitespace-pre-line break-words">{session.payment_note || "-"}</p>
              </div>
            </div>

            {/* Middle: details + totals + works  |  teeth chart */}
            <div className="grid gap-3 lg:grid-cols-[minmax(300px,0.85fr),2fr] lg:items-start">
              <div className="space-y-3">
                {/* Patient / Doctor / Appointment */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">Patient</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{session.patient.full_name}</p>
                    <p className="text-[12px] text-slate-500">{session.patient.phone}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">Doctor</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{session.doctor.full_name}</p>
                    <p className="text-[11px] text-slate-500">Session ID: {session.session_id}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">Appointment</p>
                    <p className="mt-1 text-[12px] text-slate-800">{formatDateTime(session.appointment.start_time)}</p>
                    <p className="text-[11px] text-slate-500 capitalize">Status: {session.appointment.status}</p>
                  </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-medium text-slate-500">Minimum total</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{formatMoney(session.totals.min_total, session.currency_code)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-medium text-slate-500">Final total</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{formatMoney(session.totals.total, session.currency_code)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-medium text-slate-500">Paid</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{formatMoney(session.totals.total_paid, session.currency_code)}</p>
                    <p className="text-[11px] text-slate-500">{session.totals.is_paid ? "Paid" : "Unpaid"}</p>
                  </div>
                </div>

                {/* Works summary */}
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Works summary</p>
                    <span className="rounded-full bg-[#015478]/10 px-3 py-1 text-[11px] font-medium text-[#015478] border border-[#015478]/20">{worksSummary?.works?.length || 0} items</span>
                  </div>
                  {!hasWorks ? (
                    <p className="text-xs text-slate-500">No works recorded for this session.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="px-3 py-2 font-medium text-[#015478]">Work</th>
                            <th className="px-3 py-2 font-medium text-[#015478]">Qty</th>
                            <th className="px-3 py-2 font-medium text-[#015478]">Teeth</th>
                            <th className="px-3 py-2 font-medium text-[#015478]">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {worksSummary.works.map((w, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 text-slate-800">
                                {w.work_name}
                                {w.is_plan && (
                                  <span className="ml-2 rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-medium capitalize text-purple-700">{w.plan_type || "plan"}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-700">{w.quantity}x</td>
                              <td className="px-3 py-2 text-slate-700">{w.teeth && w.teeth.length > 0 ? w.teeth.join(", ") : "-"}</td>
                              <td className="px-3 py-2 text-slate-800">{formatMoney(w.total_price, session.currency_code)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Teeth chart */}
              <div className="flex flex-col rounded-xl border border-[#015478]/20 bg-[#015478]/5 p-3 sm:p-4">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#015478] dark:text-sky-300">Teeth chart</p>
                  {noToothWorks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-500">No specific tooth:</span>
                      {noToothWorks.map((w, i) => (
                        <span key={i} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700">
                          {w.work_name}{w.is_plan && w.plan_type ? ` (${String(w.plan_type).toUpperCase()})` : ""} · {w.quantity}x
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 items-center justify-center py-4">
                  {hasWorks ? (
                    <TeethDiagram teeth={markedTeeth} labels={toothLabels} />
                  ) : (
                    <p className="text-xs text-slate-400">No works recorded for this session.</p>
                  )}
                </div>
                <p className="mt-2 text-center text-[11px] text-slate-400">Highlighted = worked this session · tagged = treatment-plan tooth</p>
              </div>
            </div>

            {/* Prescription (read-only) — printable */}
            {rxItems.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <PrescriptionEditor items={rxItems} onChange={() => {}} patientName={session.patient.full_name} readOnly />
              </div>
            )}

            {/* Case images — bottom, full width */}
            <CaseImagesGrid images={images} />
          </div>
        )}
      </div>
    </div>
  );
}

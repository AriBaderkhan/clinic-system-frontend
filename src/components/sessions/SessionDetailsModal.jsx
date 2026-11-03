import { useTranslation } from "react-i18next";
import useSessionDetails from "../../hooks/useSessionDetails";
import { useSettings } from "../../context/SettingContext";
import TeethDiagram, { worksToTeeth } from "./TeethDiagram";
import CaseImagesGrid from "./CaseImagesGrid";
import PrescriptionEditor from "../prescriptions/PrescriptionEditor";

export default function SessionDetailsModal({ sessionId, onClose }) {
  const { t } = useTranslation();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-2 backdrop-blur-sm sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
        {/* Header */}
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{t("sd.title")}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{t("sd.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={refresh} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">{t("sd.refresh")}</button>
            <button type="button" onClick={onClose} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">{t("sd.close")}</button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-slate-500">{t("sd.loading")}</div>
        ) : error ? (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
        ) : !session ? (
          <div className="py-10 text-center text-sm text-slate-500">{t("sd.not_available")}</div>
        ) : (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {/* Complaint (from booking) — full width on top */}
            {session.appointment?.complaint && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">{t("appt.complaint_badge")}</p>
                <p className="mt-0.5 whitespace-pre-line break-words text-[13px] font-medium text-slate-800">{session.appointment.complaint}</p>
              </div>
            )}

            {/* Patient medical info — blood type / allergies / chronic diseases */}
            {(session.patient?.blood_type || session.patient?.allergies || session.patient?.chronic_diseases) && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {session.patient.blood_type && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("appt.blood_type")}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">{session.patient.blood_type}</p>
                  </div>
                )}
                {session.patient.allergies && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">{t("appt.allergies")}</p>
                    <p className="mt-0.5 text-[13px] font-medium text-slate-800">{session.patient.allergies}</p>
                  </div>
                )}
                {session.patient.chronic_diseases && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">{t("appt.chronic")}</p>
                    <p className="mt-0.5 text-[13px] font-medium text-slate-800">{session.patient.chronic_diseases}</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes — above all, full width */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium text-slate-500">{t("sd.doctor_notes")}</p>
                <p className="mt-1 min-h-[36px] whitespace-pre-line break-words text-sm text-slate-900">{session.plan.notes || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium text-slate-500">{t("sd.next_plan")}</p>
                <p className="mt-1 min-h-[36px] whitespace-pre-line break-words text-sm text-slate-900">{session.plan.next_plan || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium text-slate-500">{t("sd.payment_note")}</p>
                <p className="mt-1 min-h-[36px] whitespace-pre-line break-words text-sm text-slate-900">{session.payment_note || "-"}</p>
              </div>
            </div>

            {/* Middle: details + totals + works  |  teeth chart */}
            <div className="grid gap-3 lg:grid-cols-[minmax(300px,0.85fr),2fr] lg:items-start">
              <div className="space-y-3">
                {/* Patient / Doctor / Appointment */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">{t("sd.patient")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{session.patient.full_name}</p>
                    <p className="text-[12px] text-slate-500">{session.patient.phone}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">{t("sd.doctor")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{session.doctor.full_name}</p>
                    <p className="text-[11px] text-slate-500">{t("sd.session_id", { id: session.session_id })}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">{t("sd.appointment")}</p>
                    <p className="mt-1 text-[12px] text-slate-800">{formatDateTime(session.appointment.start_time)}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{t("sd.status", { status: session.appointment.status })}</p>
                  </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium text-slate-500">{t("sd.min_total")}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-slate-900">{formatMoney(session.totals.min_total, session.currency_code)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium text-slate-500">{t("sd.final_total")}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-slate-900">{formatMoney(session.totals.total, session.currency_code)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium text-slate-500">{t("sd.paid")}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-slate-900">{formatMoney(session.totals.total_paid, session.currency_code)}</p>
                    <p className="text-[11px] text-slate-500">{session.totals.is_paid ? t("appt.paid_badge") : t("appt.unpaid_badge")}</p>
                  </div>
                </div>

                {/* Works summary */}
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{t("sd.works_summary")}</p>
                    <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{t("sd.items_count", { count: worksSummary?.works?.length || 0 })}</span>
                  </div>
                  {!hasWorks ? (
                    <p className="py-6 text-center text-sm text-slate-500">{t("sd.no_works")}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-sm">
                        <thead className="bg-slate-50">
                          <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-3 py-2.5 text-start">{t("sd.col_work")}</th>
                            <th className="px-3 py-2.5 text-start">{t("sd.col_qty")}</th>
                            <th className="px-3 py-2.5 text-start">{t("sd.col_teeth")}</th>
                            <th className="px-3 py-2.5 text-start">{t("sd.col_total")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {worksSummary.works.map((w, idx) => (
                            <tr key={idx} className="border-t border-slate-100">
                              <td className="px-3 py-2 text-slate-800">
                                {w.work_name}
                                {w.is_plan && (
                                  <span className="ms-2 inline-flex items-center rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-purple-700">{w.plan_type || t("sd.plan_fallback")}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-700">{w.quantity}x</td>
                              <td className="px-3 py-2 text-slate-700">{w.teeth && w.teeth.length > 0 ? w.teeth.join(", ") : (w.is_whole_mouth ? t("appt.arch_" + (w.arch || "whole")) : "-")}</td>
                              <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums text-slate-900">{formatMoney(w.total_price, session.currency_code)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Teeth chart */}
              <div className="flex flex-col rounded-xl border border-brand/20 bg-brand/5 p-3 sm:p-4">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-brand">{t("sd.teeth_chart")}</p>
                  {noToothWorks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-500">{t("sd.no_specific_tooth")}</span>
                      {noToothWorks.map((w, i) => (
                        <span key={i} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
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
                    <p className="text-xs text-slate-400">{t("sd.no_works")}</p>
                  )}
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">{t("sd.chart_hint")}</p>
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

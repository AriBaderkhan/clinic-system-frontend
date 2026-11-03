import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLabOrderById } from "../../api/labApi";
import { useSettings } from "../../context/SettingContext";

function statusBadgeClasses(status) {
  switch (status) {
    case "ordered":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "ready":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "delivered":
      return "bg-green-50 text-green-700 border-green-100";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xs text-slate-700">{children}</p>
    </div>
  );
}

export default function LabOrderDetailsModal({ orderId, onClose }) {
  const { t } = useTranslation();
  // shown in the branch's configured timezone
  const { formatDateTime: formatDateTimeTz, formatMoney } = useSettings();
  const formatDateTime = (value) => (value ? formatDateTimeTz(value) : "-");

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await getLabOrderById(orderId);
        setOrder(res.data ?? null);
      } catch (err) {
        setError(err.userMessage || t("labm.could_not_load_order"));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [orderId]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-pop sm:p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{t("labm.order_details")}</h2>
            {order && (
              <p className="mt-1 text-xs text-slate-500">
                {order.lab_name} · {order.patient_name}
              </p>
            )}
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {isLoading && <p className="text-xs text-slate-500">{t("labm.loading_order")}</p>}

        {error && !isLoading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && order && (
          <div className="space-y-4 text-sm text-slate-800">
            {/* Status */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize " +
                  statusBadgeClasses(order.status)
                }
              >
                {order.status}
              </span>
            </div>

            {/* Who / where */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t("labm.f_lab")}>
                {order.lab_name}
                {order.lab_phone ? ` · ${order.lab_phone}` : ""}
              </Field>
              <Field label={t("labm.f_patient")}>
                {order.patient_name}
                {order.patient_phone ? ` · ${order.patient_phone}` : ""}
              </Field>
              <Field label={t("labm.f_doctor")}>
                <span className="capitalize">{order.doctor_name}</span>
              </Field>
            </div>

            {/* Appointment link */}
            {order.appointment_id && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("labm.from_appointment")}</p>
                <p className="mt-0.5 text-xs text-slate-700">
                  #{order.appointment_id} · {formatDateTime(order.appointment_date)}
                </p>
              </div>
            )}

            {/* Treatments (line items) */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-start text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 text-start">{t("labm.col_treatment")}</th>
                    <th className="px-4 py-3 text-start">{t("labm.col_qty")}</th>
                    <th className="px-4 py-3 text-start">{t("labm.col_unit")}</th>
                    <th className="px-4 py-3 text-end">{t("labm.col_total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((it) => (
                    <tr key={it.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-900">{it.work_name}</td>
                      <td className="px-4 py-3 text-slate-700">{it.quantity}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">{formatMoney(it.unit_cost, order.currency_code)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-end font-semibold tabular-nums text-slate-900">{formatMoney(it.total_cost, order.currency_code)}</td>
                    </tr>
                  ))}
                  <tr className="bg-brand/5">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600" colSpan={3}>
                      {t("labm.order_total")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-end text-sm font-semibold tabular-nums text-brand">
                      {formatMoney(order.total_cost, order.currency_code)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t("labm.order_date")}>{formatDateTime(order.order_date)}</Field>
              <Field label={t("labm.ready_date")}>{formatDateTime(order.ready_date)}</Field>
              <Field label={t("labm.delivered_date")}>{formatDateTime(order.delivered_date)}</Field>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("labm.notes")}</p>
                <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Created by */}
            <p className="text-xs text-slate-500">
              {t("labm.created_by", { name: order.created_by_name || "-", date: formatDateTime(order.created_at) })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

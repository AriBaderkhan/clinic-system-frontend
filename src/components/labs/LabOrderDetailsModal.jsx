import { useEffect, useState } from "react";
import { getLabOrderById } from "../../api/labApi";
import { useSettings } from "../../context/SettingContext";

function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString();
}

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
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase text-slate-500">{label}</p>
      <p className="text-xs text-slate-700">{children}</p>
    </div>
  );
}

export default function LabOrderDetailsModal({ orderId, onClose }) {
  // shown in the branch's configured timezone
  const { formatDateTime: formatDateTimeTz } = useSettings();
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
        setError(err.userMessage || "Could not load order details.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [orderId]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-4 sm:p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Order details</h2>
            {order && (
              <p className="mt-1 text-[11px] text-slate-500">
                {order.lab_name} · {order.patient_name} · {order.work_name} ×{order.quantity}
              </p>
            )}
          </div>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {isLoading && <p className="text-xs text-slate-500">Loading order…</p>}

        {error && !isLoading && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && order && (
          <div className="space-y-4 text-sm text-slate-800">
            {/* Status */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium capitalize " +
                  statusBadgeClasses(order.status)
                }
              >
                {order.status}
              </span>
            </div>

            {/* Who / where */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <Field label="Lab">
                {order.lab_name}
                {order.lab_phone ? ` · ${order.lab_phone}` : ""}
              </Field>
              <Field label="Patient">
                {order.patient_name}
                {order.patient_phone ? ` · ${order.patient_phone}` : ""}
              </Field>
              <Field label="Doctor">
                <span className="capitalize">{order.doctor_name}</span>
              </Field>
            </div>

            {/* Appointment link */}
            {order.appointment_id && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase text-slate-500">From appointment</p>
                <p className="mt-0.5 text-xs text-slate-700">
                  #{order.appointment_id} · {formatDateTime(order.appointment_date)}
                </p>
              </div>
            )}

            {/* What */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <Field label="Treatment">{order.work_name}</Field>
              <Field label="Quantity">{order.quantity}</Field>
              <Field label="Unit cost">{formatMoney(order.unit_cost)}</Field>
              <Field label="Total">
                <span className="font-semibold text-[#015478]">{formatMoney(order.total_cost)}</span>
              </Field>
            </div>

            {/* Timeline */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <Field label="Order date">{formatDateTime(order.order_date)}</Field>
              <Field label="Ready date">{formatDateTime(order.ready_date)}</Field>
              <Field label="Delivered date">{formatDateTime(order.delivered_date)}</Field>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase text-slate-500">Notes</p>
                <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Created by */}
            <p className="text-[11px] text-slate-400">
              Created by {order.created_by_name || "-"} · {formatDateTime(order.created_at)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

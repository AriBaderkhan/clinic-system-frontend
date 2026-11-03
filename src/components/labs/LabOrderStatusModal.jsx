import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { setLabOrderStatus } from "../../api/labApi";

const STATUS_OPTIONS = [
  { value: "ordered", labelKey: "labm.opt_ordered", hintKey: "labm.hint_ordered" },
  { value: "ready", labelKey: "labm.opt_ready", hintKey: "labm.hint_ready" },
  { value: "delivered", labelKey: "labm.opt_delivered", hintKey: "labm.hint_delivered" },
  { value: "cancelled", labelKey: "labm.opt_cancelled", hintKey: "labm.hint_cancelled" },
];

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

export default function LabOrderStatusModal({ order, onClose, onUpdated }) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const handleSetStatus = async (status) => {
    if (status === order.status) return;
    try {
      setIsSubmitting(true);
      await setLabOrderStatus(order.id, status);
      toast.success(t("labm.marked_as", { status }));
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.userMessage || t("labm.status_update_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-pop">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{t("labm.status_title")}</h2>
            <p className="mt-1 break-words text-xs text-slate-500">
              {order.lab_name} · {order.patient_name} · {order.items_summary || ""}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 shrink-0"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Current status */}
        <div className="mb-4">
          <span
            className={
              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize " +
              statusBadgeClasses(order.status)
            }
          >
            {t("labm.current", { status: order.status })}
          </span>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={isSubmitting || opt.value === order.status}
              onClick={() => handleSetStatus(opt.value)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-start text-sm transition ${
                opt.value === order.status
                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 bg-white text-slate-800 hover:border-brand/40 hover:bg-brand/5"
              }`}
            >
              <span className="font-medium capitalize">{t(opt.labelKey)}</span>
              <span className="text-xs text-slate-500">{t(opt.hintKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

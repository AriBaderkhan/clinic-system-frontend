import { useState } from "react";
import toast from "react-hot-toast";
import { setLabOrderStatus } from "../../api/labApi";

const STATUS_OPTIONS = [
  { value: "ordered", label: "Ordered", hint: "Order sent to the lab" },
  { value: "ready", label: "Ready", hint: "Lab finished the work (ready date saved)" },
  { value: "delivered", label: "Delivered", hint: "Work arrived at the clinic (delivered date saved)" },
  { value: "cancelled", label: "Cancelled", hint: "Order cancelled" },
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const handleSetStatus = async (status) => {
    if (status === order.status) return;
    try {
      setIsSubmitting(true);
      await setLabOrderStatus(order.id, status);
      toast.success(`Order marked as ${status}`);
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.userMessage || "Could not update order status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-4 sm:p-5 shadow-xl">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Change order status</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              {order.lab_name} · {order.patient_name} · {order.items_summary || ""}
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Current status */}
        <div className="mb-4">
          <span
            className={
              "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium capitalize " +
              statusBadgeClasses(order.status)
            }
          >
            Current: {order.status}
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
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                opt.value === order.status
                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 bg-white text-slate-800 hover:border-[#015478]/40 hover:bg-[#015478]/5"
              }`}
            >
              <span className="font-medium capitalize">{opt.label}</span>
              <span className="text-[11px] text-slate-500">{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

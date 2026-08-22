// Reusable confirm dialog, styled to match EditTreatmentPlanModal (jade theme).
// Render it conditionally from the parent: {pending && <ConfirmModal ... />}.
// Pass `danger` to get a red action button (delete/void actions).
export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  loading = false,
  danger = false,
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5 text-sm leading-relaxed text-slate-600">{message}</div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-[#0E6E75] hover:bg-[#0A565C]"
            }`}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

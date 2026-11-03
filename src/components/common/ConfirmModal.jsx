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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 text-sm leading-relaxed text-slate-600">{message}</div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-brand-dark"
            }`}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

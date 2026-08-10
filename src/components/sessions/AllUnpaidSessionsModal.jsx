import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getUnpaidSessions } from "../../api/sessionApi";
import PaySessionModal from "../appointments/PaySessionModal";
import { useSettings } from "../../context/SettingContext";

export default function AllUnpaidSessionsModal({ onClose }) {
  const { t } = useTranslation();
  const { formatTime, formatMoney } = useSettings();
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedForPayment, setSelectedForPayment] = useState(null);

  const fetchAll = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getUnpaidSessions();
      setSessions(res.data || []);
      setTotal(res.total ?? (res.data || []).length);
    } catch (err) {
      setError(err.userMessage || t("aus.could_not_load"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = search.trim()
    ? sessions.filter((s) =>
        s.patient?.full_name?.toLowerCase().includes(search.trim().toLowerCase())
      )
    : sessions;

  const handlePaid = () => {
    setSelectedForPayment(null);
    fetchAll();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[35] flex items-center justify-center p-4">
        <div className="relative flex h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {t("aus.title")}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isLoading ? t("aus.loading") : t("aus.waiting", { count: total })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-slate-100 px-6 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#0E6E75]/20 bg-[#0E6E75]/5 px-3.5 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#0E6E75]/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("aus.search_ph")}
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>
            {search && (
              <p className="mt-1.5 text-[11px] text-slate-400">
                {t("aus.showing", { shown: filtered.length, total })}
              </p>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">

            {/* Error */}
            {error && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm font-medium text-slate-700">
                  {search ? t("aus.no_match") : t("aus.no_unpaid")}
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-2 text-xs text-[#0E6E75] underline"
                  >
                    {t("aus.clear_search")}
                  </button>
                )}
              </div>
            )}

            {/* Session list */}
            {!isLoading && filtered.length > 0 && (
              <div className="space-y-2.5">
                {filtered.map((s) => (
                  <div
                    key={s.session_id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {s.patient?.full_name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {s.doctor?.full_name} · {formatTime(s.appointment?.start_time)} ·{" "}
                        {(s.works_summary?.items_count ?? 0) === 1
                          ? t("aus.work_one", { count: s.works_summary?.items_count ?? 0 })
                          : t("aus.work_other", { count: s.works_summary?.items_count ?? 0 })}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        {t("aus.total_label")}{" "}
                        <span className="font-semibold">{formatMoney(s.totals?.total, s.currency_code)}</span>{" "}
                        · {t("aus.min_label")}{" "}
                        <span className="font-semibold">{formatMoney(s.totals?.min_total, s.currency_code)}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedForPayment(s)}
                      className="ms-4 flex-shrink-0 rounded-full bg-[#0E6E75] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0A565C]"
                    >
                      {t("aus.pay")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </div>

      {/* Pay modal nested inside */}
      {selectedForPayment && (
        <PaySessionModal
          session={selectedForPayment}
          onClose={() => setSelectedForPayment(null)}
          onPaid={handlePaid}
        />
      )}
    </>
  );
}

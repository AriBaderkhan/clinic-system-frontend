import { useState } from "react";
import { useTranslation } from "react-i18next";
import usePaymentHistory from "../../hooks/usePaymentHistory";
import SessionDetailsModal from "../../components/sessions/SessionDetailsModal";
import { useSettings } from "../../context/SettingContext";
import PageHeader from "../../components/common/PageHeader";

export default function PaymentHistory() {
  const { t } = useTranslation();
  const { formatDateTime, formatMoney } = useSettings();
  const { payments, isLoading, error, refresh } = usePaymentHistory();
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const totalAmount = payments.reduce((sum, p) => {
    const val = Number(p.amount || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="w-full space-y-5">
      {/* Session details modal */}
      {selectedSessionId && (
        <SessionDetailsModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}

      {/* Header */}
      <PageHeader
        title={t("clin.ph_title")}
        subtitle={t("clin.ph_subtitle")}
        actions={
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-slate-200 bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/20"
          >
            {t("clin.refresh")}
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          <p className="text-xs font-medium text-slate-500">
            {t("clin.ph_total_collected")}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-[28px]">
            {formatMoney(totalAmount)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          <p className="text-xs font-medium text-slate-500">
            {t("clin.ph_total_payments")}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-[28px]">
            {isLoading ? "…" : payments.length}
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-slate-900">
              {t("clin.ph_title")}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {t("clin.ph_card_subtitle")}
            </p>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && !error && (
          <p className="py-10 text-center text-sm text-slate-500">{t("clin.ph_loading")}</p>
        )}

        {/* Empty */}
        {!isLoading && !error && payments.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">{t("clin.ph_empty")}</p>
        )}

        {/* Table */}
        {!isLoading && !error && payments.length > 0 && (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-start">
                    {t("clin.ph_col_datetime")}
                  </th>
                  <th className="px-4 py-3 text-start">
                    {t("clin.ph_col_patient")}
                  </th>
                  <th className="px-4 py-3 text-start">
                    {t("clin.ph_col_doctor")}
                  </th>
                  <th className="px-4 py-3 text-start">
                    {t("clin.ph_col_amount")}
                  </th>
                  <th className="px-4 py-3 text-start">
                    {t("clin.ph_col_reception")}
                  </th>
                  <th className="px-4 py-3 text-start">
                    {t("clin.ph_col_note")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedSessionId(p.session_id)}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {p.patient_name}
                        </span>
                        <span className="text-xs tabular-nums text-slate-500">
                          {p.patient_phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {p.doctor_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums text-slate-900">
                      {formatMoney(p.amount, p.currency_code)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {p.processed_by || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs">
                      <span className="line-clamp-2 text-xs">
                        {p.note || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


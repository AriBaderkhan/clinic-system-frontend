import { useState } from "react";
import { useTranslation } from "react-i18next";
import usePaymentHistory from "../../hooks/usePaymentHistory";
import SessionDetailsModal from "../../components/sessions/SessionDetailsModal";
import { useSettings } from "../../context/SettingContext";

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
    <div className="space-y-6">
      {/* Session details modal */}
      {selectedSessionId && (
        <SessionDetailsModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {t("clin.ph_title")}
          </h1>
          <p className="text-xs text-slate-500">
            {t("clin.ph_subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
        >
          {t("clin.refresh")}
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            {t("clin.ph_total_collected")}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatMoney(totalAmount)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            {t("clin.ph_total_payments")}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {isLoading ? "…" : payments.length}
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {t("clin.ph_title")}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t("clin.ph_card_subtitle")}
            </p>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && !error && (
          <p className="text-xs text-slate-500">{t("clin.ph_loading")}</p>
        )}

        {/* Empty */}
        {!isLoading && !error && payments.length === 0 && (
          <p className="text-xs text-slate-500">{t("clin.ph_empty")}</p>
        )}

        {/* Table */}
        {!isLoading && !error && payments.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 font-medium text-[#0E6E75]">
                    {t("clin.ph_col_datetime")}
                  </th>
                  <th className="px-3 py-2 font-medium text-[#0E6E75]">
                    {t("clin.ph_col_patient")}
                  </th>
                  <th className="px-3 py-2 font-medium text-[#0E6E75]">
                    {t("clin.ph_col_doctor")}
                  </th>
                  <th className="px-3 py-2 font-medium text-[#0E6E75]">
                    {t("clin.ph_col_amount")}
                  </th>
                  <th className="px-3 py-2 font-medium text-[#0E6E75]">
                    {t("clin.ph_col_reception")}
                  </th>
                  <th className="px-3 py-2 font-medium text-[#0E6E75]">
                    {t("clin.ph_col_note")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedSessionId(p.session_id)}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-3 py-2 text-slate-700">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium">
                          {p.patient_name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {p.patient_phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {p.doctor_name}
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      {formatMoney(p.amount, p.currency_code)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {p.processed_by || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700 max-w-xs">
                      <span className="line-clamp-2 text-[12px]">
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


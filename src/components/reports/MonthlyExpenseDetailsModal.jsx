import { useTranslation } from "react-i18next";
import {
  calcTotalExpenses,
  formatMonth,
} from "../../utils/monthlyExpenses";
import { useSettings } from "../../context/SettingContext";

export default function MonthlyExpenseDetailsModal({ open, loading, data, onClose }) {
  const { t } = useTranslation();
  const { formatDateTime, formatMoney } = useSettings();
  if (!open) return null;

  const row = data || {};
  const total = calcTotalExpenses(row);

  const items = [
    [t("exp.cat_materials"), row.materials],
    [t("exp.cat_salary"), row.salary],
    [t("exp.cat_company_total"), row.company_total],
    [t("exp.cat_electric"), row.electric],
    [t("exp.cat_rent"), row.rent],
    [t("exp.cat_tax"), row.tax],
    [t("exp.cat_marketing"), row.marketing],
    [t("exp.cat_other"), row.other],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              {t("exp.details_title", { month: formatMonth(row.month) })}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {t("exp.company")} <span className="font-medium text-slate-700">{row.company_name || "-"}</span>
              {" · "}
              {t("exp.created_by")} <span className="font-medium text-slate-700">{row.created_by ?? "-"}</span>
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {t("exp.created")} <span className="font-medium text-slate-700">{formatDateTime(row.created_at)}</span>
              {" · "}
              {t("exp.updated")} <span className="font-medium text-slate-700">{formatDateTime(row.updated_at)}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("common.close")}
          </button>
        </div>

        <div className="px-5 py-4">
          {loading ? (
            <div className="text-sm text-slate-500">{t("exp.loading_details")}</div>
          ) : (
            <>
              <div className="rounded-xl border border-brand/20 bg-brand/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700">{t("exp.total_expenses")}</span>
                  <span className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">{formatMoney(total)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {items.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5"
                  >
                    <span className="text-sm text-slate-700">{label}</span>
                    <span className="text-end text-sm font-semibold text-slate-900 tabular-nums">{formatMoney(value)}</span>
                  </div>
                ))}
              </div>

              {row.notes ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-medium text-slate-500">{t("exp.notes")}</div>
                  <div className="mt-1 break-words text-sm text-slate-800">{row.notes}</div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

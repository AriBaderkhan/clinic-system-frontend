import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/SettingContext";

// One short line per money source of an unpaid session:
//   Session: paid X of Y          (normal works)
//   RCT plan: paid X of Y         (one line per treatment plan, whole-plan numbers)
export default function UnpaidMoneyLines({ breakdown, className = "" }) {
    const { t } = useTranslation();
    const { formatMoney } = useSettings();
    const { normal, plans, currency } = breakdown;

    const planLabel = (p) => `${String(p.type || "").toUpperCase()} ${t("appt.pay_plan_suffix")}`;

    return (
        <div className={`space-y-0.5 text-[11px] text-slate-600 ${className}`}>
            {normal.show && (
                <p>
                    {normal.remaining === 0
                        ? t("unpaid.session_done")
                        : t("unpaid.session_line", { paid: formatMoney(normal.paid, currency), total: formatMoney(normal.total, currency) })}
                </p>
            )}
            {plans.map((p) => (
                <p key={p.id}>
                    {p.remaining === 0
                        ? t("unpaid.plan_done", { plan: planLabel(p) })
                        : t("unpaid.plan_line", {
                            plan: planLabel(p),
                            paid: formatMoney(p.total_paid, p.currency_code),
                            total: formatMoney(p.agreed_total, p.currency_code),
                        })}
                </p>
            ))}
        </div>
    );
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getMySubscription, createSubscriptionRequest, getSubscriptionQuote } from "../../api/subscriptionApi";
import { getPlans } from "../../api/planApi";
import { useSubscription } from "../../context/SubscriptionContext";
import BillingPeriodToggle from "./BillingPeriodToggle";
import { planPrice } from "../../utils/billing";

// Manual bank-transfer details the tenant pays to (same number for both).
const BANK_ACCOUNTS = [
    { label: "FIB", number: "7501437572" },
    { label: "Qicard", number: "7501437572" },
];

const STATUS_BADGE = {
    active: "bg-green-50 text-green-700 border-green-200",
    expiring: "bg-amber-50 text-amber-800 border-amber-200",
    expired: "bg-red-50 text-red-700 border-red-200",
    none: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function SubscriptionSection() {
    const { t } = useTranslation();
    const { refresh: refreshCtx } = useSubscription();

    const [status, setStatus] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [billingPeriod, setBillingPeriod] = useState("monthly");
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [quote, setQuote] = useState(null); // exact amount for the chosen plan + period (from the server)

    const load = async () => {
        try {
            setLoading(true);
            const [statusRes, plansRes] = await Promise.all([getMySubscription(), getPlans()]);
            setStatus(statusRes.data);
            setPlans(plansRes.data ?? []);
            setBillingPeriod(statusRes.data?.billing_period || "monthly"); // start on the clinic's current period
        } catch (err) {
            toast.error(err.userMessage || t('subscription.failed_load'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // the server works out the amount (plan or locked price + extra doctors) — the same number the request will carry
    useEffect(() => {
        if (!selectedPlanId) return setQuote(null);
        let alive = true;
        getSubscriptionQuote(selectedPlanId, billingPeriod)
            .then((res) => alive && setQuote(res.data))
            .catch(() => alive && setQuote(null));
        return () => { alive = false; };
    }, [selectedPlanId, billingPeriod]);

    const doctorsText = (n) => (Number(n) === -1 ? t('subscription.unlimited') : n);

    const handleBuy = async () => {
        if (!selectedPlanId) return toast.error(t('subscription.choose_plan'));
        if (!file) return toast.error(t('subscription.attach_evidence'));
        try {
            setSubmitting(true);
            await createSubscriptionRequest(selectedPlanId, billingPeriod, file);
            toast.success(t('subscription.request_sent'));
            setSelectedPlanId(null);
            setFile(null);
            await load();
            await refreshCtx();
        } catch (err) {
            toast.error(err.userMessage || t('subscription.failed_send'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5 text-sm text-slate-500">{t('subscription.loading')}</div>;

    const badge = STATUS_BADGE[status?.status] || STATUS_BADGE.none;

    return (
        <div className="space-y-5">
            {/* Current plan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500">{t('subscription.current_plan')}</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{status?.plan_name || t('subscription.no_plan')}</p>
                        {status?.price != null && (
                            <p className="text-sm text-slate-500 tabular-nums">
                                {status.billing_period === "yearly"
                                    ? t('subscription.price_yearly', { price: status.yearly_price })
                                    : t('subscription.price_monthly', { price: status.price })}
                            </p>
                        )}
                        {status?.included_doctors != null && (
                            <p className="mt-1 text-sm text-slate-600" data-doctors-usage>
                                {t('subscription.doctors_usage', { used: status.doctors_used, included: doctorsText(status.included_doctors) })}
                                {status.next_period_total != null && <> · {t('subscription.next_period', { price: status.next_period_total })}</>}
                            </p>
                        )}
                        {status?.price_locked && (
                            <p className="mt-1.5 inline-flex rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand" data-price-locked>🔒 {t('subscription.price_locked')}</p>
                        )}
                    </div>
                    <div className="text-end">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge}`}>
                            {t(`subscription.status_${status?.status || "none"}`)}
                        </span>
                        {status?.days_left != null && status.status !== "expired" && (
                            <p className="mt-1.5 text-xs text-slate-500">{t('subscription.days_left', { count: status.days_left })}</p>
                        )}
                    </div>
                </div>

                {status?.pending_request && (
                    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-[13px] font-medium text-sky-800">
                        {t('subscription.pending', { plan: status.pending_request.plan_name })}
                    </div>
                )}
            </div>

            {/* Renew / upgrade */}
            {!status?.pending_request && (
                status?.can_renew ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                        <h3 className="text-[15px] font-semibold text-slate-900">{t('subscription.renew_upgrade')}</h3>
                        <p className="mb-4 mt-0.5 text-sm text-slate-500">{t('subscription.renew_hint')}</p>

                        <div className="mb-4">
                            <BillingPeriodToggle value={billingPeriod} onChange={setBillingPeriod} />
                        </div>

                        {/* Plans */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {plans.map((plan) => {
                                const selected = String(selectedPlanId) === String(plan.id);
                                return (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={`min-w-0 rounded-xl border bg-white p-4 text-start transition ${selected ? "border-brand ring-4 ring-brand/15" : "border-slate-200 hover:border-brand/50 hover:bg-slate-50"}`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-bold text-slate-900">{plan.name}</span>
                                            <span className="font-bold text-brand tabular-nums">
                                                {t(`subscription.price_${billingPeriod}`, { price: planPrice(plan, billingPeriod) })}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            {t('subscription.plan_terms', {
                                                branches: plan.max_branches === -1 ? t('subscription.unlimited') : plan.max_branches,
                                                doctors: doctorsText(plan.included_doctors),
                                            })}
                                        </p>
                                        {Number(plan.included_doctors) !== -1 && (
                                            <p className="text-xs text-slate-500">
                                                {Number(plan.extra_doctor_price) < 0
                                                    ? t('subscription.no_extra_doctor')
                                                    : t(`subscription.extra_doctor_${billingPeriod}`, { price: billingPeriod === "yearly" ? plan.extra_doctor_yearly_price : plan.extra_doctor_price })}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Pay + evidence (after a plan is picked) */}
                        {selectedPlanId && (
                            <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                {quote && (
                                    <div className="rounded-xl border border-brand/30 bg-brand/10 px-3.5 py-2.5" data-quote>
                                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                                            {t('subscription.to_pay', { price: quote.total })}
                                            {quote.price_locked && <span className="ms-2 text-xs font-normal text-brand">🔒 {t('subscription.price_locked_short')}</span>}
                                        </p>
                                        {quote.extra_doctors > 0 && quote.extra_doctor_price >= 0 && (
                                            <p className="text-xs text-slate-500">
                                                {t('subscription.to_pay_breakdown', { base: quote.base, count: quote.extra_doctors, each: quote.extra_doctor_price })}
                                            </p>
                                        )}
                                        {quote.extra_doctors > 0 && quote.extra_doctor_price < 0 && (
                                            <p className="text-xs text-red-600">{t('subscription.too_many_doctors', { count: quote.doctors, included: quote.included_doctors })}</p>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{t('subscription.step1')}</p>
                                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {BANK_ACCOUNTS.map((b) => (
                                            <div key={b.label} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                                                <span className="text-sm font-medium text-slate-700">{b.label}</span>
                                                <span className="select-all font-mono text-sm font-semibold text-brand">{b.number}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{t('subscription.step2')}</p>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="mt-2 block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-brand file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-dark"
                                    />
                                    {file && <p className="mt-1 text-xs text-slate-500">{t('subscription.selected_file', { name: file.name })}</p>}
                                </div>

                                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedPlanId(null); setFile(null); }}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleBuy}
                                        disabled={submitting}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                    >
                                        {submitting ? t('subscription.sending') : t('subscription.buy')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5 text-sm text-slate-500">
                        {t('subscription.cannot_renew')}
                    </div>
                )
            )}
        </div>
    );
}

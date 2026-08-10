import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getMySubscription, createSubscriptionRequest } from "../../api/subscriptionApi";
import { getPlans } from "../../api/planApi";
import { useSubscription } from "../../context/SubscriptionContext";

// Manual bank-transfer details the tenant pays to (same number for both).
const BANK_ACCOUNTS = [
    { label: "FIB", number: "7501437572" },
    { label: "Qicard", number: "7501437572" },
];

const STATUS_BADGE = {
    active: "bg-[#0E6E75]/10 text-[#0E6E75] border-[#0E6E75]/20",
    expiring: "bg-amber-50 text-amber-700 border-amber-100",
    expired: "bg-red-50 text-red-700 border-red-100",
    none: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function SubscriptionSection() {
    const { t } = useTranslation();
    const { refresh: refreshCtx } = useSubscription();

    const [status, setStatus] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const [statusRes, plansRes] = await Promise.all([getMySubscription(), getPlans()]);
            setStatus(statusRes.data);
            setPlans(plansRes.data ?? []);
        } catch (err) {
            toast.error(err.userMessage || t('subscription.failed_load'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleBuy = async () => {
        if (!selectedPlanId) return toast.error(t('subscription.choose_plan'));
        if (!file) return toast.error(t('subscription.attach_evidence'));
        try {
            setSubmitting(true);
            await createSubscriptionRequest(selectedPlanId, file);
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

    if (loading) return <div className="rounded-lg bg-white p-6 text-sm text-gray-500 shadow">{t('subscription.loading')}</div>;

    const badge = STATUS_BADGE[status?.status] || STATUS_BADGE.none;

    return (
        <div className="space-y-5">
            {/* Current plan */}
            <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{t('subscription.current_plan')}</p>
                        <p className="mt-0.5 text-xl font-bold text-gray-900">{status?.plan_name || t('subscription.no_plan')}</p>
                        {status?.price != null && <p className="text-sm text-gray-500">{t('subscription.price_period', { price: status.price })}</p>}
                    </div>
                    <div className="text-end">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${badge}`}>
                            {t(`subscription.status_${status?.status || "none"}`)}
                        </span>
                        {status?.days_left != null && status.status !== "expired" && (
                            <p className="mt-1 text-xs text-gray-500">{t('subscription.days_left', { count: status.days_left })}</p>
                        )}
                    </div>
                </div>

                {status?.pending_request && (
                    <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-[13px] text-sky-700">
                        {t('subscription.pending', { plan: status.pending_request.plan_name })}
                    </div>
                )}
            </div>

            {/* Renew / upgrade */}
            {!status?.pending_request && (
                status?.can_renew ? (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h3 className="text-lg font-bold text-gray-800">{t('subscription.renew_upgrade')}</h3>
                        <p className="mb-4 text-sm text-gray-500">{t('subscription.renew_hint')}</p>

                        {/* Plans */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {plans.map((plan) => {
                                const selected = String(selectedPlanId) === String(plan.id);
                                return (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={`rounded-xl border p-4 text-left transition ${selected ? "border-[#0E6E75] ring-2 ring-[#0E6E75]/30" : "border-slate-200 hover:border-[#0E6E75]/50"}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900">{plan.name}</span>
                                            <span className="font-bold text-[#0E6E75]">${plan.price}</span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            {t('subscription.plan_limits', {
                                                branches: plan.max_branches === -1 ? t('subscription.unlimited') : plan.max_branches,
                                                users: plan.max_users === -1 ? t('subscription.unlimited') : plan.max_users,
                                            })}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Pay + evidence (after a plan is picked) */}
                        {selectedPlanId && (
                            <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{t('subscription.step1')}</p>
                                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {BANK_ACCOUNTS.map((b) => (
                                            <div key={b.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                <span className="text-sm font-medium text-slate-700">{b.label}</span>
                                                <span className="select-all font-mono text-sm font-semibold text-[#0E6E75]">{b.number}</span>
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
                                        className="mt-2 block w-full text-sm text-slate-600 file:me-3 file:rounded-md file:border-0 file:bg-[#0E6E75] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[#0A565C]"
                                    />
                                    {file && <p className="mt-1 text-xs text-slate-500">{t('subscription.selected_file', { name: file.name })}</p>}
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedPlanId(null); setFile(null); }}
                                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleBuy}
                                        disabled={submitting}
                                        className="rounded-lg bg-[#0E6E75] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0A565C] disabled:opacity-50"
                                    >
                                        {submitting ? t('subscription.sending') : t('subscription.buy')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow">
                        {t('subscription.cannot_renew')}
                    </div>
                )
            )}
        </div>
    );
}

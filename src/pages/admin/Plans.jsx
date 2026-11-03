import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPlans, createPlan, updatePlan } from '../../api/planApi';
import { getFeatures, getPlanFeatures, assignFeatureToPlan, removeFeatureFromPlan } from '../../api/featureApi';
import PageHeader from '../../components/common/PageHeader';
// import Modal from '../../components/Modal'; // Assuming Modal exists, checking later. If not, simple overlay.
// Reverting to simpler implementation without custom Modal component for now to be safe, or inline it.

export default function PlansPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    // ── Manage-features modal ──
    const [featuresPlan, setFeaturesPlan] = useState(null); // the plan being edited
    const [allFeatures, setAllFeatures] = useState([]);
    const [assignedIds, setAssignedIds] = useState(new Set());
    const [featuresLoading, setFeaturesLoading] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

    // Form State
    // -1 = unlimited (branches, doctors); extra doctor price -1 = no extra doctors on this plan
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        yearly_price: '',
        max_branches: 1,
        included_doctors: 2,
        extra_doctor_price: -1,
        extra_doctor_yearly_price: -1,
        sort_order: 0
    });
    // Yearly price follows monthly x 12 until the admin edits it by hand.
    const [yearlyEdited, setYearlyEdited] = useState(false);

    const handleMonthlyChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            price: value,
            yearly_price: yearlyEdited || value === '' ? prev.yearly_price : String(Math.round(Number(value) * 12 * 100) / 100),
        }));
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const data = await getPlans();
            setPlans(data.data ?? []);
        } catch (error) {
            toast.error(error.userMessage || 'Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                price: plan.price,
                yearly_price: plan.yearly_price,
                max_branches: plan.max_branches,
                included_doctors: plan.included_doctors,
                extra_doctor_price: plan.extra_doctor_price,
                extra_doctor_yearly_price: plan.extra_doctor_yearly_price,
                sort_order: plan.sort_order
            });
            setYearlyEdited(true); // existing plan: keep its saved yearly price
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                price: '',
                yearly_price: '',
                max_branches: 1,
                included_doctors: 2,
                extra_doctor_price: -1,
                extra_doctor_yearly_price: -1,
                sort_order: 0
            });
            setYearlyEdited(false);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await updatePlan(editingPlan.id, formData);
                toast.success('Plan updated successfully');
            } else {
                await createPlan(formData);
                toast.success('Plan created successfully');
            }
            setIsModalOpen(false);
            loadPlans();
        } catch (error) {
            toast.error(error.userMessage || 'Failed to save plan');
        }
    };

    // ── Manage features per plan ──
    const openFeaturesModal = async (plan) => {
        setFeaturesPlan(plan);
        setFeaturesLoading(true);
        try {
            const [all, assigned] = await Promise.all([getFeatures(), getPlanFeatures(plan.id)]);
            setAllFeatures(all.data ?? []);
            setAssignedIds(new Set((assigned.data ?? []).map((f) => f.id)));
        } catch (error) {
            toast.error(error.userMessage || 'Failed to load features');
        } finally {
            setFeaturesLoading(false);
        }
    };

    const toggleFeature = async (featureId, checked) => {
        try {
            setTogglingId(featureId);
            if (checked) await assignFeatureToPlan(featuresPlan.id, featureId);
            else await removeFeatureFromPlan(featuresPlan.id, featureId);
            setAssignedIds((prev) => {
                const next = new Set(prev);
                if (checked) next.add(featureId); else next.delete(featureId);
                return next;
            });
        } catch (error) {
            toast.error(error.userMessage || 'Failed to update feature');
        } finally {
            setTogglingId(null);
        }
    };

    const createPlanBtn = (
        <button
            onClick={() => handleOpenModal()}
            className="rounded-xl bg-aqua px-4 py-2.5 text-sm font-bold text-ocean-deep transition hover:brightness-110"
        >
            Create Plan
        </button>
    );

    if (loading) return (
        <div className="w-full space-y-5">
            <PageHeader title="Subscription Plans" />
            <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5 py-10 text-center text-sm text-slate-500">Loading...</div>
        </div>
    );

    return (
        <div className="w-full space-y-5">
            <PageHeader title="Subscription Plans" actions={createPlanBtn} />

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => (
                    <div key={plan.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                            <h3 className="min-w-0 break-words text-lg font-bold tracking-tight text-slate-900">{plan.name}</h3>
                            <div className="text-end">
                                <div className="text-2xl font-bold tracking-tight text-brand tabular-nums">${plan.price} <span className="text-xs font-medium text-slate-500">/ month</span></div>
                                <div className="text-sm font-semibold text-slate-700 tabular-nums">${plan.yearly_price} <span className="text-xs font-medium text-slate-500">/ year</span></div>
                            </div>
                        </div>

                        <div className="mb-5 flex-1 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-600">
                            <div className="flex justify-between gap-3 py-2">
                                <span>Max Branches</span>
                                <span className="text-end font-medium text-slate-900">{plan.max_branches === -1 ? 'Unlimited' : plan.max_branches}</span>
                            </div>
                            <div className="flex justify-between gap-3 py-2">
                                <span>Doctors included</span>
                                <span className="text-end font-medium text-slate-900">{Number(plan.included_doctors) === -1 ? 'Unlimited' : plan.included_doctors}</span>
                            </div>
                            <div className="flex justify-between gap-3 py-2">
                                <span>Extra doctor</span>
                                <span className="text-end font-medium text-slate-900">
                                    {Number(plan.extra_doctor_price) < 0 ? 'Not offered (upgrade)' : `$${plan.extra_doctor_price} / month · $${plan.extra_doctor_yearly_price} / year`}
                                </span>
                            </div>
                            <div className="flex justify-between gap-3 py-2">
                                <span>Staff (reception, …)</span>
                                <span className="text-end font-medium text-slate-900">Free, unlimited</span>
                            </div>
                        </div>

                        <div className="mt-auto flex flex-wrap gap-2 sm:flex-nowrap">
                            <button
                                onClick={() => handleOpenModal(plan)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => openFeaturesModal(plan)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                            >
                                Features
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="text-base font-semibold text-slate-900">
                                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Monthly price ($)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        value={formData.price}
                                        onChange={(e) => handleMonthlyChange(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Yearly price ($)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        value={formData.yearly_price}
                                        onChange={(e) => { setYearlyEdited(true); setFormData({ ...formData, yearly_price: e.target.value }); }}
                                    />
                                    <p className="mt-1 text-xs text-slate-500">Starts as monthly × 12. You can change it.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Max Branches</label>
                                    <input
                                        type="number"
                                        required
                                        className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        value={formData.max_branches}
                                        onChange={(e) => setFormData({ ...formData, max_branches: e.target.value })}
                                        placeholder="-1 for infinite"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Doctors included</label>
                                    <input
                                        type="number"
                                        name="included_doctors"
                                        required
                                        min={-1}
                                        className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        value={formData.included_doctors}
                                        onChange={(e) => setFormData({ ...formData, included_doctors: e.target.value })}
                                        placeholder="-1 for unlimited"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Extra doctor / month ($)</label>
                                    <input
                                        type="number"
                                        name="extra_doctor_price"
                                        required
                                        min={-1}
                                        step="0.01"
                                        className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        value={formData.extra_doctor_price}
                                        onChange={(e) => setFormData({ ...formData, extra_doctor_price: e.target.value })}
                                        placeholder="-1 = not offered"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Extra doctor / year ($)</label>
                                    <input
                                        type="number"
                                        name="extra_doctor_yearly_price"
                                        required
                                        min={-1}
                                        step="0.01"
                                        className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        value={formData.extra_doctor_yearly_price}
                                        onChange={(e) => setFormData({ ...formData, extra_doctor_yearly_price: e.target.value })}
                                        placeholder="-1 = not offered"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Order (1 = cheapest)</label>
                                    <input
                                        type="number"
                                        name="sort_order"
                                        min={0}
                                        className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                                -1 = unlimited doctors / no extra doctors on this plan (the clinic must upgrade). Extra doctors are added to the renewal price automatically.
                                Clinics that were already paying keep their locked price until they change plan.
                            </p>

                            <div className="-mx-5 flex justify-end gap-2 border-t border-slate-100 px-5 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage-features modal */}
            {featuresPlan && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setFeaturesPlan(null)}
                >
                    <div className="flex w-full max-w-md max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <h3 className="min-w-0 truncate text-base font-semibold text-slate-900">
                                Features — <span className="text-brand">{featuresPlan.name}</span>
                            </h3>
                            <button onClick={() => setFeaturesPlan(null)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900">&times;</button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4">
                        {featuresLoading ? (
                            <p className="animate-pulse py-10 text-center text-sm text-slate-500">Loading features…</p>
                        ) : allFeatures.length === 0 ? (
                            <p className="py-10 text-center text-sm text-slate-500">No features defined yet. Create some on the Features page.</p>
                        ) : (
                            <div className="space-y-2">
                                {allFeatures.map((f) => {
                                    const checked = assignedIds.has(f.id);
                                    return (
                                        <label key={f.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50">
                                            <span className="min-w-0">
                                                <span className="block break-words text-sm font-medium text-slate-900">{f.name}</span>
                                                <span className="block break-all font-mono text-xs text-slate-500">{f.code}</span>
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={togglingId === f.id}
                                                onChange={(e) => toggleFeature(f.id, e.target.checked)}
                                                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        </div>

                        <div className="flex justify-end border-t border-slate-100 px-5 py-4">
                            <button
                                onClick={() => setFeaturesPlan(null)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

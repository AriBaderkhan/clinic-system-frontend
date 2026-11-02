import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPlans, createPlan, updatePlan } from '../../api/planApi';
import { getFeatures, getPlanFeatures, assignFeatureToPlan, removeFeatureFromPlan } from '../../api/featureApi';
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-slate-800">Subscription Plans</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="rounded-md bg-[#0E6E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A565C]"
                >
                    Create Plan
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <div key={plan.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                            <div className="text-end">
                                <div className="text-xl font-bold text-[#0E6E75]">${plan.price} <span className="text-xs font-medium text-slate-500">/ month</span></div>
                                <div className="text-sm font-semibold text-slate-700">${plan.yearly_price} <span className="text-xs font-medium text-slate-500">/ year</span></div>
                            </div>
                        </div>

                        <div className="mb-6 flex-1 space-y-2 text-sm text-slate-600">
                            <div className="flex justify-between border-b pb-1">
                                <span>Max Branches</span>
                                <span className="font-medium">{plan.max_branches === -1 ? 'Unlimited' : plan.max_branches}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span>Doctors included</span>
                                <span className="font-medium">{Number(plan.included_doctors) === -1 ? 'Unlimited' : plan.included_doctors}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span>Extra doctor</span>
                                <span className="font-medium">
                                    {Number(plan.extra_doctor_price) < 0 ? 'Not offered (upgrade)' : `$${plan.extra_doctor_price} / month · $${plan.extra_doctor_yearly_price} / year`}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span>Staff (reception, …)</span>
                                <span className="font-medium">Free, unlimited</span>
                            </div>
                        </div>

                        <div className="mt-auto flex gap-2">
                            <button
                                onClick={() => handleOpenModal(plan)}
                                className="w-full rounded-md border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => openFeaturesModal(plan)}
                                className="w-full rounded-md bg-[#0E6E75] py-2 text-sm font-medium text-white hover:bg-[#0A565C]"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="mb-4 text-lg font-medium text-slate-900">
                            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
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
                                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
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
                                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
                                        value={formData.yearly_price}
                                        onChange={(e) => { setYearlyEdited(true); setFormData({ ...formData, yearly_price: e.target.value }); }}
                                    />
                                    <p className="mt-1 text-xs text-slate-400">Starts as monthly × 12. You can change it.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Max Branches</label>
                                    <input
                                        type="number"
                                        required
                                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
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
                                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
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
                                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
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
                                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
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
                                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">
                                -1 = unlimited doctors / no extra doctors on this plan (the clinic must upgrade). Extra doctors are added to the renewal price automatically.
                                Clinics that were already paying keep their locked price until they change plan.
                            </p>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-[#0E6E75] px-4 py-2 text-sm text-white hover:bg-[#0A565C]"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => e.target === e.currentTarget && setFeaturesPlan(null)}
                >
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-slate-900">
                                Features — <span className="text-[#0E6E75]">{featuresPlan.name}</span>
                            </h3>
                            <button onClick={() => setFeaturesPlan(null)} className="text-xl font-bold text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        {featuresLoading ? (
                            <p className="text-sm text-slate-500">Loading features…</p>
                        ) : allFeatures.length === 0 ? (
                            <p className="text-sm text-slate-500">No features defined yet. Create some on the Features page.</p>
                        ) : (
                            <div className="space-y-2">
                                {allFeatures.map((f) => {
                                    const checked = assignedIds.has(f.id);
                                    return (
                                        <label key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium text-slate-800">{f.name}</span>
                                                <span className="block text-xs text-slate-400">{f.code}</span>
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={togglingId === f.id}
                                                onChange={(e) => toggleFeature(f.id, e.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-[#0E6E75] focus:ring-[#0E6E75]"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={() => setFeaturesPlan(null)}
                                className="rounded-md bg-[#0E6E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A565C]"
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

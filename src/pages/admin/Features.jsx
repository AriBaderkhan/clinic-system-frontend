import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getFeatures, createFeature, getPlanFeatures, assignFeatureToPlan, removeFeatureFromPlan } from '../../api/featureApi';
import { getPlans } from '../../api/planApi';
import ClinicExtras from '../../components/admin/ClinicExtras';

export default function FeaturesPage() {
    const [features, setFeatures] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [planFeatures, setPlanFeatures] = useState([]); // Features assigned to selected plan

    // Create Feature Form
    const [newFeature, setNewFeature] = useState({ name: '', code: '', description: '' });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedPlanId) {
            loadPlanFeatures(selectedPlanId);
        } else {
            setPlanFeatures([]);
        }
    }, [selectedPlanId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [featuresData, plansData] = await Promise.all([getFeatures(), getPlans()]);
            const featuresList = featuresData.data ?? [];
            const plansList = plansData.data ?? [];
            setFeatures(featuresList);
            setPlans(plansList);
            if (plansList.length > 0) setSelectedPlanId(plansList[0].id);
        } catch (error) {
            toast.error(error.userMessage || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadPlanFeatures = async (planId) => {
        try {
            const data = await getPlanFeatures(planId);
            setPlanFeatures(data.data ?? []);
        } catch (error) {
            toast.error(error.userMessage || 'Failed to load plan features');
        }
    };

    const handleCreateFeature = async (e) => {
        e.preventDefault();
        try {
            await createFeature(newFeature);
            toast.success('Feature created');
            setNewFeature({ name: '', code: '', description: '' });
            const data = await getFeatures(); // reload
            setFeatures(data.data ?? []);
        } catch (error) {
            toast.error(error.userMessage || 'Failed to create feature');
        }
    };

    const handleToggleFeature = async (featureId, isAssigned) => {
        if (!selectedPlanId) return;
        try {
            if (isAssigned) {
                // Remove
                await removeFeatureFromPlan(selectedPlanId, featureId);
                toast.success('Feature removed from plan');
            } else {
                // Assign
                await assignFeatureToPlan(selectedPlanId, featureId);
                toast.success('Feature assigned to plan');
            }
            loadPlanFeatures(selectedPlanId);
        } catch (error) {
            toast.error(error.userMessage || 'Failed to update plan feature');
        }
    };

    if (loading) return <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5 py-10 text-center text-sm text-slate-500">Loading...</div>;

    return (
        <div className="grid w-full grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
            {/* Left Column: Create Feature & List */}
            <div className="col-fill lg:col-span-1">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                    <h3 className="mb-4 text-[15px] font-semibold text-slate-900">Create New Feature</h3>
                    <form onSubmit={handleCreateFeature} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Feature Name (e.g. Reports)"
                                required
                                className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                value={newFeature.name}
                                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Code (e.g. reports_module)"
                                required
                                className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                value={newFeature.code}
                                onChange={(e) => setNewFeature({ ...newFeature, code: e.target.value })}
                            />
                        </div>
                        <div>
                            <textarea
                                placeholder="Description"
                                className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                value={newFeature.description}
                                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
                            Create Feature
                        </button>
                    </form>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                    <h3 className="mb-4 text-[15px] font-semibold text-slate-900">All Features</h3>
                    <ul className="space-y-3">
                        {features.map(f => (
                            <li key={f.id} className="flex min-w-0 flex-col border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
                                <span className="break-words font-medium text-slate-900">{f.name}</span>
                                <span className="break-all font-mono text-xs text-slate-500">{f.code}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right Column: Matrix */}
            <div className="col-fill lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-[15px] font-semibold text-slate-900">Assign Features to Plan</h3>
                        <select
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 sm:w-56"
                            value={selectedPlanId || ''}
                            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                        >
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {features.map((feature) => {
                            const isAssigned = planFeatures.some(pf => pf.id === feature.id || pf.feature_id === feature.id || pf.code === feature.code);
                            // Adjust check based on what getPlanFeatures returns (likely list of feature objects)

                            return (
                                <div key={feature.id} className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition ${isAssigned ? 'border-brand/30 bg-brand/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                    <div className="min-w-0">
                                        <p className="break-words font-medium text-slate-900">{feature.name}</p>
                                        <p className="break-all font-mono text-xs text-slate-500">{feature.code}</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleFeature(feature.id, isAssigned)}
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${isAssigned
                                                ? 'bg-brand text-white hover:bg-red-600'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {isAssigned ? 'Active' : 'Enable'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <ClinicExtras features={features} />
        </div>
    );
}

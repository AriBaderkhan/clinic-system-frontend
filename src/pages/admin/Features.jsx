import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getFeatures, createFeature, getPlanFeatures, assignFeatureToPlan, removeFeatureFromPlan } from '../../api/featureApi';
import { getPlans } from '../../api/planApi';

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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Create Feature & List */}
            <div className="space-y-6 lg:col-span-1">
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-medium text-slate-800">Create New Feature</h3>
                    <form onSubmit={handleCreateFeature} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Feature Name (e.g. Reports)"
                                required
                                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
                                value={newFeature.name}
                                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Code (e.g. reports_module)"
                                required
                                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
                                value={newFeature.code}
                                onChange={(e) => setNewFeature({ ...newFeature, code: e.target.value })}
                            />
                        </div>
                        <div>
                            <textarea
                                placeholder="Description"
                                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
                                value={newFeature.description}
                                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="w-full rounded-md bg-[#0E6E75] py-2 text-sm font-medium text-white hover:bg-[#0A565C]">
                            Create Feature
                        </button>
                    </form>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-medium text-slate-800">All Features</h3>
                    <ul className="space-y-3">
                        {features.map(f => (
                            <li key={f.id} className="flex flex-col border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0">
                                <span className="font-medium text-slate-700">{f.name}</span>
                                <span className="font-mono text-xs text-slate-400">{f.code}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right Column: Matrix */}
            <div className="lg:col-span-2">
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-medium text-slate-800">Assign Features to Plan</h3>
                        <select
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none"
                            value={selectedPlanId || ''}
                            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                        >
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {features.map((feature) => {
                            const isAssigned = planFeatures.some(pf => pf.id === feature.id || pf.feature_id === feature.id || pf.code === feature.code);
                            // Adjust check based on what getPlanFeatures returns (likely list of feature objects)

                            return (
                                <div key={feature.id} className={`flex items-center justify-between rounded-md border p-4 transition ${isAssigned ? 'border-[#0E6E75]/30 bg-[#0E6E75]/10' : 'border-slate-200 bg-white'}`}>
                                    <div>
                                        <p className="font-medium text-slate-800">{feature.name}</p>
                                        <p className="text-xs text-slate-500">{feature.code}</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleFeature(feature.id, isAssigned)}
                                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isAssigned
                                                ? 'bg-[#0E6E75]/30 text-[#0E6E75] hover:bg-red-200 hover:text-red-800 hover:content-["Remove"]'
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
        </div>
    );
}

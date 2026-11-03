import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAllTenants, registerTenant } from '../../api/adminApi';
import { getPlans } from '../../api/planApi';
import { updateSubscription } from '../../api/subscriptionApi';
import BillingPeriodToggle from '../../components/subscription/BillingPeriodToggle';
import { planPrice } from '../../utils/billing';
import PageHeader from '../../components/common/PageHeader';

const INPUT = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15';
const LABEL = 'block text-sm font-medium text-slate-700';
const BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60';
const BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50';
const OVERLAY = 'fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm';
const SECTION = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function AdminDashboard() {
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);

    // Register Form
    const [registerForm, setRegisterForm] = useState({
        tenant_name: '',
        manager_name: '',
        manager_email: '',
        manager_password: '',
        plan_id: '',
        billing_period: 'monthly',
        phone: '',
        address: '',
        timezone: 'UTC',
        currency: 'USD'
    });

    // Subscription Form
    const [subForm, setSubForm] = useState({
        plan_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [tenantsRes, plansRes] = await Promise.all([getAllTenants(), getPlans()]);
            const tenantsList = tenantsRes.data ?? [];
            const plansList = plansRes.data ?? [];
            setTenants(tenantsList);
            setPlans(plansList);
            if (plansList.length > 0) {
                setRegisterForm(prev => ({ ...prev, plan_id: plansList[0].id }));
                setSubForm(prev => ({ ...prev, plan_id: plansList[0].id }));
            }
        } catch (error) {
            toast.error(error.userMessage || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        try {
            await registerTenant({
                ...registerForm,
                plan_id: parseInt(registerForm.plan_id)
            });
            toast.success('Tenant registered successfully');
            setIsRegisterOpen(false);
            setRegisterForm({
                tenant_name: '', manager_name: '', manager_email: '', manager_password: '',
                plan_id: plans.length > 0 ? plans[0].id : '', billing_period: 'monthly', phone: '', address: '', timezone: 'UTC', currency: 'USD'
            });
            loadData(); // reload list
        } catch (error) {
            toast.error(error.userMessage || 'Registration failed');
        }
    };

    const handleSubscriptionSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTenant) return;
        // Find subscription ID from tenant object (assuming getAllTenants returns it)
        // If not, we might need a separate call. Backend: getAllTenants returns t.*, s.plan_id.
        // It doesn't seem to return subscription ID explicitly in the SELECT t.*, s.plan_id... 
        // Wait, `s.id` is needed.
        // Let's check backend model `getAllTenants`. 
        // Backend: `SELECT t.*, s.plan_id, p.name...` -> It misses `s.id`.
        // I should probably fix backend or work around it.
        // Workaround: Use `tenant_id` if possible? No, route needs `SubscriptionId`.
        // I will fix the Backend Model first to return `s.id as subscription_id`.

        // Assuming backend fix is done:
        try {
            await updateSubscription(selectedTenant.subscription_id, selectedTenant.id, parseInt(subForm.plan_id));
            toast.success('Subscription updated');
            setIsSubscriptionOpen(false);
            loadData();
        } catch (error) {
            toast.error(error.userMessage || 'Update failed');
        }
    };

    const openSubscriptionModal = (tenant) => {
        setSelectedTenant(tenant);
        setSubForm({ plan_id: tenant.plan_id || (plans.length > 0 ? plans[0].id : '') });
        setIsSubscriptionOpen(true);
    };

    const addTenantBtn = (
        <button
            onClick={() => setIsRegisterOpen(true)}
            className="rounded-xl bg-aqua px-4 py-2.5 text-sm font-bold text-ocean-deep transition hover:brightness-110"
        >
            Add Tenant
        </button>
    );

    if (loading) return (
        <div className="w-full space-y-5">
            <PageHeader title="All Tenants" />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 w-1/3 rounded bg-slate-100" />
                    <div className="h-4 w-full rounded bg-slate-100" />
                    <div className="h-4 w-5/6 rounded bg-slate-100" />
                </div>
                <p className="mt-4 text-center text-sm text-slate-500">Loading...</p>
            </div>
        </div>
    );

    return (
        <div className="w-full space-y-5">
            <PageHeader title="All Tenants" actions={addTenantBtn} />

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                <div className="overflow-x-auto">
                <table className="w-full text-start text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-4 py-3 text-start">Tenant Name</th>
                            <th className="px-4 py-3 text-start">Plan</th>
                            <th className="px-4 py-3 text-start">Status</th>
                            <th className="px-4 py-3 text-start">Created At</th>
                            <th className="px-4 py-3 text-start">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map((tenant) => (
                            <tr key={tenant.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-900">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                                            {tenant.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="min-w-0 break-words">{tenant.name}</span>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tenant.plan_name === 'Pro' ? 'bg-violet-100 text-violet-700' :
                                            tenant.plan_name === 'Enterprise' ? 'bg-amber-50 text-amber-800' :
                                                'bg-brand/10 text-brand'
                                        }`}>
                                        {tenant.plan_name || 'No Plan'}
                                    </span>
                                    {tenant.billing_period && (
                                        <span className="ms-2 text-xs capitalize text-slate-500">{tenant.billing_period}</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tenant.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {tenant.status}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                                    {new Date(tenant.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => openSubscriptionModal(tenant)}
                                        className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10"
                                    >
                                        Manage Plan
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Register Modal */}
            {isRegisterOpen && (
                <div
                    className={OVERLAY}
                    onClick={(e) => e.target === e.currentTarget && setIsRegisterOpen(false)}
                >
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Register New Tenant</h3>
                        </div>
                        <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <h4 className={SECTION}>Clinic Details</h4>
                            </div>
                            <div>
                                <label className={LABEL}>Clinic Name</label>
                                <input type="text" required className={INPUT}
                                    value={registerForm.tenant_name} onChange={e => setRegisterForm({ ...registerForm, tenant_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={LABEL}>Phone</label>
                                <input type="text" className={INPUT}
                                    value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={LABEL}>Address</label>
                                <input type="text" className={INPUT}
                                    value={registerForm.address} onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })} />
                            </div>

                            <div className="md:col-span-2 mt-2 border-t border-slate-100 pt-4">
                                <h4 className={SECTION}>Manager Details</h4>
                            </div>
                            <div>
                                <label className={LABEL}>Full Name</label>
                                <input type="text" required className={INPUT}
                                    value={registerForm.manager_name} onChange={e => setRegisterForm({ ...registerForm, manager_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={LABEL}>Email</label>
                                <input type="email" required className={INPUT}
                                    value={registerForm.manager_email} onChange={e => setRegisterForm({ ...registerForm, manager_email: e.target.value })} />
                            </div>
                            <div>
                                <label className={LABEL}>Password</label>
                                <input type="password" required className={INPUT}
                                    value={registerForm.manager_password} onChange={e => setRegisterForm({ ...registerForm, manager_password: e.target.value })} />
                            </div>

                            <div className="md:col-span-2 mt-2 border-t border-slate-100 pt-4">
                                <h4 className={SECTION}>Subscription</h4>
                            </div>
                            <div className="md:col-span-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className={LABEL}>Select Plan</label>
                                    <BillingPeriodToggle
                                        value={registerForm.billing_period}
                                        onChange={(v) => setRegisterForm({ ...registerForm, billing_period: v })}
                                    />
                                </div>
                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {plans.map(plan => (
                                        <div key={plan.id}
                                            onClick={() => setRegisterForm({ ...registerForm, plan_id: plan.id })}
                                            className={`cursor-pointer rounded-xl border p-3 text-center transition ${parseInt(registerForm.plan_id) === plan.id ? 'border-brand bg-brand/10 ring-4 ring-brand/15' : 'border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="font-semibold text-slate-900">{plan.name}</div>
                                            <div className="mt-0.5 text-sm text-slate-500 tabular-nums">
                                                ${planPrice(plan, registerForm.billing_period)} / {registerForm.billing_period === 'yearly' ? 'year' : 'month'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2 -mx-5 mt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 pt-4">
                                <button type="button" onClick={() => setIsRegisterOpen(false)} className={BTN_SECONDARY}>Cancel</button>
                                <button type="submit" className={BTN_PRIMARY}>Register Tenant</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subscription Modal */}
            {isSubscriptionOpen && selectedTenant && (
                <div
                    className={OVERLAY}
                    onClick={(e) => e.target === e.currentTarget && setIsSubscriptionOpen(false)}
                >
                    <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="text-base font-semibold text-slate-900">Update Subscription</h3>
                        </div>
                        <form onSubmit={handleSubscriptionSubmit}>
                            <div className="space-y-4 px-5 py-4">
                                <p className="text-sm text-slate-500">
                                    Updating plan for <span className="font-semibold text-slate-900">{selectedTenant.name}</span>.
                                </p>
                                <div>
                                    <label className={LABEL}>Select New Plan</label>
                                    <select
                                        className={INPUT}
                                        value={subForm.plan_id}
                                        onChange={(e) => setSubForm({ ...subForm, plan_id: e.target.value })}
                                    >
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                                <button type="button" onClick={() => setIsSubscriptionOpen(false)} className={BTN_SECONDARY}>Cancel</button>
                                <button type="submit" className={BTN_PRIMARY}>Update Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

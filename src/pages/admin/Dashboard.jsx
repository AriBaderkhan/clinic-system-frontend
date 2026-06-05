import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAllTenants, registerTenant } from '../../api/adminApi';
import { getPlans } from '../../api/planApi';
import { updateSubscription } from '../../api/subscriptionApi';

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
            const [tenantsData, plansData] = await Promise.all([getAllTenants(), getPlans()]);
            setTenants(tenantsData);
            setPlans(plansData);
            if (plansData.length > 0) {
                setRegisterForm(prev => ({ ...prev, plan_id: plansData[0].id }));
                setSubForm(prev => ({ ...prev, plan_id: plansData[0].id }));
            }
        } catch (error) {
            console.error(error);
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
                plan_id: plans.length > 0 ? plans[0].id : '', phone: '', address: '', timezone: 'UTC', currency: 'USD'
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-slate-800">All Tenants</h2>
                <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="rounded-md bg-[#015478] px-4 py-2 text-sm font-medium text-white hover:bg-[#013d58]"
                >
                    Add Tenant
                </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-6 py-3">Tenant Name</th>
                            <th className="px-6 py-3">Plan</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Created At</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {tenant.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {tenant.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tenant.plan_name === 'Pro' ? 'bg-purple-100 text-purple-800' :
                                            tenant.plan_name === 'Enterprise' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-[#015478]/20 text-[#015478]'
                                        }`}>
                                        {tenant.plan_name || 'No Plan'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tenant.status === 'active' ? 'bg-[#015478]/20 text-[#015478]' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {tenant.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {new Date(tenant.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => openSubscriptionModal(tenant)}
                                        className="text-[#015478] hover:text-indigo-900"
                                    >
                                        Manage Plan
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Register Modal */}
            {isRegisterOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="mb-4 text-lg font-medium text-slate-900">Register New Tenant</h3>
                        <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <h4 className="mb-2 text-sm font-semibold text-slate-500">Clinic Details</h4>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Clinic Name</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    value={registerForm.tenant_name} onChange={e => setRegisterForm({ ...registerForm, tenant_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Phone</label>
                                <input type="text" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Address</label>
                                <input type="text" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    value={registerForm.address} onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })} />
                            </div>

                            <div className="md:col-span-2 mt-2">
                                <h4 className="mb-2 text-sm font-semibold text-slate-500">Manager Details</h4>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    value={registerForm.manager_name} onChange={e => setRegisterForm({ ...registerForm, manager_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email</label>
                                <input type="email" required className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    value={registerForm.manager_email} onChange={e => setRegisterForm({ ...registerForm, manager_email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                <input type="password" required className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    value={registerForm.manager_password} onChange={e => setRegisterForm({ ...registerForm, manager_password: e.target.value })} />
                            </div>

                            <div className="md:col-span-2 mt-2">
                                <h4 className="mb-2 text-sm font-semibold text-slate-500">Subscription</h4>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Select Plan</label>
                                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {plans.map(plan => (
                                        <div key={plan.id}
                                            onClick={() => setRegisterForm({ ...registerForm, plan_id: plan.id })}
                                            className={`cursor-pointer rounded-lg border p-3 text-center transition ${parseInt(registerForm.plan_id) === plan.id ? 'border-[#015478] bg-[#015478]/10 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="font-medium text-slate-900">{plan.name}</div>
                                            <div className="text-sm text-slate-500">${plan.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2 mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsRegisterOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="rounded-md bg-[#015478] px-4 py-2 text-sm text-white hover:bg-[#013d58]">Register Tenant</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subscription Modal */}
            {isSubscriptionOpen && selectedTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-medium text-slate-900">Update Subscription</h3>
                        <p className="mb-4 text-sm text-slate-500">
                            Updating plan for <span className="font-semibold">{selectedTenant.name}</span>.
                        </p>
                        <form onSubmit={handleSubscriptionSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Select New Plan</label>
                                <select
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#015478] focus:outline-none"
                                    value={subForm.plan_id}
                                    onChange={(e) => setSubForm({ ...subForm, plan_id: e.target.value })}
                                >
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsSubscriptionOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="rounded-md bg-[#015478] px-4 py-2 text-sm text-white hover:bg-[#013d58]">Update Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

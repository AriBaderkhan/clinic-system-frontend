import { useState, useEffect } from "react";
import { getTenant, updateTenant, getBranches, createBranch, updateBranch, deleteBranch } from "../../api/tenantApi";
import { useSettings } from "../../context/SettingContext";
import toast from "react-hot-toast";

export default function TenantSettingsPage() {
    const { refreshSettings } = useSettings();

    // Tenant State
    const [tenant, setTenant] = useState(null);
    const [loadingTenant, setLoadingTenant] = useState(true);
    const [savingTenant, setSavingTenant] = useState(false);
    const [isEditingTenant, setIsEditingTenant] = useState(false);
    const [tenantError, setTenantError] = useState("");
    const [tenantForm, setTenantForm] = useState({
        name: "",
        logo_url: "",
        timezone: "",
        currency_code: ""
    });

    // Branch State
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [branchModalMode, setBranchModalMode] = useState("create"); // 'create' | 'edit'
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [savingBranch, setSavingBranch] = useState(false);
    const [branchError, setBranchError] = useState("");
    const [branchForm, setBranchForm] = useState({
        name: "",
        location: "",
        timezone: "",
        currency_code: ""
    });

    const timezones = Intl.supportedValuesOf('timeZone');
    const currencies = Intl.supportedValuesOf('currency');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([loadTenant(), loadBranches()]);
    };

    const loadTenant = async () => {
        try {
            setLoadingTenant(true);
            setTenantError("");
            const res = await getTenant();
            const data = res.data;
            setTenant(data);
            setTenantForm({
                name: data.name || "",
                logo_url: data.logo_url || "",
                timezone: data.timezone || "",
                currency_code: data.currency_code || ""
            });
        } catch (error) {
            setTenantError(error.userMessage || "Failed to load tenant settings");
        } finally {
            setLoadingTenant(false);
        }
    };

    const loadBranches = async () => {
        try {
            setLoadingBranches(true);
            const res = await getBranches();
            setBranches(res.data || []);
        } catch (error) {
            toast.error("Failed to load branches");
        } finally {
            setLoadingBranches(false);
        }
    };

    // --- Tenant Handlers ---
    const handleSaveTenant = async (e) => {
        e.preventDefault();
        if (!tenantForm.timezone || !tenantForm.currency_code) {
            setTenantError("Please select timezone and currency");
            return;
        }

        try {
            setSavingTenant(true);
            setTenantError("");
            await updateTenant(tenantForm);
            toast.success("Tenant settings updated");
            setIsEditingTenant(false);
            await loadTenant();
            await refreshSettings();
        } catch (error) {
            toast.error(error.userMessage || "Failed to update settings");
        } finally {
            setSavingTenant(false);
        }
    };

    const cancelEditTenant = () => {
        setIsEditingTenant(false);
        setTenantError("");
        if (tenant) {
            setTenantForm({
                name: tenant.name || "",
                logo_url: tenant.logo_url || "",
                timezone: tenant.timezone || "",
                currency_code: tenant.currency_code || ""
            });
        }
    };

    // --- Branch Handlers ---
    const openCreateBranchModal = () => {
        setBranchModalMode("create");
        setSelectedBranch(null);
        setBranchForm({ name: "", location: "", timezone: "", currency_code: "", status: true });
        setBranchError("");
        setIsBranchModalOpen(true);
    };

    const openEditBranchModal = (branch) => {
        setBranchModalMode("edit");
        setSelectedBranch(branch);
        setBranchForm({
            name: branch.name || "",
            location: branch.location || "",
            timezone: branch.timezone || "",
            currency_code: branch.currency_code || "",
            status: branch.status !== undefined ? branch.status : true
        });
        setBranchError("");
        setIsBranchModalOpen(true);
    };

    const handleSaveBranch = async (e) => {
        e.preventDefault();

        // Convert empty timezone/currency to null or let backend handle defaults if allowed.
        // However, usually we want to enforce selection or use tenant defaults?
        // User requirement: "all functionalities ... correctly implemented".
        // Let's enforce them for now or allow empty (to inherit). 
        // If empty, backend might default to tenant's.

        try {
            setSavingBranch(true);
            setBranchError("");

            // Prepare payload with status as string
            const payload = {
                ...branchForm,
                status: branchForm.status ? 'active' : 'inactive'
            };

            if (branchModalMode === "create") {
                await createBranch(payload);
                toast.success("Branch created successfully");
            } else {
                await updateBranch(selectedBranch.id, payload);
                toast.success("Branch updated successfully");
            }

            setIsBranchModalOpen(false);
            await loadBranches();
        } catch (error) {
            toast.error(error.userMessage || "Failed to save branch");
        } finally {
            setSavingBranch(false);
        }
    };

    const handleDeleteBranch = async (branchId) => {
        if (!window.confirm("Are you sure you want to delete this branch?")) return;

        try {
            await deleteBranch(branchId);
            toast.success("Branch deleted successfully");
            await loadBranches();
        } catch (error) {
            toast.error(error.userMessage || "Failed to delete branch");
        }
    };

    if (loadingTenant && loadingBranches) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">

            {/* ================= TENANT SECTION ================= */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Tenant Settings</h1>
                    {!isEditingTenant && (
                        <button
                            onClick={() => setIsEditingTenant(true)}
                            className="px-4 py-2 bg-[#015478] text-white rounded hover:bg-[#015478] transition text-sm font-medium"
                        >
                            Edit Tenant Details
                        </button>
                    )}
                </div>

                {tenantError && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                        {tenantError}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow p-6">
                    {isEditingTenant ? (
                        <form onSubmit={handleSaveTenant} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Clinic Name</label>
                                <input
                                    type="text"
                                    value={tenantForm.name}
                                    onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#015478] focus:ring-[#015478] border p-2"
                                    required
                                />
                            </div>

                            {/* Logo URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                                <input
                                    type="text"
                                    value={tenantForm.logo_url}
                                    onChange={(e) => setTenantForm({ ...tenantForm, logo_url: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#015478] focus:ring-[#015478] border p-2"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Timezone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                                    <select
                                        value={tenantForm.timezone}
                                        onChange={(e) => setTenantForm({ ...tenantForm, timezone: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#015478] focus:ring-[#015478] border p-2"
                                        required
                                    >
                                        <option value="">Select Timezone</option>
                                        {timezones.map(tz => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Currency */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                                    <select
                                        value={tenantForm.currency_code}
                                        onChange={(e) => setTenantForm({ ...tenantForm, currency_code: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#015478] focus:ring-[#015478] border p-2"
                                        required
                                    >
                                        <option value="">Select Currency</option>
                                        {currencies.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                                <button
                                    type="button"
                                    onClick={cancelEditTenant}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                                    disabled={savingTenant}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingTenant}
                                    className="px-4 py-2 bg-[#015478] text-white rounded-md hover:bg-[#015478] disabled:opacity-50 text-sm font-medium"
                                >
                                    {savingTenant ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                {tenant?.logo_url ? (
                                    <img src={tenant.logo_url} alt="Logo" className="h-16 w-16 object-contain border rounded" />
                                ) : (
                                    <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">No Logo</div>
                                )}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{tenant?.name}</h3>
                                    <p className="text-gray-500">Tenant ID: {tenant?.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                                <div>
                                    <span className="block text-sm font-medium text-gray-500">Timezone</span>
                                    <span className="text-lg text-gray-900">{tenant?.timezone}</span>
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-500">Currency</span>
                                    <span className="text-lg text-gray-900">{tenant?.currency_code}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="border-t border-gray-200"></div>

            {/* ================= BRANCHES SECTION ================= */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Branches</h2>
                    <button
                        onClick={openCreateBranchModal}
                        className="px-4 py-2 bg-[#015478] text-white rounded hover:bg-[#015478] transition text-sm font-medium shadow-sm"
                    >
                        + Create Branch
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timezone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {branches.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                                        No branches found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                branches.map((branch) => (
                                    <tr key={branch.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.location || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.timezone || "Default"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.currency_code || "Default"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${branch.status === 'active' ? 'bg-[#015478]/20 text-[#015478]' : 'bg-red-100 text-red-800'}`}>
                                                {branch.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => openEditBranchModal(branch)}
                                                className="text-[#015478] hover:text-blue-900 bg-[#015478]/10 px-3 py-1 rounded hover:bg-[#015478]/20 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBranch(branch.id)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded hover:bg-red-100 transition"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                </div>
            </section>

            {/* ================= BRANCH MODAL ================= */}
            {isBranchModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setIsBranchModalOpen(false)}
                >
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {branchModalMode === 'create' ? "Create New Branch" : "Edit Branch"}
                            </h3>
                            <button
                                onClick={() => setIsBranchModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveBranch} className="p-6 space-y-4">
                            {branchError && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                                    {branchError}
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={branchForm.name}
                                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#015478] focus:ring-1 focus:ring-[#015478] outline-none transition"
                                    placeholder="e.g. Downtown Clinic"
                                    required
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={branchForm.location}
                                    onChange={(e) => setBranchForm({ ...branchForm, location: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#015478] focus:ring-1 focus:ring-[#015478] outline-none transition"
                                    placeholder="e.g. 123 Main St"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Timezone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                                    <select
                                        value={branchForm.timezone}
                                        onChange={(e) => setBranchForm({ ...branchForm, timezone: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#015478] focus:ring-1 focus:ring-[#015478] outline-none transition"
                                    >
                                        <option value="">Default (Tenant)</option>
                                        {timezones.map(tz => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Currency */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                    <select
                                        value={branchForm.currency_code}
                                        onChange={(e) => setBranchForm({ ...branchForm, currency_code: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#015478] focus:ring-1 focus:ring-[#015478] outline-none transition"
                                    >
                                        <option value="">Default (Tenant)</option>
                                        {currencies.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center">
                                <input
                                    id="status"
                                    type="checkbox"
                                    checked={branchForm.status}
                                    onChange={(e) => setBranchForm({ ...branchForm, status: e.target.checked })}
                                    className="h-4 w-4 text-[#015478] focus:ring-[#015478] border-gray-300 rounded"
                                />
                                <label htmlFor="status" className="ml-2 block text-sm text-gray-900">
                                    Active Branch
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsBranchModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                                    disabled={savingBranch}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingBranch}
                                    className="px-4 py-2 bg-[#015478] text-white rounded-lg hover:bg-[#015478] disabled:opacity-50 text-sm font-medium shadow-sm"
                                >
                                    {savingBranch ? "Saving..." : (branchModalMode === 'create' ? "Create Branch" : "Save Changes")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}


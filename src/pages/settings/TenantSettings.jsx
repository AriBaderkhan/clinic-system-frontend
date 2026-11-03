import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getTenant, updateTenant, getBranches, createBranch, updateBranch, deleteBranch } from "../../api/tenantApi";
import { useSettings } from "../../context/SettingContext";
import SubscriptionSection from "../../components/subscription/SubscriptionSection";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import DesignBox from "../../components/settings/DesignBox";

export default function TenantSettingsPage() {
    const { refreshSettings } = useSettings();
    const { t } = useTranslation();

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
            setTenantError(error.userMessage || t('tenant_settings.failed_load'));
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
            toast.error(t('tenant_settings.failed_branches'));
        } finally {
            setLoadingBranches(false);
        }
    };

    // --- Tenant Handlers ---
    const handleSaveTenant = async (e) => {
        e.preventDefault();
        if (!tenantForm.timezone || !tenantForm.currency_code) {
            setTenantError(t('tenant_settings.select_tz_currency'));
            return;
        }

        try {
            setSavingTenant(true);
            setTenantError("");
            await updateTenant(tenantForm);
            toast.success(t('tenant_settings.updated'));
            setIsEditingTenant(false);
            await loadTenant();
            await refreshSettings();
        } catch (error) {
            toast.error(error.userMessage || t('tenant_settings.failed_update'));
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
                toast.success(t('tenant_settings.branch_created'));
            } else {
                await updateBranch(selectedBranch.id, payload);
                toast.success(t('tenant_settings.branch_updated'));
            }

            setIsBranchModalOpen(false);
            await loadBranches();
        } catch (error) {
            toast.error(error.userMessage || t('tenant_settings.failed_save_branch'));
        } finally {
            setSavingBranch(false);
        }
    };

    const handleDeleteBranch = async (branchId) => {
        if (!window.confirm(t('tenant_settings.delete_confirm'))) return;

        try {
            await deleteBranch(branchId);
            toast.success(t('tenant_settings.branch_deleted'));
            await loadBranches();
        } catch (error) {
            toast.error(error.userMessage || t('tenant_settings.failed_delete_branch'));
        }
    };

    if (loadingTenant && loadingBranches) return (
        <div className="w-full space-y-5">
            <PageHeader title={t('tenant_settings.title')} />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5 text-center text-sm text-slate-500">{t('tenant_settings.loading')}</div>
        </div>
    );

    return (
        <div className="w-full space-y-5">
            <PageHeader title={t('tenant_settings.title')} />

            {/* this user's own look */}
            <DesignBox />

            {/* ================= APPEARANCE (theme + language) ================= */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                <h2 className="text-[15px] font-semibold text-slate-900">{t('settings.appearance')}</h2>
                <div className="mt-3 divide-y divide-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <span className="text-sm font-medium text-slate-700">{t('settings.theme')}</span>
                        <div className="w-44"><ThemeToggle /></div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <span className="text-sm font-medium text-slate-700">{t('settings.language')}</span>
                        <LanguageSwitcher />
                    </div>
                </div>
            </section>

            {/* ================= TENANT SECTION ================= */}
            <section className="space-y-3">
                {tenantError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                        {tenantError}
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                    {!isEditingTenant && (
                        <div className="mb-4 flex justify-end">
                            <button
                                onClick={() => setIsEditingTenant(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                {t('tenant_settings.edit_details')}
                            </button>
                        </div>
                    )}
                    {isEditingTenant ? (
                        <form onSubmit={handleSaveTenant} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('tenant_settings.clinic_name')}</label>
                                <input
                                    type="text"
                                    value={tenantForm.name}
                                    onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                    required
                                />
                            </div>

                            {/* Logo URL */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('tenant_settings.logo_url')}</label>
                                <input
                                    type="text"
                                    value={tenantForm.logo_url}
                                    onChange={(e) => setTenantForm({ ...tenantForm, logo_url: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Timezone */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('tenant_settings.timezone')}</label>
                                    <select
                                        value={tenantForm.timezone}
                                        onChange={(e) => setTenantForm({ ...tenantForm, timezone: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        required
                                    >
                                        <option value="">{t('tenant_settings.select_timezone')}</option>
                                        {timezones.map(tz => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Currency */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('tenant_settings.currency')}</label>
                                    <select
                                        value={tenantForm.currency_code}
                                        onChange={(e) => setTenantForm({ ...tenantForm, currency_code: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        required
                                    >
                                        <option value="">{t('tenant_settings.select_currency')}</option>
                                        {currencies.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={cancelEditTenant}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    disabled={savingTenant}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingTenant}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                >
                                    {savingTenant ? t('common.saving') : t('tenant_settings.save_changes')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex min-w-0 items-center gap-4">
                                {tenant?.logo_url ? (
                                    <img src={tenant.logo_url} alt="Logo" className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-contain" />
                                ) : (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 p-1 text-center text-xs text-slate-400">{t('tenant_settings.no_logo')}</div>
                                )}
                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-bold text-slate-900">{tenant?.name}</h3>
                                    <p className="text-sm text-slate-500">{t('tenant_settings.tenant_id', { id: tenant?.id })}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                                <div>
                                    <span className="block text-xs font-medium text-slate-500">{t('tenant_settings.timezone')}</span>
                                    <span className="mt-0.5 block break-words text-[15px] font-semibold text-slate-900">{tenant?.timezone}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-medium text-slate-500">{t('tenant_settings.currency')}</span>
                                    <span className="mt-0.5 block break-words text-[15px] font-semibold text-slate-900">{tenant?.currency_code}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ================= SUBSCRIPTION SECTION ================= */}
            <section>
                <h2 className="mb-3 text-[15px] font-semibold text-slate-900">{t('subscription.title')}</h2>
                <SubscriptionSection />
            </section>

            {/* ================= BRANCHES SECTION ================= */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                    <h2 className="text-[15px] font-semibold text-slate-900">{t('tenant_settings.branches')}</h2>
                    <button
                        onClick={openCreateBranchModal}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                    >
                        + {t('tenant_settings.create_branch')}
                    </button>
                </div>

                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('tenant_settings.col_name')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('tenant_settings.col_location')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('tenant_settings.col_timezone')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('tenant_settings.col_currency')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('tenant_settings.col_status')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-end text-xs font-semibold uppercase tracking-wide text-slate-500">{t('tenant_settings.col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branches.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">
                                        {t('tenant_settings.no_branches')}
                                    </td>
                                </tr>
                            ) : (
                                branches.map((branch) => (
                                    <tr key={branch.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{branch.name}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{branch.location || "-"}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{branch.timezone || t('tenant_settings.default')}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{branch.currency_code || t('tenant_settings.default')}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${branch.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {branch.status === 'active' ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-end">
                                            <div className="inline-flex items-center gap-2">
                                            <button
                                                onClick={() => openEditBranchModal(branch)}
                                                className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/20"
                                            >
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBranch(branch.id)}
                                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                            >
                                                {t('common.delete')}
                                            </button>
                                            </div>
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setIsBranchModalOpen(false)}
                >
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <h3 className="text-base font-semibold text-slate-900">
                                {branchModalMode === 'create' ? t('tenant_settings.create_new_branch') : t('tenant_settings.edit_branch')}
                            </h3>
                            <button
                                onClick={() => setIsBranchModalOpen(false)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveBranch} className="space-y-4 px-5 py-4">
                            {branchError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                                    {branchError}
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('tenant_settings.branch_name')} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={branchForm.name}
                                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                    placeholder={t('tenant_settings.branch_name_ph')}
                                    required
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('tenant_settings.col_location')}</label>
                                <input
                                    type="text"
                                    value={branchForm.location}
                                    onChange={(e) => setBranchForm({ ...branchForm, location: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                    placeholder={t('tenant_settings.location_ph')}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Timezone */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('tenant_settings.timezone')}</label>
                                    <select
                                        value={branchForm.timezone}
                                        onChange={(e) => setBranchForm({ ...branchForm, timezone: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                    >
                                        <option value="">{t('tenant_settings.default_tenant')}</option>
                                        {timezones.map(tz => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Currency */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('tenant_settings.currency')}</label>
                                    <select
                                        value={branchForm.currency_code}
                                        onChange={(e) => setBranchForm({ ...branchForm, currency_code: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                    >
                                        <option value="">{t('tenant_settings.default_tenant')}</option>
                                        {currencies.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-2">
                                <input
                                    id="status"
                                    type="checkbox"
                                    checked={branchForm.status}
                                    onChange={(e) => setBranchForm({ ...branchForm, status: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 accent-brand"
                                />
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                                    {t('tenant_settings.active_branch')}
                                </label>
                            </div>

                            <div className="-mx-5 mt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsBranchModalOpen(false)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    disabled={savingBranch}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingBranch}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                >
                                    {savingBranch ? t('common.saving') : (branchModalMode === 'create' ? t('tenant_settings.create_branch') : t('tenant_settings.save_changes'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}


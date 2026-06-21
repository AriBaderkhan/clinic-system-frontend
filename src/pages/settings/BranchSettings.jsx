import { useState, useEffect } from "react";
import { getBranch, updateBranch } from "../../api/branchApi";
import { getReminderTemplate, updateReminderTemplate } from "../../api/reminderApi";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingContext";
import { getTheme, toggleTheme } from "../../utils/theme";
import toast from "react-hot-toast";

export default function BranchSettingsPage() {
    const { user } = useAuth();
    const { refreshSettings } = useSettings();

    const [branchDetails, setBranchDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        timezone: "",
        currency_code: ""
    });

    // Appearance (theme)
    const [theme, setTheme] = useState(getTheme());

    // Reminder template
    const [tpl, setTpl] = useState(null);
    const [tplSaving, setTplSaving] = useState(false);
    const [showTpl, setShowTpl] = useState(false);

    const timezones = Intl.supportedValuesOf('timeZone');
    const currencies = Intl.supportedValuesOf('currency');

    // Fallback to localStorage if context is empty (edge case)
    const effectiveUser = user || JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        if (effectiveUser && effectiveUser.branch_id) {
            loadBranchDetails(effectiveUser.branch_id);
            loadTemplate();
        }
    }, [effectiveUser?.branch_id]);

    const loadBranchDetails = async (id) => {
        try {
            setLoading(true);
            setError("");
            const response = await getBranch(id);
            const data = response.data;

            setBranchDetails(data);
            setFormData({
                name: data.name || "",
                location: data.location || "",
                timezone: data.timezone || "",
                currency_code: data.currency_code || ""
            });
            setIsEditing(false);
        } catch (error) {
            setError(error.userMessage || "Failed to load branch details");
        } finally {
            setLoading(false);
        }
    };

    const loadTemplate = async () => {
        try {
            const res = await getReminderTemplate();
            setTpl(res.data);
        } catch {
            setTpl(null); // no permission / feature off → hide the section
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!effectiveUser?.branch_id) return;

        try {
            setSaving(true);
            setError("");
            await updateBranch(effectiveUser.branch_id, formData);
            toast.success("Branch settings updated");

            await loadBranchDetails(effectiveUser.branch_id);
            await refreshSettings();

            setIsEditing(false);
        } catch (error) {
            toast.error(error.userMessage || "Failed to update branch");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError("");
        if (branchDetails) {
            setFormData({
                name: branchDetails.name || "",
                location: branchDetails.location || "",
                timezone: branchDetails.timezone || "",
                currency_code: branchDetails.currency_code || ""
            });
        }
    };

    const handleToggleTheme = () => setTheme(toggleTheme());

    const saveTemplate = async () => {
        try {
            setTplSaving(true);
            await updateReminderTemplate(tpl);
            toast.success("Reminder template saved");
            setShowTpl(false);
        } catch (err) {
            toast.error(err.userMessage || "Failed to save template");
        } finally {
            setTplSaving(false);
        }
    };

    if (!effectiveUser) {
        return <div>Loading user information... (Please refresh if stuck)</div>;
    }

    if (!effectiveUser.branch_id) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Branch Settings</h1>
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">
                        No branch assigned to your account. <br />
                        <span className="text-xs">User ID: {effectiveUser.id}</span>
                    </p>
                </div>
            </div>
        );
    }

    const isDark = theme === "dark";

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Branch Settings</h1>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
                </div>
            )}

            {/* ===== Section: Branch details ===== */}
            <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                {loading ? (
                    <div className="text-center p-4">Loading branch details...</div>
                ) : branchDetails ? (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b pb-4 dark:border-slate-700">
                            <h2 className="text-xl font-semibold dark:text-slate-100">{branchDetails.name}</h2>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-[#015478] text-white rounded hover:bg-[#013d58] transition"
                                >
                                    Edit Branch
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Branch Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="mt-1 block w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Timezone</label>
                                        <select
                                            value={formData.timezone}
                                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                            className="mt-1 block w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                                            required
                                        >
                                            <option value="">Select Timezone</option>
                                            {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Currency</label>
                                        <select
                                            value={formData.currency_code}
                                            onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                                            className="mt-1 block w-full border p-2 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                                            required
                                        >
                                            <option value="">Select Currency</option>
                                            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t mt-4 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:border-slate-600"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-4 py-2 bg-[#015478] text-white rounded-md hover:bg-[#013d58] disabled:opacity-50"
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <span className="block text-sm font-medium text-gray-500">Location</span>
                                    <span className="text-gray-900 dark:text-slate-200">{branchDetails.location}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500">Timezone</span>
                                        <span className="text-gray-900 dark:text-slate-200">{branchDetails.timezone}</span>
                                    </div>
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500">Currency</span>
                                        <span className="text-gray-900 dark:text-slate-200">{branchDetails.currency_code}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : null}
            </section>

            {/* ===== Section: Appearance ===== */}
            <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-1 dark:text-slate-100">Appearance</h2>
                <p className="text-sm text-gray-500 mb-4">Choose how the dashboard looks on this device.</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => { if (isDark) handleToggleTheme(); }}
                        className={[
                            "flex-1 rounded-xl border p-4 text-left transition",
                            !isDark ? "border-[#015478] ring-2 ring-[#015478]/20" : "border-slate-200 dark:border-slate-700",
                        ].join(" ")}
                    >
                        <div className="text-2xl">☀️</div>
                        <div className="mt-1 font-medium dark:text-slate-100">Light</div>
                    </button>
                    <button
                        onClick={() => { if (!isDark) handleToggleTheme(); }}
                        className={[
                            "flex-1 rounded-xl border p-4 text-left transition",
                            isDark ? "border-[#015478] ring-2 ring-[#015478]/20" : "border-slate-200 dark:border-slate-700",
                        ].join(" ")}
                    >
                        <div className="text-2xl">🌙</div>
                        <div className="mt-1 font-medium dark:text-slate-100">Dark</div>
                    </button>
                </div>
            </section>

            {/* ===== Section: Reminder template ===== */}
            {tpl && (
                <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold mb-1 dark:text-slate-100">Reminder template</h2>
                            <p className="text-sm text-gray-500">
                                The standard WhatsApp reminder message (Kurdish / Arabic / English).
                            </p>
                        </div>
                        <button
                            onClick={() => setShowTpl(true)}
                            className="px-4 py-2 bg-[#015478] text-white rounded hover:bg-[#013d58] transition"
                        >
                            Edit template
                        </button>
                    </div>
                </section>
            )}

            {/* ===== Edit template modal ===== */}
            {showTpl && tpl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={(e) => e.target === e.currentTarget && setShowTpl(false)}
                >
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-800">
                        <div className="mb-1 flex items-center justify-between">
                            <h2 className="text-lg font-semibold dark:text-slate-100">Edit reminder template</h2>
                            <button onClick={() => setShowTpl(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <p className="mb-4 text-xs text-gray-500">
                            Use <code>{"{patient_name}"}</code>, <code>{"{date}"}</code>, <code>{"{time}"}</code> — they fill in automatically.
                        </p>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">کوردی</label>
                                <textarea dir="rtl" rows={5} value={tpl.kur_msg}
                                    onChange={(e) => setTpl({ ...tpl, kur_msg: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">عربي</label>
                                <textarea dir="rtl" rows={5} value={tpl.arb_msg}
                                    onChange={(e) => setTpl({ ...tpl, arb_msg: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">English</label>
                                <textarea rows={5} value={tpl.eng_msg}
                                    onChange={(e) => setTpl({ ...tpl, eng_msg: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowTpl(false)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                                Cancel
                            </button>
                            <button onClick={saveTemplate} disabled={tplSaving}
                                className="px-4 py-2 bg-[#015478] text-white rounded-md hover:bg-[#013d58] disabled:opacity-50">
                                {tplSaving ? "Saving…" : "Save template"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

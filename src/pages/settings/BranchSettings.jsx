import { useState, useEffect } from "react";
import { getBranch, updateBranch } from "../../api/branchApi";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingContext";
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

    const timezones = Intl.supportedValuesOf('timeZone');
    const currencies = Intl.supportedValuesOf('currency');

    // Fallback to localStorage if context is empty (edge case)
    const effectiveUser = user || JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        // Ensure user is loaded and has a branch_id
        if (effectiveUser && effectiveUser.branch_id) {
            loadBranchDetails(effectiveUser.branch_id);
        }
    }, [effectiveUser?.branch_id]);

    const loadBranchDetails = async (id) => {
        try {
            setLoading(true);
            setError("");
            // API returns { message: "...", data: { ... } }
            // So we need to destructure 'data' from the response
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

    const handleSave = async (e) => {
        e.preventDefault();
        if (!effectiveUser?.branch_id) return;

        try {
            setSaving(true);
            setError("");
            await updateBranch(effectiveUser.branch_id, formData);
            toast.success("Branch settings updated");

            // Refresh details and global settings
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

    // If user is not yet loaded from context, try to peek at localStorage directly or show a loading spinner that times out?
    // Actually, AuthContext initializes user from localStorage synchronously. 
    // If user is null here, it means they are NOT logged in according to context.
    // But they are seeing the page, so the route allowed them? 
    // It's possible the context update is lagging or the route check uses localStorage directly while context uses state.

    // Let's use a derived user object that falls back to localStorage if context is null


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

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Branch Settings</h1>

            {error && (
                <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
                {loading ? (
                    <div className="text-center p-4">Loading branch details...</div>
                ) : branchDetails ? (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b pb-4">
                            <h2 className="text-xl font-semibold">{branchDetails.name}</h2>
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
                                    <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full border p-2 rounded"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="mt-1 block w-full border p-2 rounded"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Timezone</label>
                                        <select
                                            value={formData.timezone}
                                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                            className="mt-1 block w-full border p-2 rounded"
                                            required
                                        >
                                            <option value="">Select Timezone</option>
                                            {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                                        <select
                                            value={formData.currency_code}
                                            onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                                            className="mt-1 block w-full border p-2 rounded"
                                            required
                                        >
                                            <option value="">Select Currency</option>
                                            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
                                    <span className="text-gray-900">{branchDetails.location}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500">Timezone</span>
                                        <span className="text-gray-900">{branchDetails.timezone}</span>
                                    </div>
                                    <div>
                                        <span className="block text-sm font-medium text-gray-500">Currency</span>
                                        <span className="text-gray-900">{branchDetails.currency_code}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
}

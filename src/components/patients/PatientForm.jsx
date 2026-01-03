// src/components/patients/PatientForm.jsx
import {  useState } from "react";

function PatientForm({
    initialData = null,
    mode = "add",
    onSubmit,
    isSubmitting = false,
    errorMessage = "",
}) {
    const [form, setForm] = useState(() => ({
        name: initialData?.name ?? "",
        phone: initialData?.phone ?? "",
        age: initialData?.age ? String(initialData.age) : "",
        gender: initialData?.gender ?? "",
        address: initialData?.address ?? "",
    }));

    const [clientError, setClientError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setClientError("");

        if (!form.name || !form.phone || !form.age || !form.gender) {
            setClientError("Name, phone, age and gender are required.");
            return;
        }

        const payload = {
            name: form.name.trim(),
            phone: form.phone.trim(),
            age: Number(form.age),
            gender: form.gender,
            address: form.address.trim() || null,
        };

        await onSubmit?.(payload);
    };

    const title = mode === "edit" ? "Edit patient" : "Add new patient";
    const subtitle =
        mode === "edit"
            ? "Update patient information in Crown Dental Clinic."
            : "Register a new patient in Crown Dental Clinic.";
    const submitLabel = mode === "edit" ? "Save changes" : "Save patient";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>

            <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                {(clientError || errorMessage) && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                        {clientError || errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">
                            Full name<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1DB954] focus:bg-white focus:ring-1 focus:ring-[#1DB954]"
                            placeholder="e.g. Ahmed Hassan"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">
                            Phone<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1DB954] focus:bg-white focus:ring-1 focus:ring-[#1DB954]"
                            placeholder="0750..."
                        />
                    </div>

                    {/* Age + Gender */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-700">
                                Age<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={form.age}
                                onChange={handleChange}
                                min={0}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1DB954] focus:bg-white focus:ring-1 focus:ring-[#1DB954]"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-700">
                                Gender<span className="text-red-500">*</span>
                            </label>
                            <select
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1DB954] focus:bg-white focus:ring-1 focus:ring-[#1DB954]"
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">
                            Address
                        </label>
                        <textarea
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1DB954] focus:bg-white focus:ring-1 focus:ring-[#1DB954]"
                            placeholder="Erbil, Iraq"
                        />
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-[#1DB954] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Saving..." : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PatientForm;

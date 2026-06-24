import { useState } from "react";

export default function PatientForm({
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
        blood_type: initialData?.blood_type ?? "",
        allergies: initialData?.allergies ?? "",
        chronic_diseases: initialData?.chronic_diseases ?? "",
    }));

    const [clientError, setClientError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Age helper: reception may type either a real age (e.g. 32) OR a birth year
    // (e.g. 1989). A 4-digit value within [1900, this year] is treated as a year
    // and converted to age. Done on the frontend so it's instant and we save the
    // final number — the backend just validates a normal age.
    const CURRENT_YEAR = new Date().getFullYear();

    const ageYearHint = (() => {
        const n = parseInt(form.age, 10);
        if (!Number.isNaN(n) && n >= 1900 && n <= CURRENT_YEAR) return CURRENT_YEAR - n;
        return null;
    })();

    const normalizeAge = () => {
        setForm((prev) => {
            const n = parseInt(prev.age, 10);
            if (!Number.isNaN(n) && n >= 1900 && n <= CURRENT_YEAR) {
                return { ...prev, age: String(CURRENT_YEAR - n) };
            }
            return prev;
        });
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
            blood_type: form.blood_type || null,
            allergies: form.allergies.trim() || null,
            chronic_diseases: form.chronic_diseases.trim() || null,
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

            <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                {(clientError || errorMessage) && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                        {clientError || errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="text-sm">
                    {/* Two columns on laptop/PC, stacks on tablet/iPad/mobile */}
                    <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
                        {/* ===== Personal details ===== */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Personal details</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>

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
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
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
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    placeholder="0750..."
                                />
                            </div>

                            {/* Age + Gender */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700">
                                        Age<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={form.age}
                                        onChange={handleChange}
                                        onBlur={normalizeAge}
                                        min={0}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                        placeholder="e.g. 32 or 1989"
                                    />
                                    {ageYearHint !== null && (
                                        <p className="text-[11px] font-medium text-[#015478]">
                                            Year {form.age} → {ageYearHint} years old
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700">
                                        Gender<span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
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
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    placeholder="Erbil, Iraq"
                                />
                            </div>
                        </section>

                        {/* ===== Medical info (optional) ===== */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Medical info</span>
                                <span className="text-[10px] text-slate-400">(optional)</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>

                            {/* Blood type */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">Blood type</label>
                                <select
                                    name="blood_type"
                                    value={form.blood_type}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478] sm:max-w-[12rem]"
                                >
                                    <option value="">Select</option>
                                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Allergies */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">Allergies</label>
                                <textarea
                                    name="allergies"
                                    value={form.allergies}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    placeholder="e.g. Penicillin, Latex"
                                />
                            </div>

                            {/* Chronic diseases */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">Chronic diseases</label>
                                <textarea
                                    name="chronic_diseases"
                                    value={form.chronic_diseases}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    placeholder="e.g. Diabetes, Hypertension"
                                />
                            </div>
                        </section>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-[#015478] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#015478] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Saving..." : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

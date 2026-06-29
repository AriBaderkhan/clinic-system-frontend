import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getReferralSources } from "../../api/patientApi";

const REFERRAL_DEFAULTS = ["Social Media", "Relative & friends", "Location", "Old Patient"];

export default function PatientForm({
    initialData = null,
    mode = "add",
    onSubmit,
    isSubmitting = false,
    errorMessage = "",
}) {
    const { t } = useTranslation();
    const [form, setForm] = useState(() => ({
        name: initialData?.name ?? "",
        phone: initialData?.phone ?? "",
        age: initialData?.age ? String(initialData.age) : "",
        gender: initialData?.gender ?? "",
        address: initialData?.address ?? "",
        blood_type: initialData?.blood_type ?? "",
        allergies: initialData?.allergies ?? "",
        chronic_diseases: initialData?.chronic_diseases ?? "",
        referral_source: initialData?.referral_source ?? "",
    }));

    const [clientError, setClientError] = useState("");

    // Referral source dropdown: fixed defaults + any custom values reception
    // added before (loaded from the backend). "Other" reveals a text box.
    const [customSources, setCustomSources] = useState([]);
    const [showOther, setShowOther] = useState(false);
    const [otherValue, setOtherValue] = useState("");

    useEffect(() => {
        let mounted = true;
        getReferralSources()
            .then((res) => {
                if (!mounted) return;
                const list = res?.data ?? [];
                setCustomSources(list.filter((s) => s && !REFERRAL_DEFAULTS.includes(s)));
            })
            .catch(() => { });
        return () => { mounted = false; };
    }, []);

    const handleReferralChange = (e) => {
        const value = e.target.value;
        if (value === "__other__") {
            setShowOther(true);
            setForm((prev) => ({ ...prev, referral_source: otherValue }));
        } else {
            setShowOther(false);
            setForm((prev) => ({ ...prev, referral_source: value }));
        }
    };

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
            setClientError(t("patient_form.required_error"));
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
            referral_source: form.referral_source?.trim() || null,
        };

        await onSubmit?.(payload);
    };

    // Defaults + saved customs + the current value (so an edited custom still shows).
    const referralOptions = Array.from(new Set([
        ...REFERRAL_DEFAULTS,
        ...customSources,
        ...(form.referral_source && !showOther ? [form.referral_source] : []),
    ].filter(Boolean)));

    const title = mode === "edit" ? t("patient_form.edit_title") : t("patient_form.add_title");
    const subtitle =
        mode === "edit"
            ? t("patient_form.edit_subtitle")
            : t("patient_form.add_subtitle");
    const submitLabel = mode === "edit" ? t("patient_form.save_changes") : t("patient_form.save_patient");

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
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("patient_form.personal_details")}</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>

                            {/* Name */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    {t("patient_form.full_name")}<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    placeholder={t("patient_form.name_ph")}
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    {t("patient_form.phone")}<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    placeholder={t("patient_form.phone_ph")}
                                />
                            </div>

                            {/* Age + Gender */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700">
                                        {t("patient_form.age")}<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={form.age}
                                        onChange={handleChange}
                                        onBlur={normalizeAge}
                                        min={0}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                        placeholder={t("patient_form.age_ph")}
                                    />
                                    {ageYearHint !== null && (
                                        <p className="text-[11px] font-medium text-[#015478]">
                                            {t("patient_form.year_hint", { year: form.age, age: ageYearHint })}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700">
                                        {t("patient_form.gender")}<span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    >
                                        <option value="">{t("patient_form.select_gender")}</option>
                                        <option value="male">{t("patient_form.male")}</option>
                                        <option value="female">{t("patient_form.female")}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">
                                    {t("patient_form.address")}
                                </label>
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    placeholder={t("patient_form.address_ph")}
                                />
                            </div>

                            {/* Referral source */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">{t("patient_form.referral_q")}</label>
                                <select
                                    name="referral_source"
                                    value={showOther ? "__other__" : form.referral_source}
                                    onChange={handleReferralChange}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                >
                                    <option value="">{t("patient_form.select_source")}</option>
                                    {referralOptions.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                    <option value="__other__">{t("patient_form.other_add")}</option>
                                </select>
                                {showOther && (
                                    <input
                                        type="text"
                                        value={otherValue}
                                        onChange={(e) => {
                                            setOtherValue(e.target.value);
                                            setForm((prev) => ({ ...prev, referral_source: e.target.value }));
                                        }}
                                        placeholder={t("patient_form.other_ph")}
                                        className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    />
                                )}
                            </div>
                        </section>

                        {/* ===== Medical info (optional) ===== */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("patient_form.medical_info")}</span>
                                <span className="text-[10px] text-slate-400">{t("patient_form.optional")}</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>

                            {/* Blood type */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">{t("patient_form.blood_type")}</label>
                                <select
                                    name="blood_type"
                                    value={form.blood_type}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478] sm:max-w-[12rem]"
                                >
                                    <option value="">{t("patient_form.select")}</option>
                                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Allergies */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">{t("patient_form.allergies")}</label>
                                <textarea
                                    name="allergies"
                                    value={form.allergies}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    placeholder={t("patient_form.allergies_ph")}
                                />
                            </div>

                            {/* Chronic diseases */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">{t("patient_form.chronic")}</label>
                                <textarea
                                    name="chronic_diseases"
                                    value={form.chronic_diseases}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#015478] focus:bg-white focus:ring-1 focus:ring-[#015478]"
                                    placeholder={t("patient_form.chronic_ph")}
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
                            {isSubmitting ? t("patient_form.saving") : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

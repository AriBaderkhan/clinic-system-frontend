import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { getBranch, updateBranch } from "../../api/branchApi";
import { getReminderTemplate, updateReminderTemplate } from "../../api/reminderApi";
import { getFeedbackQrLink } from "../../api/feedbackApi";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingContext";
import { getTheme, toggleTheme } from "../../utils/theme";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import DiscountsSettings from "../../components/settings/DiscountsSettings";
import FloorsSettings from "../../components/settings/FloorsSettings";
import WorkflowSettings from "../../components/settings/WorkflowSettings";
import DesignBox from "../../components/settings/DesignBox";
import { hasTick } from "../../utils/can";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";

export default function BranchSettingsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { refreshSettings } = useSettings();
    const navigate = useNavigate();

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

    // Feedback QR (static, anonymous walk-in form for this branch)
    const [qrUrl, setQrUrl] = useState("");
    const qrRef = useRef(null);

    const timezones = Intl.supportedValuesOf('timeZone');
    const currencies = Intl.supportedValuesOf('currency');

    // Fallback to localStorage if context is empty (edge case)
    const effectiveUser = user || JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        if (effectiveUser && effectiveUser.branch_id) {
            loadBranchDetails(effectiveUser.branch_id);
            loadTemplate();
            loadQrLink();
        }
    }, [effectiveUser?.branch_id]);

    const loadQrLink = async () => {
        try {
            const res = await getFeedbackQrLink();
            const { tenant_id, branch_id } = res.data;
            setQrUrl(`${window.location.origin}/feedback/clinic/${tenant_id}/${branch_id}`);
        } catch {
            setQrUrl(""); // no permission / feature off → hide the QR section
        }
    };

    const downloadQr = () => {
        const canvas = qrRef.current?.querySelector("canvas");
        if (!canvas) return;
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = `feedback-qr-${(branchDetails?.name || "branch").replace(/\s+/g, "-")}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

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
            setError(error.userMessage || t("bs.failed_load"));
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
            toast.success(t("bs.updated"));

            await loadBranchDetails(effectiveUser.branch_id);
            await refreshSettings();

            setIsEditing(false);
        } catch (error) {
            toast.error(error.userMessage || t("bs.failed_update"));
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
            toast.success(t("bs.tpl_saved"));
            setShowTpl(false);
        } catch (err) {
            toast.error(err.userMessage || t("bs.tpl_save_failed"));
        } finally {
            setTplSaving(false);
        }
    };

    if (!effectiveUser) {
        return (
            <div className="w-full space-y-5">
                <PageHeader title={t("bs.title")} />
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5 text-sm text-slate-500">{t("bs.loading_user")}</div>
            </div>
        );
    }

    if (!effectiveUser.branch_id) {
        return (
            <div className="w-full space-y-5">
                <PageHeader title={t("bs.title")} />
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-card">
                    <p className="text-sm text-slate-500">
                        {t("bs.no_branch")} <br />
                        <span className="text-xs">{t("bs.user_id", { id: effectiveUser.id })}</span>
                    </p>
                </div>
            </div>
        );
    }

    const isDark = theme === "dark";

    return (
        <div className="w-full space-y-5">
            <PageHeader title={t("bs.title")} />

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* ===== Section: Branch details ===== */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                {loading ? (
                    <div className="p-4 text-center text-sm text-slate-500">{t("bs.loading_details")}</div>
                ) : branchDetails ? (
                    <>
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            <h2 className="min-w-0 break-words text-lg font-bold text-slate-900">{branchDetails.name}</h2>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                >
                                    {t("bs.edit_branch")}
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("bs.branch_name")}</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("bs.location")}</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("bs.timezone")}</label>
                                        <select
                                            value={formData.timezone}
                                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                            required
                                        >
                                            <option value="">{t("bs.select_timezone")}</option>
                                            {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("bs.currency")}</label>
                                        <select
                                            value={formData.currency_code}
                                            onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                            required
                                        >
                                            <option value="">{t("bs.select_currency")}</option>
                                            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        disabled={saving}
                                    >
                                        {t("common.cancel")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                    >
                                        {saving ? t("bs.saving") : t("bs.save_changes")}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <span className="block text-xs font-medium text-slate-500">{t("bs.location")}</span>
                                    <span className="mt-0.5 block break-words text-sm font-semibold text-slate-900">{branchDetails.location}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <span className="block text-xs font-medium text-slate-500">{t("bs.timezone")}</span>
                                        <span className="mt-0.5 block break-words text-sm font-semibold text-slate-900">{branchDetails.timezone}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-slate-500">{t("bs.currency")}</span>
                                        <span className="mt-0.5 block break-words text-sm font-semibold text-slate-900">{branchDetails.currency_code}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : null}
            </section>

            {/* ===== Section: Works (treatment catalog) ===== */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-[15px] font-semibold text-slate-900">{t("bs.works_title")}</h2>
                        <p className="mt-0.5 text-sm text-slate-500">{t("bs.works_hint")}</p>
                    </div>
                    <button
                        onClick={() => navigate("/works")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                    >
                        {t("bs.open_works")}
                    </button>
                </div>
            </section>

            {/* ===== Section: Design (this user's own look) ===== */}
            <DesignBox />

            {/* ===== Section: Roles & permissions ===== */}
            {hasTick(effectiveUser, "manage_permissions") && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-[15px] font-semibold text-slate-900">{t("nav.roles_permissions")}</h2>
                            <p className="mt-0.5 text-sm text-slate-500">{t("bs.roles_hint")}</p>
                        </div>
                        <button
                            data-open-roles
                            onClick={() => navigate("/settings/roles")}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                        >
                            {t("bs.open_roles")}
                        </button>
                    </div>
                </section>
            )}

            {/* ===== Section: Appearance ===== */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                <h2 className="text-[15px] font-semibold text-slate-900">{t("bs.appearance")}</h2>
                <p className="mb-4 mt-0.5 text-sm text-slate-500">{t("bs.appearance_hint")}</p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => { if (isDark) handleToggleTheme(); }}
                        className={[
                            "rounded-xl border bg-white p-4 text-start transition hover:bg-slate-50",
                            !isDark ? "border-brand ring-2 ring-brand/20" : "border-slate-200",
                        ].join(" ")}
                    >
                        <div className="text-2xl">☀️</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{t("bs.light")}</div>
                    </button>
                    <button
                        onClick={() => { if (!isDark) handleToggleTheme(); }}
                        className={[
                            "rounded-xl border bg-white p-4 text-start transition hover:bg-slate-50",
                            isDark ? "border-brand ring-2 ring-brand/20" : "border-slate-200",
                        ].join(" ")}
                    >
                        <div className="text-2xl">🌙</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{t("bs.dark")}</div>
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-sm font-medium text-slate-700">{t('settings.language')}</span>
                    <LanguageSwitcher />
                </div>
            </section>

            {/* ===== Section: Reminder template ===== */}
            {tpl && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-[15px] font-semibold text-slate-900">{t("bs.reminder_template")}</h2>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {t("bs.reminder_hint")}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowTpl(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                        >
                            {t("bs.edit_template")}
                        </button>
                    </div>
                </section>
            )}

            {/* ===== Section: Feedback QR ===== */}
            {qrUrl && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                    <h2 className="text-[15px] font-semibold text-slate-900">{t("bs.feedback_qr_title")}</h2>
                    <p className="mb-4 mt-0.5 text-sm text-slate-500">{t("bs.feedback_qr_hint")}</p>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                        <div ref={qrRef} className="rounded-xl border border-slate-200 bg-white p-3">
                            <QRCodeCanvas value={qrUrl} size={200} level="M" marginSize={3} />
                        </div>
                        <div className="w-full min-w-0 flex-1 space-y-3">
                            <button
                                onClick={downloadQr}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                            >
                                {t("bs.feedback_qr_download")}
                            </button>
                            <div className="break-all rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                {qrUrl}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ===== Section: Workflow rules ===== */}
            {hasTick(effectiveUser, "manage_branch_settings") && <WorkflowSettings />}

            {/* ===== Section: Discounts ===== */}
            <section>
                <DiscountsSettings />
            </section>

            {/* ===== Section: Floors ===== */}
            <section>
                <FloorsSettings />
            </section>

            {/* ===== Edit template modal ===== */}
            {showTpl && tpl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setShowTpl(false)}
                >
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-pop">
                        <div className="mb-1 flex items-center justify-between gap-3">
                            <h2 className="text-base font-semibold text-slate-900">{t("bs.edit_template_title")}</h2>
                            <button onClick={() => setShowTpl(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">✕</button>
                        </div>
                        <p className="mb-4 text-xs text-slate-500">
                            {t("bs.placeholders_hint")}
                        </p>

                        <div className="max-h-[60vh] space-y-4 overflow-y-auto pe-1">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">کوردی</label>
                                <textarea dir="rtl" rows={5} value={tpl.kur_msg}
                                    onChange={(e) => setTpl({ ...tpl, kur_msg: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">عربي</label>
                                <textarea dir="rtl" rows={5} value={tpl.arb_msg}
                                    onChange={(e) => setTpl({ ...tpl, arb_msg: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">English</label>
                                <textarea rows={5} value={tpl.eng_msg}
                                    onChange={(e) => setTpl({ ...tpl, eng_msg: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
                            </div>
                        </div>

                        <div className="-mx-5 mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 pt-4">
                            <button onClick={() => setShowTpl(false)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                {t("common.cancel")}
                            </button>
                            <button onClick={saveTemplate} disabled={tplSaving}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                                {tplSaving ? t("bs.saving_short") : t("bs.save_template")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

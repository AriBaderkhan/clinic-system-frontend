import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiCamera, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    getMyProfile, updateMyProfile, changeMyPassword,
    sendEmailChangeCode, changeMyEmail,
} from "../../api/profileApi";

function initialsOf(name) {
    if (!name) return "U";
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "U";
}

export default function ProfilePage() {
    const { t } = useTranslation();
    const { refreshProfile } = useAuth();
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    const [form, setForm] = useState({ full_name: "", phone: "", address: "" });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [savingDetails, setSavingDetails] = useState(false);

    // password
    const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });
    const [savingPwd, setSavingPwd] = useState(false);

    // email change
    const [emailMode, setEmailMode] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [emailCode, setEmailCode] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [emailBusy, setEmailBusy] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const res = await getMyProfile();
            const p = res.data;
            setData(p);
            setForm({ full_name: p.full_name || "", phone: p.phone || "", address: p.address || "" });
        } catch (err) {
            toast.error(err.userMessage || t("prof.failed_load"));
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const onPickFile = (e) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
        setPreview(f ? URL.createObjectURL(f) : null);
    };

    const saveDetails = async () => {
        if (!form.full_name.trim()) return toast.error(t("prof.name_required"));
        try {
            setSavingDetails(true);
            await updateMyProfile(form, file);
            toast.success(t("prof.updated"));
            setFile(null); setPreview(null);
            await load();
            await refreshProfile(); // update the avatar everywhere
        } catch (err) {
            toast.error(err.userMessage || t("prof.failed_update"));
        } finally {
            setSavingDetails(false);
        }
    };

    const savePassword = async () => {
        if (pwd.newPassword.length < 6) return toast.error(t("prof.pwd_min"));
        if (pwd.newPassword !== pwd.confirm) return toast.error(t("prof.pwd_mismatch"));
        try {
            setSavingPwd(true);
            await changeMyPassword(pwd.currentPassword, pwd.newPassword);
            toast.success(t("prof.pwd_changed"));
            setPwd({ currentPassword: "", newPassword: "", confirm: "" });
        } catch (err) {
            toast.error(err.userMessage || t("prof.failed_pwd"));
        } finally {
            setSavingPwd(false);
        }
    };

    const sendCode = async () => {
        if (!newEmail) return toast.error(t("prof.enter_new_email"));
        try {
            setEmailBusy(true);
            await sendEmailChangeCode(newEmail);
            setCodeSent(true);
            toast.success(t("prof.code_sent"));
        } catch (err) {
            toast.error(err.userMessage || t("prof.failed_code"));
        } finally {
            setEmailBusy(false);
        }
    };

    const confirmEmail = async () => {
        try {
            setEmailBusy(true);
            await changeMyEmail(newEmail, emailCode);
            toast.success(t("prof.email_changed"));
            setEmailMode(false); setCodeSent(false); setNewEmail(""); setEmailCode("");
            await load();
            await refreshProfile();
        } catch (err) {
            toast.error(err.userMessage || t("prof.failed_email"));
        } finally {
            setEmailBusy(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">{t("prof.loading_profile")}</div>;

    const avatar = preview || data?.image_url;

    return (
        <div className="mx-auto max-w-3xl p-4 md:p-6">
            <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <FiArrowLeft size={16} className="rtl:rotate-180" /> {t("prof.back")}
            </button>

            {/* Header card: avatar + identity */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                    <div className="relative">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#015478] text-2xl font-bold text-white">
                            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initialsOf(form.full_name)}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="absolute bottom-0 end-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#015478] text-white hover:bg-[#013d58]"
                            title={t("prof.change_photo")}
                        >
                            <FiCamera size={15} />
                        </button>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickFile} className="hidden" />
                    </div>
                    <div className="text-center sm:text-start">
                        <h1 className="text-xl font-bold text-slate-900">{data?.full_name || t("prof.your_profile")}</h1>
                        <p className="text-sm text-slate-500">{data?.email}</p>
                        <span className="mt-1 inline-flex items-center rounded-full bg-[#015478]/10 px-2.5 py-0.5 text-xs font-medium capitalize text-[#015478] border border-[#015478]/20">
                            {data?.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-slate-800">{t("prof.personal_details")}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t("prof.full_name")} required value={form.full_name} onChange={(v) => setForm((p) => ({ ...p, full_name: v }))} />
                    <Field label={t("prof.phone")} value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
                    <div className="sm:col-span-2">
                        <Field label={t("prof.address")} value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">{t("prof.role")}</label>
                        <input value={data?.role || ""} disabled className="mt-1 block w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm capitalize text-slate-500" />
                    </div>
                </div>
                <div className="mt-5 flex justify-end">
                    <button onClick={saveDetails} disabled={savingDetails}
                        className="rounded-lg bg-[#015478] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#013d58] disabled:opacity-50">
                        {savingDetails ? t("prof.saving") : t("prof.save_changes")}
                    </button>
                </div>
            </div>

            {/* Email */}
            <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-1 text-base font-bold text-slate-800">{t("prof.email")}</h2>
                <p className="mb-4 text-sm text-slate-500">{t("prof.current_label")} <b>{data?.email}</b></p>
                {!emailMode ? (
                    <button onClick={() => setEmailMode(true)} className="rounded-lg border border-[#015478] px-4 py-2 text-sm font-medium text-[#015478] hover:bg-[#015478]/10">
                        {t("prof.change_email")}
                    </button>
                ) : (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input type="email" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setCodeSent(false); }}
                                placeholder={t("prof.new_email")} disabled={codeSent}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none disabled:opacity-60" />
                            <button onClick={sendCode} disabled={emailBusy}
                                className="whitespace-nowrap rounded-lg border border-[#015478] px-4 py-2 text-sm font-medium text-[#015478] hover:bg-[#015478]/10 disabled:opacity-50">
                                {emailBusy ? "…" : codeSent ? t("prof.resend") : t("prof.send_code")}
                            </button>
                        </div>
                        {codeSent && (
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input type="text" inputMode="numeric" maxLength={6} value={emailCode}
                                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                                    placeholder={t("prof.code_ph")}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 tracking-widest placeholder:text-slate-400 focus:border-[#015478] focus:outline-none" />
                                <button onClick={confirmEmail} disabled={emailBusy}
                                    className="whitespace-nowrap rounded-lg bg-[#015478] px-4 py-2 text-sm font-medium text-white hover:bg-[#013d58] disabled:opacity-50">
                                    {emailBusy ? "…" : t("prof.save_email")}
                                </button>
                            </div>
                        )}
                        <button onClick={() => { setEmailMode(false); setCodeSent(false); setNewEmail(""); setEmailCode(""); }}
                            className="text-xs text-slate-500 hover:underline">{t("prof.cancel")}</button>
                    </div>
                )}
            </div>

            {/* Password */}
            <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-slate-800">{t("prof.change_password")}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label={t("prof.current_pwd")} type="password" value={pwd.currentPassword} onChange={(v) => setPwd((p) => ({ ...p, currentPassword: v }))} />
                    <Field label={t("prof.new_pwd")} type="password" value={pwd.newPassword} onChange={(v) => setPwd((p) => ({ ...p, newPassword: v }))} hint={t("prof.min_6")} />
                    <Field label={t("prof.confirm_new")} type="password" value={pwd.confirm} onChange={(v) => setPwd((p) => ({ ...p, confirm: v }))}
                        error={pwd.confirm && pwd.newPassword !== pwd.confirm ? t("prof.not_match") : ""} />
                </div>
                <div className="mt-5 flex justify-end">
                    <button onClick={savePassword} disabled={savingPwd || !pwd.currentPassword || !pwd.newPassword}
                        className="rounded-lg bg-[#015478] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#013d58] disabled:opacity-50">
                        {savingPwd ? t("prof.saving") : t("prof.change_password")}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", required, hint, error }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${error ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-[#015478]"}`}
            />
            {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
        </div>
    );
}

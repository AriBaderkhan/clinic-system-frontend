import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getPublicPlans } from "../../api/planApi";
import { sendRegisterCode, verifyRegisterCode, registerTenant } from "../../api/registrationApi";
import BillingPeriodToggle from "../../components/subscription/BillingPeriodToggle";
import { planPrice } from "../../utils/billing";

const BANK_ACCOUNTS = [
    { label: "FIB", number: "7501437572" },
    { label: "Qicard", number: "7501437572" },
];

const STEPS = ["Plan", "Details", "Payment"];

export default function RegisterPage() {
    const [searchParams] = useSearchParams();

    const [step, setStep] = useState(1);
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [billingPeriod, setBillingPeriod] = useState("monthly");
    const periodLabel = billingPeriod === "yearly" ? "year" : "month";

    const [form, setForm] = useState({
        tenant_name: "", manager_name: "", phone: "", address: "",
        email: "", password: "", confirmPassword: "",
    });

    const [codeSent, setCodeSent] = useState(false);
    const [code, setCode] = useState("");
    const [emailVerified, setEmailVerified] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // Load plans + preselect from ?plan= (matches id or name).
    useEffect(() => {
        (async () => {
            try {
                const res = await getPublicPlans();
                const list = res.data ?? [];
                setPlans(list);
                const wanted = searchParams.get("plan");
                if (wanted) {
                    const match = list.find(
                        (p) => String(p.id) === wanted || p.name?.toLowerCase() === wanted.toLowerCase()
                    );
                    if (match) setSelectedPlanId(match.id);
                }
            } catch (err) {
                toast.error(err.userMessage || "Failed to load plans");
            } finally {
                setLoadingPlans(false);
            }
        })();
    }, [searchParams]);

    const selectedPlan = useMemo(
        () => plans.find((p) => p.id === selectedPlanId) || null,
        [plans, selectedPlanId]
    );

    const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

    // Changing the email invalidates any prior verification.
    const onEmailChange = (v) => {
        setField("email", v);
        setEmailVerified(false);
        setCodeSent(false);
        setCode("");
    };

    const handleSendCode = async () => {
        if (!form.email) return toast.error("Enter your email first.");
        try {
            setSendingCode(true);
            await sendRegisterCode(form.email);
            setCodeSent(true);
            toast.success("Verification code sent to your email.");
        } catch (err) {
            toast.error(err.userMessage || "Failed to send code");
        } finally {
            setSendingCode(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code) return toast.error("Enter the 6-digit code.");
        try {
            setVerifying(true);
            await verifyRegisterCode(form.email, code);
            setEmailVerified(true);
            toast.success("Email verified ✓");
        } catch (err) {
            toast.error(err.userMessage || "Invalid code");
        } finally {
            setVerifying(false);
        }
    };

    const detailsValid =
        form.tenant_name.trim() &&
        form.manager_name.trim() &&
        form.email.trim() &&
        emailVerified &&
        form.password.length >= 6 &&
        form.password === form.confirmPassword;

    const handleSubmit = async () => {
        if (!file) return toast.error("Upload your payment evidence image.");
        try {
            setSubmitting(true);
            await registerTenant({ ...form, plan_id: selectedPlanId, billing_period: billingPeriod }, file);
            setDone(true);
        } catch (err) {
            toast.error(err.userMessage || "Failed to submit registration");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success screen ──
    if (done) {
        return (
            <div className="flex min-h-screen flex-col bg-ground">
                <div className="ocean-band band-dark h-56 shrink-0 sm:h-64" aria-hidden="true" />
                <div className="relative -mt-40 flex flex-1 items-start justify-center px-4 pb-12 sm:-mt-44">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-pop sm:p-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-3xl text-green-700">✓</div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Request submitted!</h1>
                    <p className="mt-2 break-words text-sm text-slate-600">
                        We received your registration for <b>{form.tenant_name}</b>. Our team will review your
                        payment and email you at <b>{form.email}</b> once your account is ready.
                    </p>
                    <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
                        Back to login
                    </Link>
                </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ground">
            <div className="ocean-band band-dark px-4 pb-24 pt-10 sm:pt-12">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">Create your clinic account</h1>
                    <p className="mt-1.5 text-sm text-slate-600">Pick a plan, fill your details, and upload your payment to get started.</p>
                </div>

                {/* Stepper */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                    {STEPS.map((label, i) => {
                        const n = i + 1;
                        const active = step === n;
                        const passed = step > n;
                        return (
                            <div key={label} className="flex items-center gap-2">
                                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${active ? "bg-aqua text-ocean-deep" : passed ? "bg-aqua/20 text-aqua" : "bg-white/10 text-slate-500"}`}>
                                    {passed ? "✓" : n}
                                </span>
                                <span className={`text-sm ${active ? "font-semibold text-slate-900" : "text-slate-500"}`}>{label}</span>
                                {n < STEPS.length && <span className="hidden w-8 border-t border-slate-300 sm:block" />}
                            </div>
                        );
                    })}
                </div>
            </div>
            </div>

            <div className="relative -mt-16 px-4 pb-10">
            <div className="mx-auto max-w-3xl">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-pop sm:p-7">
                    {/* ── Step 1: Plan ── */}
                    {step === 1 && (
                        <div>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-lg font-bold tracking-tight text-slate-900">Choose a plan</h2>
                                <BillingPeriodToggle value={billingPeriod} onChange={setBillingPeriod} />
                            </div>
                            {loadingPlans ? (
                                <p className="animate-pulse py-10 text-center text-sm text-slate-500">Loading plans…</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {plans.map((plan) => {
                                        const selected = plan.id === selectedPlanId;
                                        return (
                                            <button
                                                key={plan.id}
                                                type="button"
                                                onClick={() => setSelectedPlanId(plan.id)}
                                                className={`flex min-w-0 flex-col rounded-2xl border p-4 text-start transition ${selected ? "border-brand bg-brand/5 ring-4 ring-brand/15" : "border-slate-200 bg-white hover:border-brand/50 hover:bg-slate-50"}`}
                                            >
                                                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                                                    <span className="min-w-0 break-words font-bold text-slate-900">{plan.name}</span>
                                                    <span className="font-bold text-brand tabular-nums">${planPrice(plan, billingPeriod)} / {periodLabel}</span>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {plan.max_branches === -1 ? "Unlimited" : plan.max_branches} branches · {Number(plan.included_doctors) === -1 ? "Unlimited" : plan.included_doctors} doctors · staff free
                                                </p>
                                                {Number(plan.included_doctors) !== -1 && (
                                                    <p className="text-xs text-slate-500">
                                                        {Number(plan.extra_doctor_price) < 0
                                                            ? "No extra doctors (upgrade for more)"
                                                            : `+$${billingPeriod === "yearly" ? plan.extra_doctor_yearly_price : plan.extra_doctor_price} / ${periodLabel} per extra doctor`}
                                                    </p>
                                                )}
                                                <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                                                    {(plan.features ?? []).map((f) => (
                                                        <li key={f.code} className="flex items-start gap-1.5 text-xs text-slate-600">
                                                            <span className="shrink-0 text-brand">✓</span> {f.name}
                                                        </li>
                                                    ))}
                                                    {(plan.features ?? []).length === 0 && (
                                                        <li className="text-xs text-slate-400">Core features included</li>
                                                    )}
                                                </ul>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    disabled={!selectedPlanId}
                                    onClick={() => setStep(2)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Details ── */}
                    {step === 2 && (
                        <div>
                            <h2 className="mb-4 text-lg font-bold tracking-tight text-slate-900">Your details</h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Clinic / Tenant name" required value={form.tenant_name} onChange={(v) => setField("tenant_name", v)} />
                                <Field label="Your full name" required value={form.manager_name} onChange={(v) => setField("manager_name", v)} />
                                <Field label="Phone" value={form.phone} onChange={(v) => setField("phone", v)} />
                                <Field label="Address" value={form.address} onChange={(v) => setField("address", v)} />
                            </div>

                            {/* Email + verification */}
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <label className="block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
                                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => onEmailChange(e.target.value)}
                                        disabled={emailVerified}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-60"
                                        placeholder="you@example.com"
                                    />
                                    {emailVerified ? (
                                        <span className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">Verified ✓</span>
                                    ) : (
                                        <button type="button" onClick={handleSendCode} disabled={sendingCode}
                                            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-brand/40 bg-white px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/10 disabled:opacity-60">
                                            {sendingCode ? "Sending…" : codeSent ? "Resend code" : "Send code"}
                                        </button>
                                    )}
                                </div>
                                {codeSent && !emailVerified && (
                                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 tracking-widest tabular-nums"
                                            placeholder="6-digit code"
                                        />
                                        <button type="button" onClick={handleVerifyCode} disabled={verifying}
                                            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                                            {verifying ? "Verifying…" : "Verify"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Password */}
                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Password" type="password" required value={form.password} onChange={(v) => setField("password", v)} hint="At least 6 characters" />
                                <Field label="Confirm password" type="password" required value={form.confirmPassword} onChange={(v) => setField("confirmPassword", v)}
                                    error={form.confirmPassword && form.password !== form.confirmPassword ? "Passwords do not match" : ""} />
                            </div>

                            <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-5">
                                <button type="button" onClick={() => setStep(1)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Back</button>
                                <button type="button" disabled={!detailsValid} onClick={() => setStep(3)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Payment ── */}
                    {step === 3 && (
                        <div>
                            <h2 className="mb-1 text-lg font-bold tracking-tight text-slate-900">Payment</h2>
                            <p className="mb-4 text-sm text-slate-500">
                                Transfer <b className="text-brand">${planPrice(selectedPlan, billingPeriod)}</b> for the <b>{selectedPlan?.name}</b> plan ({billingPeriod}), then upload your payment screenshot.
                            </p>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-800">1 · Transfer to one of these</p>
                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {BANK_ACCOUNTS.map((b) => (
                                        <div key={b.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                                            <span className="text-sm font-medium text-slate-700">{b.label}</span>
                                            <span className="select-all font-mono text-sm font-semibold text-brand">{b.number}</span>
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-4 text-sm font-semibold text-slate-800">2 · Upload payment evidence</p>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 bg-white p-2 text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-dark"
                                />
                                {file && <p className="mt-1.5 break-words text-xs text-slate-500">Selected: {file.name}</p>}
                            </div>

                            <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-5">
                                <button type="button" onClick={() => setStep(2)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Back</button>
                                <button type="button" disabled={submitting || !file} onClick={handleSubmit}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                                    {submitting ? "Submitting…" : "Submit registration"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-5 text-center text-xs text-slate-500">
                    Already have an account? <Link to="/" className="font-semibold text-brand hover:underline">Sign in</Link>
                </p>
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
                className={`mt-1.5 block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4 ${error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-brand focus:ring-brand/15"}`}
            />
            {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
    );
}

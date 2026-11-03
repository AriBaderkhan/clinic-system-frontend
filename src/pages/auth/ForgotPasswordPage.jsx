import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword } from "../../api/authApi";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = email, 2 = code + new password
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);

    const sendCode = async () => {
        if (!email) return toast.error("Enter your email.");
        try {
            setBusy(true);
            await forgotPassword(email);
            // Always advances — the API never reveals whether the email exists.
            toast.success("If that email is registered, a code has been sent.");
            setStep(2);
        } catch (err) {
            toast.error(err.userMessage || "Failed to send code");
        } finally {
            setBusy(false);
        }
    };

    const submitReset = async () => {
        if (newPassword.length < 6) return toast.error("Password must be at least 6 characters.");
        if (newPassword !== confirm) return toast.error("Passwords do not match.");
        try {
            setBusy(true);
            await resetPassword(email, code, newPassword);
            toast.success("Password reset! You can sign in now.");
            navigate("/");
        } catch (err) {
            toast.error(err.userMessage || "Failed to reset password");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-ground">
            {/* navy band behind the card */}
            <div className="ocean-band band-dark h-56 shrink-0 sm:h-64" aria-hidden="true" />
            <div className="relative -mt-40 flex flex-1 items-start justify-center px-4 pb-12 sm:-mt-44">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-pop sm:p-8">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Reset your password</h1>
                <p className="mt-1.5 break-words text-sm text-slate-500">
                    {step === 1 ? "Enter your account email and we'll send a code." : `Enter the code sent to ${email} and your new password.`}
                </p>

                {step === 1 ? (
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                placeholder="you@example.com" />
                        </div>
                        <button onClick={sendCode} disabled={busy}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                            {busy ? "Sending…" : "Send code"}
                        </button>
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Verification code</label>
                            <input type="text" inputMode="numeric" maxLength={6} value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 tracking-widest tabular-nums"
                                placeholder="6-digit code" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">New password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Confirm new password</label>
                            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
                        </div>
                        <button onClick={submitReset} disabled={busy}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                            {busy ? "Resetting…" : "Reset password"}
                        </button>
                        <button onClick={() => setStep(1)} className="w-full rounded-lg py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">Use a different email</button>
                    </div>
                )}

                <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
                    Remembered it? <Link to="/" className="font-semibold text-brand hover:underline">Back to login</Link>
                </p>
            </div>
            </div>
        </div>
    );
}

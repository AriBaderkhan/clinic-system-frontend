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
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lg">
                <h1 className="text-xl font-bold text-slate-900">Reset your password</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {step === 1 ? "Enter your account email and we'll send a code." : `Enter the code sent to ${email} and your new password.`}
                </p>

                {step === 1 ? (
                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none"
                                placeholder="you@example.com" />
                        </div>
                        <button onClick={sendCode} disabled={busy}
                            className="w-full rounded-lg bg-[#015478] py-2.5 text-sm font-semibold text-white hover:bg-[#013d58] disabled:opacity-50">
                            {busy ? "Sending…" : "Send code"}
                        </button>
                    </div>
                ) : (
                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Verification code</label>
                            <input type="text" inputMode="numeric" maxLength={6} value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 tracking-widest placeholder:text-slate-400 focus:border-[#015478] focus:outline-none"
                                placeholder="6-digit code" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">New password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Confirm new password</label>
                            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none" />
                        </div>
                        <button onClick={submitReset} disabled={busy}
                            className="w-full rounded-lg bg-[#015478] py-2.5 text-sm font-semibold text-white hover:bg-[#013d58] disabled:opacity-50">
                            {busy ? "Resetting…" : "Reset password"}
                        </button>
                        <button onClick={() => setStep(1)} className="w-full text-xs text-slate-500 hover:underline">Use a different email</button>
                    </div>
                )}

                <p className="mt-5 text-center text-xs text-slate-400">
                    Remembered it? <Link to="/" className="text-[#015478] hover:underline">Back to login</Link>
                </p>
            </div>
        </div>
    );
}

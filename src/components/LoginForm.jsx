import { useState } from "react";
import { Link } from "react-router-dom";
import { FaTooth } from "react-icons/fa";

export default function LoginForm({ onSubmit, isLoading = false, errorMessage = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSubmit) return;

    onSubmit({ email, password });
  };

  const INPUT = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-pop sm:p-8">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <FaTooth size={22} aria-hidden="true" />
      </div>
      <h1 className="mb-6 text-center text-2xl font-extrabold tracking-tight text-slate-900">
        Clinic Managment System
      </h1>

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            className={INPUT}
            placeholder="tradicompany01@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`${INPUT} pe-20`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-1.5 end-1.5 rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="mt-2 text-end">
            <Link to="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>

        <p className="text-center text-xs text-slate-400">
          Use your credentials provided by the system.
        </p>
      </form>
    </div>
  );
}

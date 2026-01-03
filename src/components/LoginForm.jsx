// src/components/LoginForm.jsx
import { useState } from "react";

function LoginForm({ onSubmit, isLoading = false, errorMessage = "" }) {
  const [email, setEmail] = useState("rece@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSubmit) return;

    onSubmit({ email, password });
  };

  return (
    <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl shadow-blue-100">
      <h1 className="mb-1 text-center text-2xl font-semibold text-slate-900">
        Admin Login
      </h1>
      <p className="mb-8 text-center text-xs text-slate-500">
        Sign in to manage Crown Dental Clinic
      </p>

      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {errorMessage}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            placeholder="rece@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-24 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-1 right-1 my-1 rounded-md px-3 text-xs font-medium text-slate-500 hover:bg-slate-100"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>

        <p className="mt-3 text-center text-[11px] text-slate-400">
          Use your admin credentials provided by the system.
        </p>
      </form>
    </div>
  );
}

export default LoginForm;

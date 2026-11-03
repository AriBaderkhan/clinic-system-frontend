import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiMinimize2, FiMonitor, FiUser, FiArrowRight } from "react-icons/fi";

import Footer from "../components/Footer";
import LoginForm from "../components/LoginForm";
import api from "../api/api"; // axios instance
import { useAuth } from "../context/AuthContext";

export default function Login() {
  /* New: Capture where they came from */
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Branch Selection State
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loginCredentials, setLoginCredentials] = useState({ email: '', password: '' });

  // Check if already logged in -> redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Auto-redirect if we have a valid session
    if (token && role) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const processLoginSuccess = (data) => {
    const { token, user, role } = data;

    if (!token) {
      throw new Error("No token returned from API");
    }

    // Store auth data
    localStorage.setItem("token", token);
    if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

    // FIX: Force role to lowercase to ensure matching with App.jsx routes (e.g. "Reception" -> "reception")
    // Check if role is an object (from new backend) or string (fallback)
    const userRole = user?.role || role;
    if (userRole) {
      localStorage.setItem("role", String(userRole).toLowerCase());
    }

    if (user?.name) {
      localStorage.setItem("name", user.name);
    }
    if (user?.email) {
      localStorage.setItem("email", user.email);
    }

    // Save full user object so AuthContext can load branch_id etc.
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }

    // START FIX: Persist available branches if they exist in state
    if (availableBranches.length > 0) {
      localStorage.setItem("availableBranches", JSON.stringify(availableBranches));
    }
    // END FIX

    // the app's logged-in user (not only localStorage) — else /home sees nobody and bounces back here
    login(token, userRole ? String(userRole).toLowerCase() : "", user);

    // Go to where they wanted to go, or dashboard default
    navigate(from, { replace: true });
  }

  const handleLogin = async ({ email, password, branch_id = null }) => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const payload = { email, password };
      if (branch_id) {
        payload.branch_id = branch_id;
      }

      // POST /login
      const res = await api.post("/login", payload);

      // Check for Branch Selection Requirement
      if (res.data.requiresBranchSelection) {
        // backend sends the branch list under `data` ({ ok, requiresBranchSelection, data })
        setAvailableBranches(res.data.data || res.data.branches || []);
        setLoginCredentials({ email, password });
        setShowBranchModal(true);
        return; // Stop here, wait for user selection
      }

      // Normal Login Success
      processLoginSuccess(res.data);

    } catch (err) {
      const msg = err.userMessage || err.response?.data?.message || "Login failed. Please try again.";
      setErrorMessage(msg);

    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchSelect = (branchId) => {
    setShowBranchModal(false);
    handleLogin({
      email: loginCredentials.email,
      password: loginCredentials.password,
      branch_id: branchId
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-ground">
      {/* navy band behind the card */}
      <div className="ocean-band band-dark h-56 shrink-0 sm:h-64" aria-hidden="true" />

      <main className="relative -mt-40 flex flex-1 items-start justify-center px-4 pb-12 sm:-mt-44">
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />

        {/* Branch Selection Modal */}
        {showBranchModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && setShowBranchModal(false)}
          >
            <div className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
              <div className="ocean-band band-dark px-6 py-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-aqua/20 text-aqua">
                  <FiMinimize2 size={26} />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Select Branch</h2>
                <p className="mt-1 text-sm text-slate-600">Please choose which branch to access</p>
              </div>

              <div className="px-5 py-5">
                <div className="max-h-[50vh] space-y-2.5 overflow-y-auto pe-1 custom-scrollbar">
                  {availableBranches.map((branch) => (
                    <button
                      key={branch.branch_id}
                      onClick={() => handleBranchSelect(branch.branch_id)}
                      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-brand hover:bg-brand/5"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                          <FiMonitor size={18} />
                        </div>
                        <div className="min-w-0 text-start">
                          <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand">Branch {branch.branch_name}</h3>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <FiUser size={12} className="shrink-0 text-slate-400" />
                            <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{branch.role_name}</p>
                          </div>
                        </div>
                      </div>
                      <FiArrowRight className="shrink-0 text-slate-300 transition-all group-hover:text-brand rtl:rotate-180" size={20} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center border-t border-slate-100 px-5 py-4">
                <button
                  onClick={() => setShowBranchModal(false)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel Login
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

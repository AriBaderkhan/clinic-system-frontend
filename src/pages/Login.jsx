import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiMinimize2, FiMonitor, FiUser, FiArrowRight } from "react-icons/fi";

import Footer from "../components/Footer";
import LoginForm from "../components/LoginForm";
import api from "../api/api"; // axios instance

export default function Login() {
  /* New: Capture where they came from */
  const navigate = useNavigate();
  const location = useLocation();
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
        setAvailableBranches(res.data.branches || []);
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex flex-1 items-center justify-center px-4 py-10 relative">
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />

        {/* Branch Selection Modal */}
        {showBranchModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && setShowBranchModal(false)}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
              <div className="bg-gradient-to-r from-[#015478] to-[#013d58] px-6 py-6 text-white text-center">
                <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                  <FiMinimize2 size={32} />
                </div>
                <h2 className="text-2xl font-bold">Select Branch</h2>
                <p className="text-white text-sm mt-1">Please choose which branch to access</p>
              </div>

              <div className="p-6">
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                  {availableBranches.map((branch) => (
                    <button
                      key={branch.branch_id}
                      onClick={() => handleBranchSelect(branch.branch_id)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#015478] hover:bg-[#015478]/10 hover:shadow-md transition-all group group-hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-[#015478]/20 text-[#015478] flex items-center justify-center group-hover:bg-[#015478] group-hover:text-white transition-colors">
                          <FiMonitor size={20} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900 group-hover:text-[#015478]">Branch {branch.branch_name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <FiUser size={12} className="text-gray-400 group-hover:text-[#015478]" />
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide group-hover:text-[#015478]">{branch.role_name}</p>
                          </div>
                        </div>
                      </div>
                      <FiArrowRight className="text-gray-300 group-hover:text-[#015478] transform group-hover:translate-x-1 transition-all" size={20} />
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
                  <button
                    onClick={() => setShowBranchModal(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium hover:underline"
                  >
                    Cancel Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

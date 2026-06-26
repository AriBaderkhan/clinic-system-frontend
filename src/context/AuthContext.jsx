import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { getMyProfile } from "../api/profileApi";

const AuthContext = createContext();

// stable comparison regardless of order
const permsKey = (p) => JSON.stringify([...(p || [])].sort());

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [profile, setProfile] = useState(null); // { full_name, email, phone, address, role, image_url }
  const navigate = useNavigate();

  // The caller's own profile (powers the avatar everywhere). Call after edits.
  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const res = await getMyProfile();
      setProfile(res.data ?? null);
    } catch {
      // never break the app if it fails
    }
  }, []);

  // Sync state with localStorage purely for initial load
  // (In a more advanced version, you might validate the token with the backend here)

  const login = (newToken, newRole, newUserData) => {
    setToken(newToken);
    setRole(newRole);
    setUser(newUserData);

    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole);
    localStorage.setItem("user", JSON.stringify(newUserData));

    // Save other user details if needed
    if (newUserData?.name) localStorage.setItem("name", newUserData.name);
    if (newUserData?.email) localStorage.setItem("email", newUserData.email);

    // Navigation handles in the UI component (Login.jsx) or here.
    // Usually cleaner to return success and let UI navigate, or navigate here.
    // navigate("/dashboard"); 
  };

  const logout = () => {
    setToken("");
    setRole("");
    setUser(null);
    localStorage.clear();
    navigate("/");
  };

  // Pull the user's CURRENT role + permissions from the backend and keep
  // localStorage in sync. If they actually changed (admin edited the role),
  // reload so the layouts/PermissionRoute — which read localStorage — pick it up
  // cleanly. Same reload pattern the app already uses on branch switch.
  const refreshPermissions = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const res = await api.get("/me");
      const fresh = res.data?.user;
      if (!fresh) return;

      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const changed =
        permsKey(stored?.permissions) !== permsKey(fresh.permissions) ||
        stored?.role !== fresh.role;

      localStorage.setItem("user", JSON.stringify(fresh));
      if (fresh.role) localStorage.setItem("role", String(fresh.role).toLowerCase());
      setUser(fresh);
      if (fresh.role) setRole(String(fresh.role).toLowerCase());

      if (changed) window.location.reload();
    } catch {
      // never break the app if /me fails
    }
  }, []);

  // Refresh on load and whenever the user comes back to the tab.
  useEffect(() => {
    refreshPermissions();
    refreshProfile();
    const onFocus = () => { refreshPermissions(); refreshProfile(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshPermissions, refreshProfile]);

  // Helper boolean
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, role, user, profile, isAuthenticated, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const navigate = useNavigate();

  // Sync state with localStorage purely for initial load
  // (In a more advanced version, you might validate the token with the backend here)

  const login = (newToken, newRole, newUserData) => {
    setToken(newToken);
    setRole(newRole);
    setUser(newUserData);

    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole);
    
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

  // Helper boolean
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, role, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

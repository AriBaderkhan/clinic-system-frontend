// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import LoginForm from "../components/LoginForm";
import api from "../api/api"; // axios instance

function Login() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async ({ email, password }) => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      // POST /login   <-- your Express route
      const res = await api.post("/login", { email, password });

      // Adjust this shape to match your backend response exactly
      // Example expected:
      // { token: "...", user: { role: "admin", name: "Admin User", email: "..." } }
      const { token, user, role } = res.data;

      if (!token) {
        throw new Error("No token returned from API");
      }

      // Store auth data
      localStorage.setItem("token", token);
      if (user?.role || role) {
        localStorage.setItem("role", user?.role || role);
      }
      if (user?.name) {
        localStorage.setItem("name", user.name);
      }
      if (user?.email) {
        localStorage.setItem("email", user.email);
      }

      // Go to dashboard
      navigate("/dashboard");
    } catch (err) {
        setErrorMessage(err.userMessage || "Login failed. Please try again.");
     
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      </main>

      <Footer />
    </div>
  );
}

export default Login;
// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

function RoleRoute({ children, allowedRoles }) {
  // later this will be real token from backend login
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // if no token → kick user to login
  if (!token) {
    return <Navigate to="/" replace />;
  }
  if (!allowedRoles.includes(role)) {
    // you can send to "Not authorized" page instead
    return <Navigate to="/dashboard" replace />;
  }

  // if token exists → allow access
  return children;
}

export default RoleRoute;
// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const location = useLocation()
  // later this will be real token from backend login
  const token = localStorage.getItem("token");


  // if no token → kick user to login
  if (!token) {
    return <Navigate to="/" replace state={{from: location }}/>;
  }
 

  // if token exists → allow access
  return children;
}

export default ProtectedRoute;
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasTick } from "../utils/can";

/**
 * Renders children only when the user has the tick (or ANY of several ticks).
 * Otherwise redirects to /home (pages) or renders nothing (hideOnly, for buttons).
 * The backend checks every request again — this only keeps the screen honest.
 */
export default function PermissionRoute({ children, requiredPermission, redirectPath = "/home", hideOnly = false }) {
    const { user } = useAuth();
    const keys = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

    if (hasTick(user, ...keys)) return children;
    if (hideOnly) return null;
    return <Navigate to={redirectPath} replace />;
}

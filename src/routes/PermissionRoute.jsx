import { Navigate, useLocation } from "react-router-dom";

/**
 * Validates if the user has the required permission.
 * If yes, renders children.
 * If no, redirects (default /dashboard) or renders null (if used for hiding buttons).
 */
function PermissionRoute({ children, requiredPermission, redirectPath = "/dashboard", hideOnly = false }) {
    const userString = localStorage.getItem("user");
    let userPermissions = [];

    if (userString) {
        try {
            const user = JSON.parse(userString);
            userPermissions = user.permissions || [];
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
        }
    }

    // Check if user has the specific permission
    const hasPermission = userPermissions.includes(requiredPermission);

    if (hasPermission) {
        return children;
    }

    // Check if we just want to hide component (return null) or redirect (for routes)
    if (hideOnly) {
        return null;
    }

    return <Navigate to={redirectPath} replace />;
}

export default PermissionRoute;

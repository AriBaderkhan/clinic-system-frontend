import { Navigate, useLocation } from "react-router-dom";

// Old role-based links (/reception/..., /branch/..., /doctor/..., /tenant/...) -> the one new set,
// so saved bookmarks keep working.
const DOCTOR = { "": "/my-day", appts_per_doc: "/my-appointments", calendar: "/appointments/calendar", report: "/my-report", lab: "/lab", settings: "/settings" };
const TENANT = { "": "/overview", branches: "/clinic/branches", users: "/clinic/users", settings: "/clinic/settings", reports: "/reports", feedback: "/clinic/feedback", audit: "/clinic/audit" };

function newPathFor(pathname) {
  const [, area, ...rest] = pathname.split("/");
  const tail = rest.join("/").replace(/\/+$/, "");
  if (area === "doctor") return DOCTOR[tail] ?? "/home";
  if (area === "tenant") return TENANT[tail] ?? "/home";
  // reception + branch pages kept their names, only the prefix goes away
  return tail ? `/${tail}` : "/home";
}

export default function OldLinkRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={newPathFor(pathname) + search} replace />;
}

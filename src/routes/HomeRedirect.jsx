import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { homePath } from "../config/navItems";
import { hasTick } from "../utils/can";

// /home: the user's first dashboard (or first page). No pages at all -> a clear message, never a loop.
export default function HomeRedirect() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasFeature } = useSubscription();

  if (!user) return <Navigate to="/" replace />;
  if (hasTick(user, "manage_system")) return <Navigate to="/admin" replace />;

  const to = homePath(user, hasFeature);
  if (to) return <Navigate to={to} replace />;

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-900">{t("nav.no_pages_title")}</h1>
      <p className="mt-2 text-sm text-slate-600">{t("nav.no_pages_text")}</p>
    </div>
  );
}

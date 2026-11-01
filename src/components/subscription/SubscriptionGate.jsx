import { useTranslation } from "react-i18next";
import { useSubscription } from "../../context/SubscriptionContext";
import { useAuth } from "../../context/AuthContext";
import SubscriptionSection from "./SubscriptionSection";

// Wraps a layout's pages. When the clinic's subscription has expired the backend
// blocks everything except renewal, so instead of broken pages we show:
//  - a manager (manage_subscription): the renew form
//  - everyone else: "contact your clinic manager"
export default function SubscriptionGate({ children }) {
    const { t } = useTranslation();
    const { status } = useSubscription();
    const { user } = useAuth();

    if (status?.status !== "expired") return children;

    const canRenew = (user?.permissions || []).includes("manage_subscription");

    return (
        <div className="mx-auto max-w-3xl space-y-5">
            <div className="rounded-lg border border-red-100 bg-red-50 p-5 text-center">
                <h2 className="text-lg font-bold text-red-700">{t("subscription.expired_title")}</h2>
                <p className="mt-1 text-sm text-red-600">
                    {canRenew ? t("subscription.expired_manager") : t("subscription.expired_staff")}
                </p>
            </div>
            {canRenew && <SubscriptionSection />}
        </div>
    );
}

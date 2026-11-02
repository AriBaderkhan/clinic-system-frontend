import { Link } from "react-router-dom";
import { useSubscription } from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";
import { hasTick } from "../utils/can";

// Shows in the last 7 days (expiring) or after expiry. People who can renew get a
// button to the subscription page; the others just see the heads-up.
export default function SubscriptionBanner() {
    const { status } = useSubscription();
    const { user } = useAuth();
    if (!status || !status.in_warning) return null;

    const canRenew = hasTick(user, "manage_subscription");
    const pending = status.pending_request;
    const expired = status.status === "expired";

    // pending review = neutral; expired = red; expiring = amber
    const tone = pending
        ? "border-sky-100 bg-sky-50 text-sky-700"
        : expired
            ? "border-red-100 bg-red-50 text-red-700"
            : "border-amber-100 bg-amber-50 text-amber-700";

    let message;
    if (pending) {
        message = `Your renewal for "${pending.plan_name}" is awaiting confirmation.`;
    } else if (expired) {
        message = "Your subscription has expired. Renew now to avoid interruption.";
    } else {
        const d = status.days_left;
        message = `Your plan ends in ${d} day${d === 1 ? "" : "s"}. Please renew soon.`;
    }

    return (
        <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${tone}`}>
            <p className="text-[13px] font-medium">
                <span className="mr-1">{pending ? "⏳" : "⚠"}</span>
                {message}
            </p>
            {canRenew && !pending && (
                <Link
                    to="/clinic/settings"
                    className="shrink-0 rounded-lg bg-[#0E6E75] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0A565C]"
                >
                    Go to Subscription
                </Link>
            )}
        </div>
    );
}

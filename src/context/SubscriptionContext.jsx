import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMySubscription, getMyFeatures } from "../api/subscriptionApi";
import { useAuth } from "./AuthContext";

// One place that knows the tenant's subscription state + included features.
// Powers the renewal banner (status) and feature-hiding in the UI (hasFeature).
// The backend still enforces everything — this is UX only.
const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();

    const [status, setStatus] = useState(null);        // { status, days_left, in_warning, can_renew, pending_request, ... }
    const [features, setFeatures] = useState([]);      // feature codes
    const [featuresLoaded, setFeaturesLoaded] = useState(false);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            const [statusRes, featuresRes] = await Promise.all([
                getMySubscription().catch(() => null),
                getMyFeatures().catch(() => null),
            ]);
            setStatus(statusRes?.data ?? null);
            setFeatures(Array.isArray(featuresRes?.data) ? featuresRes.data : []);
        } catch {
            // non-fatal — never block the app over the subscription read
        } finally {
            setFeaturesLoaded(true);
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) refresh();
        else { setStatus(null); setFeatures([]); setFeaturesLoaded(false); }
    }, [isAuthenticated, refresh]);

    // Pick up plan/feature changes without a re-login (e.g. the admin assigns or
    // removes a feature, then the user comes back to this tab).
    useEffect(() => {
        if (!isAuthenticated) return;
        const onFocus = () => refresh();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [isAuthenticated, refresh]);

    // While features haven't loaded yet, don't hide anything (avoids a flash of
    // missing nav for tenants who DO have the feature).
    const hasFeature = useCallback(
        (code) => !featuresLoaded || features.includes(code),
        [featuresLoaded, features]
    );

    return (
        <SubscriptionContext.Provider value={{ status, features, featuresLoaded, loading, hasFeature, refresh }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSubscription = () => useContext(SubscriptionContext);

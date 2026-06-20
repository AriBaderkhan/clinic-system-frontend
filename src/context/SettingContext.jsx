import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getEffectiveSettings } from "../api/settingApi";
import { useAuth } from "./AuthContext";

// ── The single source of truth for how dates, times and money are displayed ──
// Every screen reads its formatters from here (via useSettings()). Because the
// timezone/currency live in React state, the moment they load or change, every
// screen that shows a date/time re-renders itself automatically — there is no
// "loose variable" that can get stuck, so times can never silently fall back to
// UTC again. To add a new formatted display anywhere: const { formatTime } =
// useSettings(). To change how a date looks everywhere: edit it once, here.

const SettingContext = createContext();

// localStorage cache keys — used only to seed the first render so there is no
// "UTC flash" before the settings request returns. The React state below is the
// real source of truth; this is just a remembered default.
const TZ_KEY = "appTimezone";
const CURRENCY_KEY = "appCurrency";

// Currencies that have no minor unit in everyday use → displayed without decimals.
const ZERO_DECIMAL_CURRENCIES = new Set([
    "IQD", "JPY", "KRW", "VND", "CLP", "ISK", "HUF", "UGX", "TZS",
    "XOF", "XAF", "XPF", "PYG", "RWF", "KMF", "DJF", "GNF", "VUV", "MGA",
]);

function readCached(key, fallback) {
    try {
        return localStorage.getItem(key) || fallback;
    } catch {
        return fallback;
    }
}

function writeCached(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // private mode / storage disabled — state still works for this session
    }
}

export const SettingProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // Seed from the cached values so the very first render is already correct.
    const [settings, setSettings] = useState({
        timezone: readCached(TZ_KEY, "UTC"),
        currency_code: readCached(CURRENCY_KEY, "USD"),
    });
    const [loading, setLoading] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            const res = await getEffectiveSettings();
            const data = res.data ?? res; // endpoint returns { ok, data: {...} }
            const timezone = data.timezone || "UTC";
            const currency_code = data.currency_code || "USD";
            writeCached(TZ_KEY, timezone);
            writeCached(CURRENCY_KEY, currency_code);
            setSettings({ timezone, currency_code });
        } catch (error) {
            console.error("Failed to load settings", error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) fetchSettings();
    }, [isAuthenticated, fetchSettings]);

    // Pick up timezone/currency changes without logout (e.g. after an admin
    // edits the branch settings, then comes back to a tab).
    useEffect(() => {
        if (!isAuthenticated) return;
        const onFocus = () => fetchSettings();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [isAuthenticated, fetchSettings]);

    const { timezone, currency_code } = settings;

    // ── Formatters (reactive: rebuilt whenever timezone/currency change) ──
    const formatDate = useCallback(
        (value) => {
            if (!value) return "-";
            try {
                return new Date(value).toLocaleDateString("en-US", { timeZone: timezone });
            } catch {
                return new Date(value).toLocaleDateString();
            }
        },
        [timezone]
    );

    const formatTime = useCallback(
        (value) => {
            if (!value) return "-";
            try {
                return new Date(value).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: timezone,
                });
            } catch {
                return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            }
        },
        [timezone]
    );

    const formatDateTime = useCallback(
        (value, timezoneOverride) => {
            if (!value) return "-";
            const tz = timezoneOverride || timezone;
            try {
                const date = new Date(value).toLocaleDateString("en-US", { timeZone: tz });
                const time = new Date(value).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: tz,
                });
                return `${date}, ${time}`;
            } catch {
                return `${formatDate(value)}, ${formatTime(value)}`;
            }
        },
        [timezone, formatDate, formatTime]
    );

    const formatMoney = useCallback(
        (amount, currencyOverride) => {
            if (amount === null || amount === undefined || amount === "") return "";
            const curr = currencyOverride || currency_code || "USD";
            const n = Number(amount);
            if (Number.isNaN(n)) return "";
            // Currencies people use as whole units (no cents) — show 0 decimals.
            const noDecimals = ZERO_DECIMAL_CURRENCIES.has(curr);
            const min = noDecimals ? 0 : 2;
            try {
                return new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: curr,
                    currencyDisplay: "narrowSymbol", // $ instead of US$, € , ₹, etc.
                    minimumFractionDigits: min,
                    maximumFractionDigits: 2,
                }).format(n);
            } catch {
                // unknown/odd code → grouped number + code suffix
                return `${n.toLocaleString("en-US", { minimumFractionDigits: min, maximumFractionDigits: 2 })} ${curr}`;
            }
        },
        [currency_code]
    );

    return (
        <SettingContext.Provider
            value={{
                settings,
                loading,
                refreshSettings: fetchSettings,
                formatDate,
                formatTime,
                formatDateTime,
                formatMoney,
            }}
        >
            {children}
        </SettingContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingContext);

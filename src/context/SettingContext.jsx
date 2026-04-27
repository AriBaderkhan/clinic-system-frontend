import { createContext, useContext, useEffect, useState } from "react";
import { getEffectiveSettings } from "../api/settingApi";
import { useAuth } from "./AuthContext";

const SettingContext = createContext();

export const SettingProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [settings, setSettings] = useState({
        timezone: "UTC",
        currency_code: "USD",
    });
    const [loading, setLoading] = useState(false);

    const fetchSettings = async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            const data = await getEffectiveSettings();
            // Ensure we have defaults if api returns nulls
            setSettings({
                timezone: data.timezone || "UTC",
                currency_code: data.currency_code || "USD"
            });
        } catch (error) {
            console.error("Failed to load settings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchSettings();
        }
    }, [isAuthenticated]);

    const formatDateTime = (isoString, timezoneOverride) => {
        if (!isoString) return "";
        const tz = timezoneOverride || settings.timezone;
        try {
            return new Date(isoString).toLocaleString('en-US', { timeZone: tz });
        } catch (e) {
            console.error("Date format error", e);
            return isoString;
        }
    };

    const formatMoney = (amount, currencyOverride) => {
        if (amount === null || amount === undefined) return "";
        const curr = currencyOverride || settings.currency_code;
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(amount);
        } catch (e) {
            console.error("Money format error", e);
            return `${amount}`;
        }
    };

    return (
        <SettingContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, formatDateTime, formatMoney }}>
            {children}
        </SettingContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingContext);

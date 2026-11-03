import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getTheme, toggleTheme } from "../utils/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme());
  const { t } = useTranslation();

  const handleToggle = () => {
    setTheme(toggleTheme());
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isDark ? t('settings.switch_light') : t('settings.switch_dark')}
      className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
    >
      <span>{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? t('settings.light_mode') : t('settings.dark_mode')}</span>
    </button>
  );
}

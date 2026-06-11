import { useState } from "react";
import { getTheme, toggleTheme } from "../utils/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme());

  const handleToggle = () => {
    setTheme(toggleTheme());
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-900 transition hover:bg-black/10 hover:text-black"
    >
      <span>{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}

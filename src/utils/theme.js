// Dark mode: toggles the .dark class on <html>, remembered in localStorage.

export function getTheme() {
  return localStorage.getItem("theme") === "dark" ? "dark" : "light";
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

// call once on app start (before render) so there is no light flash
export function initTheme() {
  applyTheme(getTheme());
}

// logout uses localStorage.clear() which would also wipe the theme — use this instead
export function clearStorageKeepingTheme() {
  // Best-effort: tell the server to REVOKE this session's refresh token so it
  // can't be reused after logout. Fire-and-forget with keepalive so it still
  // completes as the page navigates away — never block logout on it.
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    const base = import.meta.env.VITE_API_BASE_URL;
    if (refreshToken && base) {
      fetch(`${base}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // ignore — logout must always proceed
  }

  const theme = localStorage.getItem("theme");
  localStorage.clear();
  if (theme) localStorage.setItem("theme", theme);
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
  return next;
}

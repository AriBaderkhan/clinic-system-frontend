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

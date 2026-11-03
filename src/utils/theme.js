// The user's design (theme, font, corners, cards, size, light/dark) — see src/theme/designs.js.
// Shown instantly from this browser's copy, then replaced by the copy saved on the user's account.
import { applyDesign, cachedDesign, cacheDesign, forgetDesign, DEFAULT_DESIGN } from "../theme/designs";

let current = null;
let saveToAccount = null; // set by the layouts once a user is logged in

export function currentDesign() {
  return current || cachedDesign();
}

// show a design now; save=true also stores it on the account (the light/dark button does this)
export function setDesign(design, { save = false } = {}) {
  current = applyDesign(design);
  cacheDesign(current);
  if (save && saveToAccount) saveToAccount(current);
  window.dispatchEvent(new CustomEvent("design-change", { detail: current }));
  return current;
}

export function onDesignSave(fn) {
  saveToAccount = fn;
}

export function getTheme() {
  return currentDesign().mode;
}

export function applyTheme(theme) {
  setDesign({ ...currentDesign(), mode: theme === "dark" ? "dark" : "light" });
}

// call once on app start (before render) so there is no flash
export function initTheme() {
  current = applyDesign(cachedDesign());
}

// Logout: wipe the session AND this user's design, so the next person on a shared PC
// starts from the default look (their own design comes back from their account at login).
export function clearStorageOnLogout() {
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

  try { localStorage.clear(); } catch { /* storage blocked */ }
  forgetDesign();
  saveToAccount = null;
  current = applyDesign(DEFAULT_DESIGN);
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  setDesign({ ...currentDesign(), mode: next }, { save: true });
  return next;
}

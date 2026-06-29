import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ar from "./locales/ar.json";
import ckb from "./locales/ckb.json";
import { LANGUAGES, DEFAULT_LANG } from "./languages";

// Remembered choice (falls back to default for a new user).
const saved = localStorage.getItem("lang");
const initial = saved && LANGUAGES[saved] ? saved : DEFAULT_LANG;

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        ar: { translation: ar },
        ckb: { translation: ckb },
    },
    lng: initial,
    fallbackLng: DEFAULT_LANG, // missing key in a language → show English
    interpolation: { escapeValue: false }, // React already escapes
});

// Apply direction + <html lang> so the layout mirrors and the right font loads.
export function applyLang(lng) {
    const cfg = LANGUAGES[lng] || LANGUAGES[DEFAULT_LANG];
    document.documentElement.lang = lng;
    document.documentElement.dir = cfg.dir;
}

// The single entry point the switcher uses: change language + persist + flip dir.
export function changeLanguage(lng) {
    if (!LANGUAGES[lng]) return;
    localStorage.setItem("lang", lng);
    i18n.changeLanguage(lng);
    applyLang(lng);
}

applyLang(initial); // set dir on first load (before render)

export default i18n;

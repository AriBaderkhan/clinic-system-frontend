// One place that describes every supported language.
// To ADD a language later: add one entry here + one matching JSON file in locales/.
// dir drives the whole layout (rtl mirrors the UI); rtl languages use the Arabic font.
export const LANGUAGES = {
    en: { label: "English", dir: "ltr" },
    ar: { label: "العربية", dir: "rtl" },
    ckb: { label: "کوردی", dir: "rtl" }, // Kurdish (Sorani)
};

export const DEFAULT_LANG = "en";

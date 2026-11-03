// Each user's design: theme (all colours, light + dark), font, corners, cards, size, light/dark.
// Everything is CSS variables (see src/index.css + tailwind.config.js), so a design is applied by
// writing one <style> block — every page, button and table follows. The option lists must match
// the backend validator (Clinic_system/validates/profileValidate.js -> designSchema).

export const DEFAULT_DESIGN = { theme: "ocean", font: "jakarta", corners: "soft", cards: "soft", size: "normal", mode: "light" };

// nh/ns = hue/saturation of the greys (page, cards, borders, text); brand = buttons/links;
// hi = the one highlight (key button on the band, busiest hour); band = the top band [start, middle, end];
// deep = darkest band colour (text on the highlight, popup overlays)
export const THEMES = [
  { id: "ocean", nh: 207, ns: 30, brand: ["#1D5FBF", "#6FA8FF"], hi: ["#18A9B0", "#3FD0D4"],
    band: [["#0B1E3A", "#123B66", "#1B5A8A"], ["#08142A", "#0F2A4D", "#15406B"]], deep: ["#0B1E3A", "#08142A"] },
  { id: "graphite", nh: 220, ns: 9, brand: ["#2F6FE4", "#5C9DFF"], hi: ["#3D8BFF", "#4D94FF"],
    band: [["#121419", "#1F232C", "#2C3240"], ["#0E1014", "#171A21", "#20242E"]], deep: ["#0E1014", "#0A0B0E"] },
  { id: "plum", nh: 310, ns: 12, brand: ["#8A3A86", "#D394CF"], hi: ["#F07FA5", "#F48FB1"],
    band: [["#2A1030", "#47204F", "#62306C"], ["#1C0A20", "#2E1535", "#3F2047"]], deep: ["#1C0A20", "#12061A"] },
  { id: "emerald", nh: 160, ns: 16, brand: ["#0F7A5C", "#4FD1A5"], hi: ["#5EEAD4", "#5EEAD4"],
    band: [["#062A22", "#0B4A3B", "#127056"], ["#04150F", "#08281F", "#0D3A2D"]], deep: ["#04150F", "#030E0A"] },
  { id: "sky", nh: 200, ns: 34, brand: ["#0A78BE", "#4CC2F0"], hi: ["#7DD3FC", "#7DD3FC"],
    band: [["#0A4F80", "#0F6FA8", "#1A8CC4"], ["#0A3550", "#0E5276", "#137196"]], deep: ["#06304D", "#041F33"] },
  { id: "coral", nh: 15, ns: 22, brand: ["#C93C35", "#FF8A6E"], hi: ["#FFD27A", "#FFD27A"],
    band: [["#7A1E1E", "#A3302B", "#C4483A"], ["#4A1715", "#6A2420", "#86331F"]], deep: ["#4A1715", "#2A0C0B"] },
  { id: "violet", nh: 250, ns: 18, brand: ["#5038C8", "#A797FF"], hi: ["#F0A132", "#F4B256"],
    band: [["#21186A", "#35279A", "#4B3BBE"], ["#16104A", "#231A6A", "#30258A"]], deep: ["#16104A", "#0D0930"] },
];

// Latin font + a Kurdish/Arabic font that has ALL Sorani letters (ڕ ڵ ێ ۆ ە ڤ ک گ پ چ) — checked in tests.
// w / rw = weights that exist on Google Fonts; tag = the feel shown in the font picker.
export const FONTS = [
  { id: "jakarta", latin: "Plus Jakarta Sans", w: "400;500;600;700;800", rtl: "Vazirmatn", rw: "400;500;600;700;800", tag: "modern" },
  { id: "inter", latin: "Inter", w: "400;500;600;700;800", rtl: "Vazirmatn", rw: "400;500;600;700;800", tag: "clean" },
  { id: "manrope", latin: "Manrope", w: "400;500;600;700;800", rtl: "Zain", rw: "400;500;600;700", tag: "modern" },
  { id: "nunito", latin: "Nunito", w: "400;500;600;700;800", rtl: "Marhey", rw: "400;500;600;700", tag: "rounded" },
  { id: "poppins", latin: "Poppins", w: "400;500;600;700;800", rtl: "IBM Plex Sans Arabic", rw: "400;500;600;700", tag: "geometric" },
  { id: "outfit", latin: "Outfit", w: "400;500;600;700;800", rtl: "Reem Kufi", rw: "400;500;600;700", tag: "geometric" },
  { id: "rubik", latin: "Rubik", w: "400;500;600;700;800", rtl: "Noto Sans Arabic", rw: "400;500;600;700;800", tag: "friendly" },
  { id: "plex", latin: "IBM Plex Sans", w: "400;500;600;700", rtl: "IBM Plex Sans Arabic", rw: "400;500;600;700", tag: "technical" },
  { id: "serif", latin: "Source Serif 4", w: "400;500;600;700", rtl: "Noto Naskh Arabic", rw: "400;500;600;700", tag: "classic" },
  { id: "lexend", latin: "Lexend", w: "400;500;600;700;800", rtl: "Vazirmatn", rw: "400;500;600;700;800", tag: "readable" },
  { id: "dmsans", latin: "DM Sans", w: "400;500;600;700;800", rtl: "Zain", rw: "400;500;600;700", tag: "clean" },
  { id: "figtree", latin: "Figtree", w: "400;500;600;700;800", rtl: "Vazirmatn", rw: "400;500;600;700;800", tag: "friendly" },
  { id: "sora", latin: "Sora", w: "400;500;600;700;800", rtl: "IBM Plex Sans Arabic", rw: "400;500;600;700", tag: "technical" },
  { id: "urbanist", latin: "Urbanist", w: "400;500;600;700;800", rtl: "Zain", rw: "400;500;600;700", tag: "modern" },
  { id: "montserrat", latin: "Montserrat", w: "400;500;600;700;800", rtl: "Kufam", rw: "400;500;600;700;800", tag: "bold" },
  { id: "raleway", latin: "Raleway", w: "400;500;600;700;800", rtl: "Harmattan", rw: "400;500;600;700", tag: "elegant" },
  { id: "quicksand", latin: "Quicksand", w: "400;500;600;700", rtl: "Marhey", rw: "400;500;600;700", tag: "rounded" },
  { id: "mulish", latin: "Mulish", w: "400;500;600;700;800", rtl: "Noto Sans Arabic", rw: "400;500;600;700;800", tag: "readable" },
  { id: "redhat", latin: "Red Hat Display", w: "400;500;600;700;800", rtl: "Mirza", rw: "400;500;600;700", tag: "elegant" },
  { id: "merriweather", latin: "Merriweather", w: "400;700", rtl: "Amiri", rw: "400;700", tag: "classic" },
];

export const CORNERS = {
  sharp: { md: "3px", lg: "4px", xl: "6px", "2xl": "8px", "3xl": "10px" },
  soft: { md: "6px", lg: "8px", xl: "12px", "2xl": "16px", "3xl": "24px" },
  round: { md: "8px", lg: "12px", xl: "16px", "2xl": "22px", "3xl": "30px" },
};
export const CARDS = {
  soft: "0 1px 2px rgb(var(--shadow) / 0.06), 0 12px 28px -20px rgb(var(--shadow) / 0.45)",
  flat: "none",
  raised: "0 2px 4px rgb(var(--shadow) / 0.08), 0 18px 36px -18px rgb(var(--shadow) / 0.55)",
};
export const SIZES = { compact: "15px", normal: "16px", large: "17.5px" };

export const OPTION_LISTS = {
  theme: [...THEMES.map((t) => t.id), "custom"], font: FONTS.map((f) => f.id), corners: Object.keys(CORNERS),
  cards: Object.keys(CARDS), size: Object.keys(SIZES), mode: ["light", "dark"],
};

// "My colours": the user's own 3 colours (everything else is worked out from them)
export const DEFAULT_COLORS = { brand: "#1D5FBF", band: "#123B66", hi: "#18A9B0" };
const isHex = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);

// keep only known values; anything missing or unknown falls back to the default
export function cleanDesign(d) {
  const out = { ...DEFAULT_DESIGN };
  for (const [k, list] of Object.entries(OPTION_LISTS)) if (d && list.includes(d[k])) out[k] = d[k];
  const c = d?.colors;
  if (c && isHex(c.brand) && isHex(c.band) && isHex(c.hi)) out.colors = { brand: c.brand.toUpperCase(), band: c.band.toUpperCase(), hi: c.hi.toUpperCase() };
  else if (out.theme === "custom") out.colors = { ...DEFAULT_COLORS };
  return out;
}

/* ---------------- colour helpers ---------------- */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const ch = (rgb) => rgb.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(" ");
function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2; let h = 0, s = 0;
  if (max !== min) {
    const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
  }
  return [h, s * 100, l * 100];
}
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const lum = (rgb) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LIGHT_L = [92.5, 88.5, 85, 76, 48, 41, 34, 27, 19, 11, 7];
const DARK_L = [5.5, 10.5, 14.5, 20, 52, 63, 71, 80, 87, 93.5, 97];
const BAND_L = [14, 22, 28, 37, 62, 78, 84, 89, 94, 97.5, 100];

// all variables of one theme, for light (dark=false) or dark mode
function themeVars(t, dark) {
  const i = dark ? 1 : 0;
  const L = dark ? DARK_L : LIGHT_L;
  const v = {};
  STEPS.forEach((s, k) => { v[`--n-${s}`] = ch(hsl(t.nh, dark ? t.ns + 6 : t.ns, L[k])); });
  const surface = hsl(t.nh, dark ? t.ns + 8 : t.ns, dark ? 9.5 : 98.2);
  v["--surface"] = ch(surface);
  const brand = hex(t.brand[i]);
  v["--brand"] = ch(brand);
  v["--brand-dark"] = ch(dark ? mix(brand, [255, 255, 255], 0.18) : mix(brand, [0, 0, 0], 0.18));
  v["--brand-soft"] = ch(mix(dark ? surface : [255, 255, 255], brand, dark ? 0.2 : 0.15));
  v["--on-brand"] = contrast(brand, [255, 255, 255]) >= 3.6 ? "255 255 255" : ch(hex(t.deep[i]));
  v["--aqua"] = ch(hex(t.hi[i]));
  v["--ocean"] = ch(hex(t.band[i][1]));
  v["--ocean-deep"] = ch(hex(t.deep[i]));
  v["--shadow"] = dark ? "0 0 0" : ch(hex(t.deep[0]));
  v["--band"] = `linear-gradient(90deg, ${t.band[i][0]} 0%, ${t.band[i][1]} 55%, ${t.band[i][2]} 100%)`;
  return v;
}
// the palette used inside the band (menu, title, band drop-downs) — light on the band colour
function bandVars(t, dark) {
  const [h, s] = toHsl(hex(t.band[dark ? 1 : 0][1]));
  const sat = Math.min(s, 45);
  const v = {};
  STEPS.forEach((st, k) => { v[`--n-${st}`] = ch(hsl(h, sat, BAND_L[k])); });
  v["--surface"] = ch(hsl(h, sat, 20));
  const brand = mix(hex(t.brand[1]), [255, 255, 255], 0.1);
  v["--brand"] = ch(brand);
  v["--brand-dark"] = ch(mix(brand, [255, 255, 255], 0.2));
  v["--brand-soft"] = ch(hsl(h, sat, 28));
  v["--on-brand"] = contrast(brand, [255, 255, 255]) >= 3 ? "255 255 255" : ch(hex(t.deep[1]));
  return v;
}

const block = (sel, vars) => `${sel}{${Object.entries(vars).map(([k, val]) => `${k}:${val}`).join(";")}}`;

// the CSS text for one design (theme colours both modes + font + corners + cards)
/* ---------------- "My colours" ---------------- */
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const mixHex = (a, b, t) => toHex(mix(hex(a), hex(b), t));
const WHITE = "#FFFFFF", BLACK = "#000000";
const LIGHT_SURFACE = [248, 250, 252];
const deepOf = (band) => [mixHex(band, BLACK, 0.55), mixHex(band, BLACK, 0.7)];
// move a colour toward white/black in small steps until it reaches the wanted contrast with `against`
function nudge(colour, against, want, toward) {
  let c = colour;
  for (let i = 0; i < 14 && contrast(hex(c), hex(against)) < want; i++) c = mixHex(c, toward, 0.12);
  return c;
}

// a full theme (light + dark) built from the 3 colours
export function customTheme(colors) {
  const { brand, band, hi } = { ...DEFAULT_COLORS, ...colors };
  const [bh, bs] = toHsl(hex(band));
  const darkSurface = toHex(hsl(bh, Math.min(30, bs * 0.5) + 8, 9.5));
  return {
    id: "custom", nh: bh, ns: Math.min(30, bs * 0.5),
    brand: [brand, nudge(brand, darkSurface, 4.5, WHITE)],
    hi: [hi, hi],
    band: [[mixHex(band, BLACK, 0.35), band, mixHex(band, WHITE, 0.12)], [mixHex(band, BLACK, 0.6), mixHex(band, BLACK, 0.42), mixHex(band, BLACK, 0.25)]],
    deep: deepOf(band),
  };
}

// what would be hard to read with these colours: "band" (white text on it), "brand" (on the page), "hi" (text on it)
export function colorProblems(colors) {
  const { brand, band, hi } = { ...DEFAULT_COLORS, ...colors };
  const out = [];
  if (contrast(hex(band), [255, 255, 255]) < 4.5) out.push("band");
  if (contrast(hex(brand), LIGHT_SURFACE) < 4.5) out.push("brand");
  if (contrast(hex(hi), hex(deepOf(band)[0])) < 4.5) out.push("hi");
  return out;
}

// "Fix it": the nearest readable shade of each colour (the user's choice is kept as close as possible)
export function fixColors(colors) {
  const c = { ...DEFAULT_COLORS, ...colors };
  const band = nudge(c.band, WHITE, 4.5, BLACK);
  const brand = nudge(c.brand, toHex(LIGHT_SURFACE), 4.5, BLACK);
  let hi = nudge(c.hi, deepOf(band)[0], 4.5, WHITE);
  if (contrast(hex(hi), hex(deepOf(band)[0])) < 4.5) hi = "#FFFFFF";
  return { brand, band, hi };
}

export function designCss(design) {
  const d = cleanDesign(design);
  const t = d.theme === "custom" ? customTheme(d.colors) : THEMES.find((x) => x.id === d.theme);
  const f = FONTS.find((x) => x.id === d.font);
  const shape = { "--font-latin": `"${f.latin}"`, "--font-rtl": `"${f.rtl}"`, "--shadow-card": CARDS[d.cards] };
  for (const [k, val] of Object.entries(CORNERS[d.corners])) shape[`--r-${k}`] = val;
  // Deep Ocean's exact colours live in index.css already; other themes are generated
  const colours = d.theme === "ocean" ? ""
    : block(":root", themeVars(t, false)) + block(".dark", themeVars(t, true))
      + block(".band-dark", bandVars(t, false)) + block(".dark .band-dark", bandVars(t, true));
  return block(":root", shape) + colours;
}

export function fontUrl(fontId) {
  const f = FONTS.find((x) => x.id === fontId) || FONTS[0];
  const fam = (name, w) => `family=${name.replace(/ /g, "+")}:wght@${w}`;
  return `https://fonts.googleapis.com/css2?${fam(f.latin, f.w)}&${fam(f.rtl, f.rw)}&display=swap`;
}

// apply to the page right now (no saving)
export function applyDesign(design) {
  const d = cleanDesign(design);
  if (typeof document === "undefined") return d;
  let style = document.getElementById("design-vars");
  if (!style) { style = document.createElement("style"); style.id = "design-vars"; document.head.appendChild(style); }
  style.textContent = designCss(d);
  let link = document.getElementById("design-font");
  if (!link) { link = document.createElement("link"); link.id = "design-font"; link.rel = "stylesheet"; document.head.appendChild(link); }
  const url = fontUrl(d.font);
  if (link.href !== url) link.href = url;
  document.documentElement.style.fontSize = SIZES[d.size];
  document.documentElement.classList.toggle("dark", d.mode === "dark");
  return d;
}

/* ---------------- this browser's copy (shows the design instantly before the account answers) ---------------- */
const KEY = "design";
export function cachedDesign() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) return cleanDesign(saved);
    return cleanDesign({ mode: localStorage.getItem("theme") === "dark" ? "dark" : "light" }); // the old light/dark switch
  } catch { return { ...DEFAULT_DESIGN }; }
}
export function cacheDesign(d) {
  try { localStorage.setItem(KEY, JSON.stringify(cleanDesign(d))); localStorage.setItem("theme", cleanDesign(d).mode); } catch { /* storage blocked */ }
}
export function forgetDesign() {
  try { localStorage.removeItem(KEY); localStorage.removeItem("theme"); } catch { /* storage blocked */ }
}

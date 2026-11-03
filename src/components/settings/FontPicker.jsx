import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FONTS } from "../../theme/designs";

// Font dropdown: every choice is drawn in its own font (English + Kurdish sample), so the
// difference is visible before picking. Preview fonts are downloaded as tiny subsets (only the
// letters shown here) and only while this picker is on screen.
const SAMPLE = "Ahmed Salih · Filling · 40,000 IQD";
const SAMPLE_KU = "نەخۆش · ڕۆژ · گوڵ · کاتژمێر";
const latinLetters = [...new Set((FONTS.map((f) => f.latin).join("") + SAMPLE + "Aa").split(""))].join("");
const PREVIEW_URLS = [
  "https://fonts.googleapis.com/css2?" + FONTS.map((f) => `family=${f.latin.replace(/ /g, "+")}:wght@400;600`).filter((v, i, a) => a.indexOf(v) === i).join("&")
    + `&text=${encodeURIComponent(latinLetters)}&display=swap`,
  "https://fonts.googleapis.com/css2?" + [...new Set(FONTS.map((f) => f.rtl))].map((r) => `family=${r.replace(/ /g, "+")}`).join("&")
    + `&text=${encodeURIComponent(SAMPLE_KU)}&display=swap`,
];

function Preview({ font, big }) {
  const { t, i18n } = useTranslation();
  const side = i18n.dir() === "rtl" ? "right" : "left"; // both sample lines line up with the font name
  return (
    <span className="block min-w-0">
      <span className="flex items-center gap-2">
        <span className={`truncate font-semibold text-slate-900 ${big ? "text-lg" : "text-base"}`} style={{ fontFamily: `"${font.latin}"` }}>{font.latin}</span>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t(`design.tag_${font.tag}`)}</span>
      </span>
      <span className="mt-0.5 block truncate text-sm text-slate-600" style={{ fontFamily: `"${font.latin}"`, textAlign: side }} dir="ltr">{SAMPLE}</span>
      <span className="mt-0.5 block truncate text-sm text-slate-600" style={{ fontFamily: `"${font.rtl}"`, textAlign: side }} dir="rtl">{SAMPLE_KU}</span>
    </span>
  );
}

export default function FontPicker({ value, onPick }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, FONTS.findIndex((f) => f.id === value)));
  const box = useRef(null);
  const list = useRef(null);
  const current = FONTS.find((f) => f.id === value) || FONTS[0];

  useEffect(() => {
    const links = PREVIEW_URLS.map((href) => {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); return l;
    });
    const outside = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", outside);
    return () => { links.forEach((l) => l.remove()); document.removeEventListener("mousedown", outside); };
  }, []);

  // keep the highlighted choice in view while using the keyboard
  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const choose = (i) => { onPick(FONTS[i].id); setActive(i); setOpen(false); };
  const onKey = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) { e.preventDefault(); setOpen(true); return; }
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(FONTS.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(active); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  };

  return (
    <div className="relative max-w-xl" ref={box}>
      <button type="button" data-font-picker aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)} onKeyDown={onKey}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-start transition hover:border-slate-300 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15">
        <Preview font={current} big />
        <svg className={`ms-auto h-5 w-5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <ul ref={list} role="listbox" aria-label={t("design.font")} tabIndex={-1} onKeyDown={onKey}
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-[26rem] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
          {FONTS.map((f, i) => {
            const selected = f.id === value;
            return (
              <li key={f.id} role="option" aria-selected={selected} data-index={i} data-design-font={f.id}
                onMouseEnter={() => setActive(i)} onClick={() => choose(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition ${i === active ? "bg-slate-50" : ""} ${selected ? "ring-2 ring-brand/30" : ""}`}>
                <Preview font={f} />
                {selected && <span className="ms-auto shrink-0 text-sm font-bold text-brand">✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

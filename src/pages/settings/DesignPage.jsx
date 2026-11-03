import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import FontPicker from "../../components/settings/FontPicker";
import { getMyDesign, saveMyDesign } from "../../api/profileApi";
import { THEMES, DEFAULT_DESIGN, DEFAULT_COLORS, cleanDesign, applyDesign, customTheme, colorProblems, fixColors } from "../../theme/designs";
import { currentDesign, setDesign } from "../../utils/theme";

const same = (a, b) => JSON.stringify(cleanDesign(a)) === JSON.stringify(cleanDesign(b));

function Section({ title, hint, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
      <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// a row of choices (corners / cards / size / light-dark)
function Choices({ name, value, options, onPick }) {
  return (
    <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1" role="radiogroup">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} data-design-option={`${name}:${o.id}`}
          onClick={() => onPick(o.id)}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${value === o.id ? "bg-brand text-white shadow-card" : "text-slate-600 hover:bg-white"}`}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

export default function DesignPage() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(() => currentDesign());
  const [draft, setDraft] = useState(() => currentDesign());
  const [saving, setSaving] = useState(false);
  const latest = useRef({ saved, draft });
  latest.current = { saved, draft };
  const mode = draft.mode === "dark" ? 1 : 0;

  useEffect(() => {
    // the account's copy is the real one
    getMyDesign().then((res) => {
      const d = res?.data && Object.keys(res.data).length ? cleanDesign(res.data) : null;
      if (d) { setSaved(d); setDraft(d); setDesign(d); }
    }).catch(() => {});
    return () => {
      // leaving without saving: go back to the saved look
      const { saved: s, draft: d } = latest.current;
      if (!same(s, d)) setDesign(s);
    };
  }, []);

  const pick = (key, value) => {
    const next = cleanDesign({ ...draft, [key]: value });
    setDraft(next);
    applyDesign(next); // live preview, not saved yet
  };

  // "My colours": picking a colour switches to the custom theme
  const pickColor = (key, value) => {
    const next = cleanDesign({ ...draft, theme: "custom", colors: { ...(draft.colors || DEFAULT_COLORS), [key]: value } });
    setDraft(next);
    applyDesign(next);
  };
  const fixMyColors = () => {
    const next = cleanDesign({ ...draft, theme: "custom", colors: fixColors(draft.colors || DEFAULT_COLORS) });
    setDraft(next);
    applyDesign(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await saveMyDesign(cleanDesign(draft));
      const d = cleanDesign(res?.data || draft);
      setSaved(d); setDraft(d); setDesign(d);
      toast.success(t("design.saved"));
    } catch (err) {
      toast.error(err.userMessage || t("design.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    const d = { ...DEFAULT_DESIGN };
    setDraft(d);
    applyDesign(d);
  };

  const dirty = !same(saved, draft);

  return (
    <div className="w-full space-y-5" data-design-page>
      <PageHeader
        title={t("design.title")}
        subtitle={t("design.subtitle")}
        actions={
          <>
            <button type="button" onClick={reset} data-reset-design
              className="rounded-xl border border-slate-200 bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/20">
              {t("design.reset")}
            </button>
            <button type="button" onClick={save} disabled={!dirty || saving} data-save-design
              className="rounded-xl bg-aqua px-4 py-2.5 text-sm font-bold text-ocean-deep transition hover:brightness-110 disabled:opacity-50">
              {saving ? t("design.saving") : t("design.save")}
            </button>
          </>
        }
      />

      {dirty && (
        <div className="rounded-2xl border border-amber-200 bg-white p-4 text-sm text-amber-800 shadow-card" data-design-unsaved>
          {t("design.unsaved")}
        </div>
      )}

      <Section title={t("design.theme")} hint={t("design.theme_hint")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {[...THEMES, customTheme(draft.colors || DEFAULT_COLORS)].map((th) => {
            const active = draft.theme === th.id;
            const [a, b, c] = th.band[mode];
            return (
              <button key={th.id} type="button" onClick={() => pick("theme", th.id)} data-design-theme={th.id} aria-pressed={active}
                className={`overflow-hidden rounded-xl border text-start transition ${active ? "border-brand ring-4 ring-brand/20" : "border-slate-200 hover:border-slate-300"}`}>
                {/* a tiny picture of the theme: band, a card, its button and highlight */}
                <div className="h-12" style={{ background: `linear-gradient(90deg, ${a}, ${b} 55%, ${c})` }} />
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5">
                  <span className="h-6 w-14 rounded-md" style={{ background: th.brand[mode] }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: th.hi[mode] }} />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-3 py-2">
                  <span className="truncate text-sm font-semibold text-slate-900">{t(`design.theme_${th.id}`)}</span>
                  {active && <span className="text-xs font-bold text-brand">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* My colours: each box opens the colour picker */}
        {draft.theme === "custom" && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4" data-my-colors>
            <h3 className="text-sm font-semibold text-slate-900">{t("design.colors_title")}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{t("design.colors_hint")}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {["brand", "band", "hi"].map((key) => {
                const value = (draft.colors || DEFAULT_COLORS)[key];
                return (
                  <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-card" style={{ background: value }}>
                      <input type="color" value={value} onChange={(e) => pickColor(key, e.target.value)} data-color={key}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={t(`design.color_${key}`)} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{t(`design.color_${key}`)}</span>
                      <span className="block truncate text-xs text-slate-500">{t(`design.color_${key}_hint`)}</span>
                      <span className="block font-mono text-xs text-slate-600" dir="ltr">{value}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {(() => {
              const problems = colorProblems(draft.colors || DEFAULT_COLORS);
              return problems.length ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3" data-color-warning>
                  <ul className="space-y-0.5 text-sm text-amber-800">
                    {problems.map((p) => <li key={p}>⚠ {t(`design.warn_${p}`)}</li>)}
                  </ul>
                  <button type="button" onClick={fixMyColors} data-fix-colors
                    className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">
                    {t("design.fix")}
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm font-medium text-green-700" data-colors-ok>✓ {t("design.colors_ok")}</p>
              );
            })()}
          </div>
        )}
      </Section>

      <Section title={t("design.font")} hint={t("design.font_hint")}>
        <FontPicker value={draft.font} onPick={(v) => pick("font", v)} />
      </Section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title={t("design.mode")}>
          <Choices name="mode" value={draft.mode} onPick={(v) => pick("mode", v)}
            options={[{ id: "light", label: t("design.light"), icon: "☀️" }, { id: "dark", label: t("design.dark"), icon: "🌙" }]} />
        </Section>
        <Section title={t("design.size")} hint={t("design.size_hint")}>
          <Choices name="size" value={draft.size} onPick={(v) => pick("size", v)}
            options={["compact", "normal", "large"].map((id) => ({ id, label: t(`design.size_${id}`) }))} />
        </Section>
        <Section title={t("design.corners")}>
          <Choices name="corners" value={draft.corners} onPick={(v) => pick("corners", v)}
            options={[["sharp", "2px"], ["soft", "6px"], ["round", "12px"]].map(([id, r]) => ({
              id, label: t(`design.corners_${id}`),
              icon: <span className="inline-block h-4 w-5 border-2 border-current" style={{ borderRadius: r }} />,
            }))} />
        </Section>
        <Section title={t("design.cards")}>
          <Choices name="cards" value={draft.cards} onPick={(v) => pick("cards", v)}
            options={["soft", "flat", "raised"].map((id) => ({ id, label: t(`design.cards_${id}`) }))} />
        </Section>
      </div>

    </div>
  );
}

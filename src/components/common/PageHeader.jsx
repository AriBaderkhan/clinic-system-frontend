import { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

// The layout gives pages a spot inside the navy band. A page's <PageHeader> draws its
// title + buttons there, and the layout pulls the page content up over the band's edge.
export const PageBandContext = createContext(null);

export function usePageBandSlot() {
  const [slot, setSlot] = useState(null);       // the band element (page title)
  const [tabsSlot, setTabsSlot] = useState(null); // under the title: a page's tab switch
  const [count, setCount] = useState(0);        // how many band parts are showing
  const value = { slot, tabsSlot, register: () => { setCount((c) => c + 1); return () => setCount((c) => c - 1); } };
  return { ref: setSlot, tabsRef: setTabsSlot, active: count > 0, value };
}

// A page's tab switch, drawn in the band under the title (stays put while the tabs change the title)
export function BandTabs({ children }) {
  const band = useContext(PageBandContext);
  useEffect(() => (band ? band.register() : undefined), [band?.tabsSlot]); // eslint-disable-line react-hooks/exhaustive-deps
  if (band?.tabsSlot) return createPortal(children, band.tabsSlot);
  return children;
}

// tab button look inside the band
export const bandTabClass = (active) =>
  `rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? "bg-aqua text-ocean-deep" : "text-slate-700 hover:bg-white/10 hover:text-slate-900"}`;
export const BAND_TABS = "inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/10 p-1";

// A page opened inside a settings section: its header becomes the section's top card
export const SectionHeaderContext = createContext(false);

export default function PageHeader({ title, subtitle, actions, eyebrow }) {
  const band = useContext(PageBandContext);
  const inSection = useContext(SectionHeaderContext);
  useEffect(() => (band && !inSection ? band.register() : undefined), [band?.slot, inSection]); // eslint-disable-line react-hooks/exhaustive-deps

  const body = (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-medium text-slate-500">{eyebrow}</p>}
        {inSection
          ? <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          : <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[26px]">{title}</h1>}
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );

  if (inSection) return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">{body}</div>;
  // inside the app layout: draw in the band; anywhere else (admin, public pages): draw in place
  if (band?.slot) return createPortal(body, band.slot);
  return <div className="mb-5">{body}</div>;
}

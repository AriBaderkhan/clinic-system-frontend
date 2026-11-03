import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { SectionHeaderContext } from "../common/PageHeader";

// Settings layout: a menu of sections on the side; only the chosen section shows.
// groups = [{ label, items: [{ key, label, icon, content, data }] }] — hidden items are left out by the caller.
// A whole page can be a section (Works, Roles, Design): its header becomes the section's top card.
// The chosen section is kept in the link (?s=key) so refresh and Back stay on it.
export default function SettingsShell({ groups }) {
    const [params, setParams] = useSearchParams();

    const shown = groups.filter((g) => g.items.length > 0);
    const sections = shown.flatMap((g) => g.items);
    const current = sections.find((i) => i.key === params.get("s")) || sections[0];

    // phone: the menu is one row that scrolls sideways — keep the chosen item in view
    const rowRef = useRef(null);
    useEffect(() => {
        const row = rowRef.current;
        if (!row || row.scrollWidth <= row.clientWidth) return;
        row.querySelector("[aria-current]")?.scrollIntoView({ block: "nearest", inline: "center" });
    }, [current?.key]);

    const itemClass = (active) => [
        "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition md:w-full",
        active ? "bg-brand/10 text-brand" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");

    return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)]">
            <nav data-settings-menu className="min-w-0 md:self-start md:sticky md:top-4">
                <div ref={rowRef} className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card md:flex-col md:gap-0.5 md:overflow-visible md:p-2">
                    {shown.map((g, gi) => (
                        <div key={g.label} className="flex shrink-0 gap-1 md:flex-col md:gap-0.5">
                            <div className={`hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:block ${gi > 0 ? "mt-3 border-t border-slate-100 pt-3" : "pt-1"}`}>
                                {g.label}
                            </div>
                            {g.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        data-settings-item={item.key}
                                        {...(item.data || {})}
                                        aria-current={current?.key === item.key ? "page" : undefined}
                                        onClick={() => setParams({ s: item.key }, { replace: true })}
                                        className={itemClass(current?.key === item.key)}
                                    >
                                        {Icon && <Icon className="h-4 w-4 shrink-0" />}
                                        <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </nav>

            <div data-settings-section={current?.key} className="min-w-0 space-y-5">
                <SectionHeaderContext.Provider value={true}>
                    {current?.content}
                </SectionHeaderContext.Provider>
            </div>
        </div>
    );
}

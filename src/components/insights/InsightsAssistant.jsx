import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getInsightsCatalog, getInsight, getInsightsMeta, downloadInsightsExcel } from "../../api/reportsApi";
import { INSIGHT_CATEGORIES } from "./insightsConfig";

// Trigger a browser download from a Blob (used by the Excel export).
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// Floating "ask" assistant for the tenant_manager. Click the bubble → pick a
// category → pick a question → see the answer (per-branch + totals + rate).
// Every answer is a tested, read-only backend query — no typing, no AI yet, but
// the backend catalog is structured so an AI layer can be added later.

const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const fmt = (v) => Number(v || 0).toLocaleString();

export default function InsightsAssistant() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [view, setView] = useState("categories"); // categories | questions | result

    const [catalog, setCatalog] = useState(null);
    const [catalogError, setCatalogError] = useState("");
    const [loadingCatalog, setLoadingCatalog] = useState(false);

    const [activeCategory, setActiveCategory] = useState(null);
    const [activeMetric, setActiveMetric] = useState(null);

    // Period controls
    const [periodType, setPeriodType] = useState("month"); // month | range
    const [month, setMonth] = useState(currentMonth());
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [compare, setCompare] = useState(false);

    const [result, setResult] = useState(null);
    const [loadingResult, setLoadingResult] = useState(false);
    const [resultError, setResultError] = useState("");

    // Excel export (first page): one month, bounded to [join month .. this month].
    const [exportMonth, setExportMonth] = useState(currentMonth());
    const [meta, setMeta] = useState(null); // { earliest_month, latest_month }
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState("");

    // Load the question catalog once, the first time the panel opens.
    useEffect(() => {
        if (!open || catalog || loadingCatalog) return;
        setLoadingCatalog(true);
        setCatalogError("");
        getInsightsCatalog()
            .then((list) => setCatalog(list))
            .catch((e) => setCatalogError(e?.userMessage || t("insights.could_not_load_questions")))
            .finally(() => setLoadingCatalog(false));
    }, [open, catalog, loadingCatalog]);

    // Load the month bounds once, when the panel first opens.
    useEffect(() => {
        if (!open || meta) return;
        getInsightsMeta().then((m) => { if (m) setMeta(m); }).catch(() => {});
    }, [open, meta]);

    const handleExport = async () => {
        setExporting(true);
        setExportError("");
        try {
            const { blob, filename } = await downloadInsightsExcel(exportMonth);
            triggerDownload(blob, filename);
        } catch (e) {
            setExportError(e?.userMessage || t("insights.export_failed"));
        } finally {
            setExporting(false);
        }
    };

    const categories = useMemo(() => {
        if (!catalog) return [];
        return INSIGHT_CATEGORIES.filter((c) => catalog.some((m) => m.category === c.code));
    }, [catalog]);

    const questions = useMemo(() => {
        if (!catalog || !activeCategory) return [];
        return catalog.filter((m) => m.category === activeCategory.code);
    }, [catalog, activeCategory]);

    const buildParams = () => {
        const p = {};
        if (periodType === "range" && from && to) {
            p.from = from;
            p.to = to;
        } else {
            p.month = `${month}-01`;
        }
        if (compare) p.compare = "true";
        return p;
    };

    const runMetric = async (metric) => {
        setActiveMetric(metric);
        setView("result");
        setLoadingResult(true);
        setResultError("");
        setResult(null);
        try {
            const data = await getInsight(metric.id, buildParams());
            setResult(data);
        } catch (e) {
            setResultError(e?.userMessage || t("insights.could_not_load_answer"));
        } finally {
            setLoadingResult(false);
        }
    };

    const goCategories = () => {
        setView("categories");
        setActiveCategory(null);
        setActiveMetric(null);
        setResult(null);
    };

    const openCategory = (cat) => {
        setActiveCategory(cat);
        setView("questions");
    };

    const periodLabel = result?.period?.label || (periodType === "range" && from && to ? `${from} → ${to}` : month);

    return (
        <>
            {/* Floating bubble */}
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label={t("insights.title")}
                className="fixed bottom-5 end-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-pop ring-4 ring-brand/15 transition hover:scale-105 hover:bg-brand-dark"
            >
                {open ? (
                    <span className="text-xl">✕</span>
                ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div className="fixed bottom-24 end-4 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop sm:end-5">
                    {/* Header */}
                    <div className="ocean-band band-dark flex items-center gap-2 px-4 py-3.5">
                        {view !== "categories" && (
                            <button
                                onClick={() => (view === "result" ? setView("questions") : goCategories())}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-700 transition hover:bg-white/10 hover:text-slate-900 rtl:rotate-180"
                                aria-label="Back"
                            >
                                ←
                            </button>
                        )}
                        <div className="flex min-w-0 flex-col">
                            <span className="text-sm font-semibold text-slate-900">{t("insights.title")}</span>
                            <span className="truncate text-xs text-slate-500">
                                {view === "categories" && t("insights.pick_topic")}
                                {view === "questions" && activeCategory && t(`insights.cat.${activeCategory.code}`)}
                                {view === "result" && activeMetric && t(`insights.q.${activeMetric.id}`, { defaultValue: activeMetric.label })}
                            </span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* CATEGORIES */}
                        {view === "categories" && (
                            <>
                                {/* Excel export — one month, bounded to [join month .. this month] */}
                                <div className="mb-4 rounded-xl border border-brand/20 bg-brand/5 p-3">
                                    <p className="mb-2 text-xs font-semibold text-slate-900">{t("insights.export_title")}</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="month"
                                            value={exportMonth}
                                            min={meta?.earliest_month || undefined}
                                            max={meta?.latest_month || undefined}
                                            onChange={(e) => setExportMonth(e.target.value)}
                                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleExport}
                                            disabled={exporting || !exportMonth}
                                            className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                        >
                                            {exporting ? t("insights.exporting") : t("insights.export_excel")}
                                        </button>
                                    </div>
                                    {exportError && <p className="mt-1 text-[11px] text-red-600">{exportError}</p>}
                                </div>

                                {loadingCatalog && <p className="animate-pulse py-8 text-center text-sm text-slate-500">{t("insights.loading")}</p>}
                                {catalogError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{catalogError}</p>}
                                {!loadingCatalog && !catalogError && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {categories.map((c) => (
                                            <button
                                                key={c.code}
                                                onClick={() => openCategory(c)}
                                                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-5 text-center transition hover:border-brand hover:bg-brand/5"
                                            >
                                                <span className="text-2xl">{c.icon}</span>
                                                <span className="text-sm font-semibold text-slate-700">{t(`insights.cat.${c.code}`)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* QUESTIONS */}
                        {view === "questions" && (
                            <>
                                <PeriodControls
                                    t={t}
                                    periodType={periodType} setPeriodType={setPeriodType}
                                    month={month} setMonth={setMonth}
                                    from={from} setFrom={setFrom} to={to} setTo={setTo}
                                    compare={compare} setCompare={setCompare}
                                />
                                <div className="mt-3 flex flex-col gap-2">
                                    {questions.map((q) => (
                                        <button
                                            key={q.id}
                                            onClick={() => runMetric(q)}
                                            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-start text-sm font-medium text-slate-700 transition hover:border-brand hover:bg-brand/5"
                                        >
                                            <span>{t(`insights.q.${q.id}`, { defaultValue: q.label })}</span>
                                            <span className="shrink-0 text-slate-400 rtl:rotate-180">›</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* RESULT */}
                        {view === "result" && (
                            <>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{periodLabel}</span>
                                    <button
                                        onClick={() => runMetric(activeMetric)}
                                        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand transition hover:bg-brand/10"
                                    >
                                        ↻ {t("insights.update")}
                                    </button>
                                </div>
                                {loadingResult && <p className="animate-pulse py-8 text-center text-sm text-slate-500">{t("insights.loading")}</p>}
                                {resultError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{resultError}</p>}
                                {!loadingResult && !resultError && result && <ResultView data={result} t={t} />}
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function PeriodControls({ t, periodType, setPeriodType, month, setMonth, from, setFrom, to, setTo, compare, setCompare }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="mb-2.5 flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
                <button
                    onClick={() => setPeriodType("month")}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${periodType === "month" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                    {t("insights.by_month")}
                </button>
                <button
                    onClick={() => setPeriodType("range")}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${periodType === "range" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                    {t("insights.custom_range")}
                </button>
            </div>

            {periodType === "month" ? (
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                />
            ) : (
                <div className="flex items-center gap-1.5">
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
                    <span className="shrink-0 text-xs text-slate-400 rtl:rotate-180">→</span>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
                </div>
            )}

            <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" className="h-3.5 w-3.5 accent-brand" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
                {t("insights.compare_prev")}
            </label>
        </div>
    );
}

// Renders any of the result shapes: count / revenue / breakdown / split.
function ResultView({ data, t }) {
    const { type, multiBranch, result } = data;

    if (type === "count" || type === "revenue") {
        return (
            <div className="flex flex-col gap-3">
                <BigValue value={result.value} unit={result.unit} compare={result.compare} t={t} />
                {multiBranch && <BranchValueList branches={result.branches} t={t} />}
            </div>
        );
    }

    if (type === "split") {
        return (
            <div className="flex flex-col gap-3">
                <BreakdownList items={result.breakdown} t={t} />
                {result.compare && (
                    <div className="space-y-0.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        <p>{t("insights.new")}: {growthText(result.compare.new, t)}</p>
                        <p>{t("insights.returning")}: {growthText(result.compare.returning, t)}</p>
                    </div>
                )}
                {multiBranch && <BranchBreakdownSections branches={result.branches} t={t} />}
            </div>
        );
    }

    // breakdown
    return (
        <div className="flex flex-col gap-3">
            <BreakdownList items={result.breakdown} t={t} />
            {multiBranch && <BranchBreakdownSections branches={result.branches} t={t} />}
        </div>
    );
}

function BigValue({ value, unit, compare, t }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <div className="text-3xl font-bold tracking-tight text-brand tabular-nums">{fmt(value)}</div>
            <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">{unit === "money" ? t("insights.total") : t("insights.count")}</div>
            {compare && (
                <div className="mt-2 text-xs font-medium">
                    {compare.rate === null ? (
                        <span className="text-slate-400">{t("insights.no_prior")}</span>
                    ) : (
                        <span className={compare.rate >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {compare.rate >= 0 ? "▲" : "▼"} {Math.abs(compare.rate)}% {t("insights.vs_previous")} ({fmt(compare.previous)})
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function BranchValueList({ branches, t }) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200">
            <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("insights.by_branch")}</p>
            {branches.map((b) => (
                <div key={b.branch_name} className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 text-sm first-of-type:border-t-0">
                    <span className="min-w-0 truncate text-slate-600">{b.branch_name}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{fmt(b.value)}</span>
                </div>
            ))}
        </div>
    );
}

function BreakdownList({ items, t }) {
    if (!items || items.length === 0) return <p className="py-6 text-center text-sm text-slate-500">{t("insights.no_data")}</p>;
    const max = Math.max(...items.map((i) => i.value), 1);
    return (
        <div className="flex flex-col gap-2">
            {items.map((it) => (
                <div key={it.label}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 break-words text-slate-700">{it.label}</span>
                        <span className="shrink-0 text-slate-500 tabular-nums">
                            {fmt(it.value)} <span className="text-xs text-slate-400">({it.rate}%)</span>
                        </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${(it.value / max) * 100}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function BranchBreakdownSections({ branches, t }) {
    return (
        <div className="flex flex-col gap-3">
            {branches.map((b) => (
                <div key={b.branch_name} className="rounded-xl border border-slate-200 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{b.branch_name}</p>
                    <BreakdownList items={b.breakdown} t={t} />
                </div>
            ))}
        </div>
    );
}

function growthText(c, t) {
    if (!c) return "—";
    if (c.rate === null) return `${fmt(c.current)} (${t("insights.no_prior")})`;
    const sign = c.rate >= 0 ? "▲" : "▼";
    return `${fmt(c.current)} (${sign} ${Math.abs(c.rate)}% ${t("insights.vs_previous")} ${fmt(c.previous)})`;
}

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getInsightsCatalog, getInsight } from "../../api/reportsApi";
import { INSIGHT_CATEGORIES } from "./insightsConfig";

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
                className="fixed bottom-5 end-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0E6E75] text-white shadow-lg transition hover:scale-105 hover:bg-[#013f5a]"
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
                <div className="fixed bottom-24 end-5 z-50 flex h-[70vh] max-h-[560px] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-[#0E6E75] px-4 py-3 text-white">
                        {view !== "categories" && (
                            <button
                                onClick={() => (view === "result" ? setView("questions") : goCategories())}
                                className="rounded-md px-1.5 py-0.5 text-white/90 hover:bg-white/10 rtl:rotate-180"
                                aria-label="Back"
                            >
                                ←
                            </button>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">{t("insights.title")}</span>
                            <span className="text-[11px] text-white/70">
                                {view === "categories" && t("insights.pick_topic")}
                                {view === "questions" && activeCategory && t(`insights.cat.${activeCategory.code}`)}
                                {view === "result" && activeMetric && t(`insights.q.${activeMetric.id}`, { defaultValue: activeMetric.label })}
                            </span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {/* CATEGORIES */}
                        {view === "categories" && (
                            <>
                                {loadingCatalog && <p className="p-4 text-sm text-slate-500">{t("insights.loading")}</p>}
                                {catalogError && <p className="p-4 text-sm text-red-600">{catalogError}</p>}
                                {!loadingCatalog && !catalogError && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {categories.map((c) => (
                                            <button
                                                key={c.code}
                                                onClick={() => openCategory(c)}
                                                className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-5 text-center transition hover:border-[#0E6E75] hover:bg-[#0E6E75]/5"
                                            >
                                                <span className="text-2xl">{c.icon}</span>
                                                <span className="text-sm font-medium text-slate-700">{t(`insights.cat.${c.code}`)}</span>
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
                                            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-start text-sm text-slate-700 transition hover:border-[#0E6E75] hover:bg-[#0E6E75]/5"
                                        >
                                            <span>{t(`insights.q.${q.id}`, { defaultValue: q.label })}</span>
                                            <span className="text-slate-300 rtl:rotate-180">›</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* RESULT */}
                        {view === "result" && (
                            <>
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-[11px] uppercase tracking-wide text-slate-400">{periodLabel}</span>
                                    <button
                                        onClick={() => runMetric(activeMetric)}
                                        className="text-[11px] font-medium text-[#0E6E75] hover:underline"
                                    >
                                        ↻ {t("insights.update")}
                                    </button>
                                </div>
                                {loadingResult && <p className="p-4 text-sm text-slate-500">{t("insights.loading")}</p>}
                                {resultError && <p className="p-4 text-sm text-red-600">{resultError}</p>}
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm">
            <div className="mb-2 flex gap-1">
                <button
                    onClick={() => setPeriodType("month")}
                    className={`flex-1 rounded-md px-2 py-1 text-xs ${periodType === "month" ? "bg-[#0E6E75] text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                >
                    {t("insights.by_month")}
                </button>
                <button
                    onClick={() => setPeriodType("range")}
                    className={`flex-1 rounded-md px-2 py-1 text-xs ${periodType === "range" ? "bg-[#0E6E75] text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                >
                    {t("insights.custom_range")}
                </button>
            </div>

            {periodType === "month" ? (
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                />
            ) : (
                <div className="flex items-center gap-1">
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs" />
                    <span className="text-xs text-slate-400">→</span>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs" />
                </div>
            )}

            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
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
                    <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
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
        <div className="rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-3xl font-bold text-[#0E6E75]">{fmt(value)}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{unit === "money" ? t("insights.total") : t("insights.count")}</div>
            {compare && (
                <div className="mt-2 text-xs">
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
        <div className="rounded-lg border border-slate-200">
            <p className="border-b border-slate-100 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">{t("insights.by_branch")}</p>
            {branches.map((b) => (
                <div key={b.branch_name} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-slate-600">{b.branch_name}</span>
                    <span className="font-semibold text-slate-800">{fmt(b.value)}</span>
                </div>
            ))}
        </div>
    );
}

function BreakdownList({ items, t }) {
    if (!items || items.length === 0) return <p className="p-3 text-sm text-slate-500">{t("insights.no_data")}</p>;
    const max = Math.max(...items.map((i) => i.value), 1);
    return (
        <div className="flex flex-col gap-2">
            {items.map((it) => (
                <div key={it.label}>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{it.label}</span>
                        <span className="text-slate-500">
                            {fmt(it.value)} <span className="text-[11px] text-slate-400">({it.rate}%)</span>
                        </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#0E6E75]" style={{ width: `${(it.value / max) * 100}%` }} />
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
                <div key={b.branch_name} className="rounded-lg border border-slate-200 p-2.5">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">{b.branch_name}</p>
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

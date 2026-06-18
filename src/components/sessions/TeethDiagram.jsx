// Shared FDI teeth chart — used read-only when VIEWING a session and interactive
// when EDITING (same look as the Complete-appointment chart). Fully responsive:
// each tooth flexes to fill the available width, so the arches scale on iPad/laptop.

const UPPER = [[18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28]];
const LOWER = [[48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38]];

const toothCategory = (n) => {
  const p = n % 10;
  if (p <= 2) return "incisor";
  if (p === 3) return "canine";
  if (p <= 5) return "premolar";
  return "molar";
};

const CROWN = {
  incisor: "M13 4 Q13 3 18 3 Q23 3 23 4 Q24 15 22 23 Q20 27 18 27 Q16 27 14 23 Q12 15 13 4 Z",
  canine: "M18 3 Q22 7 23 15 Q23 24 18 27 Q13 24 13 15 Q14 7 18 3 Z",
  premolar: "M11 8 Q10 4 14 5 Q16 2 18 5 Q20 2 22 5 Q26 4 25 8 Q26 22 18 27 Q10 22 11 8 Z",
  molar: "M8 9 Q7 4 12 5 Q14.5 2 16.5 5 Q18 3 19.5 5 Q21.5 2 24 5 Q29 4 28 9 Q29 23 18 27 Q7 23 8 9 Z",
};
const RIDGE = {
  incisor: ["M16 8 L16 22", "M18 7 L18 23", "M20 8 L20 22"],
  canine: ["M18 8 L18 24", "M16 12 L20 12"],
  premolar: ["M15 9 L15 23", "M21 9 L21 23", "M11 15 H25"],
  molar: ["M13 9 L13 24", "M18 8 L18 25", "M23 9 L23 24", "M9 16 H27"],
};
const rootPaths = (cat, upper) => {
  if (cat === "incisor") return ["M15 25 Q14 45 17 60 Q18 63 19 60 Q22 45 21 25 Z"];
  if (cat === "canine") return ["M15 26 Q13 47 16 62 Q17 66 19 62 Q22 47 21 26 Z"];
  if (cat === "premolar")
    return upper
      ? ["M13 25 Q11 41 12 55 Q12 59 15 56 Q16 41 16 27 Z", "M23 25 Q25 41 24 55 Q24 59 21 56 Q20 41 20 27 Z"]
      : ["M15 25 Q14 46 17 59 Q18 62 19 59 Q22 46 21 25 Z"];
  return upper
    ? ["M11 25 Q8 41 8 55 Q8 59 12 56 Q13 41 14 27 Z", "M18 27 Q17.5 45 18 59 Q18 62 19 59 Q19.5 45 19 27 Z", "M25 25 Q28 41 28 55 Q28 59 24 56 Q23 41 22 27 Z"]
    : ["M12 25 Q9 43 11 57 Q12 61 15 57 Q15 43 15 27 Z", "M24 25 Q27 43 25 57 Q24 61 21 57 Q21 43 21 27 Z"];
};

function ToothShape({ n, upper, selected, amber }) {
  const cat = toothCategory(n);
  const rootFill = selected ? "#075c86" : amber ? "#b9d0e0" : "#e7dabc";
  const rootStroke = selected ? "#013d58" : amber ? "#6f9cbb" : "#c4b491";
  const crownFill = selected ? "#0a6aa0" : amber ? "#dcebf6" : "#ffffff";
  const crownStroke = selected ? "#013d58" : amber ? "#6f9cbb" : "#b7c1cf";
  const ridge = selected ? "#d6ecf7" : amber ? "#9cc0db" : "#dbe1e8";
  return (
    <svg viewBox="0 0 36 66" className="h-auto w-full">
      {rootPaths(cat, upper).map((d, i) => (
        <path key={i} d={d} fill={rootFill} stroke={rootStroke} strokeWidth="1" strokeLinejoin="round" />
      ))}
      <path d={CROWN[cat]} fill={crownFill} stroke={crownStroke} strokeWidth="1.2" strokeLinejoin="round" />
      {RIDGE[cat].map((d, i) => (
        <path key={`r${i}`} d={d} fill="none" stroke={ridge} strokeWidth="0.8" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function Tooth({ n, upper, selectedSet, markedSet, labels, onToothClick, disabled }) {
  const selected = selectedSet.has(n);
  const amber = !selected && markedSet.has(n);
  const label = labels?.[n];
  const interactive = typeof onToothClick === "function" && !disabled;

  const num = <span className={`text-[10px] sm:text-[11px] font-semibold ${selected ? "text-[#015478] dark:text-sky-300" : "text-slate-400"}`}>{n}</span>;
  const tag = (
    <span className={`h-3.5 leading-none text-[8px] sm:text-[9px] font-bold ${label ? "text-[#015478] dark:text-sky-300" : "text-transparent"}`}>
      {label || "·"}
    </span>
  );
  const svg = <ToothShape n={n} upper={upper} selected={selected} amber={amber} />;
  const inner = upper ? (<>{tag}<div className="w-full rotate-180">{svg}</div>{num}</>) : (<>{num}<div className="w-full">{svg}</div>{tag}</>);
  const cls = `flex min-w-0 flex-1 flex-col items-center ${interactive ? "cursor-pointer hover:opacity-80" : ""} transition`;
  const title = `Tooth ${n}${label ? ` · ${label}` : ""}`;

  return interactive ? (
    <button type="button" onClick={() => onToothClick(n)} className={cls} title={title}>{inner}</button>
  ) : (
    <div className={cls} title={title}>{inner}</div>
  );
}

// Derive the highlighted teeth + per-tooth plan labels from a works_summary list.
const PLAN_ABBR = { rct: "RCT", re_rct: "RE-RCT", implant: "IMP", ortho: "ORT" };
export function worksToTeeth(works) {
  const teeth = new Set();
  const labels = {};
  for (const w of works || []) {
    for (const t of w.teeth || []) {
      const n = Number(t);
      if (!Number.isFinite(n)) continue;
      teeth.add(n);
      if (w.is_plan && w.plan_type) labels[n] = PLAN_ABBR[w.plan_type] || String(w.plan_type).toUpperCase();
    }
  }
  return { teeth: [...teeth], labels };
}

export default function TeethDiagram({
  teeth = [],          // back-compat: highlighted (navy) teeth in view mode
  selected,            // navy teeth (edit draft); falls back to `teeth`
  marked = [],         // amber teeth (e.g. existing plan teeth in edit)
  labels = {},
  onToothClick,        // when provided, teeth are clickable
  disabled = false,
}) {
  const selectedSet = new Set((selected ?? teeth ?? []).map(Number).filter(Number.isFinite));
  const markedSet = new Set((marked || []).map(Number).filter(Number.isFinite));
  const common = { selectedSet, markedSet, labels, onToothClick, disabled };

  return (
    <div className="w-full space-y-2 sm:space-y-3">
      <div className="flex w-full items-end gap-px">
        {UPPER[0].map((n) => <Tooth key={n} n={n} upper {...common} />)}
        <div className="mx-0.5 sm:mx-1 h-10 sm:h-14 w-px shrink-0 self-center bg-[#015478]/30" />
        {UPPER[1].map((n) => <Tooth key={n} n={n} upper {...common} />)}
      </div>
      <div className="h-px w-full bg-[#015478]/20" />
      <div className="flex w-full items-start gap-px">
        {LOWER[0].map((n) => <Tooth key={n} n={n} {...common} />)}
        <div className="mx-0.5 sm:mx-1 h-10 sm:h-14 w-px shrink-0 self-center bg-[#015478]/30" />
        {LOWER[1].map((n) => <Tooth key={n} n={n} {...common} />)}
      </div>
    </div>
  );
}

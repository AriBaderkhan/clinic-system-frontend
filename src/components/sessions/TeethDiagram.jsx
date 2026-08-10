// Shared FDI teeth chart — used read-only when VIEWING a session and interactive
// when EDITING / completing. Supports all ages: Permanent (12+), Primary (baby,
// <6) and Mixed (6–11). Adult teeth are the realistic PNG cut-outs; baby teeth
// are simple drawn shapes. Fully responsive: each tooth flexes to fill the width.
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import TEETH from "../../assets/teeth";

// ── permanent (32) ──
const UPPER = [[18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28]];
const LOWER = [[48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38]];

// ── primary / deciduous (20), FDI 51–85 ──
const PRIMARY_UPPER = [[55, 54, 53, 52, 51], [61, 62, 63, 64, 65]];
const PRIMARY_LOWER = [[85, 84, 83, 82, 81], [71, 72, 73, 74, 75]];
// In Mixed view the baby teeth sit only over the FRONT positions — the permanent
// molars (16/17/18, 26/27/28, …) have no baby predecessor, so those columns are
// blank spacers (null) to keep the two rows aligned.
const PRIMARY_UPPER_MIX = [[null, null, null, 55, 54, 53, 52, 51], [61, 62, 63, 64, 65, null, null, null]];
const PRIMARY_LOWER_MIX = [[null, null, null, 85, 84, 83, 82, 81], [71, 72, 73, 74, 75, null, null, null]];

// age → default mode (doctor can override with the switch)
const AGE_PRIMARY_MAX = 6;   // under 6 → primary
const AGE_MIXED_MAX = 12;    // 6–11 → mixed ; 12+ → permanent
function dentitionForAge(age) {
  const a = Number(age);
  if (!Number.isFinite(a)) return "permanent";
  if (a < AGE_PRIMARY_MAX) return "primary";
  if (a < AGE_MIXED_MAX) return "mixed";
  return "permanent";
}
const isPrimaryNum = (n) => n >= 51 && n <= 85;
// read-only: pick the mode from whatever teeth are actually shown
function deriveMode(nums) {
  let prim = false, perm = false;
  for (const n of nums) { if (isPrimaryNum(n)) prim = true; else if (n >= 11 && n <= 48) perm = true; }
  if (prim && perm) return "mixed";
  if (prim) return "primary";
  return "permanent";
}

// Realistic adult tooth = transparent PNG cut-out. Selection/plan states are shown
// by a colored layer masked to the exact tooth silhouette (blue = selected,
// amber = has-plan), over the photo so the texture stays visible.
function ToothShape({ n, selected, done, amber }) {
  const src = TEETH[n];
  const tint = selected ? "#0E7FC0" : done ? "#16a34a" : amber ? "#c07d0a" : null;
  return (
    <div className="relative w-full">
      <img src={src} alt="" draggable="false" className="block h-auto w-full select-none" />
      {tint && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: tint,
            opacity: selected ? 0.62 : done ? 0.5 : 0.42,
            WebkitMaskImage: `url(${src})`,
            maskImage: `url(${src})`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  );
}

// Baby tooth = simple drawn shape (smaller, whiter). Drawn crown-up; the caller
// flips the upper row so crowns face the centre line.
const primaryCategory = (n) => { const p = n % 10; if (p <= 2) return "incisor"; if (p === 3) return "canine"; return "molar"; };
const PRIMARY_CROWN = {
  incisor: "M13 6 Q13 4 18 4 Q23 4 23 6 L21.5 27 Q21 30 18 30 Q15 30 14.5 27 Z",
  canine: "M18 4 Q22 8 22 16 Q22 27 18 30 Q14 27 14 16 Q14 8 18 4 Z",
  molar: "M11 11 Q10 6 15 7 Q18 4 21 7 Q26 6 25 11 Q26 26 18 30 Q10 26 11 11 Z",
};
const PRIMARY_ROOTS = {
  incisor: ["M15 29 Q14 43 17 51 Q18 54 19 51 Q22 43 21 29 Z"],
  canine: ["M15 29 Q13 44 16 53 Q18 57 20 53 Q23 44 21 29 Z"],
  molar: ["M13 28 Q11 42 13 51 Q14 54 16 51 Q16 42 16.5 29 Z", "M23 28 Q25 42 23 51 Q22 54 20 51 Q20 42 19.5 29 Z"],
};
function PrimaryToothShape({ n, selected, done, amber }) {
  const cat = primaryCategory(n);
  const crown = selected ? "#0E7FC0" : done ? "#16a34a" : amber ? "#eabd82" : "#fdfdfa";
  const root = selected ? "#0E7FC0" : done ? "#16a34a" : amber ? "#f0dcbc" : "#f4efe6";
  const stroke = selected ? "#0a5d90" : done ? "#0f7a37" : amber ? "#b6802f" : "#cfd4da";
  return (
    <svg viewBox="0 0 36 66" className="h-auto w-full">
      {PRIMARY_ROOTS[cat].map((d, i) => (
        <path key={i} d={d} fill={root} stroke={stroke} strokeWidth="0.7" strokeLinejoin="round" />
      ))}
      <path d={PRIMARY_CROWN[cat]} fill={crown} stroke={stroke} strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  );
}

function Tooth({ n, upper, primary, small, selectedSet, markedSet, doneSet, labels, onToothClick, onToothDoubleClick, disabled }) {
  const { t } = useTranslation();
  const clickTimer = useRef(null);
  if (n == null) return <div className="min-w-0 flex-1" />; // alignment spacer (mixed view)

  const selected = selectedSet.has(n);
  const done = !selected && (doneSet?.has(n) ?? false);   // has a work added this visit
  const amber = !selected && !done && markedSet.has(n);
  const label = labels?.[n];
  // single-click selects (respects `disabled`); double-click opens the per-tooth
  // popup (independent of `disabled` so it works even before a work is chosen).
  const clickable = typeof onToothClick === "function" && !disabled;
  const doubleable = typeof onToothDoubleClick === "function";
  const asButton = clickable || doubleable;

  const handleClick = () => {
    if (!clickable) return;
    if (!doubleable) { onToothClick(n); return; }        // no dbl handler → immediate (unchanged)
    if (clickTimer.current) return;
    clickTimer.current = setTimeout(() => { clickTimer.current = null; onToothClick(n); }, 200);
  };
  const handleDouble = () => {
    if (!doubleable) return;
    if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null; }
    onToothDoubleClick(n);
  };

  const num = <span className={`text-[10px] sm:text-[11px] font-semibold ${selected ? "text-[#0E7FC0]" : done ? "text-[#16a34a]" : "text-slate-400"}`}>{n}</span>;
  const tag = (
    <span className={`h-3.5 leading-none text-[8px] sm:text-[9px] font-bold ${label ? "text-[#0E6E75] dark:text-sky-300" : "text-transparent"}`}>
      {label || "·"}
    </span>
  );
  const shape = primary
    ? <PrimaryToothShape n={n} selected={selected} done={done} amber={amber} />
    : <ToothShape n={n} selected={selected} done={done} amber={amber} />;
  // adult PNGs are pre-oriented; baby shapes are drawn crown-up so flip the upper row
  const rotate = primary && upper ? "rotate-180" : "";
  const shapeBox = <div className={`${small ? "w-[72%]" : "w-full"} ${rotate}`}>{shape}</div>;

  const inner = upper ? (<>{tag}{shapeBox}{num}</>) : (<>{num}{shapeBox}{tag}</>);
  const cls = `flex min-w-0 flex-1 flex-col items-center rounded-lg p-0.5 transition ${asButton ? "cursor-pointer hover:opacity-80" : ""} ${selected ? "bg-[#0E7FC0]/10 ring-2 ring-inset ring-[#0E7FC0]" : done ? "bg-[#16a34a]/10 ring-1 ring-inset ring-[#16a34a]" : ""}`;
  const title = `${t("appt.comp_tooth_label", { teeth: n })}${label ? ` · ${label}` : ""}`;

  return asButton ? (
    <button type="button" onClick={handleClick} onDoubleClick={handleDouble} className={cls} title={title}>{inner}</button>
  ) : (
    <div className={cls} title={title}>{inner}</div>
  );
}

function Arch({ left, right, upper, primary, small, common }) {
  return (
    <div className={`flex w-full ${upper ? "items-end" : "items-start"} gap-px`}>
      {left.map((n, i) => <Tooth key={`l${i}`} n={n} upper={upper} primary={primary} small={small} {...common} />)}
      <div className="mx-0.5 sm:mx-1 h-10 sm:h-14 w-px shrink-0 self-center bg-[#0E6E75]/30" />
      {right.map((n, i) => <Tooth key={`r${i}`} n={n} upper={upper} primary={primary} small={small} {...common} />)}
    </div>
  );
}

const Divider = () => <div className="h-px w-full bg-[#0E6E75]/20" />;

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
  teeth = [],          // back-compat: highlighted teeth in view mode
  selected,            // blue teeth (edit draft — the tooth being picked now); falls back to `teeth`
  marked = [],         // amber teeth (e.g. existing plan teeth in edit)
  done = [],           // green teeth (a work has already been added to them this visit)
  labels = {},
  onToothClick,        // when provided, teeth are clickable
  onToothDoubleClick,  // when provided, double-clicking a tooth fires this (per-tooth popup)
  disabled = false,
  age,                 // patient age → default dentition mode
}) {
  const { t } = useTranslation();
  const selectedSet = new Set((selected ?? teeth ?? []).map(Number).filter(Number.isFinite));
  const markedSet = new Set((marked || []).map(Number).filter(Number.isFinite));
  const doneSet = new Set((done || []).map(Number).filter(Number.isFinite));
  const common = { selectedSet, markedSet, doneSet, labels, onToothClick, onToothDoubleClick, disabled };

  const editable = typeof onToothClick === "function";
  const autoMode = deriveMode([...selectedSet, ...markedSet]);
  const [modeState, setMode] = useState(() => dentitionForAge(age));
  const mode = editable ? modeState : autoMode; // read-only fits the data; edit follows the switch

  const MODES = ["primary", "mixed", "permanent"];

  return (
    <div className="w-full space-y-2 sm:space-y-3">
      {editable && (
        <div className="flex justify-center gap-1">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${mode === m ? "bg-[#0E6E75] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {t(`teeth.${m}`)}
            </button>
          ))}
        </div>
      )}

      {mode === "mixed" && <Arch left={PRIMARY_UPPER_MIX[0]} right={PRIMARY_UPPER_MIX[1]} upper primary small common={common} />}

      {mode === "primary" ? (
        <Arch left={PRIMARY_UPPER[0]} right={PRIMARY_UPPER[1]} upper primary common={common} />
      ) : (
        <Arch left={UPPER[0]} right={UPPER[1]} upper common={common} />
      )}

      <Divider />

      {mode === "primary" ? (
        <Arch left={PRIMARY_LOWER[0]} right={PRIMARY_LOWER[1]} primary common={common} />
      ) : (
        <Arch left={LOWER[0]} right={LOWER[1]} common={common} />
      )}

      {mode === "mixed" && <Arch left={PRIMARY_LOWER_MIX[0]} right={PRIMARY_LOWER_MIX[1]} primary small common={common} />}

      <p title="designed by macrovector - Magnific.com" className="select-none text-center text-[7px] leading-none text-slate-300">
        designed by macrovector · Magnific.com
      </p>
    </div>
  );
}

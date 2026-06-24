import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { completeAppointmentWithSession } from "../../api/appointmentApi";
import { uploadSessionImages } from "../../api/sessionApi";
import { getWorks } from "../../api/workApi";
import { getActiveTreatmentPlan } from "../../api/treatmentPlanApi";
import { useSettings } from "../../context/SettingContext";
import PrescriptionEditor from "../prescriptions/PrescriptionEditor";

const TREATMENT_TYPES = ["ortho", "implant", "rct", "re_rct"];
const PLAN_CODES = new Set(TREATMENT_TYPES);
const WHOLE_MOUTH_CODES = new Set(["scaling_polish", "ortho","laser"]);

const UPPER = [[18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28]];
const LOWER = [[48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38]];

function parseTeeth(s) {
  if (!s) return [];
  return String(s).split(",").map((x) => Number(x.trim())).filter((n) => Number.isFinite(n));
}

export default function CompleteAppointmentModal({ appointment, onClose, onCompleted }) {
  const { formatTime, formatDate, formatMoney } = useSettings();

  const [nextPlan, setNextPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [plans, setPlans] = useState({
    ortho: { loaded: false, list: [] },
    implant: { loaded: false, list: [] },
    rct: { loaded: false, list: [] },
    re_rct: { loaded: false, list: [] },
  });

  const [draft, setDraft] = useState({ work_id: "", quantity: 1, teeth: [], plan_mode: "new", agreed_total: "" });
  const [confirmed, setConfirmed] = useState([]);
  const [completedPlanIds, setCompletedPlanIds] = useState([]);

  // case images chosen before completion: { id, file, preview }
  const [images, setImages] = useState([]);

  // optional prescription written during the visit
  const [prescription, setPrescription] = useState([]);

  // free the object URLs we created for previews when the modal unmounts
  useEffect(() => () => images.forEach((im) => URL.revokeObjectURL(im.preview)), [images]);

  const apptId = appointment.id ?? appointment.appointment_id;
  const patientId = Number(appointment.patient_id);

  useEffect(() => {
    (async () => {
      try {
        setLoadingCatalog(true);
        const res = await getWorks();
        const data = res.data?.works || res.data?.data || res.data;
        setCatalog(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.userMessage);
      } finally {
        setLoadingCatalog(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!patientId || Number.isNaN(patientId)) return;
    TREATMENT_TYPES.forEach((type) => {
      getActiveTreatmentPlan(patientId, type)
        .then((list) => setPlans((prev) => ({ ...prev, [type]: { loaded: true, list: Array.isArray(list) ? list : [] } })))
        .catch(() => setPlans((prev) => ({ ...prev, [type]: { loaded: true, list: [] } })));
    });
  }, [patientId]);

  const getMeta = (workId) => {
    const item = catalog.find((x) => Number(x.id) === Number(workId));
    if (!item) return null;
    return { id: Number(item.id), name: item.name, code: String(item.code || "").toLowerCase(), min_price: Number(item.min_price || 0) };
  };

  // tooth number -> active plan type (for the label above the tooth)
  const planTypeByTooth = useMemo(() => {
    const m = {};
    TREATMENT_TYPES.forEach((t) => (plans[t]?.list || []).forEach((p) => parseTeeth(p.teeth).forEach((n) => { m[n] = t; })));
    return m;
  }, [plans]);

  const activePlanForTooth = (tooth, code) =>
    (plans[code]?.list || []).find((p) => parseTeeth(p.teeth).includes(tooth)) || null;

  const dMeta = getMeta(draft.work_id);
  const dCode = dMeta?.code;
  const dWhole = !!dCode && WHOLE_MOUTH_CODES.has(dCode);
  const dPlan = !!dCode && PLAN_CODES.has(dCode);
  const dPerToothPlan = dPlan && !dWhole;

  // Clinical rule: a tooth can't have two active plans of the SAME type at once.
  // Block starting a NEW plan on a tooth that already has an active plan of this type.
  const conflictPlan =
    dPlan && draft.plan_mode === "new" && draft.teeth[0]
      ? activePlanForTooth(draft.teeth[0], dCode)
      : null;

  const canAdd = (() => {
    if (!dMeta) return false;
    if (conflictPlan) return false;
    let planOk = true;
    if (dPlan && draft.plan_mode === "new") {
      const v = Number(draft.agreed_total);
      planOk = Number.isFinite(v) && v >= dMeta.min_price;
    }
    // tooth is OPTIONAL for every treatment now
    return planOk;
  })();

  const selectWork = (value) => {
    const meta = getMeta(value);
    const code = meta?.code;
    const isPlan = !!code && PLAN_CODES.has(code);
    let plan_mode = "new";
    let agreed_total = isPlan && meta ? meta.min_price : "";
    // default to continuing an existing plan of this type if one exists
    if (isPlan) {
      const list = plans[code]?.list || [];
      if (list.length > 0) { plan_mode = String(list[0].id); agreed_total = ""; }
    }
    setDraft({ work_id: value, quantity: 1, teeth: [], plan_mode, agreed_total });
  };

  const setQty = (val) => {
    const q = Math.max(1, Number(val) || 1);
    setDraft((d) => ({ ...d, quantity: q, teeth: d.teeth.slice(0, q) }));
  };

  const toggleTooth = (n) => {
    const meta = getMeta(draft.work_id);
    if (!meta) return;
    const code = meta.code;
    if (WHOLE_MOUTH_CODES.has(code)) return;
    const perToothPlan = PLAN_CODES.has(code) && !WHOLE_MOUTH_CODES.has(code);
    if (perToothPlan) {
      // optional single tooth. If the tapped tooth already has an active plan of
      // this type, auto-switch to "continue" it (convenience). Otherwise just
      // select the tooth and keep the New/Continue chosen in the dropdown.
      setDraft((d) => {
        if (d.teeth.includes(n)) return { ...d, teeth: [] }; // deselect
        const existing = activePlanForTooth(n, code);
        if (existing) return { ...d, teeth: [n], plan_mode: String(existing.id), agreed_total: "" };
        return { ...d, teeth: [n] };
      });
      return;
    }
    setDraft((d) => {
      if (d.teeth.includes(n)) return { ...d, teeth: d.teeth.filter((t) => t !== n) };
      if (d.teeth.length >= (Number(d.quantity) || 1)) return d;
      return { ...d, teeth: [...d.teeth, n] };
    });
  };

  const setPlanModeManual = (value) => {
    setDraft((d) => ({ ...d, plan_mode: value, agreed_total: value === "new" ? dMeta?.min_price || "" : "" }));
  };

  const addTreatment = () => {
    if (!canAdd) return;
    const meta = getMeta(draft.work_id);
    const code = meta.code;
    const whole = WHOLE_MOUTH_CODES.has(code);
    const isPlan = PLAN_CODES.has(code);
    setConfirmed((prev) => [
      ...prev,
      {
        uid: `${Date.now()}-${Math.random()}`,
        work_id: Number(draft.work_id),
        code, name: meta.name, min_price: meta.min_price,
        wholeMouth: whole, isPlan,
        quantity: whole || isPlan ? 1 : Number(draft.quantity) || 1,
        teeth: whole ? [] : [...draft.teeth],
        plan_mode: isPlan ? draft.plan_mode : null,
        agreed_total: isPlan && draft.plan_mode === "new" ? Number(draft.agreed_total) : null,
      },
    ]);
    setDraft({ work_id: "", quantity: 1, teeth: [], plan_mode: "new", agreed_total: "" });
  };

  const editTreatment = (uid) => {
    const e = confirmed.find((c) => c.uid === uid);
    if (!e) return;
    setDraft({
      work_id: String(e.work_id),
      quantity: e.wholeMouth ? 1 : e.teeth.length || 1,
      teeth: [...e.teeth],
      plan_mode: e.plan_mode || "new",
      agreed_total: e.agreed_total ?? (e.isPlan ? e.min_price : ""),
    });
    setConfirmed((prev) => prev.filter((c) => c.uid !== uid));
  };

  const removeTreatment = (uid) => setConfirmed((prev) => prev.filter((c) => c.uid !== uid));
  const toggleCompleted = (planId) =>
    setCompletedPlanIds((prev) => (prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]));

  const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp"];

  const onPickImages = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-picking the same file later
    setImages((prev) => {
      // No cap — the doctor can attach as many case images as they want.
      const valid = picked
        .filter((f) => ALLOWED_IMG.includes(f.type) && f.size <= 10 * 1024 * 1024)
        .map((f) => ({ id: `${Date.now()}-${Math.random()}`, file: f, preview: URL.createObjectURL(f) }));
      if (valid.length < picked.length) {
        toast.error("Some files were skipped (only JPG/PNG/WEBP up to 10MB).");
      }
      return [...prev, ...valid];
    });
  };

  const removeImage = (id) =>
    setImages((prev) => {
      const target = prev.find((im) => im.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((im) => im.id !== id);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!patientId || Number.isNaN(patientId)) return setError("Missing patient on this appointment.");
    const works = [];
    for (const c of confirmed) {
      if (c.wholeMouth) {
        works.push({ work_id: c.work_id, quantity: 1, tooth_number: null, treatment_plan_id: c.isPlan && c.plan_mode !== "new" ? Number(c.plan_mode) : null, agreed_total: c.isPlan && c.plan_mode === "new" ? Number(c.agreed_total) : null });
      } else if (c.isPlan) {
        works.push({ work_id: c.work_id, quantity: 1, tooth_number: c.teeth[0] ?? null, treatment_plan_id: c.plan_mode !== "new" ? Number(c.plan_mode) : null, agreed_total: c.plan_mode === "new" ? Number(c.agreed_total) : null });
      } else if (c.teeth.length > 0) {
        for (const t of c.teeth) works.push({ work_id: c.work_id, quantity: 1, tooth_number: t, treatment_plan_id: null, agreed_total: null });
      } else {
        // no tooth selected → one entry with the chosen quantity, no tooth
        works.push({ work_id: c.work_id, quantity: c.quantity || 1, tooth_number: null, treatment_plan_id: null, agreed_total: null });
      }
    }
    if (works.length === 0) return setError("Add at least one treatment first.");
    try {
      setSaving(true);
      // 1) complete the appointment / create the session (unchanged logic)
      const rx = prescription.filter((r) => r.drug_name && r.drug_name.trim());
      const res = await completeAppointmentWithSession(apptId, { next_plan: nextPlan || null, notes: notes || null, works, completedPlanIds, prescription: rx });

      // 2) link any chosen images to the freshly created session
      const sessionId = res?.data?.session?.id;
      if (images.length > 0 && sessionId) {
        try {
          await uploadSessionImages(sessionId, images.map((im) => im.file));
        } catch (imgErr) {
          // session is already saved — don't fail the whole flow over images
          toast.error(imgErr.userMessage || "Appointment completed, but images failed to upload.");
        }
      }

      onCompleted?.();
      onClose();
    } catch (err) {
      toast.error(err.userMessage || "Failed to complete appointment.");
    } finally {
      setSaving(false);
    }
  };

  // continuing info (per-tooth plan tooth already has a plan)
  const draftExistingPlan =
    dPlan && draft.plan_mode !== "new"
      ? (plans[dCode]?.list || []).find((p) => String(p.id) === String(draft.plan_mode))
      : null;
  const existingForSelected = dPlan ? plans[dCode]?.list || [] : [];

  // ── anatomical tooth shapes (viewBox 32x56; crown on top, root(s) at bottom) ──
  const ABBR = { rct: "RCT", re_rct: "RE-RCT", implant: "IMP", ortho: "ORT" };
  const toothCategory = (n) => {
    const p = n % 10;
    if (p <= 2) return "incisor";
    if (p === 3) return "canine";
    if (p <= 5) return "premolar";
    return "molar";
  };
  // crown outlines (viewBox 36 x 66; crown ~ y3..27)
  const CROWN = {
    incisor: "M13 4 Q13 3 18 3 Q23 3 23 4 Q24 15 22 23 Q20 27 18 27 Q16 27 14 23 Q12 15 13 4 Z",
    canine: "M18 3 Q22 7 23 15 Q23 24 18 27 Q13 24 13 15 Q14 7 18 3 Z",
    premolar: "M11 8 Q10 4 14 5 Q16 2 18 5 Q20 2 22 5 Q26 4 25 8 Q26 22 18 27 Q10 22 11 8 Z",
    molar: "M8 9 Q7 4 12 5 Q14.5 2 16.5 5 Q18 3 19.5 5 Q21.5 2 24 5 Q29 4 28 9 Q29 23 18 27 Q7 23 8 9 Z",
  };
  // light occlusal ridge lines (the grooves on the crown)
  const RIDGE = {
    incisor: ["M16 8 L16 22", "M18 7 L18 23", "M20 8 L20 22"],
    canine: ["M18 8 L18 24", "M16 12 L20 12"],
    premolar: ["M15 9 L15 23", "M21 9 L21 23", "M11 15 H25"],
    molar: ["M13 9 L13 24", "M18 8 L18 25", "M23 9 L23 24", "M9 16 H27"],
  };
  // roots vary by tooth type AND arch (upper molars 3 roots, lower 2; etc.)
  const rootPaths = (cat, upper) => {
    if (cat === "incisor") return ["M15 25 Q14 45 17 60 Q18 63 19 60 Q22 45 21 25 Z"];
    if (cat === "canine") return ["M15 26 Q13 47 16 62 Q17 66 19 62 Q22 47 21 26 Z"];
    if (cat === "premolar")
      return upper
        ? ["M13 25 Q11 41 12 55 Q12 59 15 56 Q16 41 16 27 Z", "M23 25 Q25 41 24 55 Q24 59 21 56 Q20 41 20 27 Z"]
        : ["M15 25 Q14 46 17 59 Q18 62 19 59 Q22 46 21 25 Z"];
    // molar
    return upper
      ? ["M11 25 Q8 41 8 55 Q8 59 12 56 Q13 41 14 27 Z", "M18 27 Q17.5 45 18 59 Q18 62 19 59 Q19.5 45 19 27 Z", "M25 25 Q28 41 28 55 Q28 59 24 56 Q23 41 22 27 Z"]
      : ["M12 25 Q9 43 11 57 Q12 61 15 57 Q15 43 15 27 Z", "M24 25 Q27 43 25 57 Q24 61 21 57 Q21 43 21 27 Z"];
  };

  const ToothShape = ({ n, upper, selected, amber }) => {
    const cat = toothCategory(n);
    // navy-family palette so it fits the system theme in both light & dark mode
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
  };

  const Tooth = ({ n, upper }) => {
    const selected = draft.teeth.includes(n);
    const planType = planTypeByTooth[n];
    const hasPlan = !!planType;
    const locked = dWhole || !draft.work_id;
    const num = <span className={`text-[11px] font-semibold ${selected ? "text-[#015478]" : "text-slate-500"}`}>{n}</span>;
    const tag = (
      <span className={`h-4 leading-none text-[9px] font-bold ${hasPlan ? "text-[#015478] dark:text-sky-300" : "text-transparent"}`}>
        {hasPlan ? ABBR[planType] || planType.toUpperCase() : "·"}
      </span>
    );
    const svg = <ToothShape n={n} upper={upper} selected={selected} amber={hasPlan} />;
    return (
      <button type="button" onClick={() => toggleTooth(n)} disabled={locked}
        title={hasPlan ? `Tooth ${n} · active ${(ABBR[planType] || planType).toUpperCase()}` : `Tooth ${n}`}
        className={`flex min-w-0 flex-1 flex-col items-center ${locked ? "cursor-not-allowed" : "hover:opacity-80"} transition`}>
        {upper
          ? (<>{tag}<div className="w-full rotate-180">{svg}</div>{num}</>)
          : (<>{num}<div className="w-full">{svg}</div>{tag}</>)}
      </button>
    );
  };

  const inputCls = "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex max-h-[96vh] w-full max-w-7xl flex-col rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-3 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Complete appointment & fill works</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {appointment.patient_name} · {appointment.patient_phone} · {appointment.doctor_name} ·{" "}
              {formatDate(appointment.scheduled_start)} {formatTime(appointment.scheduled_start)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {error && <div className="mx-5 mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 shrink-0">{error}</div>}

        {/* Body: clean top-down flow — less scrolling, full-width sections */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
          {/* Patient complaint (from booking) — full width on top */}
          {appointment.complaint && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">⚠ Complaint</p>
              <p className="mt-0.5 whitespace-pre-wrap text-[13px] font-medium text-slate-800">{appointment.complaint}</p>
            </div>
          )}

          {/* Patient medical info — blood type / allergies / chronic diseases */}
          {(appointment.patient_blood_type || appointment.patient_allergies || appointment.patient_chronic_diseases) && (
            <div className="grid gap-2 sm:grid-cols-3">
              {appointment.patient_blood_type && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Blood type</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">{appointment.patient_blood_type}</p>
                </div>
              )}
              {appointment.patient_allergies && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">⚠ Allergies</p>
                  <p className="mt-0.5 text-[13px] font-medium text-slate-800">{appointment.patient_allergies}</p>
                </div>
              )}
              {appointment.patient_chronic_diseases && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Chronic diseases</p>
                  <p className="mt-0.5 text-[13px] font-medium text-slate-800">{appointment.patient_chronic_diseases}</p>
                </div>
              )}
            </div>
          )}

          {/* Next plan + Notes — full width on top */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <textarea value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} rows={2}
              className={`${inputCls} resize-none`} placeholder="Next plan (optional)…" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className={`${inputCls} resize-none`} placeholder="Notes (optional)…" />
          </div>

          {/* Middle: treatment controls (left) | teeth chart (right) */}
          <div className="grid gap-3 lg:grid-cols-[minmax(280px,0.85fr),2fr] lg:items-start">
          {/* ===== LEFT: controls ===== */}
          <div className="flex flex-col gap-3">
            {/* Choose treatment */}
            <div className="rounded-xl border border-[#015478]/30 bg-[#015478]/5 p-3">
              <p className="mb-1.5 text-[11px] font-semibold text-[#015478]">1 · Choose treatment</p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[160px] flex-1">
                  <select value={draft.work_id} onChange={(e) => selectWork(e.target.value)} disabled={loadingCatalog} className={inputCls}>
                    <option value="">{loadingCatalog ? "Loading…" : "Select treatment…"}</option>
                    {catalog.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                {dMeta && !dWhole && !dPerToothPlan && (
                  <input type="number" min="1" value={draft.quantity} onChange={(e) => setQty(e.target.value)} title="Quantity (teeth)" className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                )}
                <button type="button" onClick={addTreatment} disabled={!canAdd}
                  className="rounded-md bg-[#015478] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#013d58] disabled:opacity-40">+ Add</button>
              </div>

              {/* agreement / continue */}
              {dPlan && (
                <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs">
                  {/* New vs Continue — works for legacy plans that have no tooth too */}
                  <select value={draft.plan_mode} onChange={(e) => setPlanModeManual(e.target.value)} className={`${inputCls} mb-2`}>
                    {(plans[dCode]?.list || []).map((p) => {
                      const rem = Number(p.agreed_total) - Number(p.total_paid || 0);
                      const where = p.teeth ? `tooth ${p.teeth}` : "no tooth";
                      return <option key={p.id} value={String(p.id)}>Continue · {where} · remaining {formatMoney(rem)}</option>;
                    })}
                    <option value="new">➕ New {dCode.toUpperCase()} — separate plan</option>
                  </select>

                  {conflictPlan && (
                    <p className="mb-1 text-[11px] font-medium text-red-600">
                      Tooth {draft.teeth[0]} already has an active {dCode.toUpperCase()} — choose “Continue”, or mark the existing one completed first. You can’t open two on the same tooth.
                    </p>
                  )}

                  {draftExistingPlan ? (
                    <p className="text-slate-700">
                      Continuing <b className="uppercase">{dCode}</b>{draft.teeth[0] ? ` · tooth ${draft.teeth[0]}` : " · tooth optional"} · remaining{" "}
                      <b>{formatMoney(Number(draftExistingPlan.agreed_total) - Number(draftExistingPlan.total_paid || 0))}</b> — no new agreement.
                    </p>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">New <span className="uppercase">{dCode}</span> agreement total</label>
                      <input type="number" min={dMeta?.min_price || 0} value={draft.agreed_total}
                        onChange={(e) => setDraft((d) => ({ ...d, agreed_total: e.target.value }))} className={inputCls}
                        step="0.01"
                        placeholder={`Min ${formatMoney(dMeta?.min_price || 0)}`} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Saved treatments (chips) */}
            <div className="flex flex-col rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="mb-1.5 text-[11px] font-semibold text-emerald-700">Saved treatments ({confirmed.length})</p>
              <div className="max-h-48 overflow-y-auto">
                {confirmed.length === 0 ? (
                  <p className="text-[11px] text-slate-500">Choose a treatment → pick teeth → “Add”. Items appear here.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {confirmed.map((c) => (
                      <span key={c.uid} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-slate-500">· {c.wholeMouth ? "whole mouth" : c.teeth.length ? `tooth ${c.teeth.join(", ")}` : "no tooth"}</span>
                        {c.isPlan && <span className="text-rose-500">{c.plan_mode === "new" ? `· new plan ${formatMoney(Number(c.agreed_total))}` : "· continue"}</span>}
                        <button type="button" onClick={() => editTreatment(c.uid)} title="Edit" className="ml-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-[#015478]">✎</button>
                        <button type="button" onClick={() => removeTreatment(c.uid)} title="Remove" className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Existing plans of the selected plan type */}
            {dPlan && existingForSelected.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1.5 text-[11px] font-semibold text-slate-700">Existing <span className="uppercase">{dCode}</span> — tick to mark completed</p>
                <div className="max-h-24 space-y-1.5 overflow-y-auto">
                  {existingForSelected.map((p) => {
                    const rem = Number(p.agreed_total) - Number(p.total_paid || 0);
                    return (
                      <label key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px]">
                        <span>{p.teeth ? `tooth ${p.teeth}` : "tooth not set"} · remaining {formatMoney(rem)}</span>
                        <input type="checkbox" checked={completedPlanIds.includes(p.id)} onChange={() => toggleCompleted(p.id)} />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prescription (optional) — sits in the remaining space below treatments */}
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <PrescriptionEditor items={prescription} onChange={setPrescription} patientName={appointment.patient_name} />
            </div>
          </div>

          {/* ===== RIGHT: teeth chart (hero) ===== */}
          <div className="flex flex-col rounded-xl border border-[#015478]/20 bg-[#015478]/5 p-4 lg:min-h-[420px]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#015478] dark:text-sky-300">2 · Pick teeth</p>
              {!dWhole && draft.work_id && (
                <span className="text-xs text-slate-500">
                  {draft.teeth.length
                    ? `tooth ${draft.teeth.join(", ")}`
                    : "tooth optional"}
                </span>
              )}
            </div>

            <div className="relative flex flex-1 items-center justify-center">
              <div className={`w-full space-y-3 transition-opacity ${dWhole ? "opacity-40 pointer-events-none" : !draft.work_id ? "opacity-60" : ""}`}>
                <div className="flex w-full items-end gap-px">
                  {UPPER[0].map((n) => <Tooth key={n} n={n} upper />)}
                  <div className="mx-1 h-14 w-px shrink-0 self-center bg-[#015478]/30" />
                  {UPPER[1].map((n) => <Tooth key={n} n={n} upper />)}
                </div>
                <div className="h-px w-full bg-[#015478]/20" />
                <div className="flex w-full items-start gap-px">
                  {LOWER[0].map((n) => <Tooth key={n} n={n} />)}
                  <div className="mx-1 h-14 w-px shrink-0 self-center bg-[#015478]/30" />
                  {LOWER[1].map((n) => <Tooth key={n} n={n} />)}
                </div>
              </div>

              {dWhole && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="rounded-md bg-white/85 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
                    {dMeta?.name} applies to the whole mouth — no tooth needed.
                  </span>
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">Highlighted tooth = already has an active plan · tap to select</p>
          </div>
          </div>

          {/* Case images (optional) — full width at the bottom, responsive grid */}
          <div className="rounded-xl border border-[#015478]/30 bg-[#015478]/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-[#015478]">Case images (optional)</p>
              <label className="cursor-pointer rounded-md border border-[#015478]/40 bg-white px-2.5 py-1 text-[11px] font-medium text-[#015478] hover:bg-[#015478]/10">
                + Add images
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                  onChange={onPickImages} disabled={saving} />
              </label>
            </div>
            {images.length === 0 ? (
              <p className="text-[11px] text-slate-500">Attach x-rays/photos (JPG, PNG, WEBP · up to 10MB each).</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {images.map((im) => (
                  <div key={im.id} className="relative aspect-square overflow-hidden rounded-md border border-slate-200">
                    <img src={im.preview} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(im.id)} disabled={saving}
                      title="Remove"
                      className="absolute right-0 top-0 rounded-bl-md bg-black/55 px-1 text-[11px] leading-tight text-white hover:bg-red-600">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving || confirmed.length === 0}
            className="rounded-md bg-[#015478] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#013d58] disabled:opacity-50">
            {saving ? "Saving…" : "Confirm & Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

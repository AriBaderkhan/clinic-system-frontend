import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { completeAppointmentWithSession, saveVisitDraft, getAppointmentById } from "../../api/appointmentApi";
import { uploadSessionImages } from "../../api/sessionApi";
import { getWorksForDoctor } from "../../api/workApi";
import { getActiveTreatmentPlan } from "../../api/treatmentPlanApi";
import { useSettings } from "../../context/SettingContext";
import PrescriptionEditor from "../prescriptions/PrescriptionEditor";
import TeethDiagram from "../sessions/TeethDiagram";


function parseTeeth(s) {
  if (!s) return [];
  return String(s).split(",").map((x) => Number(x.trim())).filter((n) => Number.isFinite(n));
}

// Per-tooth quick-add popup (opened by double-clicking a tooth). Fast path:
//   • normal work  → click it → saved instantly, popup closes (no extra button).
//   • plan work    → one question then saves+closes:
//        - tooth already has this plan → "Done? / Not done" (continue the plan),
//        - new plan → enter the agreed total.
// onConfirm both records the treatment AND closes the popup (parent clears state).
function ToothWorkPopup({ tooth, works, planFor, formatMoney, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(null);   // { work, existing } when a PLAN work needs a follow-up
  const [amount, setAmount] = useState("");

  const clickWork = (w) => {
    if (!w.is_plan) {
      // normal work → save immediately, popup closes
      onConfirm({ work: w, existingPlan: null, markDone: false, amount: 0 });
      return;
    }
    const existing = planFor(tooth, w.code);
    setStep({ work: w, existing });
    setAmount(existing ? "" : String(w.min_price ?? ""));
  };
  const back = () => { setStep(null); setAmount(""); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-pop">
        <div className="-mx-5 -mt-5 mb-4 flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{t("appt.tw_title", { tooth })}</h3>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">✕</button>
        </div>

        {!step ? (
          <>
            <p className="mb-3 text-sm text-slate-500">{t("appt.tw_pick")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {works.map((w) => {
                const hasPlan = w.is_plan && !!planFor(tooth, w.code);
                return (
                  <button key={w.id} type="button" onClick={() => clickWork(w)}
                    className="flex w-full min-w-0 items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-start text-sm transition hover:border-brand hover:bg-brand/5">
                    <span className="min-w-0 truncate font-medium text-slate-900" title={w.name}>{w.name}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[11px]">
                      {w.is_plan && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">{t("appt.tw_plan")}</span>}
                      {hasPlan && <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">{t("appt.tw_has_plan")}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
              <span className="min-w-0 truncate text-sm font-semibold text-slate-900">{step.work.name}</span>
              <button type="button" onClick={back} className="shrink-0 text-xs font-semibold text-brand hover:underline">{t("appt.tw_change")}</button>
            </div>

            {step.existing ? (
              // Existing plan on this tooth → ask done or not; either way it continues the plan.
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-slate-700">
                  {t("appt.tw_existing")} · {t("appt.pay_agreed")} <b>{formatMoney(step.existing.agreed_total)}</b> · {t("appt.pay_remaining")} <b>{formatMoney(Number(step.existing.agreed_total) - Number(step.existing.total_paid || 0))}</b>
                </div>
                <p className="text-sm font-medium text-slate-700">{t("appt.tw_done_q")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => onConfirm({ work: step.work, existingPlan: step.existing, markDone: true, amount: 0 })}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">{t("appt.tw_done_yes")}</button>
                  <button type="button" onClick={() => onConfirm({ work: step.work, existingPlan: step.existing, markDone: false, amount: 0 })}
                    className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">{t("appt.tw_done_no")}</button>
                </div>
              </div>
            ) : (
              // New plan → enter the agreed total, then save.
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">{t("appt.tw_agreed")}</label>
                <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
                <button type="button" onClick={() => onConfirm({ work: step.work, existingPlan: null, markDone: false, amount: Number(amount) || 0 })}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">{t("appt.tw_add")}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CompleteAppointmentModal({ appointment, onClose, onCompleted }) {
  const { t } = useTranslation();
  const { formatTime, formatDate, formatMoney } = useSettings();

  const [nextPlan, setNextPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [complaint, setComplaint] = useState(appointment.complaint || "");
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [usesTeeth, setUsesTeeth] = useState(true); // false → this doctor's specialty has no teeth chart
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [plans, setPlans] = useState({});

  const [draft, setDraft] = useState({ work_id: "", quantity: 1, teeth: [], plan_mode: "new", agreed_total: "", arch: null });
  const [confirmed, setConfirmed] = useState([]);
  const [completedPlanIds, setCompletedPlanIds] = useState([]);
  const [popupTooth, setPopupTooth] = useState(null); // tooth # for the double-click quick-add popup

  // case images chosen before completion: { id, file, preview }
  const [images, setImages] = useState([]);

  // optional prescription written during the visit
  const [prescription, setPrescription] = useState([]);

  // free the object URLs we created for previews when the modal unmounts
  useEffect(() => () => images.forEach((im) => URL.revokeObjectURL(im.preview)), [images]);

  const apptId = appointment.id ?? appointment.appointment_id;
  const patientId = Number(appointment.patient_id);

  // Load the visit (draft + its doctor), then only the treatments THIS doctor may
  // use (their specialty + extras the manager ticked).
  useEffect(() => {
    (async () => {
      let a = {};
      try {
        const res = await getAppointmentById(apptId);
        a = res.data || {};
        // Prefill complaint + notes + next plan from the saved visit draft so a refresh
        // (or reopening) never loses what was typed. Falls back to the booking complaint.
        setComplaint(a.complaint || "");
        setNotes(a.draft_notes || "");
        setNextPlan(a.draft_next_plan || "");
      } catch { /* keep whatever is already there */ }

      try {
        setLoadingCatalog(true);
        const res = await getWorksForDoctor(a.doctor_id ?? appointment.doctor_id);
        const data = res.data || {};
        // Canonicalise code to lowercase ONCE, here. The backend stores codes
        // uppercase but the whole frontend compares them lowercase (plans keys,
        // planCodes, getMeta). Normalising at ingestion keeps a single source of
        // truth so no lookup/popup ever has to remember to convert.
        setCatalog(Array.isArray(data.works) ? data.works.map((w) => ({ ...w, code: String(w.code || "").toLowerCase() })) : []);
        setUsesTeeth(data.uses_teeth !== false);
      } catch (err) {
        setError(err.userMessage);
      } finally {
        setLoadingCatalog(false);
      }
    })();
  }, [apptId, appointment.doctor_id]);

  // Behavior is data-driven now: the catalog carries is_plan / is_whole_mouth,
  // so we derive the code sets from it instead of hardcoding treatment codes.
  const planCodes = useMemo(
    () => new Set(catalog.filter((w) => w.is_plan).map((w) => String(w.code || "").toLowerCase())),
    [catalog]
  );
  const wholeMouthCodes = useMemo(
    () => new Set(catalog.filter((w) => w.is_whole_mouth).map((w) => String(w.code || "").toLowerCase())),
    [catalog]
  );
  const treatmentTypes = useMemo(() => [...planCodes], [planCodes]);

  useEffect(() => {
    if (!patientId || Number.isNaN(patientId)) return;
    treatmentTypes.forEach((type) => {
      getActiveTreatmentPlan(patientId, type)
        .then((list) => setPlans((prev) => ({ ...prev, [type]: { loaded: true, list: Array.isArray(list) ? list : [] } })))
        .catch(() => setPlans((prev) => ({ ...prev, [type]: { loaded: true, list: [] } })));
    });
  }, [patientId, treatmentTypes]);

  const getMeta = (workId) => {
    const item = catalog.find((x) => Number(x.id) === Number(workId));
    if (!item) return null;
    return { id: Number(item.id), name: item.name, code: String(item.code || "").toLowerCase(), min_price: Number(item.min_price || 0) };
  };

  // tooth number -> active plan type (for the label above the tooth)
  const planTypeByTooth = useMemo(() => {
    const m = {};
    treatmentTypes.forEach((t) => (plans[t]?.list || []).forEach((p) => parseTeeth(p.teeth).forEach((n) => { m[n] = t; })));
    return m;
  }, [plans, treatmentTypes]);

  const activePlanForTooth = (tooth, code) =>
    (plans[code]?.list || []).find((p) => parseTeeth(p.teeth).includes(tooth)) || null;

  const dMeta = getMeta(draft.work_id);
  const dCode = dMeta?.code;
  const dWhole = !!dCode && wholeMouthCodes.has(dCode);
  const dPlan = !!dCode && planCodes.has(dCode);
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
    const isPlan = !!code && planCodes.has(code);
    let plan_mode = "new";
    let agreed_total = isPlan && meta ? meta.min_price : "";
    // default to continuing an existing plan of this type if one exists
    if (isPlan) {
      const list = plans[code]?.list || [];
      if (list.length > 0) { plan_mode = String(list[0].id); agreed_total = ""; }
    }
    setDraft({ work_id: value, quantity: 1, teeth: [], plan_mode, agreed_total, arch: null });
  };

  const setQty = (val) => {
    const q = Math.max(1, Number(val) || 1);
    setDraft((d) => ({ ...d, quantity: q, teeth: d.teeth.slice(0, q) }));
  };

  const toggleTooth = (n) => {
    const meta = getMeta(draft.work_id);
    if (!meta) return;
    const code = meta.code;
    if (wholeMouthCodes.has(code)) return;
    const perToothPlan = planCodes.has(code) && !wholeMouthCodes.has(code);
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
    const whole = wholeMouthCodes.has(code);
    const isPlan = planCodes.has(code);
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
        arch: whole ? (draft.arch ?? null) : null,
      },
    ]);
    setDraft({ work_id: "", quantity: 1, teeth: [], plan_mode: "new", agreed_total: "", arch: null });
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
      arch: e.arch ?? null,
    });
    setConfirmed((prev) => prev.filter((c) => c.uid !== uid));
  };

  const removeTreatment = (uid) => setConfirmed((prev) => prev.filter((c) => c.uid !== uid));
  const toggleCompleted = (planId) =>
    setCompletedPlanIds((prev) => (prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]));

  // Double-click quick-add: builds the same "confirmed" entry the main form does,
  // and (for an existing plan marked done) reuses the completedPlanIds mechanism.
  const addToothWork = ({ work, existingPlan, markDone, amount }) => {
    const isPlan = !!work.is_plan;
    setConfirmed((prev) => [
      ...prev,
      {
        uid: `${Date.now()}-${Math.random()}`,
        work_id: Number(work.id),
        code: work.code, name: work.name, min_price: work.min_price,
        wholeMouth: false, isPlan,
        quantity: 1,
        teeth: [popupTooth],
        plan_mode: isPlan ? (existingPlan ? String(existingPlan.id) : "new") : null,
        agreed_total: isPlan && !existingPlan ? Number(amount) : null,
      },
    ]);
    if (isPlan && existingPlan && markDone && !completedPlanIds.includes(existingPlan.id)) {
      setCompletedPlanIds((prev) => [...prev, existingPlan.id]);
    }
    setPopupTooth(null);
  };

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
        toast.error(t("appt.comp_skipped_files"));
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

  // Save the mid-visit draft (complaint + notes + next plan) to the server so it
  // survives a refresh. Independent of "Confirm & Complete".
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      await saveVisitDraft(apptId, { complaint: complaint || "", notes: notes || "", next_plan: nextPlan || "" });
      setDraftSaved(true);
    } catch (err) {
      toast.error(err.userMessage || t("appt.comp_draft_failed"));
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!patientId || Number.isNaN(patientId)) return setError(t("appt.comp_err_patient"));
    const works = [];
    for (const c of confirmed) {
      if (c.wholeMouth) {
        works.push({ work_id: c.work_id, quantity: 1, tooth_number: null, treatment_plan_id: c.isPlan && c.plan_mode !== "new" ? Number(c.plan_mode) : null, agreed_total: c.isPlan && c.plan_mode === "new" ? Number(c.agreed_total) : null, arch: c.arch ?? null });
      } else if (c.isPlan) {
        works.push({ work_id: c.work_id, quantity: 1, tooth_number: c.teeth[0] ?? null, treatment_plan_id: c.plan_mode !== "new" ? Number(c.plan_mode) : null, agreed_total: c.plan_mode === "new" ? Number(c.agreed_total) : null });
      } else if (c.teeth.length > 0) {
        for (const t of c.teeth) works.push({ work_id: c.work_id, quantity: 1, tooth_number: t, treatment_plan_id: null, agreed_total: null });
      } else {
        // no tooth selected → one entry with the chosen quantity, no tooth
        works.push({ work_id: c.work_id, quantity: c.quantity || 1, tooth_number: null, treatment_plan_id: null, agreed_total: null });
      }
    }
    if (works.length === 0) return setError(t("appt.comp_err_one"));
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
          toast.error(imgErr.userMessage || t("appt.comp_img_failed"));
        }
      }

      onCompleted?.();
      onClose();
    } catch (err) {
      toast.error(err.userMessage || t("appt.comp_failed"));
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

  // Plan abbreviations shown as the per-tooth tag in the chart.
  const ABBR = { rct: "RCT", re_rct: "RE-RCT", implant: "IMP", ortho: "ORT" };
  const planTeeth = Object.keys(planTypeByTooth).map(Number);
  const planLabels = Object.fromEntries(
    Object.entries(planTypeByTooth).map(([n, pt]) => [n, ABBR[pt] || String(pt).toUpperCase()])
  );

  // teeth that already have a work added THIS visit → shown green on the chart
  const confirmedTeeth = useMemo(() => {
    const s = new Set();
    for (const c of confirmed) if (!c.wholeMouth) for (const n of c.teeth) s.add(Number(n));
    return [...s];
  }, [confirmed]);

  const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ocean-deep/60 p-2 backdrop-blur-sm sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{t("appt.comp_title")}</h2>
            <p className="mt-0.5 break-words text-xs text-slate-500">
              {appointment.patient_name} · {appointment.patient_phone} · {appointment.doctor_name} ·{" "}
              {formatDate(appointment.scheduled_start)} {formatTime(appointment.scheduled_start)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">✕</button>
        </div>

        {error && <div className="mx-5 mt-3 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}

        {/* Body: clean top-down flow — less scrolling, full-width sections */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-4 sm:p-5">
          {/* Patient medical info — blood type · allergies · chronic diseases (one box) */}
          {(appointment.patient_blood_type || appointment.patient_allergies || appointment.patient_chronic_diseases) && (
            <div className="grid gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("appt.blood_type")}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">{appointment.patient_blood_type || "—"}</p>
              </div>
              <div className="sm:border-s sm:border-slate-200 sm:ps-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">{t("appt.allergies")}</p>
                <p className="mt-0.5 text-[13px] font-medium text-slate-800">{appointment.patient_allergies || "—"}</p>
              </div>
              <div className="sm:border-s sm:border-slate-200 sm:ps-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">{t("appt.chronic")}</p>
                <p className="mt-0.5 text-[13px] font-medium text-slate-800">{appointment.patient_chronic_diseases || "—"}</p>
              </div>
            </div>
          )}

          {/* Visit notes — complaint + next plan + notes, saved mid-visit (survives refresh) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.complaint_badge")}</p>
              <button type="button" onClick={handleSaveDraft} disabled={savingDraft}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-white px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10 disabled:opacity-50">
                {savingDraft ? t("appt.comp_saving") : draftSaved ? t("appt.comp_saved") : t("appt.comp_save_draft")}
              </button>
            </div>
            <textarea value={complaint} onChange={(e) => { setComplaint(e.target.value); setDraftSaved(false); }} rows={2}
              className={`${inputCls} resize-none`} placeholder={t("appt.comp_complaint_ph")} />
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <textarea value={nextPlan} onChange={(e) => { setNextPlan(e.target.value); setDraftSaved(false); }} rows={2}
                className={`${inputCls} resize-none`} placeholder={t("appt.comp_next_plan_ph")} />
              <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setDraftSaved(false); }} rows={2}
                className={`${inputCls} resize-none`} placeholder={t("appt.comp_notes_ph")} />
            </div>
          </div>

          {/* Middle: treatment controls (left) | teeth chart (right) */}
          <div className={`grid gap-4 lg:items-start ${usesTeeth ? "lg:grid-cols-[minmax(280px,0.85fr),2fr]" : ""}`}>
          {/* ===== LEFT: controls ===== */}
          <div className="flex min-w-0 flex-col gap-4">
            {/* Choose treatment */}
            <div className="rounded-xl border border-brand/30 bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">{t("appt.comp_step1")}</p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[160px] flex-1">
                  <select value={draft.work_id} onChange={(e) => selectWork(e.target.value)} disabled={loadingCatalog} className={inputCls}>
                    <option value="">{loadingCatalog ? t("appt.loading_short") : t("appt.comp_select_treatment")}</option>
                    {catalog.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                {dMeta && !dWhole && !dPerToothPlan && (
                  <input type="number" min="1" value={draft.quantity} onChange={(e) => setQty(e.target.value)} title={t("appt.comp_qty_title")} className="w-16 px-2 py-2 text-center tabular-nums rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
                )}
                <button type="button" onClick={addTreatment} disabled={!canAdd}
                  className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40">{t("appt.comp_add")}</button>
              </div>

              {/* agreement / continue */}
              {dPlan && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs">
                  {/* New vs Continue — works for legacy plans that have no tooth too */}
                  <select value={draft.plan_mode} onChange={(e) => setPlanModeManual(e.target.value)} className={`${inputCls} mb-2`}>
                    {(plans[dCode]?.list || []).map((p) => {
                      const rem = Number(p.agreed_total) - Number(p.total_paid || 0);
                      const where = p.teeth ? t("appt.comp_tooth_label", { teeth: p.teeth }) : t("appt.comp_no_tooth");
                      return <option key={p.id} value={String(p.id)}>{t("appt.comp_continue_opt", { where, amount: formatMoney(rem) })}</option>;
                    })}
                    <option value="new">{t("appt.comp_new_plan_opt", { code: dCode.toUpperCase() })}</option>
                  </select>

                  {conflictPlan && (
                    <p className="mb-1 text-[11px] font-medium text-red-600">
                      {t("appt.comp_conflict", { tooth: draft.teeth[0], code: dCode.toUpperCase() })}
                    </p>
                  )}

                  {draftExistingPlan ? (
                    <p className="text-slate-700">
                      {t("appt.comp_continuing")} <b className="uppercase">{dCode}</b>{draft.teeth[0] ? ` · ${t("appt.comp_tooth_label", { teeth: draft.teeth[0] })}` : ` · ${t("appt.comp_tooth_optional")}`} · {t("appt.comp_remaining", { amount: formatMoney(Number(draftExistingPlan.agreed_total) - Number(draftExistingPlan.total_paid || 0)) })}{" "}
                      {t("appt.comp_no_new_agreement")}
                    </p>
                  ) : (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">{t("appt.comp_new_agreement", { code: dCode.toUpperCase() })}</label>
                      <input type="number" min={dMeta?.min_price || 0} value={draft.agreed_total}
                        onChange={(e) => setDraft((d) => ({ ...d, agreed_total: e.target.value }))} className={inputCls}
                        step="0.01"
                        placeholder={t("appt.comp_min", { amount: formatMoney(dMeta?.min_price || 0) })} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Saved treatments (chips) */}
            <div className="flex flex-col rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">{t("appt.comp_saved", { count: confirmed.length })}</p>
              <div className="max-h-48 overflow-y-auto">
                {confirmed.length === 0 ? (
                  <p className="text-xs text-slate-500">{t("appt.comp_saved_hint")}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {confirmed.map((c) => (
                      <span key={c.uid} className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">{c.name}</span>
                        <span className="text-slate-500">· {c.wholeMouth ? t("appt.arch_" + (c.arch || "whole")) : c.teeth.length ? t("appt.comp_tooth_label", { teeth: c.teeth.join(", ") }) : t("appt.comp_no_tooth")}</span>
                        {c.isPlan && <span className="text-rose-500">{c.plan_mode === "new" ? t("appt.comp_new_plan_chip", { amount: formatMoney(Number(c.agreed_total)) }) : t("appt.comp_continue_chip")}</span>}
                        <button type="button" onClick={() => editTreatment(c.uid)} title={t("common.edit")} className="ms-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-brand">✎</button>
                        <button type="button" onClick={() => removeTreatment(c.uid)} title={t("common.delete")} className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Existing plans of the selected plan type */}
            {dPlan && existingForSelected.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{t("appt.comp_existing", { code: dCode.toUpperCase() })}</p>
                <div className="max-h-24 space-y-1.5 overflow-y-auto">
                  {existingForSelected.map((p) => {
                    const rem = Number(p.agreed_total) - Number(p.total_paid || 0);
                    return (
                      <label key={p.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                        <span>{p.teeth ? t("appt.comp_tooth_label", { teeth: p.teeth }) : t("appt.comp_tooth_not_set")} · {t("appt.comp_remaining", { amount: formatMoney(rem) })}</span>
                        <input type="checkbox" checked={completedPlanIds.includes(p.id)} onChange={() => toggleCompleted(p.id)} className="h-4 w-4 accent-brand" />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prescription (optional) — sits in the remaining space below treatments */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <PrescriptionEditor items={prescription} onChange={setPrescription} patientName={appointment.patient_name} />
            </div>
          </div>

          {/* ===== RIGHT: teeth chart (hero) — only for specialties that use teeth ===== */}
          {usesTeeth && (
          <div className="flex min-w-0 flex-col rounded-xl border border-brand/20 bg-white p-4 lg:min-h-[420px]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-brand">{t("appt.comp_step2")}</p>
              {!dWhole && draft.work_id && (
                <span className="text-xs text-slate-500">
                  {draft.teeth.length
                    ? t("appt.comp_tooth_label", { teeth: draft.teeth.join(", ") })
                    : t("appt.comp_tooth_optional")}
                </span>
              )}
            </div>

            <div className="relative flex flex-1 items-center justify-center">
              <div className={`w-full transition-opacity ${dWhole ? "opacity-40 pointer-events-none" : !draft.work_id ? "opacity-60" : ""}`}>
                <TeethDiagram
                  age={appointment.patient_age}
                  selected={draft.teeth}
                  done={confirmedTeeth}
                  marked={planTeeth}
                  labels={planLabels}
                  onToothClick={toggleTooth}
                  onToothDoubleClick={(n) => setPopupTooth(n)}
                  disabled={dWhole || !draft.work_id}
                />
              </div>

              {dWhole && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span className="rounded-xl bg-white/90 px-4 py-2 text-xs font-medium text-slate-700 shadow-card">
                    {t("appt.comp_whole_overlay", { name: dMeta?.name })}
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[{ v: null, l: t("appt.arch_whole") }, { v: "upper", l: t("appt.arch_upper") }, { v: "lower", l: t("appt.arch_lower") }].map((o) => (
                      <button key={String(o.v)} type="button" onClick={() => setDraft((d) => ({ ...d, arch: o.v }))}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${(draft.arch ?? null) === o.v ? "border-brand bg-brand text-white" : "border-slate-300 bg-white text-slate-600 hover:border-brand"}`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">{t("appt.comp_teeth_hint")}</p>
          </div>
          )}
          </div>

          {/* Case images (optional) — full width at the bottom, responsive grid */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">{t("appt.comp_case_images")}</p>
              <label className="cursor-pointer rounded-lg border border-brand/40 bg-white px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10">
                {t("appt.comp_add_images")}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                  onChange={onPickImages} disabled={saving} />
              </label>
            </div>
            {images.length === 0 ? (
              <p className="text-xs text-slate-500">{t("appt.comp_images_hint")}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {images.map((im) => (
                  <div key={im.id} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                    <img src={im.preview} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(im.id)} disabled={saving}
                      title={t("common.delete")}
                      className="absolute end-0 top-0 rounded-es-md bg-black/55 px-1.5 py-0.5 text-[11px] leading-tight text-onphoto hover:bg-red-600">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t("common.cancel")}</button>
          <button type="button" onClick={handleSubmit} disabled={saving || confirmed.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">
            {saving ? t("appt.comp_saving") : t("appt.comp_confirm")}
          </button>
        </div>
      </div>

      {popupTooth != null && (
        <ToothWorkPopup
          tooth={popupTooth}
          works={catalog.filter((w) => !w.is_whole_mouth)}
          planFor={activePlanForTooth}
          formatMoney={formatMoney}
          onConfirm={addToothWork}
          onClose={() => setPopupTooth(null)}
        />
      )}
    </div>
  );
}

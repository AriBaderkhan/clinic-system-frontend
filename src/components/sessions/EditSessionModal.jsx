import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getWorks, getWorksForDoctor } from "../../api/workApi";
import { getActiveTreatmentPlan } from "../../api/treatmentPlanApi";
import {
    getNormalSessionDetails,
    updateNormalSession,
    getSessionImages,
    uploadSessionImages,
    deleteSessionImage,
    updatePlanWorkTeeth,
    editSessionPayment,
    deleteSessionPayment,
    editSessionPlanPayment,
    deleteSessionPlanPayment,
    deleteSessionPlanWork,
    moveSessionPlanWork,
    deleteSession,
} from "../../api/sessionApi";
import { useSettings } from "../../context/SettingContext";
import { useAuth } from "../../context/AuthContext";
import TeethDiagram from "./TeethDiagram";
import PrescriptionEditor from "../prescriptions/PrescriptionEditor";
import ConfirmModal from "../common/ConfirmModal";

// stable signature of the prescription so we only send it when it actually changed
const prescSig = (items) =>
    JSON.stringify((items || [])
        .filter((i) => i.drug_name && i.drug_name.trim())
        .map((i) => [i.drug_name.trim(), i.dosage || "", i.frequency || "", i.duration || "", i.instructions || ""]));

const ABBR = { rct: "RCT", re_rct: "RE-RCT", implant: "IMP", ortho: "ORT" };
const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp"];

const metaFrom = (catalog, id) => {
    const item = catalog.find((x) => Number(x.id) === Number(id));
    if (!item) return null;
    return { id: Number(item.id), name: item.name, code: String(item.code || "").toLowerCase(), min_price: Number(item.min_price || 0), is_plan: !!item.is_plan, is_whole_mouth: !!item.is_whole_mouth };
};

// units a work line counts for: whole-mouth = its quantity; per-tooth = its
// quantity (some units may have a tooth, the rest none)
const unitsOf = (c) => Math.max(Number(c.quantity) || 1, c.wholeMouth ? 0 : c.teeth.length);

// normal (non-plan) works -> the works array editNormal expects. Every unit is
// kept: one row per tooth + one row for the units without a tooth, each with its price.
function buildNormalWorks(confirmed) {
    const works = [];
    for (const c of confirmed) {
        if (c.isPlan) continue;
        const unit_price = Number(c.unit_price);
        if (c.wholeMouth) {
            works.push({ work_id: c.work_id, quantity: Number(c.quantity) || 1, tooth_number: null, arch: c.arch ?? null, unit_price });
            continue;
        }
        for (const t of c.teeth) works.push({ work_id: c.work_id, quantity: 1, tooth_number: t, unit_price });
        const noTooth = unitsOf(c) - c.teeth.length;
        if (noTooth > 0) works.push({ work_id: c.work_id, quantity: noTooth, tooth_number: null, unit_price });
    }
    return works;
}
const sigOf = (works) => JSON.stringify(works.map((w) => `${w.work_id}:${w.tooth_number}:${w.quantity}:${w.arch || ''}:${w.unit_price}`).sort());

// stored normal-work rows -> editable lines (same work + price + arch grouped)
function linesFromRows(rows, catalog) {
    const groups = new Map();
    for (const r of rows || []) {
        const key = `${r.work_id}-${r.unit_price}-${r.arch || ""}`;
        if (!groups.has(key)) {
            const meta = metaFrom(catalog, r.work_id);
            groups.set(key, {
                uid: `init-${key}`,
                work_id: Number(r.work_id),
                code: meta?.code || "",
                name: r.work_name || meta?.name || "Work",
                // an old work may keep the price it was saved with, even if the
                // catalog minimum was raised later
                min_price: Math.min(meta ? meta.min_price : Number(r.min_unit_price || 0), Number(r.unit_price)),
                wholeMouth: !!(meta?.is_whole_mouth ?? r.is_whole_mouth),
                isPlan: false,
                quantity: 0,
                teeth: [],
                arch: r.arch ?? null,
                unit_price: Number(r.unit_price),
            });
        }
        const g = groups.get(key);
        g.quantity += Number(r.quantity || 1);
        if (r.tooth_number !== null && r.tooth_number !== undefined) g.teeth.push(Number(r.tooth_number));
    }
    return [...groups.values()];
}

function parseTeeth(s) {
    if (!s) return [];
    return String(s).split(",").map((x) => Number(x.trim())).filter((n) => Number.isFinite(n));
}

// Per-tooth quick-add popup (opened by double-clicking a tooth) — mirrors the
// Complete-Appointment screen: click a normal work → added instantly; click a
// plan work → CONTINUE an existing plan on this tooth (with a Done / not-done
// choice that can mark the plan completed), or enter the agreed total for a new one.
function ToothWorkPopup({ tooth, works, planFor, formatMoney, onConfirm, onClose }) {
    const { t } = useTranslation();
    const [step, setStep] = useState(null);   // { work, existing } when a PLAN work needs a follow-up
    const [amount, setAmount] = useState("");

    const clickWork = (w) => {
        if (!w.is_plan) { onConfirm({ work: w, existingPlan: null, amount: 0 }); return; }
        const existing = planFor(tooth, w.code);
        setStep({ work: w, existing });
        setAmount(existing ? "" : String(w.min_price ?? ""));
    };
    const back = () => { setStep(null); setAmount(""); };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl max-h-[85vh] overflow-y-auto">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{t("appt.tw_title", { tooth })}</h3>
                    <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-200">✕</button>
                </div>

                {!step ? (
                    <>
                        <p className="mb-2 text-[11px] text-slate-500">{t("appt.tw_pick")}</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {works.map((w) => {
                                const hasPlan = w.is_plan && !!planFor(tooth, w.code);
                                return (
                                    <button key={w.id} type="button" onClick={() => clickWork(w)}
                                        className="flex w-full items-center justify-between gap-1 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-[#0E6E75] hover:bg-[#0E6E75]/5">
                                        <span className="min-w-0 truncate font-medium text-slate-800" title={w.name}>{w.name}</span>
                                        <span className="flex shrink-0 items-center gap-1.5 text-[11px]">
                                            {w.is_plan && <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700">{t("appt.tw_plan")}</span>}
                                            {hasPlan && <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">{t("appt.tw_has_plan")}</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                            <span className="text-sm font-semibold text-slate-800">{step.work.name}</span>
                            <button type="button" onClick={back} className="text-[11px] text-[#0E6E75] hover:underline">{t("appt.tw_change")}</button>
                        </div>

                        {step.existing ? (
                            <div className="space-y-3">
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-slate-700">
                                    {t("appt.tw_existing")} · {t("appt.pay_agreed")} <b>{formatMoney(step.existing.agreed_total)}</b> · {t("appt.pay_remaining")} <b>{formatMoney(Number(step.existing.agreed_total) - Number(step.existing.total_paid || 0))}</b>
                                </div>
                                <p className="text-xs font-medium text-slate-700">{t("appt.tw_done_q")}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => onConfirm({ work: step.work, existingPlan: step.existing, markDone: true, amount: 0 })}
                                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{t("appt.tw_done_yes")}</button>
                                    <button type="button" onClick={() => onConfirm({ work: step.work, existingPlan: step.existing, markDone: false, amount: 0 })}
                                        className="rounded-lg bg-[#0E6E75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A565C]">{t("appt.tw_done_no")}</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium text-slate-600">{t("appt.tw_agreed")}</label>
                                <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0E6E75] focus:outline-none" />
                                <button type="button" onClick={() => onConfirm({ work: step.work, existingPlan: null, amount: Number(amount) || 0 })}
                                    className="mt-2 w-full rounded-lg bg-[#0E6E75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A565C]">{t("appt.tw_add")}</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function EditSessionModal({ sessionId, onClose, onUpdated, canEditPayment = true }) {
    const { t } = useTranslation();
    const { formatDate, formatTime, formatMoney } = useSettings();
    const { user } = useAuth();
    const perms = user?.permissions || [];
    const canChangePayments = canEditPayment && perms.includes("edit_payment");
    const canDeleteVisit = canEditPayment && perms.includes("delete_session");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [catalog, setCatalog] = useState([]);            // every treatment (names/prices of saved rows)
    const [allowedIds, setAllowedIds] = useState(null);    // what this visit's doctor may ADD (null = all)
    const [usesTeeth, setUsesTeeth] = useState(true);      // false → specialty without teeth chart
    const [base, setBase] = useState(null);

    const [notes, setNotes] = useState("");
    const [nextPlan, setNextPlan] = useState("");

    // immediate corrections (payments / plan works / delete visit)
    const [busy, setBusy] = useState(false);
    const [changed, setChanged] = useState(false);          // something was saved → parent must refresh
    const [editingPay, setEditingPay] = useState(null);     // { kind: 'normal'|'plan', id, amount, note }
    const [confirmAction, setConfirmAction] = useState(null); // { title, message, run }

    const [confirmed, setConfirmed] = useState([]);          // normal + newly-added plan works
    const [origWorksSig, setOrigWorksSig] = useState("[]");
    const [draft, setDraft] = useState({ work_id: "", quantity: 1, teeth: [], plan_mode: "new", agreed_total: "", arch: null, unit_price: "" });
    const [popupTooth, setPopupTooth] = useState(null); // tooth # for the double-click quick-add popup

    const [planWorks, setPlanWorks] = useState([]);          // existing plan works (tooth only)
    const [plans, setPlans] = useState({ ortho: { list: [] }, implant: { list: [] }, rct: { list: [] }, re_rct: { list: [] } });
    const [completedPlanIds, setCompletedPlanIds] = useState([]); // plans ticked "Done" this edit

    const [existingImages, setExistingImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [newImages, setNewImages] = useState([]);

    const [prescription, setPrescription] = useState([]);
    const [origPrescSig, setOrigPrescSig] = useState("[]");

    useEffect(() => () => newImages.forEach((im) => URL.revokeObjectURL(im.preview)), [newImages]);

    useEffect(() => {
        let alive = true;
        (async () => {
            setIsLoading(true);
            setError("");
            try {
                const [catalogRes, sessionRes, imagesRes] = await Promise.all([
                    getWorks(),
                    getNormalSessionDetails(sessionId),
                    getSessionImages(sessionId).catch(() => ({ data: [] })),
                ]);

                const catalogRaw = catalogRes?.data;
                const catalogRows = Array.isArray(catalogRaw) ? catalogRaw : (catalogRaw?.works || catalogRaw?.data || []);
                const payload = sessionRes?.data || sessionRes;
                const sessionData = payload?.data ? payload.data : payload;
                if (!alive) return;

                setCatalog(catalogRows);
                setBase(sessionData);
                setNotes(sessionData?.session?.plan?.notes ?? "");
                setNextPlan(sessionData?.session?.plan?.next_plan ?? "");

                // every stored unit + its real price (nothing is dropped or re-priced)
                const initialConfirmed = linesFromRows(sessionData?.normal_works, catalogRows);
                setConfirmed(initialConfirmed);
                setOrigWorksSig(sigOf(buildNormalWorks(initialConfirmed)));

                setPlanWorks(
                    (sessionData?.plan_works || []).map((p) => ({ ...p, tooth_number: p.tooth_number ?? "", _origTooth: p.tooth_number ?? "" }))
                );
                setExistingImages(imagesRes?.data || []);

                // what this visit's doctor may add (specialty + extras). If it fails,
                // keep the full list — the server still checks on save.
                const doctorId = sessionData?.session?.doctor?.id;
                if (doctorId) {
                    try {
                        const dRes = await getWorksForDoctor(doctorId);
                        if (alive) {
                            setAllowedIds(new Set((dRes?.data?.works || []).map((w) => Number(w.id))));
                            setUsesTeeth(dRes?.data?.uses_teeth !== false);
                        }
                    } catch { /* keep the full list */ }
                }

                const pItems = sessionData?.session?.prescription?.items || [];
                setPrescription(pItems.map((i) => ({ drug_name: i.drug_name || "", dosage: i.dosage || "", frequency: i.frequency || "", duration: i.duration || "", instructions: i.instructions || "" })));
                setOrigPrescSig(prescSig(pItems));
            } catch (err) {
                if (alive) setError(err.userMessage || t("es.could_not_load"));
            } finally {
                if (alive) setIsLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [sessionId]);

    // After an immediate correction: reload money + plan works from the server.
    // Unsaved work/notes edits in the form are kept.
    const reloadSession = async () => {
        const res = await getNormalSessionDetails(sessionId);
        const payload = res?.data || res;
        const sessionData = payload?.data ? payload.data : payload;
        setBase(sessionData);
        // keep tooth changes the user typed but has not saved yet
        setPlanWorks((prev) => {
            const typed = new Map(prev.filter((p) => String(p.tooth_number) !== String(p._origTooth)).map((p) => [p.session_work_id, p.tooth_number]));
            return (sessionData?.plan_works || []).map((p) => ({
                ...p,
                tooth_number: typed.has(p.session_work_id) ? typed.get(p.session_work_id) : (p.tooth_number ?? ""),
                _origTooth: p.tooth_number ?? "",
            }));
        });
    };

    // run one correction (payment edit/delete, plan work move/delete); success → reload
    const runCorrection = async (fn, okMessage) => {
        setBusy(true);
        try {
            await fn();
            toast.success(okMessage);
            setChanged(true);
            setEditingPay(null);
            setConfirmAction(null);
            await reloadSession();
        } catch (err) {
            toast.error(err.userMessage || t("es.save_failed"));
            setConfirmAction(null);
        } finally {
            setBusy(false);
        }
    };

    // closing after a correction refreshes the list behind the modal
    const closeModal = () => {
        if (isSaving || busy) return;
        if (changed) onUpdated?.();
        onClose();
    };

    // Behavior is data-driven: derive plan / whole-mouth codes from the catalog
    // flags (is_plan / is_whole_mouth) instead of hardcoded treatment codes.
    const planCodes = useMemo(
        () => new Set(catalog.filter((w) => w.is_plan).map((w) => String(w.code || "").toLowerCase())),
        [catalog]
    );
    const wholeMouthCodes = useMemo(
        () => new Set(catalog.filter((w) => w.is_whole_mouth).map((w) => String(w.code || "").toLowerCase())),
        [catalog]
    );
    const treatmentTypes = useMemo(() => [...planCodes], [planCodes]);

    // treatments that can be picked in this visit: the doctor's allowed ones + the
    // ones already saved in this visit (stay editable even if unticked later)
    const pickable = useMemo(() => {
        if (!allowedIds) return catalog;
        const saved = new Set((base?.normal_works || []).map((r) => Number(r.work_id)));
        return catalog.filter((w) => allowedIds.has(Number(w.id)) || saved.has(Number(w.id)));
    }, [catalog, allowedIds, base]);

    // active plans for the patient (to "continue" an existing plan)
    useEffect(() => {
        const pid = Number(base?.session?.patient?.id);
        if (!pid) return;
        treatmentTypes.forEach((type) => {
            getActiveTreatmentPlan(pid, type)
                .then((list) => setPlans((prev) => ({ ...prev, [type]: { list: Array.isArray(list) ? list : [] } })))
                .catch(() => setPlans((prev) => ({ ...prev, [type]: { list: [] } })));
        });
    }, [base, treatmentTypes]);

    const header = base?.session
        ? { patientName: base.session.patient?.full_name, patientPhone: base.session.patient?.phone, doctorName: base.session.doctor?.full_name, apptTime: base.session.appointment?.start_time }
        : {};

    const dMeta = metaFrom(catalog, draft.work_id);
    const dCode = dMeta?.code;
    const dWhole = !!dMeta?.is_whole_mouth;
    const dPlan = !!dMeta?.is_plan;
    const dPerToothPlan = dPlan && !dWhole;

    const canAdd = (() => {
        if (!dMeta) return false;
        if (dPlan && draft.plan_mode === "new") {
            const v = Number(draft.agreed_total);
            return Number.isFinite(v) && v >= dMeta.min_price;
        }
        return true;
    })();

    const selectWork = (value) => {
        const meta = metaFrom(catalog, value);
        const code = meta?.code;
        const isPlan = !!meta?.is_plan;
        let plan_mode = "new";
        let agreed_total = isPlan && meta ? meta.min_price : "";
        if (isPlan) {
            const list = plans[code]?.list || [];
            if (list.length > 0) { plan_mode = String(list[0].id); agreed_total = ""; }
        }
        setDraft({ work_id: value, quantity: 1, teeth: [], plan_mode, agreed_total, arch: null, unit_price: meta ? meta.min_price : "" });
    };
    const setQty = (val) => {
        const q = Math.max(1, Number(val) || 1);
        setDraft((d) => ({ ...d, quantity: q, teeth: d.teeth.slice(0, q) }));
    };
    const setPlanMode = (value) => setDraft((d) => ({ ...d, plan_mode: value, agreed_total: value === "new" ? dMeta?.min_price || "" : "" }));

    const toggleTooth = (n) => {
        if (!dMeta || dWhole) return;
        if (dPerToothPlan) {
            setDraft((d) => (d.teeth.includes(n) ? { ...d, teeth: [] } : { ...d, teeth: [n] }));
            return;
        }
        setDraft((d) => {
            if (d.teeth.includes(n)) return { ...d, teeth: d.teeth.filter((t) => t !== n) };
            if (d.teeth.length >= (Number(d.quantity) || 1)) return d;
            return { ...d, teeth: [...d.teeth, n] };
        });
    };

    const addTreatment = () => {
        if (!canAdd) return;
        setConfirmed((prev) => [
            ...prev,
            {
                uid: `${Date.now()}-${Math.random()}`,
                work_id: Number(draft.work_id),
                code: dMeta.code,
                name: dMeta.name,
                min_price: draft.min_floor ?? dMeta.min_price,
                wholeMouth: dWhole,
                isPlan: dPlan,
                quantity: dWhole || dPlan ? 1 : Number(draft.quantity) || 1,
                teeth: dWhole ? [] : [...draft.teeth],
                plan_mode: dPlan ? draft.plan_mode : null,
                agreed_total: dPlan && draft.plan_mode === "new" ? Number(draft.agreed_total) : null,
                arch: dWhole ? (draft.arch ?? null) : null,
                unit_price: draft.unit_price !== "" && draft.unit_price !== undefined ? Number(draft.unit_price) : dMeta.min_price,
            },
        ]);
        setDraft({ work_id: "", quantity: 1, teeth: [], plan_mode: "new", agreed_total: "", arch: null, unit_price: "" });
    };
    const editTreatment = (uid) => {
        const e = confirmed.find((c) => c.uid === uid);
        if (!e) return;
        setDraft({ work_id: String(e.work_id), quantity: unitsOf(e), teeth: [...e.teeth], plan_mode: e.plan_mode || "new", agreed_total: e.agreed_total ?? (e.isPlan ? e.min_price : ""), arch: e.arch ?? null, unit_price: e.unit_price ?? "", min_floor: e.min_price });
        setConfirmed((prev) => prev.filter((c) => c.uid !== uid));
    };
    const removeTreatment = (uid) => setConfirmed((prev) => prev.filter((c) => c.uid !== uid));
    const setLinePrice = (uid, value) => setConfirmed((prev) => prev.map((c) => (c.uid === uid ? { ...c, unit_price: value } : c)));

    // Double-click quick-add (per tooth), mirroring the Complete-Appointment popup.
    const activePlanForTooth = (tooth, code) =>
        (plans[code]?.list || []).find((p) => parseTeeth(p.teeth).includes(tooth)) || null;

    const addToothWork = ({ work, existingPlan, markDone, amount }) => {
        const isPlan = !!work.is_plan;
        setConfirmed((prev) => [
            ...prev,
            {
                uid: `${Date.now()}-${Math.random()}`,
                work_id: Number(work.id),
                code: work.code, name: work.name, min_price: Number(work.min_price || 0),
                wholeMouth: false, isPlan,
                quantity: 1,
                teeth: [popupTooth],
                plan_mode: isPlan ? (existingPlan ? String(existingPlan.id) : "new") : null,
                agreed_total: isPlan && !existingPlan ? Number(amount) : null,
                unit_price: Number(work.min_price || 0),
            },
        ]);
        // "Done" on an existing plan → mark that plan completed on save.
        if (isPlan && existingPlan && markDone) {
            setCompletedPlanIds((prev) => (prev.includes(existingPlan.id) ? prev : [...prev, existingPlan.id]));
        }
        setPopupTooth(null);
    };

    const setPlanTooth = (sessionWorkId, value) =>
        setPlanWorks((prev) => prev.map((p) => (p.session_work_id === sessionWorkId ? { ...p, tooth_number: value } : p)));

    // Tick / untick a plan as "Done" (marks the treatment plan completed on save).
    const toggleCompleted = (planId) =>
        setCompletedPlanIds((prev) => (prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]));

    const onPickImages = (e) => {
        const picked = Array.from(e.target.files || []);
        e.target.value = "";
        // No cap — keep/add as many case images as needed.
        const valid = picked
            .filter((f) => ALLOWED_IMG.includes(f.type) && f.size <= 10 * 1024 * 1024)
            .map((f) => ({ id: `${Date.now()}-${Math.random()}`, file: f, preview: URL.createObjectURL(f) }));
        if (valid.length < picked.length) toast.error(t("appt.comp_skipped_files"));
        setNewImages((prev) => [...prev, ...valid]);
    };
    const removeNewImage = (id) => setNewImages((prev) => { const t = prev.find((im) => im.id === id); if (t) URL.revokeObjectURL(t.preview); return prev.filter((im) => im.id !== id); });
    const toggleDeleteExisting = (imageId) => setImagesToDelete((prev) => (prev.includes(imageId) ? prev.filter((x) => x !== imageId) : [...prev, imageId]));

    async function handleSave() {
        setError("");

        // a price can never go below the treatment's catalog (minimum) price
        const lowLine = confirmed.find((c) => !c.isPlan && !(Number(c.unit_price) >= Number(c.min_price || 0)));
        if (lowLine) return setError(`${lowLine.name}: ${t("es.price_below_min", { amount: formatMoney(lowLine.min_price || 0) })}`);

        // normal works (for total recalc) + newly added plan works (create/continue)
        const works = buildNormalWorks(confirmed);
        for (const c of confirmed) {
            if (!c.isPlan) continue;
            works.push({
                work_id: c.work_id,
                quantity: 1,
                tooth_number: c.wholeMouth ? null : (c.teeth[0] ?? null),
                treatment_plan_id: c.plan_mode !== "new" ? Number(c.plan_mode) : null,
                agreed_total: c.plan_mode === "new" ? Number(c.agreed_total) : null,
                arch: c.wholeMouth ? (c.arch ?? null) : null,
            });
        }

        const payload = {};
        if (notes !== (base?.session?.plan?.notes ?? "")) payload.notes = notes;
        if (nextPlan !== (base?.session?.plan?.next_plan ?? "")) payload.next_plan = nextPlan;

        // the works list is the FULL new list — it may be empty (last work removed)
        const hasNewPlan = confirmed.some((c) => c.isPlan);
        const normalSig = sigOf(buildNormalWorks(confirmed));
        if (hasNewPlan || normalSig !== origWorksSig) payload.works = works;

        // prescription — only send if it changed (cleaned of empty drug rows)
        if (prescSig(prescription) !== origPrescSig) {
            payload.prescription = prescription.filter((r) => r.drug_name && r.drug_name.trim());
        }

        // plans the doctor ticked "Done" this edit → mark completed
        const doneIds = [...new Set(completedPlanIds.filter(Boolean))];
        if (doneIds.length > 0) payload.completedPlanIds = doneIds;

        const planToothUpdates = planWorks
            .filter((p) => !wholeMouthCodes.has(String(p.plan_type || "").toLowerCase()))
            .filter((p) => String(p.tooth_number) !== String(p._origTooth))
            .map((p) => ({ session_work_id: p.session_work_id, tooth_number: p.tooth_number }));

        const hasSessionChange = Object.keys(payload).length > 0;
        const hasPlanChange = planToothUpdates.length > 0;
        const hasImageChange = imagesToDelete.length > 0 || newImages.length > 0;
        if (!hasSessionChange && !hasPlanChange && !hasImageChange) return closeModal();

        setIsSaving(true);
        let sessionSaved = false;
        try {
            if (hasSessionChange) await updateNormalSession(sessionId, payload);
            sessionSaved = true;
            if (hasPlanChange) await updatePlanWorkTeeth(sessionId, planToothUpdates);
            for (const imageId of imagesToDelete) await deleteSessionImage(sessionId, imageId);
            if (newImages.length > 0) await uploadSessionImages(sessionId, newImages.map((im) => im.file));
            onUpdated?.();
            onClose();
        } catch (err) {
            // the works are already saved: close, so a second Save can't add them
            // (or create a new plan) twice — the user reopens to retry the rest
            if (sessionSaved && hasSessionChange) {
                toast.error(t("es.saved_but_rest_failed"), { duration: 7000 });
                onUpdated?.();
                onClose();
            } else {
                toast.error(err.userMessage || t("es.save_failed"));
                setChanged(true);
            }
        } finally {
            setIsSaving(false);
        }
    }

    // ── immediate corrections ───────────────────────────────────────────────
    const savePayment = () => {
        const amount = Number(editingPay.amount);
        if (!Number.isFinite(amount) || amount <= 0) return toast.error(t("es.paid_invalid"));
        const body = { amount, note: editingPay.note || null };
        runCorrection(
            () => (editingPay.kind === "plan"
                ? editSessionPlanPayment(sessionId, editingPay.id, body)
                : editSessionPayment(sessionId, editingPay.id, body)),
            t("es.payment_saved")
        );
    };

    const askDeletePayment = (kind, p) => setConfirmAction({
        title: t("es.confirm_delete_payment_title"),
        message: t("es.confirm_delete_payment", { amount: formatMoney(p.amount, p.currency_code) }),
        run: () => runCorrection(
            () => (kind === "plan" ? deleteSessionPlanPayment(sessionId, p.id) : deleteSessionPayment(sessionId, p.id)),
            t("es.payment_deleted")
        ),
    });

    const askDeletePlanWork = (p) => setConfirmAction({
        title: t("es.confirm_delete_plan_work_title"),
        message: t("es.confirm_delete_plan_work", { name: p.work_name }),
        run: () => runCorrection(() => deleteSessionPlanWork(sessionId, p.session_work_id), t("es.plan_work_deleted")),
    });

    const movePlanWork = (p, toPlanId) => {
        if (!toPlanId) return;
        runCorrection(() => moveSessionPlanWork(sessionId, p.session_work_id, Number(toPlanId)), t("es.moved"));
    };

    const askDeleteVisit = () => {
        const works = (base?.normal_works?.length || 0) + (base?.plan_works?.length || 0);
        const money = [...(base?.payments || []), ...(base?.plan_payments || [])].reduce((s, p) => s + Number(p.amount || 0), 0);
        setConfirmAction({
            title: t("es.delete_visit_title"),
            message: t("es.delete_visit_confirm", { works, money: formatMoney(money, base?.session?.currency_code) }),
            run: async () => {
                setBusy(true);
                try {
                    await deleteSession(sessionId);
                    toast.success(t("es.visit_deleted"));
                    onUpdated?.();
                    onClose();
                } catch (err) {
                    toast.error(err.userMessage || t("es.save_failed"));
                    setConfirmAction(null);
                } finally {
                    setBusy(false);
                }
            },
        });
    };

    // chart highlights — mark teeth from the patient's ACTIVE plans (so existing
    // implants/RCTs show on the chart even when they aren't part of THIS session),
    // plus this session's own plan works. Mirrors the Complete-Appointment chart.
    const planTypeByTooth = useMemo(() => {
        const m = {};
        treatmentTypes.forEach((type) => (plans[type]?.list || []).forEach((p) => parseTeeth(p.teeth).forEach((n) => { m[n] = type; })));
        planWorks.forEach((p) => { const n = Number(p.tooth_number); if (Number.isFinite(n)) m[n] = String(p.plan_type || m[n] || "").toLowerCase(); });
        return m;
    }, [plans, treatmentTypes, planWorks]);
    const planTeeth = Object.keys(planTypeByTooth).map(Number).filter(Number.isFinite);
    const planLabels = {};
    Object.entries(planTypeByTooth).forEach(([n, type]) => { planLabels[n] = ABBR[type] || String(type || "").toUpperCase(); });

    // teeth that already have a work added THIS edit → shown green on the chart
    const confirmedTeeth = useMemo(() => {
        const s = new Set();
        for (const c of confirmed) if (!c.wholeMouth) for (const n of c.teeth) s.add(Number(n));
        return [...s];
    }, [confirmed]);

    // live session total = normal works × the price charged (plan works excluded)
    const liveTotal = confirmed.reduce((sum, c) => (c.isPlan ? sum : sum + (Number(c.unit_price) || 0) * unitsOf(c)), 0);
    const totals = base?.session?.totals || {};
    const sessCurr = base?.session?.currency_code;
    const livePaid = Number(totals.total_paid || 0);
    const liveRemaining = Math.max(0, liveTotal - livePaid - Number(totals.discount_amount || 0));

    const existingForType = dPlan ? plans[dCode]?.list || [] : [];
    const inputCls = "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-[#0E6E75] focus:outline-none focus:ring-1 focus:ring-[#0E6E75]";

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="flex max-h-[96vh] w-full max-w-7xl flex-col rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-4 sm:px-5 py-3 shrink-0">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">{t("es.title")}</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            {header.patientName} · {header.patientPhone} · {header.doctorName}
                            {header.apptTime ? ` · ${formatDate(header.apptTime)} ${formatTime(header.apptTime)}` : ""}
                        </p>
                    </div>
                    <button type="button" onClick={closeModal} disabled={isSaving || busy} className="text-slate-400 hover:text-slate-600 disabled:opacity-40">✕</button>
                </div>

                {error && <div className="mx-4 sm:mx-5 mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 shrink-0">{error}</div>}

                {isLoading ? (
                    <div className="p-6 text-sm text-slate-500">{t("appt.loading_short")}</div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                      <div className={`grid gap-3 lg:items-start ${usesTeeth ? "lg:grid-cols-[minmax(300px,0.85fr),2fr]" : ""}`}>
                        {/* LEFT */}
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <textarea value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder={t("appt.comp_next_plan_ph")} />
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder={t("appt.comp_notes_ph")} />
                            </div>

                            {/* Choose treatment */}
                            <div className="rounded-xl border border-[#0E6E75]/30 bg-[#0E6E75]/5 p-3">
                                <p className="mb-1.5 text-[11px] font-semibold text-[#0E6E75]">{t("appt.comp_step1")}</p>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <select value={draft.work_id} onChange={(e) => selectWork(e.target.value)} className={inputCls}>
                                            <option value="">{t("appt.comp_select_treatment")}</option>
                                            {pickable.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                    {dMeta && !dWhole && !dPerToothPlan && (
                                        <input type="number" min="1" value={draft.quantity} onChange={(e) => setQty(e.target.value)} title={t("appt.comp_qty_title")} className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                                    )}
                                    <button type="button" onClick={addTreatment} disabled={!canAdd} className="rounded-md bg-[#0E6E75] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0A565C] disabled:opacity-40">{t("appt.comp_add")}</button>
                                </div>
                                {dWhole && !dPlan && <p className="mt-1.5 text-[11px] text-slate-500">{t("appt.comp_whole_overlay", { name: dMeta?.name })}</p>}

                                {/* Plan: New / Continue + agreement total */}
                                {dPlan && (
                                    <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs">
                                        <select value={draft.plan_mode} onChange={(e) => setPlanMode(e.target.value)} className={`${inputCls} mb-2`}>
                                            {existingForType.map((p) => {
                                                const rem = Number(p.agreed_total) - Number(p.total_paid || 0);
                                                return <option key={p.id} value={String(p.id)}>{t("appt.comp_continue_opt", { where: p.teeth ? t("appt.comp_tooth_label", { teeth: p.teeth }) : t("appt.comp_no_tooth"), amount: formatMoney(rem) })}</option>;
                                            })}
                                            <option value="new">{t("appt.comp_new_plan_opt", { code: dCode.toUpperCase() })}</option>
                                        </select>
                                        {draft.plan_mode === "new" ? (
                                            <div>
                                                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">{t("appt.comp_new_agreement", { code: dCode.toUpperCase() })}</label>
                                                <input type="number" min={dMeta?.min_price || 0} step="0.01" value={draft.agreed_total} onChange={(e) => setDraft((d) => ({ ...d, agreed_total: e.target.value }))} className={inputCls} placeholder={t("appt.comp_min", { amount: formatMoney(dMeta?.min_price || 0) })} />
                                            </div>
                                        ) : (
                                            <p className="text-slate-700">{t("appt.comp_continuing")} <b className="uppercase">{dCode}</b>{dWhole ? "" : draft.teeth[0] ? ` · ${t("appt.comp_tooth_label", { teeth: draft.teeth[0] })}` : ` · ${t("es.pick_a_tooth")}`} {t("appt.comp_no_new_agreement")}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Saved treatments */}
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                                <p className="mb-1.5 text-[11px] font-semibold text-emerald-700">{t("appt.comp_saved", { count: confirmed.length })}</p>
                                {confirmed.length === 0 ? (
                                    <p className="text-[11px] text-slate-500">{t("es.saved_hint")}</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {confirmed.map((c) => {
                                            const units = unitsOf(c);
                                            const extraNoTooth = !c.wholeMouth && c.teeth.length > 0 && units > c.teeth.length;
                                            const lowPrice = !c.isPlan && !(Number(c.unit_price) >= Number(c.min_price || 0));
                                            return (
                                                <span key={c.uid} className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                                                    <span className="font-semibold">{c.name}</span>
                                                    <span className="text-slate-500">· {c.wholeMouth ? `${t("appt.arch_" + (c.arch || "whole"))}${units > 1 ? ` ×${units}` : ""}` : c.teeth.length ? `${t("appt.comp_tooth_label", { teeth: c.teeth.join(", ") })}${extraNoTooth ? ` + ${t("es.qty_no_tooth", { quantity: units - c.teeth.length })}` : ""}` : t("es.qty_no_tooth", { quantity: units })}</span>
                                                    {c.isPlan && <span className="text-rose-500">{c.plan_mode === "new" ? t("es.new_chip", { amount: formatMoney(Number(c.agreed_total)) }) : t("appt.comp_continue_chip")}</span>}
                                                    {!c.isPlan && (
                                                        <label className="flex items-center gap-1 text-[11px] text-slate-500" title={t("es.price_below_min", { amount: formatMoney(c.min_price || 0) })}>
                                                            {t("es.price")}
                                                            <input type="number" min={c.min_price || 0} step="any" value={c.unit_price} disabled={isSaving}
                                                                onChange={(e) => setLinePrice(c.uid, e.target.value)}
                                                                className={`w-24 rounded-md border px-1.5 py-0.5 text-xs focus:outline-none ${lowPrice ? "border-red-400 bg-red-50 text-red-700" : "border-slate-200 focus:border-[#0E6E75]"}`} />
                                                        </label>
                                                    )}
                                                    <button type="button" onClick={() => editTreatment(c.uid)} title={t("common.edit")} className="ms-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-[#0E6E75]">✎</button>
                                                    <button type="button" onClick={() => removeTreatment(c.uid)} title={t("common.delete")} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">✕</button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Existing plans of the selected type — tick "Done" to complete one */}
                            {dPlan && existingForType.length > 0 && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="mb-1.5 text-[11px] font-semibold text-slate-700">{t("appt.comp_existing", { code: dCode.toUpperCase() })}</p>
                                    <div className="max-h-28 space-y-1.5 overflow-y-auto">
                                        {existingForType.map((p) => {
                                            const rem = Number(p.agreed_total) - Number(p.total_paid || 0);
                                            return (
                                                <label key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px]">
                                                    <span>{p.teeth ? t("appt.comp_tooth_label", { teeth: p.teeth }) : t("appt.comp_tooth_not_set")} · {t("appt.comp_remaining", { amount: formatMoney(rem) })}</span>
                                                    <span className="flex shrink-0 items-center gap-1 font-medium text-slate-600">
                                                        {t("es.mark_done")}
                                                        <input type="checkbox" checked={completedPlanIds.includes(p.id)} onChange={() => toggleCompleted(p.id)} disabled={isSaving} />
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Money — hidden for doctors (works + images only, no money) */}
                            {canEditPayment && (
                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-[11px] font-semibold text-slate-700">{t("es.money_title")}</p>
                                        {totals.is_settled && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{t("es.settled")}</span>}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-lg bg-slate-50 p-2">
                                            <p className="text-[10px] text-slate-500">{t("es.total")}</p>
                                            <p className="text-sm font-semibold text-slate-900">{formatMoney(liveTotal, sessCurr)}</p>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 p-2">
                                            <p className="text-[10px] text-slate-500">{t("es.paid")}</p>
                                            <p className="text-sm font-semibold text-slate-900">{formatMoney(livePaid, sessCurr)}</p>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 p-2">
                                            <p className="text-[10px] text-slate-500">{t("es.remaining")}</p>
                                            <p className="text-sm font-semibold text-amber-700">{formatMoney(totals.is_settled ? 0 : liveRemaining, sessCurr)}</p>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-[10px] text-slate-400">{t("es.session_total_hint")}</p>

                                    {[
                                        { kind: "normal", title: t("es.payments_title"), rows: base?.payments || [] },
                                        { kind: "plan", title: t("es.plan_payments_title"), rows: base?.plan_payments || [] },
                                    ].filter((g) => g.kind === "normal" || g.rows.length > 0).map((g) => (
                                        <div key={g.kind} className="mt-3">
                                            <p className="mb-1 text-[11px] font-semibold text-slate-700">{g.title}</p>
                                            {g.rows.length === 0 ? (
                                                <p className="text-[11px] text-slate-400">{t("es.no_payments")}</p>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {g.rows.map((p) => {
                                                        const editing = editingPay && editingPay.kind === g.kind && editingPay.id === p.id;
                                                        return (
                                                            <div key={p.id} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px]">
                                                                {editing ? (
                                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                                        <input type="number" min="1" step="any" value={editingPay.amount} autoFocus disabled={busy}
                                                                            onChange={(e) => setEditingPay((x) => ({ ...x, amount: e.target.value }))}
                                                                            className="w-28 rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-[#0E6E75] focus:outline-none" />
                                                                        <input type="text" value={editingPay.note} placeholder={t("es.payment_note_ph")} disabled={busy}
                                                                            onChange={(e) => setEditingPay((x) => ({ ...x, note: e.target.value }))}
                                                                            className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-[#0E6E75] focus:outline-none" />
                                                                        <button type="button" onClick={savePayment} disabled={busy} className="rounded-md bg-[#0E6E75] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#0A565C] disabled:opacity-50">{t("common.save")}</button>
                                                                        <button type="button" onClick={() => setEditingPay(null)} disabled={busy} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-white">{t("common.cancel")}</button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="min-w-0 flex-1">
                                                                            <span className="font-semibold text-slate-800">{formatMoney(p.amount, p.currency_code)}</span>
                                                                            {g.kind === "plan" && <span className="ms-1.5 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-purple-700">{p.plan_type}</span>}
                                                                            <span className="ms-1.5 text-slate-500">{formatDate(p.created_at)}</span>
                                                                            {p.created_by_name && <span className="ms-1.5 text-slate-400">{t("es.by", { name: p.created_by_name })}</span>}
                                                                            {p.note && <p className="truncate text-slate-500">{p.note}</p>}
                                                                        </div>
                                                                        {canChangePayments && (
                                                                            <>
                                                                                <button type="button" title={t("common.edit")} disabled={busy}
                                                                                    onClick={() => setEditingPay({ kind: g.kind, id: p.id, amount: String(p.amount), note: p.note || "" })}
                                                                                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-[#0E6E75] disabled:opacity-40">✎</button>
                                                                                <button type="button" title={t("common.delete")} disabled={busy}
                                                                                    onClick={() => askDeletePayment(g.kind, p)}
                                                                                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40">✕</button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {canChangePayments && <p className="mt-2 text-[10px] text-slate-400">{t("es.payments_hint")}</p>}
                                </div>
                            )}

                            {/* Existing plan works (tooth only) */}
                            {planWorks.length > 0 && (
                                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3">
                                    <p className="text-[11px] font-semibold text-slate-800">{t("es.plan_works_title")}</p>
                                    <p className="text-[11px] text-slate-500">{t("es.plan_works_hint")}</p>
                                    <div className="mt-2 space-y-2">
                                        {planWorks.map((p) => {
                                            const type = String(p.plan_type || "").toLowerCase();
                                            const wholeMouthPlan = wholeMouthCodes.has(type);
                                            const moveTargets = (plans[type]?.list || []).filter((pl) => Number(pl.id) !== Number(p.treatment_plan_id));
                                            return (
                                                <div key={p.session_work_id} className="flex flex-wrap items-center gap-2 rounded-lg border border-purple-100 bg-white p-2">
                                                    <span className="flex-1 truncate text-sm font-medium text-slate-800">{p.work_name}</span>
                                                    {p.plan_type && <span className="rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-medium uppercase text-purple-700">{p.plan_type}</span>}
                                                    {wholeMouthPlan ? (
                                                        <span className="text-[11px] text-slate-500">{t("es.whole_no_tooth")}</span>
                                                    ) : (
                                                        <input type="number" min={11} max={85} value={p.tooth_number} onChange={(e) => setPlanTooth(p.session_work_id, e.target.value)} disabled={isSaving} placeholder={t("es.tooth_ph")} className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-[#0E6E75] focus:outline-none focus:ring-1 focus:ring-[#0E6E75]" />
                                                    )}
                                                    {p.is_completed ? (
                                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{t("es.plan_completed")}</span>
                                                    ) : p.treatment_plan_id ? (
                                                        <label className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-slate-600" title={t("es.mark_done_hint")}>
                                                            <input type="checkbox" checked={completedPlanIds.includes(p.treatment_plan_id)} onChange={() => toggleCompleted(p.treatment_plan_id)} disabled={isSaving} />
                                                            {t("es.mark_done")}
                                                        </label>
                                                    ) : null}
                                                    {moveTargets.length > 0 && (
                                                        <select value="" disabled={isSaving || busy} onChange={(e) => movePlanWork(p, e.target.value)}
                                                            className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-600 focus:border-[#0E6E75] focus:outline-none">
                                                            <option value="">{t("es.move_to_plan")}</option>
                                                            {moveTargets.map((pl) => (
                                                                <option key={pl.id} value={pl.id}>
                                                                    {`${type.toUpperCase()} · ${pl.teeth ? t("appt.comp_tooth_label", { teeth: pl.teeth }) : t("appt.comp_no_tooth")} · ${t("appt.comp_remaining", { amount: formatMoney(Number(pl.agreed_total) - Number(pl.total_paid || 0)) })}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <button type="button" title={t("common.delete")} disabled={isSaving || busy} onClick={() => askDeletePlanWork(p)}
                                                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40">✕</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Prescription */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <PrescriptionEditor items={prescription} onChange={setPrescription} patientName={header.patientName} />
                            </div>
                        </div>

                        {/* RIGHT: tooth chart — only for specialties that use teeth */}
                        {usesTeeth && (
                        <div className="flex flex-col rounded-xl border border-[#0E6E75]/20 bg-[#0E6E75]/5 p-3 sm:p-4 lg:min-h-[420px]">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-semibold text-[#0E6E75] dark:text-sky-300">{t("appt.comp_step2")}</p>
                                {dMeta && !dWhole && (<span className="text-xs text-slate-500">{draft.teeth.length ? t("appt.comp_tooth_label", { teeth: draft.teeth.join(", ") }) : t("appt.comp_tooth_optional")}</span>)}
                            </div>
                            <div className="relative flex flex-1 items-center justify-center">
                                <div className={`w-full transition-opacity ${dWhole ? "opacity-40 pointer-events-none" : !draft.work_id ? "opacity-70" : ""}`}>
                                    <TeethDiagram age={base?.session?.patient?.age} selected={draft.teeth} done={confirmedTeeth} marked={planTeeth} labels={planLabels} onToothClick={toggleTooth} onToothDoubleClick={(n) => setPopupTooth(n)} disabled={isSaving || dWhole || !draft.work_id} />
                                </div>
                                {dWhole && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                        <span className="rounded-md bg-white/85 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">{t("appt.comp_whole_overlay", { name: dMeta?.name })}</span>
                                        <div className="flex gap-2">
                                            {[{ v: null, l: t("appt.arch_whole") }, { v: "upper", l: t("appt.arch_upper") }, { v: "lower", l: t("appt.arch_lower") }].map((o) => (
                                                <button key={String(o.v)} type="button" onClick={() => setDraft((d) => ({ ...d, arch: o.v }))}
                                                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${(draft.arch ?? null) === o.v ? "border-[#0E6E75] bg-[#0E6E75] text-white" : "border-slate-300 bg-white text-slate-600 hover:border-[#0E6E75]"}`}>{o.l}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="mt-2 text-center text-[11px] text-slate-400">{t("es.chart_hint")}</p>
                        </div>
                        )}
                      </div>

                      {/* Case images — full width at the bottom, responsive grid (like the add flow) */}
                      <div className="rounded-xl border border-[#0E6E75]/30 bg-[#0E6E75]/5 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-[#0E6E75]">{t("es.case_images")}</p>
                          <label className="cursor-pointer rounded-md border border-[#0E6E75]/40 bg-white px-2.5 py-1 text-[11px] font-medium text-[#0E6E75] hover:bg-[#0E6E75]/10">
                            {t("appt.comp_add_images")}
                            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onPickImages} disabled={isSaving} />
                          </label>
                        </div>
                        {existingImages.length === 0 && newImages.length === 0 ? (
                          <p className="text-[11px] text-slate-500">{t("es.images_hint")}</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                            {existingImages.map((img) => {
                              const marked = imagesToDelete.includes(img.id);
                              return (
                                <div key={img.id} className={`relative aspect-square overflow-hidden rounded-md border ${marked ? "border-red-300 opacity-40" : "border-slate-200"}`}>
                                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                                  <button type="button" onClick={() => toggleDeleteExisting(img.id)} disabled={isSaving} className="absolute right-0 top-0 rounded-bl-md bg-black/55 px-1 text-[11px] leading-tight text-white hover:bg-red-600">{marked ? "↺" : "✕"}</button>
                                </div>
                              );
                            })}
                            {newImages.map((im) => (
                              <div key={im.id} className="relative aspect-square overflow-hidden rounded-md border border-emerald-300">
                                <img src={im.preview} alt="" className="h-full w-full object-cover" />
                                <span className="absolute left-0 bottom-0 bg-emerald-600 px-1 text-[9px] leading-tight text-white">{t("es.new_badge")}</span>
                                <button type="button" onClick={() => removeNewImage(im.id)} disabled={isSaving} className="absolute right-0 top-0 rounded-bl-md bg-black/55 px-1 text-[11px] leading-tight text-white hover:bg-red-600">✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                )}

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-4 sm:px-5 py-3">
                    {canDeleteVisit && !isLoading && (
                        <button type="button" onClick={askDeleteVisit} disabled={isSaving || busy}
                            className="me-auto rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">{t("es.delete_visit")}</button>
                    )}
                    <button type="button" onClick={closeModal} disabled={isSaving || busy} className="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">{t("common.cancel")}</button>
                    <button type="button" onClick={handleSave} disabled={isSaving || isLoading || busy} className="rounded-md bg-[#0E6E75] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#0A565C] disabled:opacity-50">{isSaving ? t("es.saving") : t("es.save_changes")}</button>
                </div>
            </div>

            {confirmAction && (
                <ConfirmModal
                    title={confirmAction.title}
                    message={confirmAction.message}
                    confirmLabel={t("common.delete")}
                    cancelLabel={t("common.cancel")}
                    onConfirm={confirmAction.run}
                    onClose={() => !busy && setConfirmAction(null)}
                    loading={busy}
                    danger
                />
            )}

            {popupTooth != null && (
                <ToothWorkPopup
                    tooth={popupTooth}
                    works={pickable.filter((w) => !w.is_whole_mouth).map((w) => ({ ...w, code: String(w.code || "").toLowerCase() }))}
                    planFor={activePlanForTooth}
                    formatMoney={formatMoney}
                    onConfirm={addToothWork}
                    onClose={() => setPopupTooth(null)}
                />
            )}
        </div>
    );
}

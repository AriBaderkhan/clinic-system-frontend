import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getWorks } from "../../api/workApi";
import { getActiveTreatmentPlan } from "../../api/treatmentPlanApi";
import {
    getNormalSessionDetails,
    updateNormalSession,
    getSessionImages,
    uploadSessionImages,
    deleteSessionImage,
    updatePlanWorkTeeth,
} from "../../api/sessionApi";
import { useSettings } from "../../context/SettingContext";
import TeethDiagram from "./TeethDiagram";

const TREATMENT_TYPES = ["ortho", "implant", "rct", "re_rct"];
const PLAN_CODES = new Set(TREATMENT_TYPES);
const WHOLE_MOUTH_CODES = new Set(["scaling_polish", "ortho", "laser"]);
const ABBR = { rct: "RCT", re_rct: "RE-RCT", implant: "IMP", ortho: "ORT" };
const MAX_IMAGES = 12;
const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp"];

const metaFrom = (catalog, id) => {
    const item = catalog.find((x) => Number(x.id) === Number(id));
    if (!item) return null;
    return { id: Number(item.id), name: item.name, code: String(item.code || "").toLowerCase(), min_price: Number(item.min_price || 0) };
};

// normal (non-plan) works -> the works array editNormal expects
function buildNormalWorks(confirmed) {
    const works = [];
    for (const c of confirmed) {
        if (c.isPlan) continue;
        if (c.wholeMouth) works.push({ work_id: c.work_id, quantity: 1, tooth_number: null });
        else if (c.teeth.length > 0) for (const t of c.teeth) works.push({ work_id: c.work_id, quantity: 1, tooth_number: t });
        else works.push({ work_id: c.work_id, quantity: c.quantity || 1, tooth_number: null });
    }
    return works;
}
const sigOf = (works) => JSON.stringify(works.map((w) => `${w.work_id}:${w.tooth_number}:${w.quantity}`).sort());

export default function EditSessionModal({ sessionId, onClose, onUpdated, canEditPayment = true }) {
    const { formatDate, formatTime, formatMoney, settings } = useSettings();
    const curr = settings?.currency_code || "";

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [catalog, setCatalog] = useState([]);
    const [base, setBase] = useState(null);

    const [notes, setNotes] = useState("");
    const [nextPlan, setNextPlan] = useState("");
    const [totalPaid, setTotalPaid] = useState("");

    const [confirmed, setConfirmed] = useState([]);          // normal + newly-added plan works
    const [origWorksSig, setOrigWorksSig] = useState("[]");
    const [draft, setDraft] = useState({ work_id: "", quantity: 1, teeth: [], plan_mode: "new", agreed_total: "" });

    const [planWorks, setPlanWorks] = useState([]);          // existing plan works (tooth only)
    const [plans, setPlans] = useState({ ortho: { list: [] }, implant: { list: [] }, rct: { list: [] }, re_rct: { list: [] } });

    const [existingImages, setExistingImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [newImages, setNewImages] = useState([]);

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
                const paid0 = sessionData?.session?.totals?.total_paid;
                setTotalPaid(paid0 === null || paid0 === undefined ? "" : Number(paid0));

                const initialConfirmed = (sessionData?.works_summary?.works || []).map((g, i) => {
                    const meta = metaFrom(catalogRows, g.work_id);
                    const code = meta?.code || "";
                    return {
                        uid: `init-${i}-${g.work_id}`,
                        work_id: Number(g.work_id),
                        code,
                        name: g.work_name || meta?.name || "Work",
                        wholeMouth: WHOLE_MOUTH_CODES.has(code),
                        isPlan: false,
                        quantity: Number(g.quantity || 1),
                        teeth: Array.isArray(g.teeth) ? g.teeth.map(Number).filter(Number.isFinite) : [],
                    };
                });
                setConfirmed(initialConfirmed);
                setOrigWorksSig(sigOf(buildNormalWorks(initialConfirmed)));

                setPlanWorks(
                    (sessionData?.plan_works || []).map((p) => ({ ...p, tooth_number: p.tooth_number ?? "", _origTooth: p.tooth_number ?? "" }))
                );
                setExistingImages(imagesRes?.data || []);
            } catch (err) {
                if (alive) setError(err.userMessage || "Could not load session.");
            } finally {
                if (alive) setIsLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [sessionId]);

    // active plans for the patient (to "continue" an existing plan)
    useEffect(() => {
        const pid = Number(base?.session?.patient?.id);
        if (!pid) return;
        TREATMENT_TYPES.forEach((type) => {
            getActiveTreatmentPlan(pid, type)
                .then((list) => setPlans((prev) => ({ ...prev, [type]: { list: Array.isArray(list) ? list : [] } })))
                .catch(() => setPlans((prev) => ({ ...prev, [type]: { list: [] } })));
        });
    }, [base]);

    const header = base?.session
        ? { patientName: base.session.patient?.full_name, patientPhone: base.session.patient?.phone, doctorName: base.session.doctor?.full_name, apptTime: base.session.appointment?.start_time }
        : {};

    const dMeta = metaFrom(catalog, draft.work_id);
    const dCode = dMeta?.code;
    const dWhole = !!dCode && WHOLE_MOUTH_CODES.has(dCode);
    const dPlan = !!dCode && PLAN_CODES.has(dCode);
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
        const isPlan = !!code && PLAN_CODES.has(code);
        let plan_mode = "new";
        let agreed_total = isPlan && meta ? meta.min_price : "";
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
                min_price: dMeta.min_price,
                wholeMouth: dWhole,
                isPlan: dPlan,
                quantity: dWhole || dPlan ? 1 : Number(draft.quantity) || 1,
                teeth: dWhole ? [] : [...draft.teeth],
                plan_mode: dPlan ? draft.plan_mode : null,
                agreed_total: dPlan && draft.plan_mode === "new" ? Number(draft.agreed_total) : null,
            },
        ]);
        setDraft({ work_id: "", quantity: 1, teeth: [], plan_mode: "new", agreed_total: "" });
    };
    const editTreatment = (uid) => {
        const e = confirmed.find((c) => c.uid === uid);
        if (!e) return;
        setDraft({ work_id: String(e.work_id), quantity: e.wholeMouth ? 1 : e.teeth.length || e.quantity || 1, teeth: [...e.teeth], plan_mode: e.plan_mode || "new", agreed_total: e.agreed_total ?? (e.isPlan ? e.min_price : "") });
        setConfirmed((prev) => prev.filter((c) => c.uid !== uid));
    };
    const removeTreatment = (uid) => setConfirmed((prev) => prev.filter((c) => c.uid !== uid));

    const setPlanTooth = (sessionWorkId, value) =>
        setPlanWorks((prev) => prev.map((p) => (p.session_work_id === sessionWorkId ? { ...p, tooth_number: value } : p)));

    const onPickImages = (e) => {
        const picked = Array.from(e.target.files || []);
        e.target.value = "";
        const room = MAX_IMAGES - (existingImages.length - imagesToDelete.length + newImages.length);
        if (room <= 0) return toast.error(`You can keep up to ${MAX_IMAGES} images.`);
        const valid = picked
            .filter((f) => ALLOWED_IMG.includes(f.type) && f.size <= 10 * 1024 * 1024)
            .slice(0, room)
            .map((f) => ({ id: `${Date.now()}-${Math.random()}`, file: f, preview: URL.createObjectURL(f) }));
        if (valid.length < picked.length) toast.error("Some files were skipped (only JPG/PNG/WEBP up to 10MB).");
        setNewImages((prev) => [...prev, ...valid]);
    };
    const removeNewImage = (id) => setNewImages((prev) => { const t = prev.find((im) => im.id === id); if (t) URL.revokeObjectURL(t.preview); return prev.filter((im) => im.id !== id); });
    const toggleDeleteExisting = (imageId) => setImagesToDelete((prev) => (prev.includes(imageId) ? prev.filter((x) => x !== imageId) : [...prev, imageId]));

    async function handleSave() {
        setError("");

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
            });
        }

        const payload = {};
        if (notes !== (base?.session?.plan?.notes ?? "")) payload.notes = notes;
        if (nextPlan !== (base?.session?.plan?.next_plan ?? "")) payload.next_plan = nextPlan;

        const hasNewPlan = confirmed.some((c) => c.isPlan);
        const normalSig = sigOf(buildNormalWorks(confirmed));
        if (works.length > 0 && (hasNewPlan || normalSig !== origWorksSig)) payload.works = works;

        const oldPaid = Number(base?.session?.totals?.total_paid || 0);
        if (canEditPayment && totalPaid !== "" && Number(totalPaid) !== oldPaid) {
            const v = Number(totalPaid);
            if (!Number.isFinite(v) || v < 0) return setError("Total paid must be a number ≥ 0");
            payload.total_paid = v;
        }

        const planToothUpdates = planWorks
            .filter((p) => !WHOLE_MOUTH_CODES.has(String(p.plan_type || "").toLowerCase()))
            .filter((p) => String(p.tooth_number) !== String(p._origTooth))
            .map((p) => ({ session_work_id: p.session_work_id, tooth_number: p.tooth_number }));

        const hasSessionChange = Object.keys(payload).length > 0;
        const hasPlanChange = planToothUpdates.length > 0;
        const hasImageChange = imagesToDelete.length > 0 || newImages.length > 0;
        if (!hasSessionChange && !hasPlanChange && !hasImageChange) return onClose();

        setIsSaving(true);
        try {
            if (hasSessionChange) await updateNormalSession(sessionId, payload);
            if (hasPlanChange) await updatePlanWorkTeeth(sessionId, planToothUpdates);
            for (const imageId of imagesToDelete) await deleteSessionImage(sessionId, imageId);
            if (newImages.length > 0) await uploadSessionImages(sessionId, newImages.map((im) => im.file));
            onUpdated?.();
            onClose();
        } catch (err) {
            toast.error(err.userMessage || "Failed to save session.");
        } finally {
            setIsSaving(false);
        }
    }

    // chart highlights
    const planTeeth = planWorks.map((p) => Number(p.tooth_number)).filter(Number.isFinite);
    const planLabels = {};
    planWorks.forEach((p) => { const t = Number(p.tooth_number); if (Number.isFinite(t)) planLabels[t] = ABBR[p.plan_type] || String(p.plan_type || "").toUpperCase(); });

    // live session total = normal works × catalog price (plan works excluded)
    const unitsOf = (c) => (c.wholeMouth ? 1 : c.teeth.length > 0 ? c.teeth.length : Number(c.quantity) || 1);
    const liveTotal = confirmed.reduce((sum, c) => {
        if (c.isPlan) return sum;
        const meta = metaFrom(catalog, c.work_id);
        return meta ? sum + meta.min_price * unitsOf(c) : sum;
    }, 0);

    const existingForType = dPlan ? plans[dCode]?.list || [] : [];
    const inputCls = "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]";

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="flex max-h-[96vh] w-full max-w-7xl flex-col rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-4 sm:px-5 py-3 shrink-0">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">Edit session</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            {header.patientName} · {header.patientPhone} · {header.doctorName}
                            {header.apptTime ? ` · ${formatDate(header.apptTime)} ${formatTime(header.apptTime)}` : ""}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                {error && <div className="mx-4 sm:mx-5 mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 shrink-0">{error}</div>}

                {isLoading ? (
                    <div className="p-6 text-sm text-slate-500">Loading…</div>
                ) : (
                    <div className="grid min-h-0 flex-1 gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(300px,0.85fr),2fr]">
                        {/* LEFT */}
                        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <textarea value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Next plan (optional)…" />
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Notes (optional)…" />
                            </div>

                            {/* Choose treatment */}
                            <div className="rounded-xl border border-[#015478]/30 bg-[#015478]/5 p-3">
                                <p className="mb-1.5 text-[11px] font-semibold text-[#015478]">1 · Choose treatment</p>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <select value={draft.work_id} onChange={(e) => selectWork(e.target.value)} className={inputCls}>
                                            <option value="">Select treatment…</option>
                                            {catalog.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                    {dMeta && !dWhole && !dPerToothPlan && (
                                        <input type="number" min="1" value={draft.quantity} onChange={(e) => setQty(e.target.value)} title="Quantity (teeth)" className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                                    )}
                                    <button type="button" onClick={addTreatment} disabled={!canAdd} className="rounded-md bg-[#015478] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#013d58] disabled:opacity-40">+ Add</button>
                                </div>
                                {dWhole && !dPlan && <p className="mt-1.5 text-[11px] text-slate-500">{dMeta?.name} applies to the whole mouth — no tooth needed.</p>}

                                {/* Plan: New / Continue + agreement total */}
                                {dPlan && (
                                    <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs">
                                        <select value={draft.plan_mode} onChange={(e) => setPlanMode(e.target.value)} className={`${inputCls} mb-2`}>
                                            {existingForType.map((p) => {
                                                const rem = Number(p.agreed_total) - Number(p.total_paid || 0);
                                                return <option key={p.id} value={String(p.id)}>Continue · {p.teeth ? `tooth ${p.teeth}` : "no tooth"} · remaining {formatMoney(rem)}</option>;
                                            })}
                                            <option value="new">➕ New {dCode.toUpperCase()} — separate plan</option>
                                        </select>
                                        {draft.plan_mode === "new" ? (
                                            <div>
                                                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">New <span className="uppercase">{dCode}</span> agreement total</label>
                                                <input type="number" min={dMeta?.min_price || 0} step="0.01" value={draft.agreed_total} onChange={(e) => setDraft((d) => ({ ...d, agreed_total: e.target.value }))} className={inputCls} placeholder={`Min ${formatMoney(dMeta?.min_price || 0)}`} />
                                            </div>
                                        ) : (
                                            <p className="text-slate-700">Continuing <b className="uppercase">{dCode}</b>{dWhole ? "" : draft.teeth[0] ? ` · tooth ${draft.teeth[0]}` : " · pick a tooth"} — no new agreement.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Saved treatments */}
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                                <p className="mb-1.5 text-[11px] font-semibold text-emerald-700">Saved treatments ({confirmed.length})</p>
                                {confirmed.length === 0 ? (
                                    <p className="text-[11px] text-slate-500">Choose a treatment → pick teeth → “Add”.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {confirmed.map((c) => (
                                            <span key={c.uid} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                                                <span className="font-semibold">{c.name}</span>
                                                <span className="text-slate-500">· {c.wholeMouth ? "whole mouth" : c.teeth.length ? `tooth ${c.teeth.join(", ")}` : `${c.quantity}x · no tooth`}</span>
                                                {c.isPlan && <span className="text-rose-500">{c.plan_mode === "new" ? `· new ${formatMoney(Number(c.agreed_total))}` : "· continue"}</span>}
                                                <button type="button" onClick={() => editTreatment(c.uid)} title="Edit" className="ml-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-[#015478]">✎</button>
                                                <button type="button" onClick={() => removeTreatment(c.uid)} title="Remove" className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">✕</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Money — hidden for doctors (works + images only, no money) */}
                            {canEditPayment && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-[11px] font-medium text-slate-600">Session total</p>
                                        <p className="mt-1 text-base font-semibold text-slate-900">{formatMoney(liveTotal)}</p>
                                        <p className="text-[10px] text-slate-400">Updates with the treatments · saved to the session.</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <label className="text-[11px] font-medium text-slate-600">Total paid{curr ? ` (${curr})` : ""}</label>
                                        <input type="number" min={0} step="0.01" value={totalPaid} onChange={(e) => setTotalPaid(e.target.value)} disabled={isSaving} className={`${inputCls} mt-1`} />
                                    </div>
                                </div>
                            )}

                            {/* Existing plan works (tooth only) */}
                            {planWorks.length > 0 && (
                                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3">
                                    <p className="text-[11px] font-semibold text-slate-800">Treatment-plan works — tooth only</p>
                                    <p className="text-[11px] text-slate-500">Money &amp; type are managed in Treatment Plans.</p>
                                    <div className="mt-2 space-y-2">
                                        {planWorks.map((p) => {
                                            const wholeMouthPlan = WHOLE_MOUTH_CODES.has(String(p.plan_type || "").toLowerCase());
                                            return (
                                                <div key={p.session_work_id} className="flex items-center gap-2 rounded-lg border border-purple-100 bg-white p-2">
                                                    <span className="flex-1 truncate text-sm font-medium text-slate-800">{p.work_name}</span>
                                                    {p.plan_type && <span className="rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-medium uppercase text-purple-700">{p.plan_type}</span>}
                                                    {wholeMouthPlan ? (
                                                        <span className="text-[11px] text-slate-500">whole mouth · no tooth</span>
                                                    ) : (
                                                        <input type="number" min={11} max={85} value={p.tooth_number} onChange={(e) => setPlanTooth(p.session_work_id, e.target.value)} disabled={isSaving} placeholder="tooth" className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Case images */}
                            <div className="rounded-xl border border-[#015478]/30 bg-[#015478]/5 p-3">
                                <div className="mb-1.5 flex items-center justify-between">
                                    <p className="text-[11px] font-semibold text-[#015478]">Case images</p>
                                    <label className="cursor-pointer rounded-md border border-[#015478]/40 bg-white px-2.5 py-1 text-[11px] font-medium text-[#015478] hover:bg-[#015478]/10">
                                        + Add images
                                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onPickImages} disabled={isSaving} />
                                    </label>
                                </div>
                                {existingImages.length === 0 && newImages.length === 0 ? (
                                    <p className="text-[11px] text-slate-500">JPG, PNG or WEBP · up to 10MB each.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {existingImages.map((img) => {
                                            const marked = imagesToDelete.includes(img.id);
                                            return (
                                                <div key={img.id} className={`relative h-16 w-16 overflow-hidden rounded-md border ${marked ? "border-red-300 opacity-40" : "border-slate-200"}`}>
                                                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                                                    <button type="button" onClick={() => toggleDeleteExisting(img.id)} disabled={isSaving} className="absolute right-0 top-0 rounded-bl-md bg-black/55 px-1 text-[11px] leading-tight text-white hover:bg-red-600">{marked ? "↺" : "✕"}</button>
                                                </div>
                                            );
                                        })}
                                        {newImages.map((im) => (
                                            <div key={im.id} className="relative h-16 w-16 overflow-hidden rounded-md border border-emerald-300">
                                                <img src={im.preview} alt="" className="h-full w-full object-cover" />
                                                <span className="absolute left-0 bottom-0 bg-emerald-600 px-1 text-[9px] leading-tight text-white">new</span>
                                                <button type="button" onClick={() => removeNewImage(im.id)} disabled={isSaving} className="absolute right-0 top-0 rounded-bl-md bg-black/55 px-1 text-[11px] leading-tight text-white hover:bg-red-600">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: tooth chart */}
                        <div className="flex min-h-0 flex-col rounded-xl border border-[#015478]/20 bg-[#015478]/5 p-3 sm:p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-semibold text-[#015478] dark:text-sky-300">2 · Pick teeth</p>
                                {dMeta && !dWhole && (<span className="text-xs text-slate-500">{draft.teeth.length ? `tooth ${draft.teeth.join(", ")}` : "tooth optional"}</span>)}
                            </div>
                            <div className="flex flex-1 items-center justify-center">
                                <div className={`w-full transition-opacity ${dWhole ? "opacity-40 pointer-events-none" : !draft.work_id ? "opacity-70" : ""}`}>
                                    <TeethDiagram selected={draft.teeth} marked={planTeeth} labels={planLabels} onToothClick={toggleTooth} disabled={isSaving || dWhole || !draft.work_id} />
                                </div>
                            </div>
                            <p className="mt-2 text-center text-[11px] text-slate-400">Amber = treatment-plan tooth · pick a treatment then tap teeth</p>
                        </div>
                    </div>
                )}

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-4 sm:px-5 py-3">
                    <button type="button" onClick={onClose} disabled={isSaving} className="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
                    <button type="button" onClick={handleSave} disabled={isSaving || isLoading} className="rounded-md bg-[#015478] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#013d58] disabled:opacity-50">{isSaving ? "Saving…" : "Save changes"}</button>
                </div>
            </div>
        </div>
    );
}

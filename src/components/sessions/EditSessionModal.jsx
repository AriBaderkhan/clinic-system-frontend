import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getWorks } from "../../api/workApi";
import {
    getNormalSessionDetails,
    updateNormalSession,
    getSessionImages,
    uploadSessionImages,
    deleteSessionImage,
} from "../../api/sessionApi";

const MAX_IMAGES = 12;
const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp"];

function toNumberOrEmpty(v) {
    if (v === null || v === undefined) return "";
    const n = Number(v);
    return Number.isNaN(n) ? "" : n;
}

function money(n) {
    const v = Number(n || 0);
    return v.toLocaleString();
}

export default function EditSessionModal({ sessionId, onClose, onUpdated, hideMoney = false }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [catalog, setCatalog] = useState([]);
    const [base, setBase] = useState(null);

    const [notes, setNotes] = useState("");
    const [nextPlan, setNextPlan] = useState("");
    const [totalPaid, setTotalPaid] = useState("");

    const [works, setWorks] = useState([]);
    const [planWorks, setPlanWorks] = useState([]); // treatment-plan works, read-only

    // images: those already saved, ids staged for deletion, and new files to upload
    const [existingImages, setExistingImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]); // image ids
    const [newImages, setNewImages] = useState([]); // { id, file, preview }

    // revoke preview object URLs on unmount
    useEffect(() => () => newImages.forEach((im) => URL.revokeObjectURL(im.preview)), [newImages]);

    const estimatedTotal = useMemo(() => {
        let sum = 0;
        for (const w of works) {
            if (!w.work_id) continue;
            const item = catalog.find((c) => Number(c.id) === Number(w.work_id));
            if (!item) continue;
            const qty = Number(w.quantity || 1);
            const price = Number(item.min_price || 0); // you said unit = min for now
            sum += price * qty;
        }
        return sum;
    }, [works, catalog]);

    useEffect(() => {
        let alive = true;

        async function load() {
            setIsLoading(true);
            setError("");

            try {
                const [catalogRes, sessionRes, imagesRes] = await Promise.all([
                    getWorks(),
                    getNormalSessionDetails(sessionId),
                    getSessionImages(sessionId).catch(() => ({ data: [] })),
                ]);

                const catalogRaw = catalogRes?.data;
                const catalogRows = Array.isArray(catalogRaw)
                    ? catalogRaw
                    : (catalogRaw?.works || catalogRaw?.data || []);
                const payload = sessionRes?.data || sessionRes;
                const sessionData = payload?.data ? payload.data : payload;

                if (!alive) return;

                setCatalog(catalogRows);
                setBase(sessionData);
                setExistingImages(imagesRes?.data || []);

                setNotes(sessionData?.session?.plan?.notes ?? "");
                setNextPlan(sessionData?.session?.plan?.next_plan ?? "");
                setTotalPaid(toNumberOrEmpty(sessionData?.session?.totals?.total_paid));

                // map grouped -> editable rows (use work_id straight from the backend)
                const grouped = sessionData?.works_summary?.works || [];
                const mapped = grouped
                    .map((g) => {
                        if (!g.work_id) return null;

                        if (Array.isArray(g.teeth) && g.teeth.length > 0) {
                            return g.teeth.map((t) => ({
                                work_id: g.work_id,
                                quantity: 1,
                                tooth_number: t,
                            }));
                        }

                        return {
                            work_id: g.work_id,
                            quantity: Number(g.quantity || 1),
                            tooth_number: null,
                        };
                    })
                    .flat()
                    .filter(Boolean);

                setWorks(mapped.length ? mapped : [{ work_id: "", quantity: 1, tooth_number: null }]);
                setPlanWorks(sessionData?.plan_works || []);
            } catch (err) {
                if (!alive) return;
                setError(err.userMessage);
            } finally {
                if (alive) setIsLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [sessionId]);

    const header = useMemo(() => {
        const s = base?.session;
        if (!s) return {};
        return {
            patientName: s.patient?.full_name,
            patientPhone: s.patient?.phone,
            doctorName: s.doctor?.full_name,
            apptTime: s.appointment?.start_time,
            apptStatus: s.appointment?.status,
        };
    }, [base]);

    function addWorkRow() {
        setWorks((prev) => [...prev, { work_id: "", quantity: 1, tooth_number: null }]);
    }

    function removeWorkRow(idx) {
        setWorks((prev) => prev.filter((_, i) => i !== idx));
    }

    function updateWorkRow(idx, patch) {
        setWorks((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
    }

    function onPickImages(e) {
        const picked = Array.from(e.target.files || []);
        e.target.value = "";
        const shown = existingImages.length - imagesToDelete.length + newImages.length;
        const room = MAX_IMAGES - shown;
        if (room <= 0) {
            toast.error(`You can keep up to ${MAX_IMAGES} images.`);
            return;
        }
        const valid = picked
            .filter((f) => ALLOWED_IMG.includes(f.type) && f.size <= 10 * 1024 * 1024)
            .slice(0, room)
            .map((f) => ({ id: `${Date.now()}-${Math.random()}`, file: f, preview: URL.createObjectURL(f) }));
        if (valid.length < picked.length) toast.error("Some files were skipped (only JPG/PNG/WEBP up to 10MB).");
        setNewImages((prev) => [...prev, ...valid]);
    }

    function removeNewImage(id) {
        setNewImages((prev) => {
            const t = prev.find((im) => im.id === id);
            if (t) URL.revokeObjectURL(t.preview);
            return prev.filter((im) => im.id !== id);
        });
    }

    // mark/unmark an already-saved image for deletion (applied on Save)
    function toggleDeleteExisting(imageId) {
        setImagesToDelete((prev) => (prev.includes(imageId) ? prev.filter((x) => x !== imageId) : [...prev, imageId]));
    }

    async function handleSave() {
        setError("");

        const payload = {};

        if (notes !== (base?.session?.plan?.notes ?? "")) payload.notes = notes;
        if (nextPlan !== (base?.session?.plan?.next_plan ?? "")) payload.next_plan = nextPlan;

        // money is never edited in money-hidden (doctor) mode
        if (!hideMoney) {
            const paidNum = totalPaid === "" ? "" : Number(totalPaid);
            if (totalPaid !== "" && (Number.isNaN(paidNum) || paidNum < 0)) {
                setError("total_paid must be a number >= 0");
                return;
            }
            const oldPaid = Number(base?.session?.totals?.total_paid || 0);
            if (totalPaid !== "" && paidNum !== oldPaid) payload.total_paid = paidNum;
        }

        const cleanedWorks = works
            .filter((w) => w.work_id)
            .map((w) => ({
                work_id: Number(w.work_id),
                quantity: Number(w.quantity || 1),
                tooth_number: w.tooth_number === "" ? null : (w.tooth_number ?? null),
            }));

        if (cleanedWorks.length > 0) payload.works = cleanedWorks;

        const hasSessionChange = Object.keys(payload).length > 0;
        const hasImageChange = imagesToDelete.length > 0 || newImages.length > 0;

        if (!hasSessionChange && !hasImageChange) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            if (hasSessionChange) await updateNormalSession(sessionId, payload);

            // apply image deletions, then upload new ones
            for (const imageId of imagesToDelete) {
                await deleteSessionImage(sessionId, imageId);
            }
            if (newImages.length > 0) {
                await uploadSessionImages(sessionId, newImages.map((im) => im.file));
            }

            onUpdated?.();
            onClose();
        } catch (err) {
            toast.error(err.userMessage || "Failed to save session.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
                    <div>
                        <p className="text-lg font-semibold text-slate-900">Edit session</p>
                        <p className="text-xs text-slate-500">
                            {hideMoney ? "Update notes, works, and case images." : "Update notes, paid, works, and images."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>

                <div className="px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="text-sm text-slate-600">Loading...</div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-[11px] text-slate-500">Patient</p>
                                    <p className="mt-1 font-semibold text-slate-900">{header.patientName || "-"}</p>
                                    <p className="text-sm text-slate-600">{header.patientPhone || "-"}</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-[11px] text-slate-500">Doctor</p>
                                    <p className="mt-1 font-semibold text-slate-900">{header.doctorName || "-"}</p>
                                    <p className="text-xs text-slate-500">Session ID: {sessionId}</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-[11px] text-slate-500">Appointment</p>
                                    <p className="mt-1 text-sm text-slate-700">{header.apptTime || "-"}</p>
                                    <p className="text-xs text-slate-500">Status: {header.apptStatus || "-"}</p>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 grid-cols-1 md:grid-cols-2">
                                <div>
                                    <label className="text-[11px] font-medium text-slate-700">Next plan (optional)</label>
                                    <textarea
                                        value={nextPlan}
                                        onChange={(e) => setNextPlan(e.target.value)}
                                        rows={3}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                                        placeholder="Short note for next visit..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-medium text-slate-700">Notes (optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                                        placeholder="Notes about today's treatment..."
                                    />
                                </div>
                            </div>

                            {!hideMoney && (
                                <div className="mt-4 grid gap-3 grid-cols-1 md:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <p className="text-[11px] font-medium text-slate-700">Estimated total (IQD)</p>
                                        <p className="mt-2 text-lg font-semibold text-slate-900">{money(estimatedTotal)} IQD</p>
                                        <p className="text-[11px] text-slate-500">Updates when you change works.</p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <label className="text-[11px] font-medium text-slate-700">Total paid (IQD)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={totalPaid}
                                            onChange={(e) => setTotalPaid(e.target.value)}
                                            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                                        />

                                    </div>
                                </div>
                            )}

                            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Works</p>
                                        <p className="text-[11px] text-slate-500">Edit works; backend will recalculate totals.</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addWorkRow}
                                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                        + Add work
                                    </button>
                                </div>

                                <div className="mt-3 space-y-3">
                                    {works.map((row, idx) => (
                                        <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <div className="grid gap-3 grid-cols-1 sm:grid-cols-12">
                                                <div className="md:col-span-6">
                                                    <label className="text-[11px] font-medium text-slate-700">Work</label>
                                                    <select
                                                        value={row.work_id}
                                                        onChange={(e) => updateWorkRow(idx, { work_id: e.target.value })}
                                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                                                    >
                                                        <option value="">Select...</option>
                                                        {catalog.map((c) => (
                                                            <option key={c.id} value={c.id}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="text-[11px] font-medium text-slate-700">Qty</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={row.quantity}
                                                        onChange={(e) => updateWorkRow(idx, { quantity: e.target.value })}
                                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                                                    />
                                                </div>

                                                <div className="md:col-span-3">
                                                    <label className="text-[11px] font-medium text-slate-700">Tooth #</label>
                                                    <input
                                                        type="number"
                                                        min={11}
                                                        max={48}
                                                        value={row.tooth_number ?? ""}
                                                        onChange={(e) => updateWorkRow(idx, { tooth_number: e.target.value })}
                                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                                                        placeholder="optional"
                                                    />
                                                </div>

                                                <div className="md:col-span-1 flex items-end justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWorkRow(idx)}
                                                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 hover:bg-red-100"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Treatment-plan works (read-only) */}
                            {planWorks.length > 0 && (
                                <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                                    <p className="text-sm font-semibold text-slate-900">Treatment-plan works</p>
                                    <p className="text-[11px] text-slate-500">Managed by the treatment plan — view only, not editable here.</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {planWorks.map((p, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                                                <span className="font-semibold">{p.work_name}</span>
                                                {p.plan_type && (
                                                    <span className="rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-medium uppercase text-purple-700">
                                                        {p.plan_type}
                                                    </span>
                                                )}
                                                <span className="text-slate-500">
                                                    · {p.quantity}x{p.teeth && p.teeth.length > 0 ? ` · tooth ${p.teeth.join(", ")}` : ""}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Case images */}
                            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Case images</p>
                                        <p className="text-[11px] text-slate-500">Add or remove x-rays/photos. Changes apply on Save.</p>
                                    </div>
                                    <label className="cursor-pointer rounded-lg border border-[#015478]/40 bg-[#015478]/5 px-3 py-1 text-sm font-medium text-[#015478] hover:bg-[#015478]/10">
                                        + Add images
                                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                                            onChange={onPickImages} disabled={isSaving} />
                                    </label>
                                </div>

                                {existingImages.length === 0 && newImages.length === 0 ? (
                                    <p className="mt-3 text-[11px] text-slate-500">No images yet. JPG, PNG or WEBP · up to 10MB each.</p>
                                ) : (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {existingImages.map((img) => {
                                            const marked = imagesToDelete.includes(img.id);
                                            return (
                                                <div key={img.id} className={`relative h-20 w-20 overflow-hidden rounded-lg border ${marked ? "border-red-300 opacity-40" : "border-slate-200"}`}>
                                                    <img src={img.url} alt="Case image" className="h-full w-full object-cover" />
                                                    <button type="button" onClick={() => toggleDeleteExisting(img.id)} disabled={isSaving}
                                                        title={marked ? "Keep image" : "Remove image"}
                                                        className="absolute right-0 top-0 rounded-bl-md bg-black/55 px-1 text-[11px] leading-tight text-white hover:bg-red-600">
                                                        {marked ? "↺" : "✕"}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {newImages.map((im) => (
                                            <div key={im.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-emerald-300">
                                                <img src={im.preview} alt="" className="h-full w-full object-cover" />
                                                <span className="absolute left-0 bottom-0 bg-emerald-600 px-1 text-[9px] leading-tight text-white">new</span>
                                                <button type="button" onClick={() => removeNewImage(im.id)} disabled={isSaving}
                                                    title="Remove" className="absolute right-0 top-0 rounded-bl-md bg-black/55 px-1 text-[11px] leading-tight text-white hover:bg-red-600">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </>
                    )}
                </div>

                {/* Footer — fixed at bottom */}
                <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className={[
                            "rounded-xl px-6 py-2 text-sm font-semibold text-white",
                            isSaving
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-[#015478] hover:opacity-90",
                        ].join(" ")}
                    >
                        {isSaving ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}


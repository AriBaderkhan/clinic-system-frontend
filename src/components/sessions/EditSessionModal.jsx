// ✅ EditSessionModal.jsx (FIX alive error + add "Estimated total" that updates when works change)
import { useEffect, useMemo, useState } from "react";
import { fetchWorkCatalog } from "../../api/workApi";
import { apiGetNormalSessionDetails, updateNormalSession } from "../../api/sessionApi";

function toNumberOrEmpty(v) {
    if (v === null || v === undefined) return "";
    const n = Number(v);
    return Number.isNaN(n) ? "" : n;
}

function money(n) {
    const v = Number(n || 0);
    return v.toLocaleString();
}

export default function EditSessionModal({ sessionId, onClose, onUpdated }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [catalog, setCatalog] = useState([]);
    const [base, setBase] = useState(null);

    const [notes, setNotes] = useState("");
    const [nextPlan, setNextPlan] = useState("");
    const [totalPaid, setTotalPaid] = useState("");

    const [works, setWorks] = useState([]);

    // ✅ live estimated total from works
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

    // const paidNumber = Number(totalPaid || 0);
    // const isUnderPaid = paidNumber < estimatedTotal;

    useEffect(() => {
        let alive = true;

        async function load() {
            setIsLoading(true);
            setError("");

            try {
                const [catalogRes, sessionRes] = await Promise.all([
                    fetchWorkCatalog(),
                    apiGetNormalSessionDetails(sessionId),
                ]);

                const catalogRows = Array.isArray(catalogRes) ? catalogRes : (catalogRes?.data || []);
                const payload = sessionRes?.data || sessionRes;
                const sessionData = payload?.data ? payload.data : payload;

                if (!alive) return;

                setCatalog(catalogRows);
                setBase(sessionData);

                setNotes(sessionData?.session?.plan?.notes ?? "");
                setNextPlan(sessionData?.session?.plan?.next_plan ?? "");
                setTotalPaid(toNumberOrEmpty(sessionData?.session?.totals?.total_paid));

                // map grouped -> editable rows
                const grouped = sessionData?.works_summary?.works || [];
                const mapped = grouped
                    .map((g) => {
                        const c = catalogRows.find((x) => x.name === g.work_name);
                        if (!c) return null;

                        if (Array.isArray(g.teeth) && g.teeth.length > 0) {
                            return g.teeth.map((t) => ({
                                work_id: c.id,
                                quantity: 1,
                                tooth_number: t,
                            }));
                        }

                        return {
                            work_id: c.id,
                            quantity: Number(g.quantity || 1),
                            tooth_number: null,
                        };
                    })
                    .flat()
                    .filter(Boolean);

                setWorks(mapped.length ? mapped : [{ work_id: "", quantity: 1, tooth_number: null }]);
            } catch (err) {
                if (!alive) return;
                setError(err.userMessage);
            } finally {
                if (alive) setIsLoading(false); // ✅ FIXED (no "return;" inside finally)
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

    async function handleSave() {
        setError("");

        const payload = {};

        if (notes !== (base?.session?.plan?.notes ?? "")) payload.notes = notes;
        if (nextPlan !== (base?.session?.plan?.next_plan ?? "")) payload.next_plan = nextPlan;

        const paidNum = totalPaid === "" ? "" : Number(totalPaid);
        if (totalPaid !== "" && (Number.isNaN(paidNum) || paidNum < 0)) {
            setError("total_paid must be a number >= 0");
            return;
        }

        // ✅ prevent paying more than estimated total

        const oldPaid = Number(base?.session?.totals?.total_paid || 0);
        if (totalPaid !== "" && paidNum !== oldPaid) payload.total_paid = paidNum;

        const cleanedWorks = works
            .filter((w) => w.work_id)
            .map((w) => ({
                work_id: Number(w.work_id),
                quantity: Number(w.quantity || 1),
                tooth_number: w.tooth_number === "" ? null : (w.tooth_number ?? null),
            }));

        if (cleanedWorks.length > 0) payload.works = cleanedWorks;

        if (Object.keys(payload).length === 0) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            await updateNormalSession(sessionId, payload);
            onUpdated?.();
            onClose();
        } catch (err) {
            setError(err.userMessage);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-3">
            <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <p className="text-lg font-semibold text-slate-900">Edit session</p>
                        <p className="text-xs text-slate-500">Update notes, paid, and works.</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>

                <div className="px-6 py-5">
                    {isLoading ? (
                        <div className="text-sm text-slate-600">Loading...</div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="grid gap-3 md:grid-cols-3">
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

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <div>
                                    <label className="text-[11px] font-medium text-slate-700">Next plan (optional)</label>
                                    <textarea
                                        value={nextPlan}
                                        onChange={(e) => setNextPlan(e.target.value)}
                                        rows={3}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                                        placeholder="Short note for next visit..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-medium text-slate-700">Notes (optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                                        placeholder="Notes about today's treatment..."
                                    />
                                </div>
                            </div>

                            {/* ✅ total + paid preview */}
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                                        className={[
                                            "mt-2 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-1",
                                        ].join(" ")}
                                        // isUnderPaid
                                        //         ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                                        //         : "border-slate-200 focus:border-[#1DB954] focus:ring-[#1DB954]",
                                    />

                                </div>
                            </div>

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
                                            <div className="grid gap-3 md:grid-cols-12">
                                                <div className="md:col-span-6">
                                                    <label className="text-[11px] font-medium text-slate-700">Work</label>
                                                    <select
                                                        value={row.work_id}
                                                        onChange={(e) => updateWorkRow(idx, { work_id: e.target.value })}
                                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
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
                                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
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
                                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1DB954] focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
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

                            <div className="mt-5 flex items-center justify-end gap-2">
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
                                    disabled={isSaving }
                                    className={[
                                        "rounded-xl px-6 py-2 text-sm font-semibold text-white",
                                        isSaving 
                                            ? "bg-gray-300 cursor-not-allowed"
                                            : "bg-[#1DB954] hover:opacity-90",
                                    ].join(" ")}
                                >
                                    {isSaving ? "Saving..." : "Save changes"}
                                </button>

                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

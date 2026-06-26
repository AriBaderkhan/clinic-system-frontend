import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    getRegistrationRequests,
    approveRegistrationRequest,
    rejectRegistrationRequest,
} from "../../api/registrationApi";

export default function RegistrationsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [preview, setPreview] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            const res = await getRegistrationRequests();
            setRequests(res.data ?? []);
        } catch (err) {
            toast.error(err.userMessage || "Failed to load registrations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleApprove = async (id) => {
        if (!window.confirm("Approve this registration? This creates the tenant, its admin login, and the subscription, and emails the owner.")) return;
        try {
            setBusyId(id);
            await approveRegistrationRequest(id);
            toast.success("Tenant approved & provisioned. Email sent.");
            await load();
        } catch (err) {
            toast.error(err.userMessage || "Failed to approve");
        } finally {
            setBusyId(null);
        }
    };

    const handleReject = async (id) => {
        const note = window.prompt("Reason for rejection (optional):") ?? "";
        try {
            setBusyId(id);
            await rejectRegistrationRequest(id, note);
            toast.success("Registration rejected");
            await load();
        } catch (err) {
            toast.error(err.userMessage || "Failed to reject");
        } finally {
            setBusyId(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading registrations…</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-slate-800">New Registrations</h2>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-100">
                    {requests.length} pending
                </span>
            </div>

            {requests.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                    No pending registrations.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {requests.map((r) => (
                        <div key={r.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{r.tenant_name}</p>
                                <p className="text-xs text-slate-500">
                                    {r.manager_name} · wants <b>{r.plan_name}</b> · ${r.plan_price}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-slate-500">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
                            </div>

                            {/* Evidence */}
                            <div className="mt-3">
                                {r.evidence_url ? (
                                    <button
                                        type="button"
                                        onClick={() => setPreview(r.evidence_url)}
                                        className="block w-full overflow-hidden rounded-lg border border-slate-200 hover:border-[#015478]"
                                        title="View evidence"
                                    >
                                        <img src={r.evidence_url} alt="Payment evidence" className="h-40 w-full object-cover" />
                                    </button>
                                ) : (
                                    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                                        No evidence image
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleApprove(r.id)}
                                    disabled={busyId === r.id}
                                    className="flex-1 rounded-lg bg-[#015478] py-2 text-sm font-semibold text-white hover:bg-[#013d58] disabled:opacity-50"
                                >
                                    {busyId === r.id ? "…" : "Approve"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleReject(r.id)}
                                    disabled={busyId === r.id}
                                    className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Evidence lightbox */}
            {preview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={(e) => e.target === e.currentTarget && setPreview(null)}
                >
                    <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                            <p className="text-[13px] font-medium text-slate-700">Payment evidence</p>
                            <div className="flex items-center gap-2">
                                <a href={preview} target="_blank" rel="noopener noreferrer"
                                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100">
                                    Open original
                                </a>
                                <button type="button" onClick={() => setPreview(null)}
                                    className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-200">
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-900/95 p-2 sm:p-4">
                            <img src={preview} alt="Payment evidence" className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

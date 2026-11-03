import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    getSubscriptionRequests,
    approveSubscriptionRequest,
    rejectSubscriptionRequest,
} from "../../api/subscriptionApi";
import PageHeader from "../../components/common/PageHeader";

export default function SubscriptionRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [preview, setPreview] = useState(null); // evidence image being viewed

    const load = async () => {
        try {
            setLoading(true);
            const res = await getSubscriptionRequests();
            setRequests(res.data ?? []);
        } catch (err) {
            toast.error(err.userMessage || "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleApprove = async (id) => {
        if (!window.confirm("Confirm this payment and renew the tenant's subscription?")) return;
        try {
            setBusyId(id);
            await approveSubscriptionRequest(id);
            toast.success("Subscription renewed");
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
            await rejectSubscriptionRequest(id, note);
            toast.success("Request rejected");
            await load();
        } catch (err) {
            toast.error(err.userMessage || "Failed to reject");
        } finally {
            setBusyId(null);
        }
    };

    if (loading) return (
        <div className="w-full space-y-5">
            <PageHeader title="Subscription Requests" />
            <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5 py-10 text-center text-sm text-slate-500">Loading requests…</div>
        </div>
    );

    return (
        <div className="w-full space-y-5">
            <PageHeader
                title="Subscription Requests"
                actions={
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-aqua/15 px-3 py-1.5 text-xs font-semibold text-aqua">
                        {requests.length} pending
                    </span>
                }
            />

            {requests.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-card">
                    No pending requests.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {requests.map((r) => (
                        <div key={r.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate text-[15px] font-semibold text-slate-900">{r.tenant_name}</p>
                                    <p className="mt-0.5 break-words text-xs text-slate-500">
                                        wants <b>{r.plan_name}</b> · <span className="capitalize">{r.billing_period}</span> · ${r.amount ?? r.plan_price}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400 tabular-nums">
                                        {new Date(r.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Evidence */}
                            <div className="mt-3">
                                {r.evidence_url ? (
                                    <button
                                        type="button"
                                        onClick={() => setPreview(r.evidence_url)}
                                        className="block w-full overflow-hidden rounded-xl border border-slate-200 transition hover:border-brand hover:ring-4 hover:ring-brand/15"
                                        title="View evidence"
                                    >
                                        <img src={r.evidence_url} alt="Payment evidence" className="h-40 w-full object-cover" />
                                    </button>
                                ) : (
                                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                                        No evidence image
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => handleApprove(r.id)}
                                    disabled={busyId === r.id}
                                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                                >
                                    {busyId === r.id ? "…" : "Confirm"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleReject(r.id)}
                                    disabled={busyId === r.id}
                                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/70 p-4 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setPreview(null)}
                >
                    <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
                            <p className="text-base font-semibold text-slate-900">Payment evidence</p>
                            <div className="flex items-center gap-2">
                                <a href={preview} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                                    Open original
                                </a>
                                <button type="button" onClick={() => setPreview(null)}
                                    className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="flex min-h-0 flex-1 items-center justify-center bg-ocean-deep p-2 sm:p-4">
                            <img src={preview} alt="Payment evidence" className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

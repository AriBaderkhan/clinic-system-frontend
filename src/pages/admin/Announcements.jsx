import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getPlans } from "../../api/planApi";
import { createAnnouncement, getAdminAnnouncements, deleteAnnouncement } from "../../api/announcementApi";

const ROLE_OPTIONS = [
    { value: "tenant_manager", label: "Tenant manager" },
    { value: "branch_manager", label: "Branch manager" },
    { value: "doctor", label: "Doctor" },
    { value: "reception", label: "Reception" },
];

export default function AnnouncementsPage() {
    const [plans, setPlans] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPlan, setFilterPlan] = useState(""); // "" = all

    const [form, setForm] = useState({ title: "", body: "", target_plan_id: "" });
    const [roles, setRoles] = useState([]); // [] = all roles
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const toggleRole = (value) =>
        setRoles((prev) => (prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]));

    const loadPlans = async () => {
        try {
            const res = await getPlans();
            setPlans(res.data ?? []);
        } catch { /* non-fatal */ }
    };

    const loadItems = async (planId) => {
        try {
            setLoading(true);
            const res = await getAdminAnnouncements(planId || null);
            setItems(res.data ?? []);
        } catch (err) {
            toast.error(err.userMessage || "Failed to load announcements");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPlans(); }, []);
    useEffect(() => { loadItems(filterPlan); }, [filterPlan]);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return toast.error("Title is required.");
        try {
            setSubmitting(true);
            await createAnnouncement({ ...form, target_roles: roles }, file);
            toast.success("Announcement posted");
            setForm({ title: "", body: "", target_plan_id: "" });
            setRoles([]);
            setFile(null);
            loadItems(filterPlan);
        } catch (err) {
            toast.error(err.userMessage || "Failed to post announcement");
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
            await deleteAnnouncement(id);
            toast.success("Deleted");
            loadItems(filterPlan);
        } catch (err) {
            toast.error(err.userMessage || "Failed to delete");
        }
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,0.9fr),1.4fr]">
            {/* Create */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-medium text-slate-800">New Announcement</h2>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Title</label>
                        <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none"
                            placeholder="e.g. Scheduled maintenance" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Message</label>
                        <textarea rows="5" value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#015478] focus:outline-none"
                            placeholder="Write the announcement…" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Target plan</label>
                        <select value={form.target_plan_id} onChange={(e) => setForm((p) => ({ ...p, target_plan_id: e.target.value }))}
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#015478] focus:outline-none">
                            <option value="">All plans</option>
                            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Target roles</label>
                        <p className="mb-2 text-xs text-slate-400">Leave all unchecked = everyone.</p>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLE_OPTIONS.map((r) => (
                                <label key={r.value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" checked={roles.includes(r.value)} onChange={() => toggleRole(r.value)}
                                        className="h-4 w-4 rounded border-slate-300 text-[#015478] focus:ring-[#015478]" />
                                    {r.label}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Image (optional)</label>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#015478] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[#013d58]" />
                        {file && <p className="mt-1 text-xs text-slate-500">Selected: {file.name}</p>}
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={submitting}
                            className="rounded-md bg-[#015478] px-5 py-2 text-sm font-semibold text-white hover:bg-[#013d58] disabled:opacity-50">
                            {submitting ? "Posting…" : "Post announcement"}
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-medium text-slate-800">Sent</h2>
                    <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-[#015478] focus:outline-none">
                        <option value="">All plans</option>
                        {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {loading ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading…</div>
                ) : items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No announcements.</div>
                ) : (
                    <div className="space-y-3">
                        {items.map((a) => (
                            <div key={a.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                {a.image_url && (
                                    <img src={a.image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="truncate font-semibold text-slate-900">{a.title}</p>
                                        <span className="shrink-0 rounded-full bg-[#015478]/10 px-2 py-0.5 text-[11px] font-medium text-[#015478] border border-[#015478]/20">
                                            {a.plan_name || "All plans"}
                                        </span>
                                    </div>
                                    {a.body && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.body}</p>}
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Roles: {a.target_roles?.length ? a.target_roles.join(", ") : "Everyone"}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-[11px] text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
                                        <button onClick={() => remove(a.id)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

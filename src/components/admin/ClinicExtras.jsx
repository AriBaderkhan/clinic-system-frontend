import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAllTenants } from '../../api/adminApi';
import { getTenantGrants, grantTenantFeature, revokeTenantFeature } from '../../api/featureApi';

// Platform admin: give ONE clinic a feature its plan does not have (a trial or a deal),
// optionally until a date. When the date passes the feature simply stops.
export default function ClinicExtras({ features }) {
    const [tenants, setTenants] = useState([]);
    const [tenantId, setTenantId] = useState('');
    const [grants, setGrants] = useState([]);
    const [form, setForm] = useState({ feature_id: '', expires_at: '', note: '' });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        getAllTenants().then((res) => setTenants(res.data || [])).catch(() => toast.error('Failed to load clinics'));
    }, []);

    const loadGrants = (id) => {
        if (!id) return setGrants([]);
        getTenantGrants(id).then((res) => setGrants(res.data || [])).catch((err) => toast.error(err.userMessage || 'Failed to load extras'));
    };
    useEffect(() => { loadGrants(tenantId); }, [tenantId]);

    const give = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await grantTenantFeature(tenantId, {
                feature_id: Number(form.feature_id),
                expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : null,
                note: form.note || null,
            });
            toast.success('Extra given');
            setForm({ feature_id: '', expires_at: '', note: '' });
            loadGrants(tenantId);
        } catch (err) {
            toast.error(err.userMessage || 'Failed to give the extra');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (g) => {
        if (!window.confirm(`Remove "${g.name}" from this clinic?`)) return;
        try {
            await revokeTenantFeature(tenantId, g.feature_id);
            toast.success('Extra removed');
            loadGrants(tenantId);
        } catch (err) {
            toast.error(err.userMessage || 'Failed to remove');
        }
    };

    const clinic = tenants.find((t) => String(t.id) === String(tenantId));

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" data-clinic-extras>
            <h2 className="text-lg font-bold text-slate-900">Clinic extras</h2>
            <p className="mb-4 text-sm text-slate-500">Give one clinic a feature its plan does not include — a trial or a special deal. Leave the date empty for no end.</p>

            <select
                name="tenant"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
                <option value="">Choose a clinic…</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}{t.plan_name ? ` (${t.plan_name})` : ''}</option>)}
            </select>

            {tenantId && (
                <>
                    <ul className="mb-4 space-y-2">
                        {grants.length === 0 && <li className="text-sm text-slate-500">No extras for {clinic?.name}.</li>}
                        {grants.map((g) => (
                            <li key={g.feature_id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                                <span>
                                    <span className="font-medium">{g.name}</span>
                                    <span className="ms-2 text-xs text-slate-500">
                                        {g.expires_at ? `until ${new Date(g.expires_at).toLocaleDateString()}` : 'no end'}
                                        {!g.active && ' · ended'}
                                        {g.note && ` · ${g.note}`}
                                    </span>
                                </span>
                                <button type="button" onClick={() => remove(g)} className="text-xs text-red-600 hover:underline">Remove</button>
                            </li>
                        ))}
                    </ul>

                    <form onSubmit={give} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto]">
                        <select name="feature_id" required value={form.feature_id} onChange={(e) => setForm({ ...form, feature_id: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                            <option value="">Feature…</option>
                            {features.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <input type="date" name="expires_at" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                        <input name="note" maxLength={200} placeholder="Note (e.g. 14-day trial)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                        <button type="submit" disabled={busy || !form.feature_id} className="rounded-md bg-[#0E6E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A565C] disabled:opacity-50">Give</button>
                    </form>
                </>
            )}
        </div>
    );
}

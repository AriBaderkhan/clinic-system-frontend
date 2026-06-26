import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiSearch, FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getAuditLogs } from '../../api/auditApi';

const VERB = { create: 'Created', update: 'Updated', delete: 'Deleted' };

// Turn the stored action ('patients.delete', id 42) into a readable line.
function actionLabel(row) {
    const [resource, verb] = (row.action || '').split('.');
    const word = VERB[verb] || verb || row.method || 'Action';
    const entity = (resource || '').replace(/s$/, '') || 'record';
    return `${word} ${entity}${row.entity_id ? ` #${row.entity_id}` : ''}`;
}

function StatusBadge({ code }) {
    const ok = code != null && code < 300;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ok
            ? 'bg-[#015478]/10 text-[#015478] border-[#015478]/20'
            : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
            {code ?? '—'}
        </span>
    );
}

export default function AuditLogPage() {
    const [data, setData] = useState({ rows: [], total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);

    const [q, setQ] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);

    // Load (debounced) whenever a filter or the page changes.
    useEffect(() => {
        let active = true;
        setLoading(true);
        const t = setTimeout(async () => {
            try {
                const res = await getAuditLogs({ q, from, to, page });
                if (active) setData(res.data ?? { rows: [], total: 0, page: 1, pages: 1 });
            } catch (err) {
                if (active) toast.error(err.userMessage || 'Failed to load activity log');
            } finally {
                if (active) setLoading(false);
            }
        }, 300);
        return () => { active = false; clearTimeout(t); };
    }, [q, from, to, page]);

    // A changed filter always sends you back to the first page.
    useEffect(() => { setPage(1); }, [q, from, to]);

    const clearFilters = () => { setQ(''); setFrom(''); setTo(''); };
    const hasFilters = q || from || to;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Activity Log</h1>
                <p className="text-gray-500 mt-1">A record of who did what across your organization.</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row gap-3 md:items-end">
                    <div className="relative w-full md:flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Search by user</label>
                        <FiSearch className="absolute left-3 top-[34px] text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="User name..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#015478]/20 focus:border-[#015478] transition-all"
                        />
                    </div>
                    <div className="w-full md:w-44">
                        <label className="block text-xs font-medium text-gray-600 mb-1">From date</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#015478]/20 focus:border-[#015478] transition-all"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-44">
                        <label className="block text-xs font-medium text-gray-600 mb-1">To date</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#015478]/20 focus:border-[#015478] transition-all"
                            />
                        </div>
                    </div>
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            <FiX size={16} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">When</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading activity…</td></tr>
                            ) : data.rows.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No activity found.</td></tr>
                            ) : (
                                data.rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                            {new Date(row.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{row.actor_name || 'System'}</div>
                                            <div className="text-xs text-gray-400 capitalize">{row.actor_role || ''}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-800">{actionLabel(row)}</div>
                                            <div className="text-xs text-gray-400">{row.action}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-mono text-gray-600">{row.method} {row.path}</div>
                                            {row.request_id && <div className="text-[11px] text-gray-400">{row.request_id}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right"><StatusBadge code={row.status_code} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-500">Loading activity…</div>
                ) : data.rows.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-500">No activity found.</div>
                ) : (
                    data.rows.map((row) => (
                        <div key={row.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">{actionLabel(row)}</p>
                                    <p className="text-xs text-gray-500">{row.actor_name || 'System'} · <span className="capitalize">{row.actor_role || ''}</span></p>
                                </div>
                                <StatusBadge code={row.status_code} />
                            </div>
                            <div className="mt-2 text-xs font-mono text-gray-500 break-all">{row.method} {row.path}</div>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                                <span>{new Date(row.created_at).toLocaleString()}</span>
                                {row.request_id && <span>{row.request_id}</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {!loading && data.total > 0 && (
                <div className="mt-5 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Page {data.page} of {data.pages} · {data.total} entr{data.total === 1 ? 'y' : 'ies'}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={data.page <= 1}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiChevronLeft size={16} /> Prev
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                            disabled={data.page >= data.pages}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next <FiChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

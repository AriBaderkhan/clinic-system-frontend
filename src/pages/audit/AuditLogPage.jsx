import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { FiSearch, FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getAuditLogs } from '../../api/auditApi';
import PageHeader from '../../components/common/PageHeader';

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
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${ok
            ? 'bg-green-50 text-green-700'
            : 'bg-amber-50 text-amber-800'}`}>
            {code ?? '—'}
        </span>
    );
}

export default function AuditLogPage() {
    const { t } = useTranslation();
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
                if (active) toast.error(err.userMessage || t('audit.failed_load'));
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
        <div className="w-full space-y-5">
            <PageHeader title={t('audit.title')} subtitle={t('audit.subtitle')} />

            {/* Filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="relative w-full min-w-0 md:w-auto md:flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('audit.search_by_user')}</label>
                        <FiSearch className="absolute start-3 top-[41px] text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('audit.user_name_ph')}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full pe-4 ps-10 rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                        />
                    </div>
                    <div className="w-full sm:w-44">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('audit.from_date')}</label>
                        <div className="relative">
                            <FiCalendar className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="w-full pe-3 ps-9 rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-44">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('audit.to_date')}</label>
                        <div className="relative">
                            <FiCalendar className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full pe-3 ps-9 rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                            />
                        </div>
                    </div>
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <FiX size={16} /> {t('audit.clear')}
                        </button>
                    )}
                </div>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('audit.col_when')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('audit.col_user')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('audit.col_action')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t('audit.col_request')}</th>
                                <th className="whitespace-nowrap px-4 py-3 text-end text-xs font-semibold uppercase tracking-wide text-slate-500">{t('audit.col_status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">{t('audit.loading')}</td></tr>
                            ) : data.rows.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">{t('audit.none')}</td></tr>
                            ) : (
                                data.rows.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 tabular-nums">
                                            {new Date(row.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-slate-900">{row.actor_name || t('audit.system')}</div>
                                            <div className="text-xs capitalize text-slate-500">{row.actor_role || ''}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-slate-800">{actionLabel(row)}</div>
                                            <div className="text-xs text-slate-500">{row.action}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="break-all font-mono text-xs text-slate-600">{row.method} {row.path}</div>
                                            {row.request_id && <div className="text-[11px] text-slate-400">{row.request_id}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-end"><StatusBadge code={row.status_code} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-card">{t('audit.loading')}</div>
                ) : data.rows.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-card">{t('audit.none')}</div>
                ) : (
                    data.rows.map((row) => (
                        <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900">{actionLabel(row)}</p>
                                    <p className="truncate text-xs text-slate-500">{row.actor_name || t('audit.system')} · <span className="capitalize">{row.actor_role || ''}</span></p>
                                </div>
                                <StatusBadge code={row.status_code} />
                            </div>
                            <div className="mt-2 break-all font-mono text-xs text-slate-500">{row.method} {row.path}</div>
                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                                <span>{new Date(row.created_at).toLocaleString()}</span>
                                {row.request_id && <span>{row.request_id}</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {!loading && data.total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">
                        {t('audit.page_of', { page: data.page, pages: data.pages, total: data.total })}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={data.page <= 1}
                            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FiChevronLeft size={16} className="rtl:rotate-180" /> {t('audit.prev')}
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                            disabled={data.page >= data.pages}
                            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {t('audit.next')} <FiChevronRight size={16} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

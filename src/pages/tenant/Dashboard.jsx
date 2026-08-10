import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FiUserPlus, FiUsers, FiCalendar, FiDollarSign,
    FiRefreshCw, FiGitBranch, FiCheckCircle, FiClock, FiActivity,
} from 'react-icons/fi';
import { getTenantDashboard } from '../../api/tenantApi';
import { useSettings } from '../../context/SettingContext';

// Status → tailwind badge colors. Labels come from the shared appt.st_* keys.
const STATUS_STYLE = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
    checked_in: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    no_show: 'bg-slate-100 text-slate-600 border-slate-200',
};

function StatusBadge({ status }) {
    const { t } = useTranslation();
    const cls = STATUS_STYLE[status] || 'bg-slate-100 text-slate-600 border-slate-200';
    const label = t(`appt.st_${status}`, status);
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
            {label}
        </span>
    );
}

// Rotating palette for the treatment bars.
const BAR_COLORS = [
    'from-[#0E6E75] to-[#0a7ab0]',
    'from-violet-500 to-violet-400',
    'from-emerald-500 to-emerald-400',
    'from-sky-500 to-sky-400',
    'from-amber-500 to-amber-400',
    'from-rose-500 to-rose-400',
    'from-teal-500 to-teal-400',
    'from-indigo-500 to-indigo-400',
];

// Dependency-free horizontal bar chart for the top treatments this month.
function TreatmentsChart({ data }) {
    const { t } = useTranslation();
    const rows = data || [];
    const max = rows.reduce((m, r) => Math.max(m, Number(r.value || 0)), 0) || 1;

    if (rows.length === 0) {
        return (
            <div className="flex h-full min-h-[220px] items-center justify-center px-5 py-10 text-center text-sm text-slate-400">
                {t('tdash.no_treatments')}
            </div>
        );
    }

    return (
        <div className="space-y-4 px-5 py-5">
            {rows.map((r, i) => {
                const pct = Math.max(4, Math.round((Number(r.value || 0) / max) * 100));
                return (
                    <div key={r.label}>
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-medium text-slate-700">{r.label}</span>
                            <span className="shrink-0 text-xs font-semibold text-slate-500">{r.value}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-700`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function KpiCard({ icon: Icon, label, value, accent, children }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
                    <Icon size={18} />
                </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            {children ? <div className="mt-2">{children}</div> : null}
        </div>
    );
}

export default function TenantDashboard() {
    const { t } = useTranslation();
    const { formatTime, formatMoney } = useSettings();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [branch, setBranch] = useState('all'); // 'all' | branch id

    const load = useCallback(async () => {
        try {
            const res = await getTenantDashboard();
            setStats(res.data);
        } catch {
            /* non-fatal — keep last good data */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(load, 60000); // keep revenue/appointments live
        return () => clearInterval(id);
    }, [load]);

    const branchList = stats?.branches || [];
    const selected = branch === 'all' ? null : branchList.find((b) => String(b.id) === String(branch));
    const allAppts = stats?.today_appointments || { total: 0, done: 0, scheduled: 0, list: [] };
    const fullList = allAppts.list || [];

    // Everything below reads from `view`, which is either the tenant-wide totals
    // ("All branches") or a single branch's slice.
    const view = selected
        ? {
            newPatients: selected.new_patients,
            returningPatients: selected.returning_patients,
            appts: selected.appointments || { total: 0, done: 0, scheduled: 0 },
            revenue: selected.revenue || [],
            treatments: selected.treatments || [],
            list: fullList.filter((a) => a.branch_name === selected.name),
        }
        : {
            newPatients: stats?.today_new_patients ?? 0,
            returningPatients: stats?.today_returning_patients ?? 0,
            appts: allAppts,
            revenue: stats?.month_revenue ?? [],
            treatments: stats?.treatments_month || [],
            list: fullList,
        };

    const appts = view.appts;
    const list = view.list;
    const treatments = view.treatments;
    const dash = (v) => (stats ? v : '--');

    // Revenue is a per-currency list ([{ currency_code, total }]) — each currency
    // shown on its own (IQD and USD are never added together).
    const revenueText = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return formatMoney(0);
        return arr.map((r) => formatMoney(r.total, r.currency_code)).join('   ·   ');
    };

    return (
        <div className="w-full space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('tdash.title')}</h1>
                    <p className="text-sm text-slate-500">{t('tdash.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    {t('tdash.live')}
                </div>
            </div>

            {/* Branch selector — switch the whole dashboard between all branches and one */}
            {branchList.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setBranch('all')}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${branch === 'all'
                            ? 'border-[#0E6E75] bg-[#0E6E75] text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        {t('tdash.all_branches')}
                    </button>
                    {branchList.map((b) => (
                        <button
                            key={b.id}
                            onClick={() => setBranch(String(b.id))}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${String(branch) === String(b.id)
                                ? 'border-[#0E6E75] bg-[#0E6E75] text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            {b.name}
                        </button>
                    ))}
                </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    icon={FiUserPlus}
                    label={t('tdash.new_patients')}
                    value={dash(view.newPatients)}
                    accent="bg-[#0E6E75]/10 text-[#0E6E75]"
                />
                <KpiCard
                    icon={FiUsers}
                    label={t('tdash.returning_patients')}
                    value={dash(view.returningPatients)}
                    accent="bg-violet-100 text-violet-700"
                />
                <KpiCard
                    icon={FiCalendar}
                    label={t('tdash.todays_appointments')}
                    value={dash(appts.total)}
                    accent="bg-sky-100 text-sky-700"
                >
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                            <FiCheckCircle className="text-emerald-500" size={14} />
                            {t('tdash.done')}: <b className="text-slate-700">{dash(appts.done)}</b>
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <FiClock className="text-sky-500" size={14} />
                            {t('tdash.scheduled')}: <b className="text-slate-700">{dash(appts.scheduled)}</b>
                        </span>
                    </div>
                </KpiCard>
                <KpiCard
                    icon={FiDollarSign}
                    label={t('tdash.month_revenue')}
                    value={dash(revenueText(view.revenue))}
                    accent="bg-emerald-100 text-emerald-700"
                />
            </div>

            {/* Main grid: today's appointments (wide) + treatments chart */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Today's appointments */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">{t('tdash.appointments_list')}</h2>
                    <button
                        onClick={load}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                    >
                        <FiRefreshCw size={13} /> {t('exp.refresh')}
                    </button>
                </div>

                {loading && !stats ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-400">{t('tdash.loading')}</div>
                ) : list.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-400">{t('tdash.no_appointments')}</div>
                ) : (
                    <>
                        {/* Desktop / tablet table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full text-start text-sm">
                                <thead className="border-b border-slate-100 text-xs text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3 text-start font-medium">{t('tdash.col_time')}</th>
                                        <th className="px-5 py-3 text-start font-medium">{t('tdash.col_patient')}</th>
                                        <th className="px-5 py-3 text-start font-medium">{t('tdash.col_doctor')}</th>
                                        <th className="px-5 py-3 text-start font-medium">{t('tdash.col_branch')}</th>
                                        <th className="px-5 py-3 text-start font-medium">{t('tdash.col_status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((a) => (
                                        <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                            <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-700">{formatTime(a.scheduled_start)}</td>
                                            <td className="px-5 py-3 text-slate-900">{a.patient_name}</td>
                                            <td className="px-5 py-3 text-slate-600">{a.doctor_name || '—'}</td>
                                            <td className="px-5 py-3 text-slate-600">{a.branch_name}</td>
                                            <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile stacked cards */}
                        <div className="divide-y divide-slate-100 md:hidden">
                            {list.map((a) => (
                                <div key={a.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-slate-900">{a.patient_name}</p>
                                        <p className="truncate text-xs text-slate-500">
                                            {a.doctor_name || '—'} · {a.branch_name}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-slate-600">{formatTime(a.scheduled_start)}</p>
                                    </div>
                                    <StatusBadge status={a.status} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Treatments chart */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">{t('tdash.treatments_title')}</h2>
                        <p className="text-xs text-slate-500">{t('tdash.treatments_hint')}</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E6E75]/10 text-[#0E6E75]">
                        <FiActivity size={16} />
                    </span>
                </div>
                <TreatmentsChart data={treatments} />
            </div>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 gap-4 sm:max-w-md">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <FiGitBranch size={16} />
                    </span>
                    <div>
                        <p className="text-lg font-bold text-slate-900">{dash(stats?.active_branches ?? 0)}</p>
                        <p className="text-xs text-slate-500">{t('tdash.active_branches')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <FiUsers size={16} />
                    </span>
                    <div>
                        <p className="text-lg font-bold text-slate-900">{dash(stats?.total_users ?? 0)}</p>
                        <p className="text-xs text-slate-500">{t('tdash.total_users')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

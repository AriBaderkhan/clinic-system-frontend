import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FiUserPlus, FiUsers, FiCalendar, FiDollarSign, FiRefreshCw,
    FiCheckCircle, FiClock, FiActivity, FiAlertCircle, FiTrendingUp, FiTrendingDown,
} from 'react-icons/fi';
import { getBranchDashboard } from '../../api/branchApi';
import { useSettings } from '../../context/SettingContext';
import { KpiCard, StatusBadge, TreatmentsChart } from '../tenant/Dashboard';
import PageHeader from '../../components/common/PageHeader';

const CARD = 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm';

function CardHead({ title, hint, icon: Icon }) {
    return (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
            </div>
            {Icon ? (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon size={16} />
                </span>
            ) : null}
        </div>
    );
}

// this month vs the same days of last month, one line per currency
function MonthChange({ row }) {
    const { t } = useTranslation();
    const { formatMoney } = useSettings();
    const pct = row.change_percent;
    const up = pct !== null && pct >= 0;
    return (
        <div className="space-y-0.5 text-xs text-slate-500" data-month-change={row.currency_code}>
            {pct === null ? (
                <p>{t('bdash.no_last_month')}</p>
            ) : (
                <p className={`inline-flex items-center gap-1 font-medium ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {up ? <FiTrendingUp size={13} /> : <FiTrendingDown size={13} />}
                    {t('bdash.vs_last_month', { pct: `${up ? '+' : ''}${pct}` })}
                </p>
            )}
            <p>{t('bdash.last_month_total', { money: formatMoney(row.last_month, row.currency_code) })}</p>
        </div>
    );
}

// simple bars: [{ label, value }]
function Bars({ rows, empty }) {
    const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;
    if (!rows.some((r) => r.value > 0)) {
        return <div className="px-5 py-8 text-center text-sm text-slate-400">{empty}</div>;
    }
    return (
        <div className="space-y-2 px-5 py-4">
            {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs font-medium text-slate-600">{r.label}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={`h-full rounded-full ${r.value === max ? 'bg-brand' : 'bg-brand/50'}`}
                            style={{ width: `${Math.round((r.value / max) * 100)}%` }}
                        />
                    </div>
                    <span className="w-8 shrink-0 text-end text-xs font-semibold text-slate-500">{r.value}</span>
                </div>
            ))}
        </div>
    );
}

export default function BranchDashboard() {
    const { t } = useTranslation();
    const { formatTime, formatMoney } = useSettings();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await getBranchDashboard();
            setStats(res.data);
        } catch {
            /* non-fatal — keep last good data */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(load, 60000); // keep today + money live
        return () => clearInterval(id);
    }, [load]);

    const dash = (v) => (stats ? v : '--');
    const appts = stats?.today_appointments || { total: 0, done: 0, scheduled: 0, list: [] };
    const revenue = stats?.revenue || [];
    const unpaid = stats?.unpaid || [];
    const doctors = stats?.doctors || [];
    // lower plans get the short overview: no doctors / busy times / treatments (server leaves them out)
    const full = stats?.full_overview !== false;
    const money = (list, key) => (list.length ? list.map((r) => formatMoney(key ? r[key] : r.total, r.currency_code)).join('   ·   ') : formatMoney(0));
    const unpaidMoney = (kind) => money(unpaid.map((u) => ({ currency_code: u.currency_code, total: u[kind].total })));
    const unpaidCount = (kind) => unpaid.reduce((a, u) => a + u[kind].count, 0);

    // Saturday first (the clinic week)
    const dayRows = [6, 0, 1, 2, 3, 4, 5].map((d) => ({ label: t(`bdash.day_${d}`), value: stats?.busy?.days[d] || 0 }));
    const hourRows = (stats?.busy?.hours || []).map((h) => ({ label: `${String(h.hour).padStart(2, '0')}:00`, value: h.total }));

    return (
        <div className="w-full space-y-5" data-branch-overview>
            <PageHeader
                title={t('bdash.title')}
                subtitle={t('bdash.subtitle')}
                actions={
                    <button
                        onClick={load}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/20"
                    >
                        <FiRefreshCw size={14} /> {t('exp.refresh')}
                    </button>
                }
            />

            {/* today + money */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard icon={FiUserPlus} label={t('tdash.new_patients')} value={dash(stats?.new_patients)} accent="bg-brand/10 text-brand" />
                <KpiCard icon={FiUsers} label={t('tdash.returning_patients')} value={dash(stats?.returning_patients)} accent="bg-violet-100 text-violet-700" />
                <KpiCard icon={FiCalendar} label={t('tdash.todays_appointments')} value={dash(appts.total)} accent="bg-sky-100 text-sky-700">
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
                <KpiCard icon={FiDollarSign} label={t('tdash.month_revenue')} value={dash(money(revenue, 'this_month'))} accent="bg-emerald-100 text-emerald-700">
                    {revenue.map((r) => <MonthChange key={r.currency_code} row={r} />)}
                </KpiCard>
            </div>

            {/* what patients still owe + team */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5" data-unpaid-visits>
                    <p className="flex items-center gap-2 text-sm font-medium text-rose-700"><FiAlertCircle size={15} /> {t('bdash.unpaid_visits')}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{dash(unpaidMoney('visits'))}</p>
                    <p className="mt-1 text-xs text-slate-500">{t('bdash.unpaid_visits_count', { count: unpaidCount('visits') })}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5" data-open-plans>
                    <p className="text-sm font-medium text-amber-800">{t('bdash.open_plans')}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{dash(unpaidMoney('plans'))}</p>
                    <p className="mt-1 text-xs text-slate-500">{t('bdash.open_plans_count', { count: unpaidCount('plans') })}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-medium text-slate-500">{t('bdash.team')}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{dash(stats?.team_members)}</p>
                    <p className="mt-1 text-xs text-slate-500">{t('bdash.team_hint')}</p>
                </div>
            </div>

            {/* doctors this month */}
            {full && (
            <div className={CARD} data-doctors>
                <CardHead title={t('bdash.doctors_title')} hint={t('bdash.doctors_hint')} icon={FiUsers} />
                {doctors.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-400">{t('bdash.no_doctors')}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="border-b border-slate-100 text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 text-start font-medium">{t('tdash.col_doctor')}</th>
                                    <th className="px-5 py-3 text-start font-medium">{t('bdash.col_visits')}</th>
                                    <th className="px-5 py-3 text-start font-medium">{t('bdash.col_patients')}</th>
                                    <th className="px-5 py-3 text-start font-medium">{t('bdash.col_works')}</th>
                                    <th className="px-5 py-3 text-start font-medium">{t('bdash.col_missed')}</th>
                                    <th className="px-5 py-3 text-start font-medium">{t('bdash.col_income')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.map((d) => (
                                    <tr key={d.doctor_id} className="border-b border-slate-50 last:border-0">
                                        <td className="px-5 py-3 font-medium text-slate-900">{d.doctor_name || '—'}</td>
                                        <td className="px-5 py-3 text-slate-700">{d.visits_done}</td>
                                        <td className="px-5 py-3 text-slate-700">{d.patients}</td>
                                        <td className="px-5 py-3 text-slate-700">{d.works_done}</td>
                                        <td className="px-5 py-3 text-slate-700">{d.missed}</td>
                                        <td className="whitespace-nowrap px-5 py-3 font-semibold text-emerald-700">{money(d.income)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            )}

            {/* busy days + hours */}
            {full && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" data-busy>
                <div className={CARD}>
                    <CardHead title={t('bdash.busy_days')} hint={t('bdash.busy_hint', { days: stats?.busy?.days_back || 28 })} />
                    <Bars rows={dayRows} empty={t('bdash.no_busy')} />
                </div>
                <div className={CARD}>
                    <CardHead title={t('bdash.busy_hours')} hint={t('bdash.busy_hint', { days: stats?.busy?.days_back || 28 })} />
                    <Bars rows={hourRows} empty={t('bdash.no_busy')} />
                </div>
            </div>

            )}

            {/* today's appointments + top treatments */}
            <div className={`grid grid-cols-1 gap-6 ${full ? 'xl:grid-cols-3' : ''}`}>
                <div className={`${CARD} ${full ? 'xl:col-span-2' : ''}`}>
                    <CardHead title={t('tdash.appointments_list')} />
                    {loading && !stats ? (
                        <div className="px-5 py-10 text-center text-sm text-slate-400">{t('tdash.loading')}</div>
                    ) : appts.list.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-slate-400">{t('tdash.no_appointments')}</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {appts.list.map((a) => (
                                <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-slate-900">{a.patient_name}</p>
                                        <p className="truncate text-xs text-slate-500">{formatTime(a.scheduled_start)} · {a.doctor_name || '—'}</p>
                                    </div>
                                    <StatusBadge status={a.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {full && (
                <div className={CARD} data-treatments>
                    <CardHead title={t('tdash.treatments_title')} hint={t('tdash.treatments_hint')} icon={FiActivity} />
                    <TreatmentsChart data={stats?.treatments_month || []} />
                </div>
                )}
            </div>
        </div>
    );
}

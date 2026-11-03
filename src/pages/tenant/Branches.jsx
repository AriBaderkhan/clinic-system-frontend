import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getBranches } from '../../api/tenantApi';
import openBranch from '../../utils/openBranch';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';

export default function TenantBranches() {
    const { t } = useTranslation();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        try {
            setLoading(true);
            const data = await getBranches();
            setBranches(data.data || []);
        } catch (error) {
            toast.error(error.userMessage || t('branches.failed_load'));
        } finally {
            setLoading(false);
        }
    };

    // open the branch (same switch as the menu's branch picker), then go to its page
    const openAt = async (branch, to) => {
        try {
            await openBranch(branch.id, to);
        } catch (error) {
            toast.error(error.userMessage || t('branches.failed_switch'));
        }
    };
    const handleManage = (branch) => openAt(branch, '/home');
    const handleWorks = (branch) => openAt(branch, '/works');

    return (
        <div className="w-full space-y-5">
            <PageHeader title={t('branches.title')} />
            {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-card sm:p-5">{t('common.loading')}</div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {branches.map((branch) => (
                        <div
                            key={branch.id}
                            className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:shadow-pop sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="min-w-0 truncate text-[15px] font-semibold text-slate-900">{branch.name}</h3>
                                <button
                                    onClick={() => handleWorks(branch)}
                                    className="shrink-0 cursor-pointer text-sm font-semibold text-brand hover:underline"
                                >
                                    {t('branches.works')} &rarr;
                                </button>
                            </div>
                            <p className="mt-0.5 break-words text-sm text-slate-500">{branch.location}</p>
                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${branch.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {branch.status}
                                </span>
                                <button
                                    onClick={() => handleManage(branch)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-brand transition hover:bg-slate-50"
                                >
                                    {t('branches.manage')} &rarr;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

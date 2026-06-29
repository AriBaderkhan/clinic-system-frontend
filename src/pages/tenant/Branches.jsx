import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getBranches, switchBranch } from '../../api/tenantApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TenantBranches() {
    const { t } = useTranslation();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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

    const handleManage = async (branch) => {
        try {
            const data = await switchBranch(branch.id);
            localStorage.setItem('tenant_token', localStorage.getItem('token'));
            localStorage.setItem('token', data.token);
            navigate('/branch');
        } catch (error) {
            toast.error(error.userMessage || t('branches.failed_switch'));
        }
    };

    const handleWorks = async (branch) => {
        try {
            const data = await switchBranch(branch.id);
            localStorage.setItem('tenant_token', localStorage.getItem('token'));
            localStorage.setItem('token', data.token);
            navigate('/branch/works');
        } catch (error) {
            toast.error(error.userMessage || t('branches.failed_switch'));
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">{t('branches.title')}</h2>
            {loading ? (
                <p>{t('common.loading')}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {branches.map((branch) => (
                        <div
                            key={branch.id}
                            className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg">{branch.name}</h3>
                                <button
                                    onClick={() => handleWorks(branch)}
                                    className="text-[#015478] text-sm font-medium hover:underline cursor-pointer"
                                >
                                    {t('branches.works')} &rarr;
                                </button>
                            </div>
                            <p className="text-sm text-gray-500">{branch.location}</p>
                            <div className="mt-4 flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-xs ${branch.status === 'active' ? 'bg-[#015478]/20 text-[#015478]' : 'bg-red-100 text-red-700'}`}>
                                    {branch.status}
                                </span>
                                <button
                                    onClick={() => handleManage(branch)}
                                    className="text-[#015478] text-sm font-medium hover:underline cursor-pointer"
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

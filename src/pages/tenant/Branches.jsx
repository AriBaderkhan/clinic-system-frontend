import React, { useEffect, useState } from 'react';
import { getBranches, switchBranch } from '../../api/tenantApi';
import { useNavigate } from 'react-router-dom';

export default function TenantBranches() {
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
            setBranches(data);
        } catch (error) {
            console.error("Failed to load branches", error);
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
            console.error("Failed to switch branch", error);
            alert(error.userMessage || "Failed to switch branch");
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Active Branches</h2>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {branches.map((branch) => (
                        <div
                            key={branch.id}
                            className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition"
                        >
                            <h3 className="font-bold text-lg">{branch.name}</h3>
                            <p className="text-sm text-gray-500">{branch.location}</p>
                            <div className="mt-4 flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-xs ${branch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {branch.status}
                                </span>
                                <button
                                    onClick={() => handleManage(branch)}
                                    className="text-blue-600 text-sm font-medium hover:underline cursor-pointer"
                                >
                                    Manage &rarr;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

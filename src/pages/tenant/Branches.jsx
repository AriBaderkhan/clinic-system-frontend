import React, { useEffect, useState } from 'react';
import { getBranches } from '../../api/tenantApi';
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
                            onClick={() => {
                                // Logic to switch context to this branch? 
                                // For now, maybe just show details or login as branch manager?
                                // User asked: "when they click on the branch one let's say the meny bewlow branches will change to the now we have appointments all"
                                // This implies switching the 'current branch' context.
                                alert(`Switching to branch: ${branch.name} (Implementation Pending Step 8)`);
                            }}
                            className="bg-white p-6 rounded-lg shadow border hover:shadow-md cursor-pointer transition"
                        >
                            <h3 className="font-bold text-lg">{branch.name}</h3>
                            <p className="text-sm text-gray-500">{branch.location}</p>
                            <div className="mt-4 flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-xs ${branch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {branch.status}
                                </span>
                                <button className="text-blue-600 text-sm font-medium">Manage &rarr;</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

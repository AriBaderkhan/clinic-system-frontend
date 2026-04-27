import React from 'react';

export default function TenantDashboard() {
    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Welcome, Tenant Manager</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-500">Active Branches</h3>
                    <p className="text-3xl font-bold mt-2">--</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-500">Total Users</h3>
                    <p className="text-3xl font-bold mt-2">--</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-500">License Status</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">Active</p>
                </div>
            </div>
        </div>
    );
}

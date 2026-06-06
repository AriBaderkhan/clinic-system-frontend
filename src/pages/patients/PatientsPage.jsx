import { useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import usePatients from "../../hooks/usePatients";

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { patients, isLoading, error, refresh, deletePatient } = usePatients({
    search: searchTerm,
  });

  // const normalizedSearch = searchTerm.trim().toLowerCase();

  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "reception";
  const prefix = role === "branch_manager" ? "/branch" : "/reception";

  const handleEdit = (id) => {
    navigate(`${prefix}/patients/${id}/edit`);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this patient?"
    );
    if (!confirm) return;

    const result = await deletePatient(id);
    if (!result.ok) {
      toast.error(result.error || "Could not delete patient. Please try again.");
    }
  };

  const handleRowClick = (id) => {
    navigate(`${prefix}/patients/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Patients</h1>
          <p className="text-xs text-slate-500">
            Manage Crown Dental Clinic patients. View records, edit details, and
            handle follow-ups.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`${prefix}/patients/add`)}
          className="rounded-lg bg-[#015478] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#015478]"
        >
          + Add patient
        </button>
      </div>

      {/* Content card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {/* Top bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {isLoading
              ? "Loading patients…"
              : `Total patients: ${patients.length}`}
          </div>
          <div className="flex flex-1 items-center gap-1 min-w-0">
            <span className="shrink-0 text-[11px] text-slate-500">Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Patient, phone"
              className="w-full max-w-xs rounded-md border border-slate-700 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
            />
          </div>
          <button
            type="button"
            onClick={refresh}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && patients.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            No patients found. Click &quot;Add patient&quot; to create the first
            record.
          </div>
        )}

        {/* Table */}
        {patients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Age</th>
                  <th className="px-3 py-2 font-medium">Gender</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleRowClick(p.id)}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 text-slate-800">{p.name}</td>
                    <td className="px-3 py-2 text-slate-700">{p.age}</td>
                    <td className="px-3 py-2 text-slate-700 capitalize">
                      {p.gender}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{p.phone}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {p.address || "-"}
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          type="button"
                          className="rounded-md border border-slate-200 bg-yellow-600 px-3 py-1 text-[11px] text-white hover:bg-yellow-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(p.id);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 bg-red-600 px-3 py-1 text-[11px] text-white hover:bg-red-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


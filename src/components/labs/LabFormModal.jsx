import { useEffect, useState } from "react";
import useWorks from "../../hooks/useWorks";
import { getLabById } from "../../api/labApi";

export default function LabFormModal({ mode = "add", labId, onClose, onSubmit, isSubmitting = false }) {
  const { works, isLoading: isWorksLoading } = useWorks();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState([{ work_id: "", cost: "" }]);
  const [error, setError] = useState("");
  const [isLoadingLab, setIsLoadingLab] = useState(mode === "edit");

  // edit mode: load the lab with its price list
  useEffect(() => {
    if (mode !== "edit" || !labId) return;
    (async () => {
      try {
        setIsLoadingLab(true);
        const res = await getLabById(labId);
        const lab = res.data;
        setName(lab.name || "");
        setPhone(lab.phone || "");
        setRows(
          lab.treatments?.length > 0
            ? lab.treatments.map((t) => ({ work_id: String(t.work_id), cost: String(t.cost) }))
            : [{ work_id: "", cost: "" }]
        );
      } catch (err) {
        setError(err.userMessage || "Could not load lab.");
      } finally {
        setIsLoadingLab(false);
      }
    })();
  }, [mode, labId]);

  const updateRow = (idx, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { work_id: "", cost: "" }]);

  const removeRow = (idx) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  // works already used in other rows can't be picked twice
  const usedWorkIds = rows.map((r) => r.work_id).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || name.trim().length < 2) {
      setError("Lab name is required (at least 2 characters).");
      return;
    }

    const treatments = [];
    for (const r of rows) {
      if (!r.work_id || r.cost === "") {
        setError("Every treatment row needs a treatment and a cost.");
        return;
      }
      if (Number(r.cost) < 0) {
        setError("Cost cannot be negative.");
        return;
      }
      treatments.push({ work_id: Number(r.work_id), cost: Number(r.cost) });
    }

    if (treatments.length === 0) {
      setError("Add at least one treatment with its cost.");
      return;
    }

    await onSubmit({ name: name.trim(), phone: phone.trim() || null, treatments });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-4 sm:p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {mode === "add" ? "Add Lab" : "Edit Lab"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Lab info and the cost of each treatment this lab offers.
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {isLoadingLab ? (
          <p className="text-xs text-slate-500">Loading lab…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Name + Phone */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Lab Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Farhan Lab"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Phone (optional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07xx xxx xxxx"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                />
              </div>
            </div>

            {/* Price list */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase text-slate-500">
                  Treatments &amp; Costs
                </p>
                <button
                  type="button"
                  onClick={addRow}
                  className="rounded-md bg-[#015478] px-3 py-1 text-[11px] font-medium text-white hover:bg-[#013d58]"
                >
                  + Add Treatment
                </button>
              </div>

              {isWorksLoading ? (
                <p className="text-xs text-slate-500">Loading treatments…</p>
              ) : (
                <div className="space-y-2">
                  {rows.map((row, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2">
                      <select
                        value={row.work_id}
                        onChange={(e) => updateRow(idx, "work_id", e.target.value)}
                        className="flex-1 min-w-[160px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                      >
                        <option value="">Select treatment</option>
                        {works.map((w) => (
                          <option
                            key={w.id}
                            value={String(w.id)}
                            disabled={usedWorkIds.includes(String(w.id)) && row.work_id !== String(w.id)}
                          >
                            {w.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.cost}
                        onChange={(e) => updateRow(idx, "cost", e.target.value)}
                        placeholder="Cost"
                        className="w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                      />

                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={rows.length === 1}
                        className="rounded-md border border-red-200 bg-red-600 px-3 py-2 text-[11px] text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#015478] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#013d58] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : mode === "add" ? "Create Lab" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { searchLabs, getLabById, getLabOrderById } from "../../api/labApi";
import { getAllAppointments } from "../../api/appointmentApi";
import { useSettings } from "../../context/SettingContext";

export default function LabOrderFormModal({ mode = "add", initialData, onClose, onSubmit, isSubmitting = false }) {
  // appointment times shown in the branch's configured timezone
  const { formatDateTime: formatDateTimeTz, formatMoney } = useSettings();
  const formatApptLabel = (a) =>
    `${a.patient_name} · Dr. ${a.doctor_name} · ${a.scheduled_start ? formatDateTimeTz(a.scheduled_start) : "-"}`;

  const [error, setError] = useState("");

  // ------------------ LAB SEARCH ------------------
  const [labQuery, setLabQuery] = useState(
    mode === "edit" && initialData ? initialData.lab_name : ""
  );
  const [selectedLab, setSelectedLab] = useState(
    mode === "edit" && initialData ? { id: initialData.lab_id, name: initialData.lab_name } : null
  );
  const [labResults, setLabResults] = useState([]);
  const [isLabSearching, setIsLabSearching] = useState(false);

  // treatments of the selected lab (only these can be ordered)
  const [labTreatments, setLabTreatments] = useState([]);
  const [isTreatmentsLoading, setIsTreatmentsLoading] = useState(false);

  // ------------------ APPOINTMENT SEARCH (patient + doctor come from it) ------------------
  const [apptQuery, setApptQuery] = useState("");
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [apptResults, setApptResults] = useState([]);
  const [isApptSearching, setIsApptSearching] = useState(false);

  // ------------------ TREATMENT ROWS + NOTES ------------------
  const [rows, setRows] = useState(
    initialData?.items?.length > 0
      ? initialData.items.map((it) => ({ work_id: String(it.work_id), quantity: String(it.quantity) }))
      : [{ work_id: "", quantity: "1" }]
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // debounced lab search (add mode only — lab can't change on edit)
  useEffect(() => {
    if (mode === "edit") return;
    const q = labQuery.trim();
    if (!q || q.length < 2 || (selectedLab && q === selectedLab.name)) {
      setLabResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLabSearching(true);
        const res = await searchLabs(q);
        setLabResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setLabResults([]);
      } finally {
        setIsLabSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [labQuery, selectedLab, mode]);

  // debounced appointment search by patient name/phone or doctor (add mode only)
  useEffect(() => {
    if (mode === "edit") return;
    const q = apptQuery.trim();
    if (!q || q.length < 2 || (selectedAppt && q === formatApptLabel(selectedAppt))) {
      setApptResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsApptSearching(true);
        const res = await getAllAppointments({ q, limit: 10 });
        setApptResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setApptResults([]);
      } finally {
        setIsApptSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [apptQuery, selectedAppt, mode]);

  // edit mode: load this order's existing items into the rows
  useEffect(() => {
    if (mode !== "edit" || !initialData?.id) return;
    (async () => {
      try {
        const res = await getLabOrderById(initialData.id);
        const items = res.data?.items ?? [];
        if (items.length > 0) {
          setRows(items.map((it) => ({ work_id: String(it.work_id), quantity: String(it.quantity) })));
        }
      } catch {
        /* keep default row */
      }
    })();
  }, [mode, initialData?.id]);

  // load the price list whenever a lab is selected
  useEffect(() => {
    if (!selectedLab?.id) {
      setLabTreatments([]);
      return;
    }
    (async () => {
      try {
        setIsTreatmentsLoading(true);
        const res = await getLabById(selectedLab.id);
        setLabTreatments(res.data?.treatments ?? []);
      } catch (err) {
        setError(err.userMessage || "Could not load lab treatments.");
        setLabTreatments([]);
      } finally {
        setIsTreatmentsLoading(false);
      }
    })();
  }, [selectedLab]);

  const handleLabSelect = (lab) => {
    setSelectedLab(lab);
    setLabQuery(lab.name);
    setLabResults([]);
    setRows([{ work_id: "", quantity: "1" }]); // treatments differ per lab
  };

  const handleApptSelect = (a) => {
    setSelectedAppt(a);
    setApptQuery(formatApptLabel(a));
    setApptResults([]);
  };

  const updateRow = (idx, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };
  const addRow = () => setRows((prev) => [...prev, { work_id: "", quantity: "1" }]);
  const removeRow = (idx) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  // a treatment already chosen in another row can't be picked again
  const usedWorkIds = rows.map((r) => r.work_id).filter(Boolean);

  const costOf = (workId) => {
    const t = labTreatments.find((t) => String(t.work_id) === String(workId));
    return t ? Number(t.cost) : 0;
  };

  // live total = sum of (cost × quantity) over all rows
  const total = rows.reduce((sum, r) => sum + costOf(r.work_id) * (Number(r.quantity) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "add" && !selectedLab?.id) {
      setError("Please select a lab from the list.");
      return;
    }
    if (mode === "add" && !selectedAppt?.id) {
      setError("Please select an appointment from the list.");
      return;
    }

    const items = [];
    for (const r of rows) {
      if (!r.work_id || Number(r.quantity) < 1) {
        setError("Every treatment row needs a treatment and a quantity of at least 1.");
        return;
      }
      items.push({ work_id: Number(r.work_id), quantity: Number(r.quantity) });
    }
    if (items.length === 0) {
      setError("Add at least one treatment.");
      return;
    }

    const payload = { items, notes: notes.trim() || null };

    if (mode === "add") {
      payload.lab_id = Number(selectedLab.id);
      payload.appointment_id = Number(selectedAppt.id);
    }

    await onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white p-4 sm:p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {mode === "add" ? "Make Order" : "Edit Order"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Pick the appointment — patient and doctor are taken from it automatically.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* APPOINTMENT FIELD */}
          {mode === "add" ? (
            <div className="relative space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Appointment (search by patient name, phone or doctor)
              </label>
              <input
                type="text"
                value={apptQuery}
                onChange={(e) => {
                  setApptQuery(e.target.value);
                  setSelectedAppt(null);
                }}
                placeholder="Start typing: e.g. Ari..."
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
              />
              {isApptSearching && <p className="mt-1 text-[11px] text-slate-500">Searching…</p>}

              {apptResults.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white text-sm shadow-lg">
                  {apptResults.map((a) => (
                    <li
                      key={a.id}
                      onClick={() => handleApptSelect(a)}
                      className="cursor-pointer px-3 py-2 text-slate-800 hover:bg-slate-100"
                    >
                      <div className="font-medium">
                        {a.patient_name}
                        <span className="ml-2 text-xs font-normal text-slate-500">{a.patient_phone}</span>
                      </div>
                      <div className="text-xs text-slate-500 capitalize">
                        Dr. {a.doctor_name} ·{" "}
                        {a.scheduled_start ? formatDateTimeTz(a.scheduled_start) : "-"} ·{" "}
                        {a.status?.replace("_", " ")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {selectedAppt && (
                <div className="mt-1 rounded-xl border border-[#015478]/10 bg-[#015478]/5 px-3 py-2 text-xs text-slate-700">
                  <span className="font-medium">{selectedAppt.patient_name}</span> ·{" "}
                  {selectedAppt.patient_phone || "no phone"} · Dr.{" "}
                  <span className="capitalize">{selectedAppt.doctor_name}</span>
                </div>
              )}
            </div>
          ) : (
            // edit mode: patient/doctor are fixed, shown read-only
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <span className="font-medium">{initialData?.patient_name}</span> ·{" "}
              {initialData?.patient_phone || "no phone"} · Dr.{" "}
              <span className="capitalize">{initialData?.doctor_name}</span>
            </div>
          )}

          {/* LAB FIELD */}
          <div className="relative space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Lab (type to search)
            </label>
            <input
              type="text"
              value={labQuery}
              disabled={mode === "edit"}
              onChange={(e) => {
                setLabQuery(e.target.value);
                setSelectedLab(null);
              }}
              placeholder="Start typing: e.g. Far..."
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478] disabled:bg-slate-100 disabled:text-slate-500"
            />
            {isLabSearching && <p className="mt-1 text-[11px] text-slate-500">Searching…</p>}

            {labResults.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white text-sm shadow-lg">
                {labResults.map((lab) => (
                  <li
                    key={lab.id}
                    onClick={() => handleLabSelect(lab)}
                    className="cursor-pointer px-3 py-2 text-slate-800 hover:bg-slate-100"
                  >
                    <div className="font-medium">{lab.name}</div>
                    {lab.phone && <div className="text-xs text-slate-500">{lab.phone}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* TREATMENTS (repeatable rows, only this lab's price list) */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase text-slate-500">Treatments</label>
              <button
                type="button"
                onClick={addRow}
                disabled={!selectedLab || labTreatments.length === 0}
                className="rounded-md bg-[#015478] px-3 py-1 text-[11px] font-medium text-white hover:bg-[#013d58] disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add Treatment
              </button>
            </div>

            {!selectedLab ? (
              <p className="text-xs text-slate-500">Select a lab first to choose treatments.</p>
            ) : isTreatmentsLoading ? (
              <p className="text-xs text-slate-500">Loading treatments…</p>
            ) : labTreatments.length === 0 ? (
              <p className="text-xs text-slate-500">This lab has no treatments configured.</p>
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
                      {labTreatments.map((t) => (
                        <option
                          key={t.work_id}
                          value={String(t.work_id)}
                          disabled={usedWorkIds.includes(String(t.work_id)) && row.work_id !== String(t.work_id)}
                        >
                          {t.work_name} – {formatMoney(t.cost)}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => updateRow(idx, "quantity", e.target.value)}
                      placeholder="Qty"
                      className="w-20 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                    />

                    <span className="w-24 text-right text-xs text-slate-600">
                      {formatMoney(costOf(row.work_id) * (Number(row.quantity) || 0))}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length === 1}
                      className="rounded-md border border-red-200 bg-red-600 px-2.5 py-2 text-[11px] text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LIVE TOTAL */}
          <div className="rounded-xl border border-[#015478]/10 bg-[#015478]/5 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs text-slate-600">Order total</span>
              <span className="text-base font-semibold text-[#015478]">
                {formatMoney(total)}
              </span>
            </div>
          </div>

          {/* NOTES */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Shade, special instructions..."
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
            />
          </div>

          {/* SUBMIT */}
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
              {isSubmitting ? (mode === "add" ? "Ordering..." : "Saving...") : mode === "add" ? "Make Order" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

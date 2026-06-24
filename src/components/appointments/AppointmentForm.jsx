import { useEffect, useState } from "react";
import { searchPatients } from "../../api/patientApi";

// "YYYY-MM-DDTHH:mm" -> { date, hour (1-12), minute, period }
function parseDateTimeLocal(value) {
  if (!value || !value.includes("T")) return { date: "", hour: "", minute: "", period: "AM" };
  const [date, time] = value.split("T");
  const [H, M] = time.split(":").map(Number);
  const period = H >= 12 ? "PM" : "AM";
  const hour12 = H % 12 === 0 ? 12 : H % 12;
  return { date, hour: String(hour12), minute: String(M).padStart(2, "0"), period };
}

export default function AppointmentForm({
  mode = "add",             // "add" | "edit"
  initialData,              // used only in edit
  doctors = [],
  onSubmit,
  isSubmitting = false,
  error,
  defaultScheduledStart = "",  // prefill date/time in add mode (e.g. from calendar day click)
}) {
  // ------------------ PATIENT SEARCH ------------------
  const [patientQuery, setPatientQuery] = useState(
    mode === "edit" && initialData
      ? `${initialData.patient_name} – ${initialData.patient_phone}`
      : ""
  );
  const [selectedPatient, setSelectedPatient] = useState(
    mode === "edit" && initialData
      ? {
        id: initialData.patient_id,
        name: initialData.patient_name,
        phone: initialData.patient_phone,
      }
      : null
  );
  const [patientResults, setPatientResults] = useState([]);
  const [isPatientSearching, setIsPatientSearching] = useState(false);
  const [patientError, setPatientError] = useState("");

  // ------------------ OTHER FIELDS ------------------
  const initialDT = parseDateTimeLocal(
    initialData?.scheduled_start?.slice(0, 16) ?? defaultScheduledStart ?? ""
  );

  const [form, setForm] = useState({
    patient_id: initialData?.patient_id ? String(initialData.patient_id) : "",
    doctor_id: initialData?.doctor_id ? String(initialData.doctor_id) : "",
    appointment_type: initialData?.appointment_type ?? "normal",
    date: initialDT.date,
    hour: initialDT.hour,
    minute: initialDT.minute,
    period: initialDT.period,
    complaint: initialData?.complaint ?? "",
  });

  useEffect(() => {
    if (!initialData || mode !== "edit") return;

    const dt = parseDateTimeLocal(initialData.scheduled_start.slice(0, 16));

    setForm({
      doctor_id: initialData.doctor_id ? String(initialData.doctor_id) : "",
      appointment_type: initialData.appointment_type ?? "normal",
      date: dt.date,
      hour: dt.hour,
      minute: dt.minute,
      period: dt.period,
      complaint: initialData.complaint ?? "",
    });

    // ADD THIS PART - Make sure selectedPatient is set correctly in edit mode
    setSelectedPatient({
      id: initialData.patient_id,
      name: initialData.patient_name,
      phone: initialData.patient_phone,
    });

    setPatientQuery(`${initialData.patient_name} – ${initialData.patient_phone}`);
  }, [initialData, mode]);

  useEffect(() => {
    const q = patientQuery.trim();
    setPatientError("");

    // Skip search if in edit mode and query hasn't changed from initial
    if (mode === "edit" && initialData &&
      q === `${initialData.patient_name} – ${initialData.patient_phone}`) {
      setPatientResults([]);
      return;
    }

    if (!q || q.length < 2) {
      setPatientResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsPatientSearching(true);
        const res = await searchPatients(q);
        const data = res.data;

        const list = Array.isArray(data)
          ? data
          : data.patients || data.data || [];

        setPatientResults(list);
      } catch (err) {
        setPatientError("Could not search patients. Try again.");
        setPatientResults([]);
      } finally {
        setIsPatientSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientQuery, mode, initialData]);

  const handlePatientSelect = (p) => {
    setSelectedPatient(p);
    setPatientQuery(`${p.name} – ${p.phone}`);
    setPatientResults([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let patient_id;

    // In both modes, check if patient is selected
    if (!selectedPatient?.id) {
      setPatientError("Please select a patient from the list.");
      return;
    }

    patient_id = selectedPatient.id;

    if (!form.doctor_id || !form.date || form.hour === "" || form.minute === "") {
      setPatientError("Doctor, date and time are required.");
      return;
    }

    const hourNum = Number(form.hour);
    const minuteNum = Number(form.minute);

    if (!Number.isInteger(hourNum) || hourNum < 1 || hourNum > 12) {
      setPatientError("Hour must be between 1 and 12.");
      return;
    }
    if (!Number.isInteger(minuteNum) || minuteNum < 0 || minuteNum > 59) {
      setPatientError("Minutes must be between 0 and 59.");
      return;
    }

    // 3:30 + PM -> 15:30
    let hour24 = hourNum % 12;
    if (form.period === "PM") hour24 += 12;

    const scheduledStart = `${form.date}T${String(hour24).padStart(2, "0")}:${String(minuteNum).padStart(2, "0")}`;

    const basePayload = {
      patient_id: Number(patient_id),  // Always include patient_id
      doctor_id: Number(form.doctor_id),
      scheduled_start: new Date(scheduledStart).toISOString(),
      complaint: form.complaint?.trim() || null,
    };

    let payload;

    if (mode === "add") {
      payload = {
        ...basePayload,
        appointment_type: form.appointment_type,
      };
    } else {
      // EDIT mode - send patient_id, doctor_id, and scheduled_start
      payload = basePayload;
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(error || patientError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error || patientError}
        </div>
      )}

      {/* PATIENT FIELD */}
      {mode === "add" || mode === "edit" ? (
        <div className="relative space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Patient (type name or phone)
          </label>
          <input
            type="text"
            value={patientQuery}
            onChange={(e) => {
              setPatientQuery(e.target.value);
              setSelectedPatient(null);
            }}
            placeholder="Start typing: e.g. Ari..."
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
          />
          {isPatientSearching && (
            <p className="mt-1 text-[11px] text-slate-500">Searching…</p>
          )}

          {patientResults.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white text-sm shadow-lg">
              {patientResults.map((p) => (
                <li
                  key={p.id}
                  onClick={() => handlePatientSelect(p)}
                  className="cursor-pointer px-3 py-2 text-slate-800 hover:bg-slate-100"
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.phone}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* DOCTOR SELECT */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Doctor
        </label>
        <select
          name="doctor_id"
          value={form.doctor_id}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
        >
          <option value="">Select doctor</option>
          {doctors.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.full_name ?? d.doctor_name ?? `Doctor #${d.id}`}
              {d.room ? ` – Room ${d.room}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* DATE / TIME */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Appointment Date &amp; Time
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
          />

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              name="hour"
              min="1"
              max="12"
              placeholder="3"
              value={form.hour}
              onChange={handleChange}
              className="w-16 rounded-md border border-slate-200 px-2 py-2 text-center text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
            />
            <span className="text-sm font-semibold text-slate-400">:</span>
            <input
              type="number"
              name="minute"
              min="0"
              max="59"
              placeholder="30"
              value={form.minute}
              onChange={handleChange}
              className="w-16 rounded-md border border-slate-200 px-2 py-2 text-center text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
            />
            <select
              name="period"
              value={form.period}
              onChange={handleChange}
              className="rounded-md border border-slate-200 px-2 py-2 text-sm font-semibold text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Example: 3 : 30 PM = 15:30 · Clinic rules: normal = 1 hour spacing, urgent / walk-in can ignore.
        </p>
      </div>

      {/* TYPE */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Appointment Type
        </label>
        <select
          name="appointment_type"
          value={form.appointment_type}
          onChange={handleChange}
          disabled={mode === "edit"}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
        >
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
          <option value="walk_in">Walk-in</option>
        </select>
      </div>

      {/* COMPLAINT */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Complaint <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          name="complaint"
          value={form.complaint}
          onChange={handleChange}
          rows={2}
          placeholder="e.g. Toothache upper right, sensitivity to cold"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
        />
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#015478] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#015478] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? mode === "add"
              ? "Creating..."
              : "Saving..."
            : mode === "add"
              ? "Create Appointment"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

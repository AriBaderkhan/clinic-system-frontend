// src/components/appointments/AppointmentForm.jsx
import { useEffect, useState } from "react";
import patientApi from "../../api/patientApi";

function AppointmentForm({
  mode = "add",             // "add" | "edit"
  initialData,              // used only in edit
  doctors = [],
  onSubmit,
  isSubmitting = false,
  error,
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
  const [form, setForm] = useState({
    patient_id: initialData?.patient_id ? String(initialData.patient_id) : "",
    doctor_id: initialData?.doctor_id ? String(initialData.doctor_id) : "",
    appointment_type: initialData?.appointment_type ?? "normal",
    scheduled_start:
      initialData?.scheduled_start?.slice(0, 16) ?? "", // datetime-local format
  });

  // useEffect(() => {
  //   if (!initialData || mode !== "edit") return;
  //   setForm({
  //     doctor_id: initialData.doctor_id ? String(initialData.doctor_id) : "",
  //     appointment_type: initialData.appointment_type ?? "normal",
  //     scheduled_start: initialData.scheduled_start.slice(0, 16),
  //   });
  // }, [initialData, mode]);

  useEffect(() => {
    if (!initialData || mode !== "edit") return;

    setForm({
      doctor_id: initialData.doctor_id ? String(initialData.doctor_id) : "",
      appointment_type: initialData.appointment_type ?? "normal",
      scheduled_start: initialData.scheduled_start.slice(0, 16),
    });

    // ADD THIS PART - Make sure selectedPatient is set correctly in edit mode
    setSelectedPatient({
      id: initialData.patient_id,
      name: initialData.patient_name,
      phone: initialData.patient_phone,
    });

    setPatientQuery(`${initialData.patient_name} – ${initialData.patient_phone}`);
  }, [initialData, mode]);

  // 🔍 debounce patient search (ADD mode only)
  // useEffect(() => {
  //   // if (mode === "edit") return;

  //   const q = patientQuery.trim();
  //   setPatientError("");

  //   if (!q || q.length < 2) {
  //     setPatientResults([]);
  //     return;
  //   }

  //   const timer = setTimeout(async () => {
  //     try {
  //       setIsPatientSearching(true);
  //       const res = await patientApi.searchPatients(q);
  //       const data = res.data;

  //       const list = Array.isArray(data)
  //         ? data
  //         : data.patients || data.data || [];

  //       setPatientResults(list);
  //     } catch (err) {
  //       console.error("Patient search failed:", err);
  //       setPatientError("Could not search patients. Try again.");
  //       setPatientResults([]);
  //     } finally {
  //       setIsPatientSearching(false);
  //     }
  //   }, 300);

  //   return () => clearTimeout(timer);
  // }, [patientQuery, mode]);

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
        const res = await patientApi.searchPatients(q);
        const data = res.data;

        const list = Array.isArray(data)
          ? data
          : data.patients || data.data || [];

        setPatientResults(list);
      } catch (err) {
        console.error("Patient search failed:", err);
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

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   let patient_id;

  //   if (mode === "add") {
  //     if (!selectedPatient?.id) {
  //       setPatientError("Please select a patient from the list.");
  //       return;
  //     }
  //     patient_id = selectedPatient.id;
  //   } else {
  //     if (!selectedPatient?.id) {
  //       setPatientError("Please select a patient from the list.");
  //       return;
  //     }
  //     patient_id = selectedPatient.id;
  //   }


  //   if (!form.doctor_id || !form.scheduled_start) {
  //     setPatientError("Doctor and date/time are required.");
  //     return;
  //   }

  //   const basePayload = {
  //     doctor_id: Number(form.doctor_id),
  //     scheduled_start: new Date(form.scheduled_start).toISOString(),
  //   };

  //   let payload;

  //   if (mode === "add") {
  //     payload = {
  //       ...basePayload,
  //       patient_id: Number(patient_id),
  //       appointment_type: form.appointment_type, // only send in ADD
  //     };
  //   } else {
  //     // EDIT -> only doctor + time
  //     payload = { ...basePayload, patient_id: Number(patient_id) };
  //   }

  //   await onSubmit(payload);
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let patient_id;

    // In both modes, check if patient is selected
    if (!selectedPatient?.id) {
      setPatientError("Please select a patient from the list.");
      return;
    }

    patient_id = selectedPatient.id;

    if (!form.doctor_id || !form.scheduled_start) {
      setPatientError("Doctor and date/time are required.");
      return;
    }

    const basePayload = {
      patient_id: Number(patient_id),  // Always include patient_id
      doctor_id: Number(form.doctor_id),
      scheduled_start: new Date(form.scheduled_start).toISOString(),
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

    console.log("🔍 Mode:", mode);
    console.log("🔍 Selected Patient:", selectedPatient);
    console.log("🔍 Payload being sent:", payload);
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
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
      )
        // : (
        //   <div className="space-y-1">
        //     <label className="block text-xs font-medium text-slate-700">
        //       Patient
        //     </label>
        //     <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
        //       {initialData?.patient_name} –{" "}
        //       <span className="text-slate-500">{initialData?.patient_phone}</span>
        //     </div>
        //   </div>
        // )
        : null}

      {/* DOCTOR SELECT */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Doctor
        </label>
        <select
          name="doctor_id"
          value={form.doctor_id}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
        <input
          type="datetime-local"
          name="scheduled_start"
          value={form.scheduled_start}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Clinic rules: normal = 1 hour spacing, urgent / walk-in can ignore.
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
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
          <option value="walk_in">Walk-in</option>
        </select>
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
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

export default AppointmentForm;

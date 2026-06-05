import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PatientForm from "../../components/patients/PatientForm";
import usePatients from "../../hooks/usePatients";
import { getPatientById } from "../../api/patientApi";

export default function EditPatient() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const { updatePatient, isSubmitting } = usePatients({ skipFetch: true });

  const [patient, setPatient] = useState(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Load single patient by ID
  useEffect(() => {
    let isMounted = true;

    async function fetchPatient() {
      try {
        setIsLoadingPatient(true);
        setLoadError("");

        const res = await getPatientById(patientId);
        // assume backend: { message, patient: {...} }
        const data = res.data?.patient || res.data;
        if (isMounted) setPatient(data);
      } catch (err) {
        if (isMounted)
          setLoadError(err.userMessage || "Could not load patient. Please try again.");
      } finally {
        if (isMounted) setIsLoadingPatient(false);
      }
    }

    fetchPatient();
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const handleUpdate = async (payload) => {
    const result = await updatePatient(patientId, payload);
    if (!result.ok) {
      toast.error(result.error || "Could not update patient.");
      return;
    }
    navigate("/reception/patients");
  };

  if (isLoadingPatient) {
    return <p className="p-4 text-sm text-slate-500">Loading patient...</p>;
  }

  if (loadError || !patient) {
    return (
      <div className="p-4">
        <p className="mb-3 text-sm text-red-600">{loadError || "Patient not found."}</p>
        <button
          onClick={() => navigate("/dashboard/patients")}
          className="rounded-md bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
        >
          Back to patients
        </button>
      </div>
    );
  }

  return (
    <PatientForm
      mode="edit"
      initialData={patient}
      onSubmit={handleUpdate}
      isSubmitting={isSubmitting}
    />
  );
}

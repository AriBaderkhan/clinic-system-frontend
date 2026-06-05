import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PatientForm from "../../components/patients/PatientForm";
import usePatients from "../../hooks/usePatients";

export default function AddPatient() {
  const { createPatients, isSubmitting } = usePatients({ skipFetch: true });
  const navigate = useNavigate();

  const handleCreate = async (payload) => {
    const result = await createPatients(payload);
    if (result.ok) {
      navigate("/branch/patients");
    } else {
      toast.error(result.error || "Could not create patient.");
    }
  };

  return (
    <PatientForm
      mode="add"
      initialData={null}
      onSubmit={handleCreate}
      isSubmitting={isSubmitting}
    />
  );
}

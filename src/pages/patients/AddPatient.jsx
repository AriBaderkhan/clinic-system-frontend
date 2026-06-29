import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import PatientForm from "../../components/patients/PatientForm";
import usePatients from "../../hooks/usePatients";

export default function AddPatient() {
  const { t } = useTranslation();
  const { createPatients, isSubmitting } = usePatients({ skipFetch: true });
  const navigate = useNavigate();

  const handleCreate = async (payload) => {
    const result = await createPatients(payload);
    if (result.ok) {
      navigate("/branch/patients");
    } else {
      toast.error(result.error || t("patient_form.create_failed"));
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

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import PatientForm from "../../components/patients/PatientForm";
import usePatients from "../../hooks/usePatients";
import { checkPatientPhone } from "../../api/patientApi";

export default function AddPatient() {
  const { t } = useTranslation();
  const { createPatients, isSubmitting } = usePatients({ skipFetch: true });
  const navigate = useNavigate();

  const handleCreate = async (payload) => {
    // same phone in another branch? ask them to share the patient instead of making a second file
    try {
      const res = await checkPatientPhone(payload.phone);
      const where = (res.data?.elsewhere || []).map((b) => b.branch_name).join(", ");
      if (where && !window.confirm(t("share.phone_elsewhere", { branches: where }))) return;
    } catch {
      // the check is only a helper: never block adding a patient because of it
    }
    const result = await createPatients(payload);
    if (result.ok) {
      navigate("/patients");
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

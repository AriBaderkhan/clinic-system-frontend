import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import PatientForm from "../../components/patients/PatientForm";
import usePatients from "../../hooks/usePatients";
import { getPatientById } from "../../api/patientApi";
import PageHeader from "../../components/common/PageHeader";

export default function EditPatient() {
  const { t } = useTranslation();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // back to where the edit was opened from (the patient's folder), else the
  const returnTo = location.state?.returnTo || `/patients`;

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
          setLoadError(err.userMessage || t("patient_form.load_failed"));
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
      toast.error(result.error || t("patient_form.update_failed"));
      return;
    }
    navigate(returnTo);
  };

  if (isLoadingPatient) {
    return (
      <div className="w-full space-y-5">
        <PageHeader title={t("patient_form.edit_title")} subtitle={t("patient_form.edit_subtitle")} />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          <p className="py-10 text-center text-sm text-slate-500">{t("patient_form.loading_patient")}</p>
        </div>
      </div>
    );
  }

  if (loadError || !patient) {
    return (
      <div className="w-full space-y-5">
        <PageHeader title={t("patient_form.edit_title")} subtitle={t("patient_form.edit_subtitle")} />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{loadError || t("patient_form.not_found")}</p>
          <button
            onClick={() => navigate(returnTo)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("patient_form.back_to_patients")}
          </button>
        </div>
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

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getAppointmentById, editAppointment } from "../../api/appointmentApi";
import useDoctors from "../../hooks/useDoctors";
import AppointmentForm from "../../components/appointments/AppointmentForm";
import PageHeader from "../../components/common/PageHeader";

export default function EditAppointment() {
  const { t } = useTranslation();
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const { doctors } = useDoctors();
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadAppointment() {
      try {
        setIsLoading(true);
        setLoadError("");
        const res = await getAppointmentById(appointmentId);
        setAppointment(res.data?.appointment || res.data);
      } catch (err) {
        setLoadError(err.userMessage || t("appt.load_failed"));
      } finally {
        setIsLoading(false);
      }
    }
    loadAppointment();
  }, [appointmentId]);

  const handleSubmit = async (formValues) => {
    try {
      setIsSubmitting(true);
      await editAppointment(appointmentId, {
        patient_id: formValues.patient_id,
        doctor_id: formValues.doctor_id,
        scheduled_start: formValues.scheduled_start,
      });
      navigate("/appointments");
    } catch (err) {
      toast.error(err.userMessage || t("appt.update_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      <PageHeader title={t("appt.edit_title")} subtitle={t("appt.edit_subtitle")} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        {isLoading && <p className="py-10 text-center text-sm text-slate-500">{t("appt.loading_appt")}</p>}

        {loadError && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {!isLoading && !appointment && !loadError && (
          <p className="py-10 text-center text-sm text-slate-500">{t("appt.not_found_edit")}</p>
        )}

        {!isLoading && appointment && (
          <AppointmentForm
            mode="edit"
            initialData={appointment}
            doctors={doctors}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

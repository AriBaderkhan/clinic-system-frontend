import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { createAppointment } from "../../api/appointmentApi";
import useDoctors from "../../hooks/useDoctors";
import AppointmentForm from "../../components/appointments/AppointmentForm";
import PageHeader from "../../components/common/PageHeader";

export default function AddAppointment() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // date prefill from calendar day click (?date=YYYY-MM-DD)
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const defaultScheduledStart = /^\d{4}-\d{2}-\d{2}$/.test(dateParam || "") ? `${dateParam}T09:00` : "";

  const { doctors, isLoading, error: doctorsError } = useDoctors();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      await createAppointment(payload);
      navigate(`/appointments`);
    } catch (err) {
      toast.error(err.userMessage || t("appt.create_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      <PageHeader title={t("appt.add_title")} subtitle={t("appt.add_subtitle")} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-slate-500">{t("appt.loading_short")}</div>
        ) : (
          <AppointmentForm
            mode="add"
            doctors={doctors}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={doctorsError}
            defaultScheduledStart={defaultScheduledStart}
          />
        )}
      </div>
    </div>
  );
}

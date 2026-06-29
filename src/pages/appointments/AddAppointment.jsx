import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { createAppointment } from "../../api/appointmentApi";
import useDoctors from "../../hooks/useDoctors";
import AppointmentForm from "../../components/appointments/AppointmentForm";

export default function AddAppointment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "reception";
  const prefix = (role === "branch_manager" || role === "tenant_manager") ? "/branch" : "/reception";

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
      navigate(`${prefix}/appointments`);
    } catch (err) {
      toast.error(err.userMessage || t("appt.create_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{t("appt.add_title")}</h1>
          <p className="text-xs text-slate-500">
            {t("appt.add_subtitle")}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {isLoading ? (
          <div className="text-xs text-slate-500">{t("appt.loading_short")}</div>
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

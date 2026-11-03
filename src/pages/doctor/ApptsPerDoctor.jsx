import { useState } from "react";
import { useTranslation } from "react-i18next";
import useApptsPerDoc from "../../hooks/useApptsPerDoctor";
import CalendarAppointmentModal from "../../components/appointments/CalendarAppointmentModal";
import { useSettings } from "../../context/SettingContext";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";

const SELECT =
    "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";
const BTN_SECONDARY =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

export default function ApptsPerDoctor() {
    const { t } = useTranslation();
    const { formatDateTime } = useSettings();
    const { user } = useAuth();


    // ---------- FILTER STATE ----------
    const [dayFilter, setDayFilter] = useState("");   // '', 'today', 'yesterday', 'last_week', 'last_month'
    const [typeFilter, setTypeFilter] = useState(""); // '', 'normal', 'urgent', 'walk_in'
    const [searchTerm, setSearchTerm] = useState("");

    const { appointments, isLoading, error, refresh } = useApptsPerDoc({
        day: dayFilter,
        type: typeFilter,
        search: searchTerm,
    });


    const [selectedAppointment, setSelectedAppointment] = useState(null);


    // ---------- ACTIONS ----------

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredAppointments = appointments.filter((a) => {
        if (!normalizedSearch) return true; // no search → keep all

        const fields = [
            a.patient_name,
            a.patient_phone,
            ...(a.patient_extra_phones || []),
            a.doctor_name,
            a.appointment_type,
            a.status,
        ];

        return fields
            .filter(Boolean) // ignore null/undefined
            .some((value) =>
                value.toString().toLowerCase().includes(normalizedSearch)
            );
    });

    let x = 1
    return (
        <div className="w-full space-y-5">
            {/* Modals */}


            {selectedAppointment && (
                <CalendarAppointmentModal
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}

            {/* Header */}
            <PageHeader
                title={t("appt.title")}
                subtitle={t("appt.subtitle", { clinic: user?.clinic_name || "" })}
            />

            {/* Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
                {/* Top bar: filters + refresh */}
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
                    {/* Left: info + filters + search */}
                    <div className="flex min-w-0 flex-wrap items-end gap-3">
                        {/* Day filter */}
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-slate-500">{t("clin.apd_day")}</span>
                            <select
                                value={dayFilter}
                                onChange={(e) => setDayFilter(e.target.value)}
                                className={SELECT}
                            >
                                <option value="">{t("appt.all")}</option>
                                <option value="today">{t("appt.today")}</option>
                                <option value="yesterday">{t("appt.yesterday")}</option>
                                <option value="last_week">{t("appt.last_week")}</option>
                                <option value="last_month">{t("appt.last_month")}</option>
                            </select>
                        </label>

                        {/* Type filter */}
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-slate-500">{t("clin.apd_type")}</span>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className={SELECT}
                            >
                                <option value="">{t("appt.all")}</option>
                                <option value="normal">{t("appt.type_normal")}</option>
                                <option value="urgent">{t("appt.type_urgent")}</option>
                                <option value="walk_in">{t("appt.type_walk_in")}</option>
                            </select>
                        </label>

                        {/* 🔍 Search */}
                        <label className="flex w-full flex-col gap-1 sm:w-72">
                            <span className="text-xs font-medium text-slate-500">{t("clin.apd_search")}</span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t("clin.apd_search_ph")}
                                className={`w-full ${SELECT} placeholder:text-slate-400`}
                            />
                        </label>
                    </div>

                    {/* Right: buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="me-1 text-xs font-medium text-slate-500">
                            {isLoading
                                ? t("appt.loading")
                                : t("clin.apd_total", { count: filteredAppointments.length })}
                        </span>
                        <button
                            type="button"
                            onClick={refresh}
                            className={BTN_SECONDARY}
                        >
                            {t("appt.refresh")}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDayFilter("");
                                setTypeFilter("");
                                setSearchTerm("");
                            }}
                            className={BTN_SECONDARY}
                        >
                            {t("appt.clear")}
                        </button>
                    </div>
                </div>


                {/* Errors */}
                {error && (
                    <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-5">
                        {error}
                    </div>
                )}



                {/* Empty state */}
                {!isLoading && !error && filteredAppointments.length === 0 && (
                    <div className="px-4 py-10 text-center text-sm text-slate-500">
                        {t("appt.empty")}
                    </div>
                )}

                {/* Table */}
                {filteredAppointments.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-sm">
                            <thead className="bg-slate-50">
                                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3 text-start">#</th>
                                    <th className="px-4 py-3 text-start">{t("appt.col_patient_name")}</th>
                                    <th className="px-4 py-3 text-start">{t("appt.col_patient_phone")}</th>
                                    <th className="px-4 py-3 text-start">{t("appt.col_doctor")}</th>
                                    <th className="px-4 py-3 text-start">
                                        {t("appt.col_datetime")}
                                    </th>
                                    <th className="px-4 py-3 text-start">{t("appt.col_type")}</th>
                                    <th className="px-4 py-3 text-start">{t("appt.col_status")}</th>
                                    <th className="px-4 py-3 text-end">
                                        {t("appt.col_actions")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>

                                {filteredAppointments.map((a) => {
                                    const id = a.id ?? a.appointment_id;

                                    return (
                                        <tr
                                            key={id}
                                            className="border-t border-slate-100 hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-3 text-slate-500 tabular-nums">
                                                {x++}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {a.patient_name}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-slate-700 tabular-nums">
                                                {a.patient_phone}
                                            </td>

                                            <td className="px-4 py-3 text-slate-700 capitalize">
                                                {a.doctor_name}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                                {formatDateTime(a.scheduled_start)}
                                            </td>

                                            <td className="px-4 py-3 text-slate-700">
                                                {a.appointment_type}
                                                {a.is_walk_in && (
                                                    <span className="ms-1.5 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                                        {t("appt.walk_in_badge")}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-slate-700">
                                                {a.status}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedAppointment(a)}
                                                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        {t("common.view")}
                                                    </button>


                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}


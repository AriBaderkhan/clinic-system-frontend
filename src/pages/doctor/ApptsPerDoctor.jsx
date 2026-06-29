import { useState } from "react";
import { useTranslation } from "react-i18next";
import useApptsPerDoc from "../../hooks/useApptsPerDoctor";
import CalendarAppointmentModal from "../../components/appointments/CalendarAppointmentModal";
import { useSettings } from "../../context/SettingContext";


export default function ApptsPerDoctor() {
    const { t } = useTranslation();
    const { formatDateTime } = useSettings();


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
        <div className="space-y-6">
            {/* Modals */}


            {selectedAppointment && (
                <CalendarAppointmentModal
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">
                        {t("appt.title")}
                    </h1>
                    <p className="text-xs text-slate-500">
                        {t("appt.subtitle")}
                    </p>
                </div>


            </div>

            {/* Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                {/* Top bar: filters + refresh */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    {/* Left: info + filters + search */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                            {isLoading
                                ? t("appt.loading")
                                : t("clin.apd_total", { count: filteredAppointments.length })}
                        </span>

                        {/* Day filter */}
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500">{t("clin.apd_day")}</span>
                            <select
                                value={dayFilter}
                                onChange={(e) => setDayFilter(e.target.value)}
                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                            >
                                <option value="">{t("appt.all")}</option>
                                <option value="today">{t("appt.today")}</option>
                                <option value="yesterday">{t("appt.yesterday")}</option>
                                <option value="last_week">{t("appt.last_week")}</option>
                                <option value="last_month">{t("appt.last_month")}</option>
                            </select>
                        </div>

                        {/* Type filter */}
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500">{t("clin.apd_type")}</span>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                            >
                                <option value="">{t("appt.all")}</option>
                                <option value="normal">{t("appt.type_normal")}</option>
                                <option value="urgent">{t("appt.type_urgent")}</option>
                                <option value="walk_in">{t("appt.type_walk_in")}</option>
                            </select>
                        </div>

                        {/* 🔍 Search */}
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500">{t("clin.apd_search")}</span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t("clin.apd_search_ph")}
                                className="w-48 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-[#015478] focus:outline-none focus:ring-1 focus:ring-[#015478]"
                            />
                        </div>
                    </div>

                    {/* Right: buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={refresh}
                            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
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
                            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50"
                        >
                            {t("appt.clear")}
                        </button>
                    </div>
                </div>


                {/* Errors */}
                {error && (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                        {error}
                    </div>
                )}



                {/* Empty state */}
                {!isLoading && !error && filteredAppointments.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                        {t("appt.empty")}
                    </div>
                )}

                {/* Table */}
                {filteredAppointments.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs text-slate-500">
                                    <th className="px-3 py-2 font-medium">#</th>
                                    <th className="px-3 py-2 font-medium">{t("appt.col_patient_name")}</th>
                                    <th className="px-3 py-2 font-medium">{t("appt.col_patient_phone")}</th>
                                    <th className="px-3 py-2 font-medium">{t("appt.col_doctor")}</th>
                                    <th className="px-3 py-2 font-medium">
                                        {t("appt.col_datetime")}
                                    </th>
                                    <th className="px-3 py-2 font-medium">{t("appt.col_type")}</th>
                                    <th className="px-3 py-2 font-medium">{t("appt.col_status")}</th>
                                    <th className="px-3 py-2 font-medium text-end">
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
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                        >
                                            <td className="px-3 py-2 text-slate-800">
                                                {x++}
                                            </td>
                                            <td className="px-3 py-2 text-slate-800">
                                                {a.patient_name}
                                            </td>

                                            <td className="px-3 py-2 text-slate-700">
                                                {a.patient_phone}
                                            </td>

                                            <td className="px-3 py-2 text-slate-700 capitalize">
                                                {a.doctor_name}
                                            </td>

                                            <td className="px-3 py-2 text-slate-700">
                                                {formatDateTime(a.scheduled_start)}
                                            </td>

                                            <td className="px-3 py-2 text-slate-700">
                                                {a.appointment_type}
                                                {a.is_walk_in && (
                                                    <span className="ms-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                                                        {t("appt.walk_in_badge")}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-3 py-2 text-slate-700">
                                                {a.status}
                                            </td>

                                            <td className="px-3 py-2">
                                                <div className="flex items-center justify-end gap-2 text-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedAppointment(a)}
                                                        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
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


import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useCalendarAppointments from "../../hooks/useCalendarAppointments";
import { buildDoctorColorMap, getDoctorColor } from "../../utils/doctorColors";

const WEEK_DAY_KEYS = ["appt.day_mon", "appt.day_tue", "appt.day_wed", "appt.day_thu", "appt.day_fri", "appt.day_sat", "appt.day_sun"];
const MAX_PILLS_PER_DAY = 3;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Monday-based start of the week
function startOfWeek(date) {
  const d = startOfDay(date);
  const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

import { useSettings } from "../../context/SettingContext";

export default function AppointmentsCalendar({ onSelectAppointment, onSelectDay, floorId = "" }) {
  const { t } = useTranslation();
  const { formatTime } = useSettings();
  const [view, setView] = useState("month"); // month | week
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const [expandedDay, setExpandedDay] = useState(null); // dateKey of the "+N more" expanded cell

  // ---- visible grid range ----
  const { gridStart, gridDays } = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(anchorDate);
      return { gridStart: start, gridDays: 7 };
    }
    const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const start = startOfWeek(firstOfMonth);
    const lastOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
    const totalDays = Math.ceil((addDays(startOfDay(lastOfMonth), 1) - start) / 86400000);
    return { gridStart: start, gridDays: Math.ceil(totalDays / 7) * 7 };
  }, [anchorDate, view]);

  const from = useMemo(() => gridStart.toISOString(), [gridStart]);
  const to = useMemo(() => addDays(gridStart, gridDays).toISOString(), [gridStart, gridDays]);

  const { appointments, isLoading, error, refresh } = useCalendarAppointments(from, to, floorId);

  // ---- group appointments by day ----
  const apptsByDay = useMemo(() => {
    const map = {};
    for (const a of appointments) {
      const key = dateKey(a.scheduled_start);
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [appointments]);

  // ---- doctor colors (first doctor = menu bar blue, then navy, then light green...) ----
  const doctorColorMap = useMemo(
    () => buildDoctorColorMap(appointments.map((a) => a.doctor_id)),
    [appointments]
  );

  const colorFor = (doctorId) =>
    doctorColorMap.get(Number(doctorId)) || getDoctorColor(doctorId);

  // ---- doctors legend (unique doctors in the visible range) ----
  const doctorsLegend = useMemo(() => {
    const seen = new Map();
    for (const a of appointments) {
      if (!seen.has(a.doctor_id)) seen.set(a.doctor_id, a.doctor_name);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [appointments]);

  const days = useMemo(
    () => Array.from({ length: gridDays }, (_, i) => addDays(gridStart, i)),
    [gridStart, gridDays]
  );

  const todayKey = dateKey(new Date());
  const currentMonth = anchorDate.getMonth();

  const goPrev = () => {
    setExpandedDay(null);
    setAnchorDate((d) =>
      view === "week" ? addDays(d, -7) : new Date(d.getFullYear(), d.getMonth() - 1, 1)
    );
  };

  const goNext = () => {
    setExpandedDay(null);
    setAnchorDate((d) =>
      view === "week" ? addDays(d, 7) : new Date(d.getFullYear(), d.getMonth() + 1, 1)
    );
  };

  const goToday = () => {
    setExpandedDay(null);
    setAnchorDate(startOfDay(new Date()));
  };

  const title =
    view === "week"
      ? `${gridStart.toLocaleDateString([], { month: "short", day: "numeric" })} – ${addDays(gridStart, 6).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
      : anchorDate.toLocaleDateString([], { month: "long", year: "numeric" });

  const renderPill = (a) => {
    const color = colorFor(a.doctor_id);
    const isInactive = a.status === "cancelled" || a.status === "no_show";
    return (
      <button
        key={a.id}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectAppointment?.({ ...a, doctor_color: color });
        }}
        title={`${formatTime(a.scheduled_start)} · ${a.patient_name} · ${a.doctor_name} (${a.status})`}
        className={`flex w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-start text-[11px] font-semibold text-white shadow-sm transition hover:brightness-110 ${
          isInactive ? "opacity-40 line-through" : ""
        }`}
        style={{ backgroundColor: color.bg }}
      >
        <span className="shrink-0 tabular-nums">{formatTime(a.scheduled_start)}</span>
        <span className="truncate">{a.patient_name}</span>
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-base text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 rtl:rotate-180"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-base text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 rtl:rotate-180"
            aria-label="Next"
          >
            ›
          </button>
          <button
            type="button"
            onClick={goToday}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-brand/30 bg-white px-3.5 text-sm font-semibold text-brand transition hover:bg-brand/10"
          >
            {t("appt.cal_today")}
          </button>
        </div>

        <h2 className="order-first w-full text-lg font-bold tracking-tight text-slate-900 sm:order-none sm:w-auto">{title}</h2>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t("appt.refresh")}
          </button>
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setView("week")}
              className={`rounded-lg px-3.5 py-1.5 transition-colors ${
                view === "week" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("appt.cal_week")}
            </button>
            <button
              type="button"
              onClick={() => setView("month")}
              className={`rounded-lg px-3.5 py-1.5 transition-colors ${
                view === "month" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("appt.cal_month")}
            </button>
          </div>
        </div>
      </div>

      {/* Doctors legend */}
      {doctorsLegend.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {doctorsLegend.map((doc) => {
            const color = colorFor(doc.id);
            return (
              <span key={doc.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color.bg }}
                />
                <span className="capitalize">{doc.name}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <p className="mb-2 text-xs font-medium text-slate-500">{t("appt.loading")}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {WEEK_DAY_KEYS.map((k) => (
          <div key={k}>{t(k)}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dateKey(day);
          const dayAppts = apptsByDay[key] || [];
          const isToday = key === todayKey;
          const isOtherMonth = view === "month" && day.getMonth() !== currentMonth;
          const isExpanded = expandedDay === key;
          const visible = isExpanded ? dayAppts : dayAppts.slice(0, MAX_PILLS_PER_DAY);
          const hiddenCount = dayAppts.length - visible.length;

          return (
            <div
              key={key}
              onClick={() => onSelectDay?.(day)}
              title={onSelectDay ? t("appt.cal_add_hint") : undefined}
              className={`group min-w-0 border-b border-e border-slate-100 p-1.5 transition-colors [&:nth-child(7n)]:border-e-0 ${
                view === "week" ? "min-h-[340px]" : "min-h-[110px]"
              } ${isToday ? "bg-brand/10" : isOtherMonth ? "bg-slate-50" : "bg-white"} ${
                onSelectDay ? "cursor-pointer hover:bg-brand/5" : ""
              }`}
            >
              <div className="mb-1 flex items-center justify-between px-0.5">
                <span
                  className={`text-xs font-semibold ${
                    isToday
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] text-white"
                      : isOtherMonth
                      ? "text-slate-300"
                      : "text-slate-700"
                  }`}
                >
                  {day.getDate()}
                </span>
                {dayAppts.length > 0 ? (
                  <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold tabular-nums text-slate-500">{dayAppts.length}</span>
                ) : onSelectDay ? (
                  <span className="hidden text-[10px] font-semibold text-brand group-hover:inline">+</span>
                ) : null}
              </div>

              <div className="space-y-1">
                {visible.map(renderPill)}

                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDay(key);
                    }}
                    className="w-full rounded-md px-2 py-0.5 text-start text-[11px] font-semibold text-brand hover:bg-brand/10"
                  >
                    {t("appt.cal_more", { count: hiddenCount })}
                  </button>
                )}

                {isExpanded && dayAppts.length > MAX_PILLS_PER_DAY && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDay(null);
                    }}
                    className="w-full rounded-md px-2 py-0.5 text-start text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    {t("appt.cal_show_less")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

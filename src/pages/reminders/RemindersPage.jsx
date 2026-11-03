import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getUpcomingReminders, markReminderSent } from "../../api/reminderApi";
import PageHeader from "../../components/common/PageHeader";

const LANGS = [
  { key: "ku", label: "کوردی", rtl: true },
  { key: "ar", label: "عربي", rtl: true },
  { key: "en", label: "English", rtl: false },
];

// Show the appointment time in the clinic's timezone (Iraq, UTC+3).
const fmtWhen = (iso) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baghdad",
    weekday: "short", day: "2-digit", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(iso));

export default function RemindersPage() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // "Prepare message" modal state
  const [active, setActive] = useState(null);      // the appointment being prepared
  const [lang, setLang] = useState("ku");
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getUpcomingReminders();
      setList(res.data || []);
    } catch (err) {
      setError(err.userMessage || t("appt.rem_load_failed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // refetch when the tab regains focus → checked-in/handled appts drop off
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  // ---- Prepare message ----
  const openPrepare = (appt) => {
    setActive(appt);
    setLang("ku");
    setDraft(appt.messages.ku);
  };

  const switchLang = (key) => {
    setLang(key);
    setDraft(active.messages[key]); // reset draft to the chosen language's text
  };

  const sendWhatsapp = async () => {
    if (!active) return;
    if (!active.phone_valid) {
      toast.error(t("appt.rem_invalid_phone"));
      return;
    }
    // open WhatsApp with the (possibly edited) message ready to send
    const url = `https://wa.me/${active.phone}?text=${encodeURIComponent(draft)}`;
    window.open(url, "_blank");

    try {
      await markReminderSent(active.appointment_id, {
        patient_id: active.patient_id,
        language: lang,
        message: draft,
      });
      // remove from list so it disappears (stays gone after refresh too)
      setList((prev) => prev.filter((r) => r.appointment_id !== active.appointment_id));
      toast.success(t("appt.rem_marked_sent"));
      setActive(null);
    } catch (err) {
      toast.error(err.userMessage || t("appt.rem_mark_failed"));
    }
  };

  return (
    <div className="w-full space-y-5">
      <PageHeader title={t("appt.rem_title")} subtitle={t("appt.rem_subtitle")} />

      {loading && <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500 shadow-card">{t("appt.loading_short")}</div>}
      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-card">{error}</div>
      )}

      {!loading && !error && list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500 shadow-card">
          {t("appt.rem_empty")}
        </div>
      )}

      {!loading && !error && list.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.rem_col_patient")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.rem_col_phone")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.rem_col_when")}</th>
                <th className="whitespace-nowrap px-4 py-3 text-end text-xs font-semibold uppercase tracking-wide text-slate-500">{t("appt.rem_col_action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((r) => (
                <tr key={r.appointment_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.patient_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                    {r.phone_raw}
                    {!r.phone_valid && (
                      <span className="ms-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        {t("appt.rem_check_number")}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">{fmtWhen(r.scheduled_start)}</td>
                  <td className="px-4 py-3 text-end">
                    <button
                      onClick={() => openPrepare(r)}
                      className="inline-flex items-center justify-center rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
                    >
                      {t("appt.rem_prepare")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ===== Prepare message modal ===== */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setActive(null)}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-pop">
            <div className="-mx-5 -mt-5 mb-4 flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h2 className="min-w-0 text-base font-semibold text-slate-900">
                {t("appt.rem_modal_title", { name: active.patient_name })}
              </h2>
              <button onClick={() => setActive(null)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">✕</button>
            </div>

            {/* language tabs */}
            <div className="mb-3 inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
              {LANGS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => switchLang(l.key)}
                  className={[
                    "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition",
                    lang === l.key
                      ? "bg-brand text-white"
                      : "text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* editable preview */}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              dir={LANGS.find((l) => l.key === lang)?.rtl ? "rtl" : "ltr"}
              rows={9}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />

            <div className="-mx-5 -mb-5 mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
              <span className="text-xs tabular-nums text-slate-500" dir="ltr">→ {active.phone}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActive(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={sendWhatsapp}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  {t("appt.rem_send")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

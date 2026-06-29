import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getUpcomingReminders, markReminderSent } from "../../api/reminderApi";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("appt.rem_title")}
        </h1>
        <p className="text-xs text-slate-500">
          {t("appt.rem_subtitle")}
        </p>
      </div>

      {loading && <div className="py-10 text-center text-slate-500">{t("appt.loading_short")}</div>}
      {error && !loading && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
          {t("appt.rem_empty")}
        </div>
      )}

      {!loading && !error && list.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
              <tr>
                <th className="px-4 py-3">{t("appt.rem_col_patient")}</th>
                <th className="px-4 py-3">{t("appt.rem_col_phone")}</th>
                <th className="px-4 py-3">{t("appt.rem_col_when")}</th>
                <th className="px-4 py-3 text-end">{t("appt.rem_col_action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {list.map((r) => (
                <tr key={r.appointment_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {r.patient_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {r.phone_raw}
                    {!r.phone_valid && (
                      <span className="ms-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">
                        {t("appt.rem_check_number")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtWhen(r.scheduled_start)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openPrepare(r)}
                      className="rounded-lg bg-[#015478] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#013d58]"
                    >
                      {t("appt.rem_prepare")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Prepare message modal ===== */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setActive(null)}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                {t("appt.rem_modal_title", { name: active.patient_name })}
              </h2>
              <button onClick={() => setActive(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* language tabs */}
            <div className="mb-3 flex gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => switchLang(l.key)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-sm transition",
                    lang === l.key
                      ? "bg-[#015478] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200",
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
              className="w-full rounded-lg border border-slate-300 p-3 text-sm leading-relaxed focus:border-[#015478] focus:outline-none dark:bg-slate-900 dark:text-slate-100"
            />

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">→ {active.phone}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActive(null)}
                  className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={sendWhatsapp}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
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

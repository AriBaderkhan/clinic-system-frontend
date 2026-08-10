import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { createFeedbackInvite, dismissFeedback } from "../../api/feedbackApi";

const LANGS = [
  { key: "ku", label: "کوردی", rtl: true },
  { key: "ar", label: "عربي", rtl: true },
  { key: "en", label: "English", rtl: false },
];

/**
 * Shared "send feedback" modal for BOTH entry points.
 *
 * props:
 *   item   = { patient_id, appointment_id?, patient_name, phone, phone_valid, messages:{ku,ar,en} }
 *   source = 'patient' | 'appointment'
 *   onDone(item)  → parent removes the item from its list (after send OR skip)
 *   onClose()
 */
export default function FeedbackSendModal({ item, source, onDone, onClose }) {
  const { t } = useTranslation();
  const [lang, setLang] = useState("ku");
  const [draft, setDraft] = useState(item.messages.ku);
  const [busy, setBusy] = useState(false);

  const switchLang = (key) => {
    setLang(key);
    setDraft(item.messages[key]);
  };

  const invitePayload = {
    source,
    patient_id: item.patient_id,
    ...(source === "appointment" ? { appointment_id: item.appointment_id } : {}),
  };

  const handleSend = async () => {
    if (!item.phone_valid) {
      toast.error(t("feedback.invalid_phone"));
      return;
    }
    setBusy(true);
    try {
      // 1) create the invite → get the token for the public link
      const res = await createFeedbackInvite({ ...invitePayload, language: lang });
      const token = res?.data?.token;
      const url = `${window.location.origin}/feedback/${token}`;

      // 2) inject the real link ({link} placeholder, or append if it was removed)
      const finalText = draft.includes("{link}")
        ? draft.replaceAll("{link}", url)
        : `${draft}\n\n${url}`;

      // 3) open WhatsApp ready to send
      window.open(`https://wa.me/${item.phone}?text=${encodeURIComponent(finalText)}`, "_blank");

      toast.success(t("feedback.sent_ok"));
      onDone(item);
    } catch (err) {
      toast.error(err.userMessage || t("feedback.send_failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async () => {
    setBusy(true);
    try {
      await dismissFeedback(invitePayload);
      toast.success(t("feedback.skipped_ok"));
      onDone(item);
    } catch (err) {
      toast.error(err.userMessage || t("feedback.skip_failed"));
    } finally {
      setBusy(false);
    }
  };

  const rtl = LANGS.find((l) => l.key === lang)?.rtl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            {t("feedback.modal_title", { name: item.patient_name })}
          </h2>
          <button onClick={onClose} disabled={busy} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* language tabs (message language) */}
        <div className="mb-3 flex gap-2">
          {LANGS.map((l) => (
            <button
              key={l.key}
              onClick={() => switchLang(l.key)}
              className={[
                "rounded-lg px-3 py-1.5 text-sm transition",
                lang === l.key
                  ? "bg-[#0E6E75] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200",
              ].join(" ")}
            >
              {l.label}
            </button>
          ))}
        </div>

        <p className="mb-2 text-[11px] text-slate-400">{t("feedback.link_note")}</p>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          dir={rtl ? "rtl" : "ltr"}
          rows={9}
          className="w-full rounded-lg border border-slate-300 p-3 text-sm leading-relaxed focus:border-[#0E6E75] focus:outline-none dark:bg-slate-900 dark:text-slate-100"
        />

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">
            → {item.phone}
            {!item.phone_valid && (
              <span className="ms-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">
                {t("feedback.check_number")}
              </span>
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {t("feedback.skip")}
            </button>
            <button
              onClick={handleSend}
              disabled={busy}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {t("feedback.send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

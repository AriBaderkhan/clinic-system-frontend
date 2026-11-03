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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-pop">
        <div className="-mx-5 -mt-5 mb-4 flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="min-w-0 text-base font-semibold text-slate-900">
            {t("feedback.modal_title", { name: item.patient_name })}
          </h2>
          <button onClick={onClose} disabled={busy} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">✕</button>
        </div>

        {/* language tabs (message language) */}
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

        <p className="mb-2 text-xs text-slate-500">{t("feedback.link_note")}</p>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          dir={rtl ? "rtl" : "ltr"}
          rows={9}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-900 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
        />

        <div className="-mx-5 -mb-5 mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
          <span className="min-w-0 text-xs tabular-nums text-slate-500">
            → {item.phone}
            {!item.phone_valid && (
              <span className="ms-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                {t("feedback.check_number")}
              </span>
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {t("feedback.skip")}
            </button>
            <button
              onClick={handleSend}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {t("feedback.send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { getPublicFeedback, submitPublicFeedback, getQrFeedback, submitQrFeedback } from "../../api/publicFeedbackApi";

// Form languages. `api` is what the backend expects ('ku'|'ar'|'en'); `i18n` is
// the locale code used by react-i18next (Kurdish = 'ckb').
const LANGS = [
  { api: "ku", i18n: "ckb", label: "کوردی", rtl: true },
  { api: "ar", i18n: "ar", label: "عربي", rtl: true },
  { api: "en", i18n: "en", label: "English", rtl: false },
];

// The patient rates these 4. "Overall experience" is NOT rated here — it is
// computed on the backend as the average of these four.
const CATEGORIES = [
  { key: "doctor", labelKey: "feedback.cat_doctor" },
  { key: "staff", labelKey: "feedback.cat_staff" },
  { key: "cleanliness", labelKey: "feedback.cat_cleanliness" },
  { key: "cost", labelKey: "feedback.cat_cost" },
];

// NOTE: these three are defined at MODULE level (not inside the form component).
// Defining components inside render remounts them on every keystroke, which is
// what made the comment inputs lose focus after a single character.
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`text-2xl transition ${(hover || value) >= n ? "text-amber-500" : "text-slate-300"}`}
          aria-label={`${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function Shell({ rtl, children }) {
  return (
    <div dir={rtl ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-b from-[#015478] to-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-xl">{children}</div>
    </div>
  );
}

function LangBar({ current, onPick }) {
  return (
    <div className="mb-4 flex justify-center gap-2">
      {LANGS.map((l) => (
        <button
          key={l.api}
          onClick={() => onPick(l)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            current === l.api ? "bg-white text-[#015478] shadow" : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export default function PublicFeedbackForm() {
  // Two modes: token flow (/feedback/:token, per patient) OR QR flow
  // (/feedback/clinic/:tenantId/:branchId, static & anonymous walk-in).
  const { token, tenantId, branchId } = useParams();
  const qrMode = !token && !!tenantId && !!branchId;
  const { t } = useTranslation();

  const [lang, setLang] = useState(LANGS[2]); // default English
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null); // { clinic_name, branch_name, patient_name, already_submitted }
  const [fatal, setFatal] = useState("");
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [note, setNote] = useState("");        // optional general note
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Apply the chosen language to the whole form (and its direction).
  const pickLang = (l) => {
    setLang(l);
    i18n.changeLanguage(l.i18n);
    document.documentElement.dir = l.rtl ? "rtl" : "ltr";
  };

  useEffect(() => {
    document.documentElement.dir = lang.rtl ? "rtl" : "ltr";
    (async () => {
      try {
        const res = qrMode
          ? await getQrFeedback(tenantId, branchId)
          : await getPublicFeedback(token);
        setInfo(res.data);
        if (res.data?.already_submitted) setDone(true);
      } catch (err) {
        setFatal(err?.response?.data?.code === "FEEDBACK_ALREADY_SUBMITTED"
          ? t("feedback.already_submitted")
          : t("feedback.link_invalid"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tenantId, branchId]);

  const setRating = (key, n) => setRatings((p) => ({ ...p, [key]: n }));
  const setComment = (key, v) => setComments((p) => ({ ...p, [key]: v }));

  const allRated = CATEGORIES.every((c) => ratings[c.key] >= 1);

  const handleSubmit = async () => {
    if (!allRated) return;
    setSubmitting(true);
    try {
      const payload = { form_language: lang.api, anonymous: qrMode ? true : anonymous, note: note || null };
      for (const c of CATEGORIES) {
        payload[`${c.key}_rating`] = ratings[c.key];
        payload[`${c.key}_comment`] = comments[c.key] || null;
      }
      if (qrMode) await submitQrFeedback(tenantId, branchId, payload);
      else await submitPublicFeedback(token, payload);
      setDone(true);
    } catch (err) {
      setFatal(err?.response?.data?.code === "FEEDBACK_ALREADY_SUBMITTED"
        ? t("feedback.already_submitted")
        : t("feedback.submit_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Shell rtl={lang.rtl}>
        <LangBar current={lang.api} onPick={pickLang} />
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500">…</div>
      </Shell>
    );
  }

  if (fatal && !done) {
    return (
      <Shell rtl={lang.rtl}>
        <LangBar current={lang.api} onPick={pickLang} />
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
          <p className="text-slate-700">{fatal}</p>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell rtl={lang.rtl}>
        <LangBar current={lang.api} onPick={pickLang} />
        <div className="rounded-2xl bg-white p-10 text-center shadow-xl">
          <div className="mb-3 text-4xl">🌿</div>
          <h1 className="text-lg font-semibold text-slate-900">{t("feedback.thanks_title")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("feedback.thanks_body")}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell rtl={lang.rtl}>
      <LangBar current={lang.api} onPick={pickLang} />
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        {/* Clinic-branded header — the clinic name follows the selected language
            (falls back to the base name when a language isn't set). */}
        <div className="mb-5 text-center">
          <h1 className="text-xl font-bold text-[#015478]">
            {info?.clinic_names?.[lang.api] || info?.clinic_names?.en}
          </h1>
          <p className="mt-3 text-sm text-slate-600">{t("feedback.form_intro")}</p>
        </div>

        <div className="space-y-4">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">{t(c.labelKey)}</span>
                <StarInput value={ratings[c.key] || 0} onChange={(n) => setRating(c.key, n)} />
              </div>
              <input
                type="text"
                value={comments[c.key] || ""}
                onChange={(e) => setComment(c.key, e.target.value)}
                placeholder={t("feedback.comment_ph")}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-[#015478] focus:outline-none"
              />
            </div>
          ))}
        </div>

        {/* Optional general note — anything else the patient wants to add. */}
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">{t("feedback.extra_note")}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("feedback.extra_note_ph")}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#015478] focus:outline-none"
          />
        </div>

        {!qrMode && (
          <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            {t("feedback.anonymous_opt")}
          </label>
        )}

        {!allRated && <p className="mt-3 text-xs text-amber-600">{t("feedback.rate_all_hint")}</p>}

        <button
          onClick={handleSubmit}
          disabled={!allRated || submitting}
          className="mt-4 w-full rounded-xl bg-[#015478] py-3 text-sm font-semibold text-white transition hover:bg-[#013d58] disabled:opacity-50"
        >
          {submitting ? "…" : t("feedback.submit")}
        </button>
      </div>
    </Shell>
  );
}

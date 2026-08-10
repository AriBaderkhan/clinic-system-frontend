import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getFeedbackResults } from "../../api/feedbackApi";

// Summary cards show all 5 averages. `key` matches the DB column prefix.
const CATEGORIES = [
  { key: "overall", labelKey: "feedback.cat_overall" },
  { key: "doctor", labelKey: "feedback.cat_doctor" },
  { key: "staff", labelKey: "feedback.cat_staff" },
  { key: "cleanliness", labelKey: "feedback.cat_cleanliness" },
  { key: "cost", labelKey: "feedback.cat_cost" },
];

// Per-response cards show only the 4 rated categories (overall is the computed
// average of these, shown next to the name; the general note is separate).
const RATED_CATEGORIES = CATEGORIES.filter((c) => c.key !== "overall");

const fmtDate = (iso) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baghdad", day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(iso));

// Small inline star row (filled up to `value`, out of 5).
function Stars({ value }) {
  const v = Number(value) || 0;
  return (
    <span className="whitespace-nowrap text-amber-500" aria-label={`${v}/5`}>
      {"★★★★★".slice(0, Math.round(v))}
      <span className="text-slate-300">{"★★★★★".slice(Math.round(v))}</span>
    </span>
  );
}

export default function FeedbackResultsPage() {
  const { t } = useTranslation();
  const [overall, setOverall] = useState(null);
  const [branches, setBranches] = useState([]);
  const [responses, setResponses] = useState([]);
  const [branch, setBranch] = useState("all"); // 'all' | branch_id
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getFeedbackResults();
      setOverall(res.data?.overall || null);
      setBranches(res.data?.branches || []);
      setResponses(res.data?.responses || []);
    } catch (err) {
      setError(err.userMessage || t("feedback.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  // The active summary + response list depend on the selected branch.
  const summary = branch === "all"
    ? overall
    : branches.find((b) => String(b.branch_id) === String(branch));
  const rows = branch === "all"
    ? responses
    : responses.filter((r) => String(r.branch_id) === String(branch));

  const avgFor = (key) => summary?.[`avg_${key}`];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t("feedback.results_title")}
        </h1>
        <p className="text-xs text-slate-500">{t("feedback.results_subtitle")}</p>
      </div>

      {loading && <div className="py-10 text-center text-slate-500">{t("feedback.loading")}</div>}
      {error && !loading && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Branch tabs — switch the whole view between all branches and one */}
          {branches.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setBranch("all")}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  branch === "all"
                    ? "border-[#0E6E75] bg-[#0E6E75] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("tdash.all_branches")}
              </button>
              {branches.map((b) => (
                <button
                  key={b.branch_id}
                  onClick={() => setBranch(String(b.branch_id))}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    String(branch) === String(b.branch_id)
                      ? "border-[#0E6E75] bg-[#0E6E75] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {b.branch_name}
                </button>
              ))}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <div key={c.key} className="rounded-xl border border-slate-200 bg-white p-4 dark:bg-slate-800">
                <p className="text-[11px] font-medium uppercase text-slate-500">{t(c.labelKey)}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {avgFor(c.key) ?? "—"}
                </p>
                <div className="mt-1 text-sm"><Stars value={avgFor(c.key)} /></div>
              </div>
            ))}
          </div>

          <div className="flex gap-6 text-xs text-slate-500">
            <span>{t("feedback.invites_sent")}: <b className="text-slate-800 dark:text-slate-200">{summary?.invites_sent ?? 0}</b></span>
            <span>{t("feedback.responses")}: <b className="text-slate-800 dark:text-slate-200">{summary?.responses ?? 0}</b></span>
          </div>

          {/* Individual responses */}
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
              {t("feedback.no_responses")}
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:bg-slate-800">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {r.patient_name || t("feedback.anonymous")}
                      </span>
                      {branch === "all" && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 dark:bg-slate-700">
                          {r.branch_name}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">{t("feedback.cat_overall")}:</span>
                      <Stars value={r.overall_rating} />
                    </div>
                    <span className="text-[11px] text-slate-400">{fmtDate(r.submitted_at)}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {RATED_CATEGORIES.map((c) => (
                      <div key={c.key} className="flex flex-col gap-0.5 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{t(c.labelKey)}</span>
                          <Stars value={r[`${c.key}_rating`]} />
                        </div>
                        {r[`${c.key}_comment`] && (
                          <p className="text-xs text-slate-600 dark:text-slate-300">{r[`${c.key}_comment`]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {r.note && (
                    <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
                      <span className="text-[11px] font-medium text-slate-500">{t("feedback.note_result")}</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{r.note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

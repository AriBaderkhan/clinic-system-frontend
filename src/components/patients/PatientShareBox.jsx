import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { sharePatient, unsharePatient } from "../../api/patientApi";
import { useSettings } from "../../context/SettingContext";
import useCan from "../../utils/can";

// Patient folder: where the patient belongs and which branches it is shared with.
// shares = GET /api/patients/:id/shares (null while loading); onChanged reloads it.
export default function PatientShareBox({ patientId, shares, onChanged }) {
  const { t } = useTranslation();
  const { formatDateTime } = useSettings();
  const can = useCan();
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  if (!shares) return null;
  const canShare = can("share_patient") && shares.is_home;

  const doShare = async () => {
    const branch = shares.can_share_to.find((b) => String(b.id) === String(target));
    if (!branch || !window.confirm(t("share.confirm_share", { branch: branch.name }))) return;
    setBusy(true);
    try {
      await sharePatient(patientId, branch.id);
      toast.success(t("share.shared", { branch: branch.name }));
      setTarget("");
      onChanged();
    } catch (err) {
      toast.error(err.userMessage || t("share.failed"));
    } finally {
      setBusy(false);
    }
  };

  const doUnshare = async (s) => {
    if (!window.confirm(t("share.confirm_unshare", { branch: s.branch_name }))) return;
    setBusy(true);
    try {
      await unsharePatient(patientId, s.branch_id);
      toast.success(t("share.unshared", { branch: s.branch_name }));
      onChanged();
    } catch (err) {
      toast.error(err.userMessage || t("share.failed"));
    } finally {
      setBusy(false);
    }
  };

  // nothing to say: home branch, not shared, and the user cannot share
  if (shares.is_home && !shares.shared_with.length && !(canShare && shares.can_share_to.length)) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs" data-share-box>
      {!shares.is_home && shares.shared_here && (
        <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700" data-shared-from>
          {t("share.shared_from", { branch: shares.shared_here.from_branch_name || shares.home.branch_name, date: formatDateTime(shares.shared_here.created_at) })}
        </span>
      )}
      {!shares.is_home && <span className="text-slate-500">{t("share.read_only_hint")}</span>}

      {shares.is_home && shares.shared_with.length > 0 && (
        <>
          <span className="text-slate-500">{t("share.shared_with")}:</span>
          {shares.shared_with.map((s) => (
            <span key={s.branch_id} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">
              {s.branch_name}
              {canShare && (
                <button type="button" disabled={busy} onClick={() => doUnshare(s)} title={t("share.stop")} aria-label={t("share.stop")} className="text-sky-500 hover:text-red-600">
                  ×
                </button>
              )}
            </span>
          ))}
        </>
      )}

      {canShare && shares.can_share_to.length > 0 && (
        <span className="ms-auto inline-flex items-center gap-2">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            data-share-select
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          >
            <option value="">{t("share.choose_branch")}</option>
            {shares.can_share_to.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button
            type="button"
            disabled={!target || busy}
            onClick={doShare}
            className="rounded-md bg-[#0E6E75] px-3 py-1 font-semibold text-white hover:bg-[#0A565C] disabled:opacity-50"
          >
            {t("share.share")}
          </button>
        </span>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getBranches } from "../api/tenantApi";
import openBranch, { LAST_BRANCH } from "../utils/openBranch";

// The owner picks which branch the "Branch" menu works on. With no branch open
// yet (first login), it opens the last used branch, or the first one.
export default function OwnerBranchSwitcher({ currentId, onBranches }) {
  const { t } = useTranslation();
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let alive = true;
    getBranches()
      .then((res) => {
        if (!alive) return;
        const list = (res.data || []).filter((b) => b.status === "active");
        setBranches(list);
        onBranches?.(list);
        if (!currentId && list.length) {
          let last = null;
          try { last = Number(localStorage.getItem(LAST_BRANCH)); } catch { /* storage off */ }
          const pick = list.find((b) => Number(b.id) === last) || list[0];
          openBranch(pick.id).catch(() => { });
        }
      })
      .catch(() => { });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  if (branches.length <= 1) return null;
  const current = branches.find((b) => Number(b.id) === Number(currentId));

  const choose = async (id) => {
    if (Number(id) === Number(currentId)) return setOpen(false);
    try {
      setSwitching(true);
      await openBranch(id);
    } catch (err) {
      toast.error(err.userMessage || t("branches.failed_switch"));
      setSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={switching}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
      >
        <span className="truncate font-semibold">{current?.name || t("nav.choose_branch")}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {branches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => choose(b.id)}
              className={`block w-full rounded-lg px-3 py-2 text-start text-sm transition hover:bg-slate-100 ${Number(b.id) === Number(currentId) ? "font-semibold text-[#0E6E75]" : "text-slate-700"}`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

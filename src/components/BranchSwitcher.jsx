import { useState } from "react";
import toast from "react-hot-toast";
import { switchBranch } from "../api/userApi";

// Sidebar control that lets a user assigned to more than one branch switch
// between them without logging out. Renders nothing for single-branch users.
// The branch list is saved to localStorage at login (availableBranches).
export default function BranchSwitcher() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  let branches = [];
  let user = {};
  try {
    branches = JSON.parse(localStorage.getItem("availableBranches") || "[]");
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    branches = [];
  }

  if (!Array.isArray(branches) || branches.length <= 1) return null;

  const currentId = user?.branch_id;
  const current = branches.find((b) => Number(b.branch_id) === Number(currentId));

  const handleSwitch = async (branchId) => {
    if (Number(branchId) === Number(currentId)) {
      setOpen(false);
      return;
    }
    try {
      setSwitching(true);
      const res = await switchBranch({ branch_id: branchId });
      // backend re-issues a token + refresh token + user scoped to the chosen branch
      localStorage.setItem("token", res.token);
      if (res.refreshToken) localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.user));
      if (res.user?.role) {
        localStorage.setItem("role", String(res.user.role).toLowerCase());
      }
      toast.success("Switched branch");
      // full reload so the new role/permissions/routes take effect cleanly
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(err.userMessage || "Failed to switch branch");
      setSwitching(false);
    }
  };

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={switching}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-900 transition hover:bg-black/10 hover:text-black disabled:opacity-60"
      >
        <span className="truncate">
          Branch: <span className="font-semibold">{current?.branch_name || `#${currentId}`}</span>
        </span>
        <span className={`ml-2 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="mt-1 space-y-1 rounded-lg bg-black/10 p-1">
          {branches.map((b) => {
            const isCurrent = Number(b.branch_id) === Number(currentId);
            return (
              <button
                key={b.branch_id}
                type="button"
                disabled={isCurrent || switching}
                onClick={() => handleSwitch(b.branch_id)}
                className={[
                  "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-xs transition",
                  isCurrent
                    ? "bg-[#0E6E75] text-white cursor-default"
                    : "text-slate-900 hover:bg-black/15 hover:text-black",
                ].join(" ")}
              >
                <span className="truncate">{b.branch_name || `Branch ${b.branch_id}`}</span>
                <span className="ml-2 shrink-0 capitalize opacity-70">{b.role_name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

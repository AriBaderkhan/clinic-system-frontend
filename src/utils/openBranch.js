import api from "../api/api";
import { switchBranch } from "../api/tenantApi";

export const LAST_BRANCH = "last_branch_id";

// Owner: open one branch of the clinic — new token for that branch, fresh /me, reload on `to`.
export default async function openBranch(branchId, to = "/home") {
  const res = await switchBranch(branchId);
  localStorage.setItem("token", res.token);
  const me = await api.get("/me");
  if (me.data?.user) localStorage.setItem("user", JSON.stringify(me.data.user));
  try { localStorage.setItem(LAST_BRANCH, String(branchId)); } catch { /* storage off: fine */ }
  window.location.href = to;
}

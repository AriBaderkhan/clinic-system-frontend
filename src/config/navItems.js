import { hasTick } from "../utils/can";

// ONE menu for everyone. An item shows when the user has ANY of its ticks and
// the plan includes its feature. `indent` items open under the item above them.

// clinic-level ticks: whoever has one of these gets the owner menu
export const CLINIC_TICKS = ["view_clinic_dashboard", "manage_users", "manage_branches", "manage_tenant_settings", "view_audit_log", "view_feedback"];

export const BRANCH_SETTINGS_TICKS = ["manage_branch_settings", "manage_floors", "manage_discounts", "manage_works"];

const BRANCH_ITEMS = [
  { key: "branch_overview", labelKey: "nav.overview", to: "/branch-overview", ticks: ["view_branch_dashboard"] },
  { key: "front_desk", labelKey: "nav.dashboard", to: "/front-desk", ticks: ["view_front_desk"] },
  { key: "my_day", labelKey: "nav.dashboard", to: "/my-day", ticks: ["view_my_day"] },
  { key: "patients", labelKey: "nav.patients", to: "/patients", ticks: ["view_patient"] },
  { key: "appointments", labelKey: "nav.appointments", to: "/appointments", end: true, ticks: ["view_appointment"] },
  { key: "calendar", labelKey: "nav.calendar", to: "/appointments/calendar", ticks: ["view_appointment"], indent: true },
  { key: "reminders", labelKey: "nav.reminders", to: "/appointments/reminders", ticks: ["send_reminders"], feature: "reminders", indent: true },
  { key: "feedback_send", labelKey: "nav.feedback", to: "/appointments/feedback", ticks: ["send_reminders"], feature: "reminders", indent: true },
  { key: "sessions", labelKey: "nav.sessions", to: "/sessions", ticks: ["view_session"] },
  { key: "lab", labelKey: "nav.lab", to: "/lab", ticks: ["manage_lab"] },
  { key: "reports", labelKey: "nav.reports", to: "/reports", ticks: ["view_reports"] },
  { key: "my_report", labelKey: "nav.reports", to: "/my-report", ticks: ["view_own_report"] },
  { key: "branch_settings", labelKey: "nav.branch_settings", to: "/settings/branch", ticks: BRANCH_SETTINGS_TICKS },
  { key: "roles", labelKey: "nav.roles_permissions", to: "/settings/roles", ticks: ["manage_permissions"] },
  { key: "appearance", labelKey: "nav.settings", to: "/settings", ticks: [] },
];

const CLINIC_ITEMS = [
  { key: "users", labelKey: "nav.users", to: "/clinic/users", ticks: ["manage_users"] },
  { key: "reports", labelKey: "nav.reports", to: "/reports", ticks: ["view_reports"] },
  { key: "feedback_results", labelKey: "nav.feedback_results", to: "/clinic/feedback", ticks: ["view_feedback"], feature: "reminders" },
  { key: "audit", labelKey: "nav.activity_log", to: "/clinic/audit", ticks: ["view_audit_log"], feature: "audit_log" },
  { key: "clinic_settings", labelKey: "nav.settings", to: "/clinic/settings", ticks: ["manage_tenant_settings"] },
];

const allowed = (user, hasFeature) => (it) =>
  (it.ticks.length === 0 || hasTick(user, ...it.ticks)) && (!it.feature || hasFeature(it.feature));

// the branch pages this user may open, with clear names when two would look the same
function branchItems(user, hasFeature) {
  const items = BRANCH_ITEMS.filter(allowed(user, hasFeature));
  const has = (k) => items.some((i) => i.key === k);
  // Branch Settings already holds Appearance and a Roles box, so those two leave the menu
  const inSettings = has("branch_settings") ? ["appearance", "roles"] : [];
  return items.filter((it) => !inSettings.includes(it.key)).map((it) => {
    if (it.key === "front_desk" && (has("my_day") || has("branch_overview"))) return { ...it, labelKey: "nav.front_desk" };
    if (it.key === "my_day" && has("front_desk")) return { ...it, labelKey: "nav.my_day" };
    if (it.key === "my_report" && has("reports")) return { ...it, labelKey: "nav.my_report" };
    // "Appointments" opens the doctor's own work list for people with My day
    if (it.key === "appointments" && has("my_day")) return { ...it, to: "/my-appointments", end: false };
    return it;
  });
}

export const isOwnerMenu = (user) => hasTick(user, ...CLINIC_TICKS);

// Items in TopNav shape (labelKey still to translate). branchName labels the owner's branch list.
export function buildNav(user, hasFeature, { branchName } = {}) {
  const branch = branchItems(user, hasFeature);
  if (!isOwnerMenu(user)) return branch;

  // owner: Overview | Branch: X ▾ (every branch page) | Users | Reports | Feedback | Activity log | Settings
  const overview = hasTick(user, "view_clinic_dashboard")
    ? [{ key: "overview", labelKey: "nav.overview", to: "/overview", end: true }] : [];
  const inBranch = user?.branch_id
    ? branch.filter((it) => !["reports", "my_report", "appearance"].includes(it.key))
        .map((it) => (it.key === "front_desk" ? { ...it, labelKey: "nav.front_desk" }
          : it.key === "branch_overview" ? { ...it, labelKey: "nav.branch_overview" } : it))
    : [];
  const branchGroup = inBranch.length
    ? [{ key: "branch_group", labelKey: "nav.branch_named", labelArgs: { name: branchName || "" }, to: inBranch[0].to, end: false },
       ...inBranch.map((it) => ({ ...it, indent: true }))]
    : [];
  return [...overview, ...branchGroup, ...CLINIC_ITEMS.filter(allowed(user, hasFeature))];
}

// the first page to open after login: a dashboard if the user has one, else the first menu item
const DASHBOARDS = [
  // [tick, page, needs an open branch]
  ["view_clinic_dashboard", "/overview", false],
  ["view_branch_dashboard", "/branch-overview", true],
  ["view_front_desk", "/front-desk", true],
  ["view_my_day", "/my-day", true],
];

export function homePath(user, hasFeature) {
  for (const [tick, to, needsBranch] of DASHBOARDS) {
    if (hasTick(user, tick) && (!needsBranch || user?.branch_id)) return to;
  }
  const first = buildNav(user, hasFeature).find((it) => it.to && it.key !== "appearance" && it.key !== "branch_group");
  return first ? first.to : null;
}

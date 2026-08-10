import { useState } from "react";
import { NavLink, useLocation, useResolvedPath } from "react-router-dom";
import { getTheme, toggleTheme } from "../utils/theme";
import ProfileMenu from "./ProfileMenu";

/*
 * Shared top navigation bar (replaces the old per-role left sidebars).
 *
 * Layout:  [ avatar + brand ]  ····  [ page links + dropdowns ]  ····  [ extras · theme · logout ]
 * Fully responsive: on < lg the center links collapse into a hamburger menu.
 *
 * Each role passes its OWN already-filtered items so permission/feature gating
 * stays exactly where it was. Items shaped like { key, to, end, label, indent }.
 * Consecutive `indent` items are grouped under the preceding item as a dropdown
 * (this is how Appointments → Calendar / Reminders / Feedback is built).
 */

// Active top-level link = teal underline (tab indicator), like the design.
const topLinkClass = ({ isActive }) =>
  [
    "relative px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap",
    isActive
      ? "text-slate-900 after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#0E6E75]"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
  ].join(" ");

// Menu / dropdown / mobile link = soft teal fill when active.
const menuLinkClass = ({ isActive }) =>
  [
    "block px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap",
    isActive
      ? "text-[#0E6E75] bg-[#0E6E75]/10"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
  ].join(" ");

function ChevronIcon({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* A single top-level link with no children. */
function NavItem({ item, onNavigate, className = topLinkClass }) {
  return (
    <NavLink to={item.to} end={item.end} onClick={onNavigate} className={className}>
      {item.label}
    </NavLink>
  );
}

/* A top-level item that owns a dropdown of children (desktop).
 * Opens on HOVER. The label itself is a real link to the section (e.g. Appointments),
 * so clicking it navigates there; the menu lists only the child pages. */
function NavDropdown({ group }) {
  const [open, setOpen] = useState(false);
  const resolved = useResolvedPath(group.to);
  const loc = useLocation();
  const sectionActive =
    loc.pathname === resolved.pathname ||
    loc.pathname.startsWith(resolved.pathname + "/");

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <NavLink
        to={group.to}
        end={group.end}
        aria-haspopup="true"
        aria-expanded={open}
        className={[
          "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap",
          sectionActive
            ? "text-slate-900 after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#0E6E75]"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
        ].join(" ")}
      >
        {group.label}
        <ChevronIcon open={open} />
      </NavLink>

      {open && (
        /* top-full + pt-2 keeps the hover area continuous across the visual gap */
        <div className="absolute start-1/2 top-full z-50 -translate-x-1/2 pt-2">
          <div className="w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {group.children.map((c) => (
              <NavLink key={c.key} to={c.to} end={c.end} onClick={() => setOpen(false)} className={menuLinkClass}>
                {c.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Compact icon theme toggle for the right cluster. */
function ThemeIconToggle() {
  const [theme, setTheme] = useState(getTheme());
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      title={isDark ? "Light mode" : "Dark mode"}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

function buildGroups(items) {
  const groups = [];
  for (const it of items) {
    if (it.indent && groups.length) groups[groups.length - 1].children.push(it);
    else groups.push({ ...it, children: [] });
  }
  return groups;
}

export default function TopNav({
  items = [],
  title,
  subtitle,
  onLogout,
  rightExtras = null,   // e.g. <NotificationBell/>
  switcher = null,      // e.g. <BranchSwitcher/>
  beforeLogout = null,  // e.g. back-to-tenant button
  showProfile = true,
  logoutLabel = "Log out",
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const groups = buildGroups(items);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="z-40 shrink-0 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:px-6">
        {/* LEFT — avatar + brand */}
        <div className="flex min-w-0 items-center gap-3">
          {showProfile && <ProfileMenu />}
          {(title || subtitle) && (
            <div className="hidden min-w-0 flex-col leading-tight sm:flex">
              {title && <span className="truncate text-sm font-semibold text-slate-900">{title}</span>}
              {subtitle && <span className="truncate text-[11px] text-slate-500">{subtitle}</span>}
            </div>
          )}
        </div>

        {/* CENTER — page links (desktop) */}
        <nav className="mx-auto hidden items-center gap-0.5 lg:flex">
          {groups.map((g) =>
            g.children.length ? (
              <NavDropdown key={g.key} group={g} />
            ) : (
              <NavItem key={g.key} item={g} />
            )
          )}
        </nav>

        {/* RIGHT — extras + theme + logout */}
        <div className="ms-auto flex items-center gap-1.5">
          {switcher && <div className="hidden lg:block">{switcher}</div>}
          {rightExtras}
          <ThemeIconToggle />
          {beforeLogout && <div className="hidden lg:block">{beforeLogout}</div>}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-red-300 hover:text-red-600 sm:inline-flex"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span className="hidden md:inline">{logoutLabel}{" "}</span>
            </button>
          )}

          {/* hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-3 py-3 lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {groups.map((g) => (
              <div key={g.key}>
                <NavItem item={g} onNavigate={closeMenu} className={menuLinkClass} />
                {g.children.length > 0 && (
                  <div className="ms-3 mt-0.5 flex flex-col gap-0.5 border-s border-slate-200 ps-2">
                    {g.children.map((c) => (
                      <NavItem key={c.key} item={c} onNavigate={closeMenu} className={menuLinkClass} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {(switcher || beforeLogout || onLogout) && (
            <div className="mt-3 flex flex-col gap-1 border-t border-slate-200 pt-3">
              {switcher}
              {beforeLogout}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => { closeMenu(); onLogout(); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

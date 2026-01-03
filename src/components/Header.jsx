// src/components/Header.jsx
function Header() {
  return (
    <header className="w-full border-b bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo + Clinic name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
            CD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              Crown Dental Clinic
            </span>
            <span className="text-xs text-blue-100">
              Clinic Management System
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium uppercase tracking-wide">
            Admin Portal
          </span>
          <span className="text-[11px] text-blue-100">
            Secure access only
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;

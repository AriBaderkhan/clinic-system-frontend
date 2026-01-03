// src/components/Footer.jsx
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-xs text-slate-500">
        <span>© {year} Crown Dental Clinic.</span>
        <span className="hidden sm:inline">
          Built for internal clinic use · Admin only
        </span>
      </div>
    </footer>
  );
}

export default Footer;

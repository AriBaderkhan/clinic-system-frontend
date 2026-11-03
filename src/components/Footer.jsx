export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ocean-band band-dark mt-auto w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 text-xs font-medium text-slate-600 sm:px-6">
        <span>© {year} Tradi Company</span>
      </div>
    </footer>
  );
}

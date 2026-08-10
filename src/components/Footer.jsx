export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full bg-[#0E6E75]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-xs text-white">
        <span>© {year} Tradi Company</span>
      </div>
    </footer>
  );
}

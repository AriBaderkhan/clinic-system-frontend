// src/components/Footer.jsx
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full bg-[#7b97bd]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-xs text-white">
        <span>© {year} Tradi Company</span>
      </div>
    </footer>
  );
}

export default Footer;

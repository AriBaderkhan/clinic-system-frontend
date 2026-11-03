import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-ground">
      {/* navy band behind the card */}
      <div className="ocean-band band-dark h-56 shrink-0 sm:h-64" aria-hidden="true" />
      <div className="relative -mt-40 flex flex-1 items-start justify-center px-4 pb-12 sm:-mt-44">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-pop sm:p-10">
          <h1 className="mb-2 text-5xl font-extrabold tracking-tight text-brand tabular-nums">404</h1>
          <p className="mb-6 text-sm text-slate-500">Page not found.</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Go back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

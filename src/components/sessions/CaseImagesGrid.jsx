import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Case-images gallery + responsive lightbox.
// Click a thumbnail to open it as a card overlay (not a new tab).
export default function CaseImagesGrid({ images = [] }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(null); // the image being viewed, or null

  // close on Escape; lock page scroll while the lightbox is open
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{t("ci.title")}</p>
        <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{t("ci.images_count", { count: images.length })}</span>
      </div>

      {images.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">{t("ci.no_images")}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(img)}
              title={t("ci.view_image")}
              className="group relative block aspect-square overflow-hidden rounded-xl border border-slate-200 transition hover:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            >
              <img src={img.url} alt="Case image" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox overlay */}
      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ocean-deep/80 p-3 backdrop-blur-sm sm:p-6"
          onClick={(e) => e.target === e.currentTarget && setActive(null)}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
              <p className="text-base font-semibold text-slate-900">{t("ci.case_image")}</p>
              <div className="flex items-center gap-2">
                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("ci.open_original")}
                </a>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-ocean-deep p-2 sm:p-4">
              <img
                src={active.url}
                alt="Case image"
                className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

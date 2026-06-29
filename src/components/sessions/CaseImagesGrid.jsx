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
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{t("ci.title")}</p>
        <span className="rounded-full bg-[#015478]/10 px-3 py-1 text-[11px] font-medium text-[#015478] border border-[#015478]/20">{t("ci.images_count", { count: images.length })}</span>
      </div>

      {images.length === 0 ? (
        <p className="text-xs text-slate-500">{t("ci.no_images")}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(img)}
              title={t("ci.view_image")}
              className="group relative block aspect-square overflow-hidden rounded-lg border border-slate-200 hover:border-[#015478] focus:outline-none focus:ring-2 focus:ring-[#015478]"
            >
              <img src={img.url} alt="Case image" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox overlay */}
      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6"
          onClick={(e) => e.target === e.currentTarget && setActive(null)}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <p className="text-[13px] font-medium text-slate-700">{t("ci.case_image")}</p>
              <div className="flex items-center gap-2">
                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
                >
                  {t("ci.open_original")}
                </a>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-200"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-900/95 p-2 sm:p-4">
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

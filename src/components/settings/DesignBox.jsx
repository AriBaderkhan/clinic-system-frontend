import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// "Design" box on the settings pages (like the Works box): opens the user's own Design page
export default function DesignBox() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5" data-design-box>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{t("design.title")}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{t("design.box_hint")}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/design")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          {t("design.open")}
        </button>
      </div>
    </section>
  );
}

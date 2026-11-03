import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

// Full-screen popout for an announcement — used when a message is long or has
// an image/video. (video_url is reserved for later; rendered if present.)
// Drawn into <body> so it uses the page colours, not the navy band's (the bells live in the band).
export default function AnnouncementModal({ announcement, onClose }) {
    const { t } = useTranslation();
    if (!announcement) return null;
    const a = announcement;

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ocean-deep/60 p-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <h3 className="min-w-0 break-words text-base font-semibold text-slate-900">{a.title}</h3>
                    <button onClick={onClose} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                        {t("common.close")}
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {a.image_url && (
                        <img src={a.image_url} alt="" className="mb-4 max-h-80 w-full rounded-xl bg-slate-50 object-contain" />
                    )}
                    {a.video_url && (
                        <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl bg-black">
                            <iframe src={a.video_url} title={t("layout.announcement_video")} className="h-full w-full" allowFullScreen />
                        </div>
                    )}
                    {a.body && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{a.body}</p>}
                    <p className="mt-4 text-xs text-slate-400 tabular-nums">{new Date(a.created_at).toLocaleString()}</p>
                </div>
            </div>
        </div>,
        document.body
    );
}

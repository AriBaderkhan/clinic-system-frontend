import { useTranslation } from "react-i18next";

// Full-screen popout for an announcement — used when a message is long or has
// an image/video. (video_url is reserved for later; rendered if present.)
export default function AnnouncementModal({ announcement, onClose }) {
    const { t } = useTranslation();
    if (!announcement) return null;
    const a = announcement;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    <h3 className="pe-3 font-semibold text-slate-900">{a.title}</h3>
                    <button onClick={onClose} className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200">
                        {t("common.close")}
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    {a.image_url && (
                        <img src={a.image_url} alt="" className="mb-4 max-h-80 w-full rounded-lg object-contain" />
                    )}
                    {a.video_url && (
                        <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg bg-black">
                            <iframe src={a.video_url} title={t("layout.announcement_video")} className="h-full w-full" allowFullScreen />
                        </div>
                    )}
                    {a.body && <p className="whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>}
                    <p className="mt-4 text-[11px] text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

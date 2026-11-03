import { useState, useEffect } from 'react';
import { FaWifi } from 'react-icons/fa';

const OfflineNotice = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto bg-ground transition-all duration-300">
            {/* navy band behind the card */}
            <div className="ocean-band band-dark h-56 shrink-0 sm:h-64" aria-hidden="true" />
            <div className="relative -mt-40 flex flex-1 items-start justify-center px-4 pb-12 sm:-mt-44">
                <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-pop sm:p-10">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
                        <FaWifi className="text-4xl text-red-600" />
                    </div>

                    <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">No Internet Connection</h1>
                    <p className="mb-8 max-w-md text-sm text-slate-500">
                        Please check your network connection
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-95"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfflineNotice;

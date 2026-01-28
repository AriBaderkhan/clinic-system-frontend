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
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
            <div className="bg-red-50 p-6 rounded-full mb-6">
                <FaWifi className="text-6xl text-blue-900" />
            </div>

            <h1 className="text-3xl font-bold text-gray-700 mb-2">No Internet Connection</h1>
            <p className="text-gray-500 max-w-md mb-8">
                Please check your network connection
            </p>
            <br />
            <button
                onClick={() => window.location.reload()}
                className="btn btn-primary bg-blue-950 px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-transform active:scale-95"
            >
                Reload Page
            </button>
        </div>
    );
};

export default OfflineNotice;

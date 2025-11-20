import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import CardNotification from '@/components/common/CardNotification';
import { BellIcons } from '@/components/icons';
import { useNotificationStore } from '@/stores/notificationStore';

const Notifications = () => {
    const { unreadCount, markAllAsRead, hasNewNotifications } = useNotificationStore();

    // Check if mobile
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Estado para mantener el contador mostrado
    const [displayCount, setDisplayCount] = useState(unreadCount);

    // Actualizar el contador mostrado cuando cambie unreadCount
    useEffect(() => {
        setDisplayCount(unreadCount);
    }, [unreadCount]);

    const [openDrawer, setOpenDrawer] = useState(false);

    const handleChangeDrawer = () => {
        setOpenDrawer(!openDrawer);

        // Si estamos abriendo el drawer, cargar las notificaciones
        if (!openDrawer) {
            useNotificationStore.getState().fetchNotifications();
        }

        // Si estamos cerrando el drawer y hay notificaciones nuevas, actualizamos el indicador
        if (openDrawer && hasNewNotifications) {
            useNotificationStore.getState().hasNewNotifications = false;
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    return (
        <>
            {/* Notification Bell Button */}
            <div
                onClick={handleChangeDrawer}
                className="flex items-center justify-center cursor-pointer transition-all duration-300"
            >
                <button
                    aria-label="notifications"
                    className="p-0 bg-[#F0F0F0] rounded-lg relative"
                >
                    {/* Badge */}
                    {displayCount > 0 && (
                        <span className="absolute -top-0.5 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {displayCount}
                        </span>
                    )}
                    <BellIcons />
                </button>
            </div>

            {/* Overlay */}
            {openDrawer && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-1299"
                    onClick={handleChangeDrawer}
                />
            )}

            {/* Drawer */}
            <div
                className={`
                    fixed top-0 right-0 h-full bg-[#F9F9FA] z-1300
                    ${isMobile ? 'w-full' : 'w-[400px]'}
                    transform transition-transform duration-300 ease-in-out
                    ${openDrawer ? 'translate-x-0' : 'translate-x-full'}
                    shadow-xl
                `}
            >
                <div className="flex flex-col justify-between gap-4 w-full p-4 h-full">
                    <div className="flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold font-helvetica text-[#353535]">
                                Notificaciones
                            </h2>

                            <div className="flex items-center gap-4">
                                {displayCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-[#FF336D] font-bold font-helvetica text-sm hover:underline transition-all"
                                    >
                                        Marcar todo como leído
                                    </button>
                                )}

                                <div
                                    className="cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded p-1 transition-colors"
                                    onClick={handleChangeDrawer}
                                >
                                    <X strokeWidth={2} size={22} className="text-[#353535]" />
                                </div>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div>
                            <div className="grid grid-cols-1 gap-4">
                                <CardNotification />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Notifications;
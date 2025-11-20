import dayjs from 'dayjs';
import 'dayjs/locale/es';

import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@/stores/notificationStore';

const CardNotification = () => {
    const { notifications, loading, markAsRead } = useNotificationStore();

    const handleNotificationClick = async (notification: Notification) => {
        console.warn('Clic en notificación:', notification.id, 'Leída:', notification.isRead);

        if (!notification.isRead) {
            try {
                // Marcar como leída solo si no estaba leída
                const result = await markAsRead(notification.id);
                console.warn('Resultado de marcar como leída:', result);

                // Forzar actualización del contador real
                await useNotificationStore.getState().fetchUnreadCount();
            } catch (error) {
                console.error('Error en handleNotificationClick:', error);
            }
        } else {
            console.warn('La notificación ya estaba leída, no se realiza acción');
        }

        // Aquí puedes agregar lógica para navegar según el tipo de notificación
    };

    const formatNotificationDate = (dateString: string): string => {
        try {
            return dayjs(dateString).locale('es').format("ddd, D [de] MMMM");
        } catch (error) {
            return '';
        }
    };

    const getNotificationTitle = (notification: Notification): string => {
        // Determinar título según tipo de notificación
        switch (notification.type) {
            case 'Club':
                return 'Club 🏢';
            case 'Event':
                return 'Evento 🎭';
            case 'Artist':
                return 'Artista 🎤';
            case 'User':
                return 'Usuario 👤';
            case 'System':
                return 'Sistema ⚙️';
            default:
                return 'Staff 🫡';
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#353535]"></div>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="flex justify-center items-center h-[200px]">
                <p className="text-sm font-bold font-helvetica text-[#353535]">
                    No tienes notificaciones
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-auto">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`
                        flex flex-col gap-1 p-4 rounded-lg cursor-pointer transition-colors
                        ${notification.isRead ? 'bg-white' : 'bg-[#F0F0F0]'}
                        hover:bg-[#F0F0F0]
                    `}
                    onClick={() => handleNotificationClick(notification)}
                >
                    <p className="text-sm font-bold font-helvetica text-[#353535]">
                        {getNotificationTitle(notification)}
                    </p>
                    <p className="text-sm font-bold font-helvetica text-[#353535]">
                        {notification.title}
                    </p>
                    <p className="text-sm font-medium font-helvetica text-[#353535]">
                        {notification.message}
                    </p>
                    <p className="text-sm font-bold font-helvetica text-[#98AAC0]">
                        {formatNotificationDate(notification.createdAt)}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default CardNotification;
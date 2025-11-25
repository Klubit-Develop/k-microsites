import { useEffect, useState } from 'react';
import { useSocket } from '@/integrations/socket/socket-provider';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface Notification {
    id: string;
    title: string;
    description: string;
    status: 'UNREAD' | 'READ';
    createdAt: string;
    updatedAt: string;
    userId: string;
}

export const useNotifications = () => {
    const { socket, isConnected } = useSocket();
    const token = useAuthStore((state) => state.token);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!token) return;
        
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/v2/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        if (!token) return;

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/v2/notifications/${notificationId}/read`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif.id === notificationId
                            ? { ...notif, status: 'READ' }
                            : notif
                    )
                );
                toast.success('Notificación marcada como leída');
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Error al marcar como leída');
        }
    };

    const deleteNotification = async (notificationId: string) => {
        if (!token) return;

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/v2/notifications/${notificationId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                setNotifications((prev) =>
                    prev.filter((notif) => notif.id !== notificationId)
                );
                toast.success('Notificación eliminada');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Error al eliminar notificación');
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
        }
    }, [token]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNotification = (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
            
            toast.info(notification.title, {
                description: notification.description,
            });
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket, isConnected]);

    const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;

    return {
        notifications,
        unreadCount,
        isConnected,
        loading,
        markAsRead,
        deleteNotification,
        refetch: fetchNotifications,
    };
};
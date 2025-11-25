import { useEffect, useState } from 'react';
import { useSocket } from '@/integrations/socket/socket-provider';
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
    const [notifications, setNotifications] = useState<Notification[]>([]);

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

    return {
        notifications,
        isConnected,
    };
};
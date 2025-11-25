import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';

const TOKEN_KEY = 'SACAR ESTO';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'Club' | 'Event' | 'Artist' | 'User' | 'System' | 'Staff';
    isRead: boolean;
    createdAt: string;
}

interface NotificationResponse {
    status: 'success' | 'error';
    message?: string;
    data?: {
        notifications: Notification[];
        count?: number;
    };
}

interface NotificationStore {
    notifications: Notification[];
    unreadCount: number;
    hasNewNotifications: boolean;
    loading: boolean;
    page: number;
    limit: number;
    connectSocket: (userId: string) => Socket | undefined;
    disconnectSocket: () => void;
    fetchNotifications: (page?: number, limit?: number) => Promise<NotificationResponse>;
    fetchUnreadCount: () => Promise<NotificationResponse>;
    markAsRead: (id: string) => Promise<NotificationResponse>;
    markAllAsRead: () => Promise<NotificationResponse>;
}

let socket: Socket | null = null;
let connectedUserId: string | null = null;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    hasNewNotifications: false,
    loading: false,
    page: 1,
    limit: 10,

    connectSocket: (userId: string) => {
        if (!userId) return;

        // Evitamos reconexiones innecesarias
        if (socket && socket.connected && connectedUserId === userId) {
            console.warn('Socket ya conectado para el usuario:', userId);
            return socket;
        }

        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return;

        // Si existe una conexión, la desconectamos
        if (socket) {
            console.warn('Desconectando socket existente');
            socket.disconnect();
            socket = null;
        }

        // Creamos nueva conexión
        console.warn('Creando nueva conexión de socket para usuario:', userId);
        socket = io(API_URL, {
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            transports: ['websocket']
        });

        socket.on('connect', () => {
            console.warn('Socket conectado:', socket?.id);

            // Autenticamos la conexión
            socket?.emit('authenticate', { userId, token });
            connectedUserId = userId; // Guardamos el ID del usuario conectado
        });

        // Escuchamos nuevas notificaciones
        socket.on('notification', (notification: Notification) => {
            console.warn('Nueva notificación recibida:', notification);
            set((state) => ({
                notifications: [notification, ...state.notifications],
                unreadCount: state.unreadCount + 1,
                hasNewNotifications: true
            }));
        });

        // Escuchamos actualizaciones del contador
        socket.on('unreadNotificationCount', (data: { count: number }) => {
            console.warn('Contador de notificaciones actualizado:', data);
            console.warn('Estado anterior del contador:', get().unreadCount);
            set({ unreadCount: data.count });
            console.warn('Nuevo estado del contador:', get().unreadCount);
        });

        socket.on('disconnect', () => {
            console.warn('Socket desconectado');
        });

        socket.on('connect_error', (error: Error) => {
            console.error('Error de conexión socket:', error);
        });

        return socket;
    },

    disconnectSocket: () => {
        if (socket) {
            console.warn('Desconectando socket manualmente');
            socket.disconnect();
            socket = null;
            connectedUserId = null;
        }
    },

    // Cargar notificaciones
    fetchNotifications: async (page = 1, limit = 10) => {
        try {
            set({ loading: true });

            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                set({ loading: false });
                return { status: 'error', message: 'No hay token disponible' };
            }

            const response = await fetch(`${API_URL}/v1/notifications?page=${page}&limit=${limit}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data: NotificationResponse = await response.json();

            if (data.status === 'success' && data.data) {
                if (page === 1) {
                    set({
                        notifications: data.data.notifications,
                        page: 1,
                        hasNewNotifications: false
                    });
                } else {
                    // Agregamos más notificaciones si estamos paginando
                    set((state) => ({
                        notifications: [...state.notifications, ...data.data!.notifications],
                        page
                    }));
                }
            }

            set({ loading: false });
            return data;
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            set({ loading: false });
            return { status: 'error', message: (error as Error).message };
        }
    },

    // Contador de notificaciones no leídas
    fetchUnreadCount: async () => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                return { status: 'error', message: 'No hay token disponible' };
            }

            const response = await fetch(`${API_URL}/v1/notifications/unread-count`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data: NotificationResponse = await response.json();

            if (data.status === 'success' && data.data) {
                set({ unreadCount: data.data.count || 0 });
            }

            return data;
        } catch (error) {
            console.error('Error al obtener contador de notificaciones:', error);
            return { status: 'error', message: (error as Error).message };
        }
    },

    // Marcar como leída
    markAsRead: async (id: string) => {
        try {
            console.warn('Marcando notificación como leída:', id);
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                return { status: 'error', message: 'No hay token disponible' };
            }

            // Verificar si la notificación ya estaba leída antes de la llamada API
            const notifications = get().notifications;
            const notification = notifications.find((n) => n.id === id);
            const wasAlreadyRead = notification ? notification.isRead : false;

            console.warn('¿La notificación ya estaba leída?', wasAlreadyRead);

            const response = await fetch(`${API_URL}/v1/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data: NotificationResponse = await response.json();
            console.warn('Respuesta del servidor:', data);

            if (data.status === 'success') {
                // Solo reducir el contador si la notificación no estaba leída
                if (!wasAlreadyRead) {
                    set((state) => ({
                        notifications: state.notifications.map((notif) =>
                            notif.id === id ? { ...notif, isRead: true } : notif
                        ),
                        unreadCount: Math.max(0, state.unreadCount - 1)
                    }));
                    console.warn('Contador reducido a:', get().unreadCount);
                } else {
                    // Si ya estaba leída, solo actualizar el estado sin modificar el contador
                    set((state) => ({
                        notifications: state.notifications.map((notif) =>
                            notif.id === id ? { ...notif, isRead: true } : notif
                        )
                    }));
                    console.warn('No se redujo el contador porque ya estaba leída');
                }

                // Opcional: Verificar el conteo real desde el servidor
                await get().fetchUnreadCount();
            }

            return data;
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            return { status: 'error', message: (error as Error).message };
        }
    },

    // Marcar todas como leídas
    markAllAsRead: async () => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                return { status: 'error', message: 'No hay token disponible' };
            }

            const response = await fetch(`${API_URL}/v1/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data: NotificationResponse = await response.json();

            if (data.status === 'success') {
                set((state) => ({
                    notifications: state.notifications.map((notif) => ({ ...notif, isRead: true })),
                    unreadCount: 0,
                    hasNewNotifications: false
                }));
            }

            return data;
        } catch (error) {
            console.error('Error al marcar todas las notificaciones como leídas:', error);
            return { status: 'error', message: (error as Error).message };
        }
    }
}));

export type { Notification, NotificationResponse, NotificationStore };
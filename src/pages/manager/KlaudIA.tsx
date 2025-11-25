import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from '@tanstack/react-router';
import { useNotifications } from '@/hooks/useNotifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

const KlaudIA = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    const { 
        notifications, 
        unreadCount, 
        isConnected, 
        loading,
        markAsRead,
        deleteNotification,
        refetch
    } = useNotifications();

    const handleLogout = () => {
        logout();
        navigate({ to: '/' });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-6">
            <h1 className="text-3xl font-bold font-['N27'] text-[#252E39]">
                KlaudIA
            </h1>

            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                    {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
            </div>

            <div className="w-full max-w-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Notificaciones {unreadCount > 0 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : 'Actualizar'}
                    </button>
                </div>

                {loading && notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Cargando notificaciones...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No tienes notificaciones
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id} 
                                className={`p-4 rounded-lg border transition-all ${
                                    notif.status === 'UNREAD' 
                                        ? 'bg-blue-50 border-blue-200' 
                                        : 'bg-white border-gray-200'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-[#252E39]">
                                                {notif.title}
                                            </p>
                                            {notif.status === 'UNREAD' && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {notif.description}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {dayjs(notif.createdAt).fromNow()}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {notif.status === 'UNREAD' && (
                                            <button
                                                onClick={() => markAsRead(notif.id)}
                                                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                                            >
                                                Marcar como leída
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notif.id)}
                                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <button
                onClick={handleLogout}
                className="px-6 py-2 bg-[#252E39] text-white rounded-lg hover:bg-[#1a2129] transition-colors"
            >
                Cerrar sesión
            </button>
        </div>
    );
};

export default KlaudIA;
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from '@tanstack/react-router';
import { useNotifications } from '@/hooks/useNotifications';

const KlaudIA = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    const { notifications, isConnected } = useNotifications();

    const handleLogout = () => {
        logout();
        navigate({ to: '/' });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <h1 className="text-3xl font-bold font-['N27'] text-[#252E39]">
                KlaudIA
            </h1>

            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                    {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
            </div>

            {notifications.length > 0 && (
                <div className="w-full max-w-md space-y-2">
                    <h2 className="text-lg font-semibold">Notificaciones ({notifications.length})</h2>
                    {notifications.map((notif) => (
                        <div key={notif.id} className="p-3 bg-gray-100 rounded-lg">
                            <p className="font-medium">{notif.title}</p>
                            <p className="text-sm text-gray-600">{notif.description}</p>
                        </div>
                    ))}
                </div>
            )}
            
            <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#252E39] text-white rounded-lg hover:bg-[#1a2129] transition-colors"
            >
                Cerrar sesión
            </button>
        </div>
    );
};

export default KlaudIA;
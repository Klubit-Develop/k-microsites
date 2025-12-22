import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { useNavigate } from '@tanstack/react-router';

import { useAuthStore } from '@/stores/authStore';

dayjs.extend(relativeTime);
dayjs.locale('es');

const KlaudIA = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate({ to: '/' });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-6">
            <button
                onClick={handleLogout}
                className="px-6 py-2 bg-[#252E39] text-white rounded-lg hover:bg-[#1a2129]"
            >
                Cerrar sesión
            </button>

        </div>
    );
};

export default KlaudIA;
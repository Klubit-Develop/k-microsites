import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from '@tanstack/react-router';

const KlaudIA = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate({ to: '/' });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <h1 className="text-3xl font-bold font-['N27'] text-[#252E39]">
                KlaudIA
            </h1>
            
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
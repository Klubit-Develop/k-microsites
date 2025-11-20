import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: async ({ location }) => {
        const { token, logout } = useAuthStore.getState();
        
        // Limpiar location.state del historial del navegador
        if (location.state && Object.keys(location.state).length > 0) {
            window.history.replaceState(
                {},
                '',
                window.location.pathname + window.location.search
            );
        }
        
        if (!token) {
            logout();
            throw redirect({ to: '/' });
        }
    }
})
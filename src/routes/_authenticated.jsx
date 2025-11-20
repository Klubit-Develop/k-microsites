import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: async () => {
        const { token, logout } = useAuthStore.getState();

        console.log('Token:', token);

        if (!token) {
            logout();
            throw redirect({ to: '/' });
        }
    }
})
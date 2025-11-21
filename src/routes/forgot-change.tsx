import { createFileRoute, redirect } from '@tanstack/react-router'
import ForgotChangePage from '@/pages/ForgotChange';

export const Route = createFileRoute('/forgot-change')({
    component: ForgotChangePage,
    beforeLoad: async ({ location }) => {
        const state = location.state as { id?: string; token?: string };

        if (!state?.id || !state?.token) {
            throw redirect({ to: '/forgot' });
        }
    },
})

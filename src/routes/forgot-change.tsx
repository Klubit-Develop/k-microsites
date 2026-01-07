import { createFileRoute, redirect, useBlocker } from '@tanstack/react-router'
import ForgotChangePage from '@/pages/ForgotChange';

const ForgotChangePageWrapper = () => {
    useBlocker({
        shouldBlockFn: () => true,
    });

    return <ForgotChangePage />;
};

export const Route = createFileRoute('/forgot-change')({
    component: ForgotChangePageWrapper,
    beforeLoad: async ({ location }) => {
        const state = location.state as { id?: string; token?: string };

        if (!state?.id || !state?.token) {
            throw redirect({ to: '/forgot' });
        }
    },
})
import { createFileRoute, redirect } from '@tanstack/react-router'
import VerifyPage from '@/pages/Verify';

export const Route = createFileRoute('/verify')({
    component: VerifyPage,
    beforeLoad: async ({ location }) => {
        const verification = (location.state as { verification?: string })?.verification;

        if (!verification) {
            throw redirect({ to: '/' });
        }
    },
})
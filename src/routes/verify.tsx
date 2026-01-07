import { createFileRoute, redirect, useBlocker } from '@tanstack/react-router'
import VerifyPage from '@/pages/Verify';

const VerifyPageWrapper = () => {
    useBlocker({
        shouldBlockFn: () => true,
    });

    return <VerifyPage />;
};

export const Route = createFileRoute('/verify')({
    component: VerifyPageWrapper,
    beforeLoad: async ({ location }) => {
        const verification = (location.state as { verification?: string })?.verification;

        if (!verification) {
            throw redirect({ to: '/' });
        }
    },
})
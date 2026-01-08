import { createFileRoute, redirect } from '@tanstack/react-router'
import ForgotChangePage from '@/pages/ForgotChange';

interface ForgotChangeSearchParams {
    id?: string;
    token?: string;
    currentEmail?: string;
}

export const Route = createFileRoute('/forgot-change')({
    validateSearch: (search: Record<string, unknown>): ForgotChangeSearchParams => ({
        id: (search.id as string) || '',
        token: (search.token as string) || '',
        currentEmail: (search.currentEmail as string) || '',
    }),
    component: ForgotChangePage,
    beforeLoad: async ({ search }) => {
        if (!search?.id || !search?.token) {
            throw redirect({ to: '/forgot' });
        }
    },
})
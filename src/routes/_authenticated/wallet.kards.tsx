import { createFileRoute, redirect } from '@tanstack/react-router'
import WalletKards from '@/pages/WalletKards'

interface WalletKardsSearch {
    clubId?: string;
}

export const Route = createFileRoute('/_authenticated/wallet/kards')({
    validateSearch: (search: Record<string, unknown>): WalletKardsSearch => ({
        clubId: (search.clubId as string) || undefined,
    }),
    component: WalletKards,
    beforeLoad: async ({ search }) => {
        if (!search?.clubId) {
            throw redirect({ to: '/wallet' });
        }
    },
})
import { createFileRoute } from '@tanstack/react-router'
import WalletKards from '@/pages/WalletKards'

export const Route = createFileRoute('/_authenticated/wallet/kards')({
    component: WalletKards,
})
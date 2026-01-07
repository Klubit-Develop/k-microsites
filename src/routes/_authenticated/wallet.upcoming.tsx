import { createFileRoute } from '@tanstack/react-router'
import WalletUpcoming from '@/pages/WalletUpcoming'

export const Route = createFileRoute('/_authenticated/wallet/upcoming')({
    component: WalletUpcoming,
})
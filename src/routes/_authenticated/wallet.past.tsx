import { createFileRoute } from '@tanstack/react-router'
import WalletPast from '@/pages/WalletPast'

export const Route = createFileRoute('/_authenticated/wallet/past')({
    component: WalletPast,
})
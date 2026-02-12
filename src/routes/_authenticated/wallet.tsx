import { createFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import WalletPage from '@/pages/Wallet'

export const Route = createFileRoute('/_authenticated/wallet')({
    component: WalletLayout,
})

function WalletLayout() {
    const kardsMatch = useMatch({
        from: '/_authenticated/wallet/kards/$idKard',
        shouldThrow: false
    })

    if (kardsMatch) {
        return <Outlet />
    }

    return <WalletPage />
}
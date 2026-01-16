import { createFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import WalletPage from '@/pages/Wallet'

export const Route = createFileRoute('/_authenticated/wallet')({
    component: WalletLayout,
})

function WalletLayout() {
    const upcomingMatch = useMatch({
        from: '/_authenticated/wallet/upcoming',
        shouldThrow: false
    })
    const pastMatch = useMatch({
        from: '/_authenticated/wallet/past',
        shouldThrow: false
    })
    const kardsMatch = useMatch({
        from: '/_authenticated/wallet/kards',
        shouldThrow: false
    })

    if (upcomingMatch || pastMatch || kardsMatch) {
        return <Outlet />
    }

    return <WalletPage />
}
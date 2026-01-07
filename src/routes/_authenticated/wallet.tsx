import { createFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import WalletPage from '@/pages/Wallet'

export const Route = createFileRoute('/_authenticated/wallet')({
    component: WalletLayout,
})

function WalletLayout() {
    // Check if any child route is active
    const transactionMatch = useMatch({
        from: '/_authenticated/wallet/$transactionId',
        shouldThrow: false
    })
    const itemMatch = useMatch({
        from: '/_authenticated/wallet/$transactionId/$itemId',
        shouldThrow: false
    })
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

    // If any child route is active, render Outlet
    if (transactionMatch || itemMatch || upcomingMatch || pastMatch || kardsMatch) {
        return <Outlet />
    }

    // Otherwise render main Wallet page
    return <WalletPage />
}
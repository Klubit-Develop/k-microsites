import { createFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import TransactionItems from '@/pages/TransactionItems'

export const Route = createFileRoute('/_authenticated/wallet/$transactionId')({
    component: TransactionItemsLayout,
})

function TransactionItemsLayout() {
    // Check if itemId route is active
    const itemMatch = useMatch({
        from: '/_authenticated/wallet/$transactionId/$itemId',
        shouldThrow: false
    })

    // If item detail route is active, render Outlet
    if (itemMatch) {
        return <Outlet />
    }

    // Otherwise render TransactionItems page
    return <TransactionItems />
}
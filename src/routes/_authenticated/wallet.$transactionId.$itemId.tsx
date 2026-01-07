import { createFileRoute } from '@tanstack/react-router'
import ItemDetail from '@/pages/ItemDetail'

export const Route = createFileRoute('/_authenticated/wallet/$transactionId/$itemId')({
    component: ItemDetail,
})
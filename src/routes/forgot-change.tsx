import { createFileRoute } from '@tanstack/react-router'
import ForgotChangePage from '@/pages/ForgotChange';

export const Route = createFileRoute('/forgot-change')({
    component: ForgotChangePage,
})

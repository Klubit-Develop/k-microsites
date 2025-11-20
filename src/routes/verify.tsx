import { createFileRoute } from '@tanstack/react-router'
import VerifyPage from '@/pages/Verify';

export const Route = createFileRoute('/verify')({
    component: VerifyPage,
})

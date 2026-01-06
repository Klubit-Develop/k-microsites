import { createFileRoute } from '@tanstack/react-router';
import CheckoutSuccess from '@/pages/CheckoutSuccess';

interface CheckoutSuccessSearch {
    transactionId?: string;
    payment_intent?: string;
    payment_intent_client_secret?: string;
    redirect_status?: string;
}

export const Route = createFileRoute('/checkout/success')({
    validateSearch: (search: Record<string, unknown>): CheckoutSuccessSearch => {
        return {
            transactionId: search.transactionId as string | undefined,
            payment_intent: search.payment_intent as string | undefined,
            payment_intent_client_secret: search.payment_intent_client_secret as string | undefined,
            redirect_status: search.redirect_status as string | undefined,
        };
    },
    component: CheckoutSuccess,
});
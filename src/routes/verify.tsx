import { createFileRoute, redirect } from '@tanstack/react-router'
import VerifyPage from '@/pages/Verify';

interface VerifySearchParams {
    verification?: string;
    email?: string;
    country?: string;
    phone?: string;
    oauthEmail?: string;
    oauthProvider?: string;
    oauthFirstName?: string;
    oauthLastName?: string;
    isForgot?: string;
    currentEmail?: string;
    userId?: string;
    token?: string;
}

export const Route = createFileRoute('/verify')({
    validateSearch: (search: Record<string, unknown>): VerifySearchParams => ({
        verification: (search.verification as string) || '',
        email: (search.email as string) || '',
        country: (search.country as string) || '',
        phone: (search.phone as string) || '',
        oauthEmail: (search.oauthEmail as string) || '',
        oauthProvider: (search.oauthProvider as string) || '',
        oauthFirstName: (search.oauthFirstName as string) || '',
        oauthLastName: (search.oauthLastName as string) || '',
        isForgot: (search.isForgot as string) || '',
        currentEmail: (search.currentEmail as string) || '',
        userId: (search.userId as string) || '',
        token: (search.token as string) || '',
    }),
    component: VerifyPage,
    beforeLoad: async ({ search }) => {
        if (!search.verification) {
            throw redirect({ to: '/' });
        }
    },
})
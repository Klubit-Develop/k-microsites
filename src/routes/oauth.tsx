import { createFileRoute } from '@tanstack/react-router'
import OauthPage from '@/pages/Oauth';

interface OAuthSearchParams {
    email?: string;
    provider?: string;
    firstName?: string;
    lastName?: string;
}

export const Route = createFileRoute('/oauth')({
    validateSearch: (search: Record<string, unknown>): OAuthSearchParams => ({
        email: (search.email as string) || '',
        provider: (search.provider as string) || '',
        firstName: (search.firstName as string) || '',
        lastName: (search.lastName as string) || ''
    }),
    component: OauthPage,
})
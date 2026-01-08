import { createFileRoute, redirect } from '@tanstack/react-router'
import RegisterPage from '@/pages/Register';

interface RegisterSearchParams {
    country?: string;
    phone?: string;
    oauthEmail?: string;
    oauthProvider?: string;
    oauthFirstName?: string;
    oauthLastName?: string;
}

export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>): RegisterSearchParams => ({
    country: (search.country as string) || '',
    phone: (search.phone as string) || '',
    oauthEmail: (search.oauthEmail as string) || '',
    oauthProvider: (search.oauthProvider as string) || '',
    oauthFirstName: (search.oauthFirstName as string) || '',
    oauthLastName: (search.oauthLastName as string) || '',
  }),
  component: RegisterPage,
  beforeLoad: async ({ search }) => {
    if (!search?.country || !search?.phone) {
      throw redirect({ to: '/' });
    }
  },
})
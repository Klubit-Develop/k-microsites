import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { getCheckoutReturnState, clearCheckoutReturnState } from '@/components/AuthModal';

interface SearchParams {
    status?: string;
    provider?: string;
    email?: string;
    exists?: string;
    user?: string;
    profile?: string;
    redirectTo?: string;
    token?: string;
}

interface OAuthProfile {
    email: string;
    firstName?: string;
    lastName?: string;
    googleId?: string;
    appleId?: string;
}

interface OAuthUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    username: string;
    avatar: string;
    country: string;
    language: string;
    isOnboardingComplete: boolean;
    clubRoles: unknown[];
}

const AuthSuccessComponent = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setUser, setToken } = useAuthStore();
    const searchParams = Route.useSearch();

    const { status, provider, email, user, profile, token } = searchParams;

    useEffect(() => {
        const authenticateUser = async () => {
            try {
                if (status !== 'success') {
                    console.error('OAuth failed');
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                    return;
                }

                let userData: OAuthUser | null = null;

                if (user) {
                    if (typeof user === 'string') {
                        const trimmed = user.trim();
                        if (trimmed !== '' && trimmed !== '{}') {
                            try {
                                userData = JSON.parse(trimmed);
                            } catch (e) {
                                console.error('Error parsing user data:', e);
                            }
                        }
                    } else if (typeof user === 'object' && user !== null) {
                        userData = user as unknown as OAuthUser;
                    }
                }

                const hasValidUser = userData && userData.id && userData.id.trim() !== '';
                const hasValidToken = token && token.trim() !== '';

                console.log('Parsed userData:', userData);
                console.log('Has valid user:', hasValidUser);
                console.log('Has valid token:', hasValidToken);

                if (!hasValidUser) {
                    let profileData: OAuthProfile | null = null;

                    if (profile) {
                        if (typeof profile === 'string') {
                            const trimmed = profile.trim();
                            if (trimmed !== '' && trimmed !== '{}') {
                                try {
                                    profileData = JSON.parse(trimmed);
                                } catch (e) {
                                    console.error('Error parsing profile data:', e);
                                }
                            }
                        } else if (typeof profile === 'object' && profile !== null) {
                            profileData = profile as unknown as OAuthProfile;
                        }
                    }

                    setTimeout(() => {
                        navigate({
                            to: '/oauth',
                            search: {
                                email: email || profileData?.email || '',
                                provider: provider || '',
                                firstName: profileData?.firstName || '',
                                lastName: profileData?.lastName || ''
                            }
                        });
                    }, 1500);
                    return;
                }

                if (hasValidUser && hasValidToken) {
                    setToken(token!);
                    setUser(userData!);

                    toast.success(t('auth_success.login_success'));

                    const checkoutReturn = getCheckoutReturnState();
                    if (checkoutReturn) {
                        clearCheckoutReturnState();
                        setTimeout(() => {
                            const searchParamsStr = new URLSearchParams(
                                checkoutReturn.searchParams as Record<string, string>
                            ).toString();
                            const returnUrl = `/event/${checkoutReturn.eventSlug}${searchParamsStr ? `?${searchParamsStr}` : ''}`;
                            navigate({ to: returnUrl });
                        }, 1000);
                        return;
                    }

                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 1500);
                    return;
                }

                console.error('User exists but no token provided');
                toast.error(t('auth_success.authentication_error'));
                setTimeout(() => {
                    navigate({ to: '/' });
                }, 2000);

            } catch (error: unknown) {
                console.error('Error in auth-success:', error);
                toast.error(t('auth_success.authentication_error'));
                setTimeout(() => {
                    navigate({ to: '/' });
                }, 2000);
            }
        };

        authenticateUser();
    }, [status, provider, email, user, profile, token, navigate, setToken, setUser, t]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff336d]"></div>
                <p className="mt-4 text-[#939393] font-helvetica">{t('auth_success.authenticating')}</p>
            </div>
        </div>
    );
};

export const Route = createFileRoute('/auth-success')({
    validateSearch: (search: Record<string, unknown>): SearchParams => ({
        status: (search.status as string) || '',
        provider: (search.provider as string) || '',
        email: (search.email as string) || '',
        exists: (search.exists as string) || '',
        user: (search.user as string) || '',
        profile: (search.profile as string) || '',
        redirectTo: (search.redirectTo as string) || '',
        token: (search.token as string) || ''
    }),
    component: AuthSuccessComponent
});
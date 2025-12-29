import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';

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
    clubRoles: any[];
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
                // Validar status
                if (status !== 'success') {
                    console.error('OAuth failed');
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                    return;
                }

                // Parsear user - puede venir como string JSON o ya como objeto
                let userData: OAuthUser | null = null;

                if (user) {
                    // Si es string, intentar parsear
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
                        // Ya viene como objeto
                        userData = user as unknown as OAuthUser;
                    }
                }

                // Validar que userData tenga un id válido
                const hasValidUser = userData && userData.id && userData.id.trim() !== '';
                const hasValidToken = token && token.trim() !== '';

                console.log('Parsed userData:', userData);
                console.log('Has valid user:', hasValidUser);
                console.log('Has valid token:', hasValidToken);

                // Si NO hay user válido → redirigir a /oauth con el profile
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
                            state: {
                                oauthEmail: email || profileData?.email,
                                provider,
                                profile: profileData
                            } as any
                        });
                    }, 1500);
                    return;
                }

                // Si HAY user válido y token → hacer login directo
                if (hasValidUser && hasValidToken) {
                    setToken(token!);
                    setUser(userData!);

                    toast.success(t('auth_success.login_success'));

                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 1500);
                    return;
                }

                // Caso edge: hay user pero no token
                console.error('User exists but no token provided');
                toast.error(t('auth_success.authentication_error'));
                setTimeout(() => {
                    navigate({ to: '/' });
                }, 2000);

            } catch (error: any) {
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff336d]"></div>
                <p className="mt-4 text-gray-600 font-helvetica">{t('auth_success.authenticating')}</p>
            </div>
        </div>
    );
};

export const Route = createFileRoute('/auth-success')({
    validateSearch: (search: Record<string, any>): SearchParams => ({
        status: search.status || '',
        provider: search.provider || '',
        email: search.email || '',
        exists: search.exists || '',
        user: search.user || '',
        profile: search.profile || '',
        redirectTo: search.redirectTo || '',
        token: search.token || ''
    }),
    component: AuthSuccessComponent
});
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import axiosInstance from '@/config/axiosConfig';

interface SearchParams {
    oauthToken?: string;
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

interface OAuthDataMainApp {
    status: string;
    code: string;
    navigation: string;
    provider: string;
    profile: OAuthProfile | null;
    email: string;
    sessionToken: string | null;
    missingFields: string[] | null;
    user: OAuthUser | null;
}

interface OAuthDataMicrosites {
    status: string;
    provider: string;
    email: string;
    exists: boolean;
    redirectTo: string;
    token: string | null;
    user: OAuthUser | null;
    profile: OAuthProfile | null;
}

type OAuthData = OAuthDataMainApp | OAuthDataMicrosites;

const isMicrositesData = (data: OAuthData): data is OAuthDataMicrosites => {
    return 'exists' in data;
};

const AuthSuccessComponent = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setUser, setToken } = useAuthStore();
    const searchParams = Route.useSearch();

    const { oauthToken } = searchParams;

    useEffect(() => {
        const authenticateUser = async () => {
            try {
                if (!oauthToken) {
                    console.error('No OAuth token provided');
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                    return;
                }

                const response = await axiosInstance.get<OAuthData>(`/v2/oauth/verify/${oauthToken}`);
                const data = response.data;

                if (isMicrositesData(data)) {
                    if (data.exists && data.user && data.token) {
                        setToken(data.token);
                        setUser(data.user);
                        toast.success(t('auth_success.login_success'));
                        setTimeout(() => {
                            navigate({ to: '/' });
                        }, 1500);
                        return;
                    }

                    setTimeout(() => {
                        navigate({
                            to: '/oauth',
                            search: {
                                email: data.email || data.profile?.email || '',
                                provider: data.provider,
                                firstName: data.profile?.firstName || '',
                                lastName: data.profile?.lastName || ''
                            }
                        });
                    }, 1500);
                    return;
                }

                if (data.status !== 'success') {
                    console.error('OAuth failed');
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                    return;
                }

                const hasValidUser = data.user && data.user.id && data.user.id.trim() !== '';
                const hasValidToken = data.sessionToken && data.sessionToken.trim() !== '';

                if (!hasValidUser) {
                    setTimeout(() => {
                        navigate({
                            to: '/oauth',
                            search: {
                                email: data.email || data.profile?.email || '',
                                provider: data.provider,
                                firstName: data.profile?.firstName || '',
                                lastName: data.profile?.lastName || ''
                            }
                        });
                    }, 1500);
                    return;
                }

                if (hasValidUser && hasValidToken) {
                    setToken(data.sessionToken!);
                    setUser(data.user!);

                    toast.success(t('auth_success.login_success'));

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

            } catch (error) {
                console.error('Error in auth-success:', error);
                toast.error(t('auth_success.authentication_error'));
                setTimeout(() => {
                    navigate({ to: '/' });
                }, 2000);
            }
        };

        authenticateUser();
    }, [oauthToken, navigate, setToken, setUser, t]);

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
    validateSearch: (search: Record<string, unknown>): SearchParams => ({
        oauthToken: (search.oauthToken as string) || ''
    }),
    component: AuthSuccessComponent
});
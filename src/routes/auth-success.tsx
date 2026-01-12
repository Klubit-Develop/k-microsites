import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { getCheckoutReturnState, clearCheckoutReturnState } from '@/components/AuthModal';
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

interface OAuthVerifyResponse {
    status: string;
    provider: string;
    email: string;
    exists: boolean;
    redirectTo: string;
    token: string | null;
    user: OAuthUser | null;
    profile: OAuthProfile | null;
}

const AuthSuccessComponent = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setUser, setToken } = useAuthStore();
    const searchParams = Route.useSearch();
    const [, setIsProcessing] = useState(true);

    const { oauthToken } = searchParams;

    useEffect(() => {
        const authenticateUser = async () => {
            try {
                if (!oauthToken) {
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                    return;
                }

                const response = await axiosInstance.get<OAuthVerifyResponse>(
                    `/v2/oauth/verify/${oauthToken}`
                );

                const data = response.data;

                if (data.status !== 'success') {
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                    return;
                }

                const hasValidUser = data.user && data.user.id;
                const hasValidToken = data.token && data.token.trim() !== '';

                if (!hasValidUser) {
                    setTimeout(() => {
                        navigate({
                            to: '/oauth',
                            search: {
                                email: data.email || data.profile?.email || '',
                                provider: data.provider || '',
                                firstName: data.profile?.firstName || '',
                                lastName: data.profile?.lastName || '',
                            },
                        });
                    }, 1500);
                    return;
                }

                if (hasValidUser && hasValidToken) {
                    setToken(data.token!);
                    setUser(data.user!);

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
            } finally {
                setIsProcessing(false);
            }
        };

        authenticateUser();
    }, [oauthToken, navigate, setToken, setUser, t]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff336d]"></div>
                <p className="mt-4 text-[#939393] font-helvetica">
                    {t('auth_success.authenticating')}
                </p>
            </div>
        </div>
    );
};

export const Route = createFileRoute('/auth-success')({
    validateSearch: (search: Record<string, unknown>): SearchParams => ({
        oauthToken: (search.oauthToken as string) || '',
    }),
    component: AuthSuccessComponent,
});
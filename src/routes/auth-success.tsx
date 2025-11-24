import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useEffect } from 'react';
import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: Record<string, any>;
    message: string;
    details: string;
}

interface VerifyResponse extends BackendResponse {
    data: {
        exists: boolean;
        email?: string;
        country?: string;
        phone?: string;
    };
}

interface LoginResponse extends BackendResponse {
    data: {
        token?: string;
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            username: string;
            country: string;
            roles: any[];
        };
    };
}

interface SearchParams {
    provider?: string;
    email?: string;
    redirectTo?: string;
    [key: string]: any;
}

const AuthSuccessComponent = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setUser, setToken } = useAuthStore();
    const { email } = Route.useSearch();

    useEffect(() => {
        const authenticateUser = async () => {
            try {
                if (!email) {
                    console.error('No email provided in search params');
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                    return;
                }

                const verifyResponse = await axiosInstance.post<VerifyResponse>(
                    '/v2/auth/verify',
                    { email }
                );

                if (!verifyResponse.data.data.exists) {
                    navigate({
                        to: '/',
                        search: { oauthEmail: email }
                    });
                    return;
                }

                const { country, phone } = verifyResponse.data.data;

                if (!country || !phone) {
                    console.error('Missing country or phone in verify response');
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                    return;
                }

                const loginResponse = await axiosInstance.post<LoginResponse>(
                    '/v2/auth/login',
                    {
                        country,
                        phone
                    }
                );

                if (loginResponse.data.status === 'success' && loginResponse.data.data) {
                    const { token, user } = loginResponse.data.data;

                    if (token && user) {
                        setToken(token);
                        setUser(user);

                        toast.success(t('auth_success.login_success'));
                        setTimeout(() => {
                            navigate({ to: '/manager/klaudia' });
                        }, 1500);
                    } else {
                        console.error('Missing token or user in login response');
                        toast.error(t('auth_success.authentication_error'));
                        setTimeout(() => {
                            navigate({ to: '/' });
                        }, 2000);
                    }
                } else {
                    console.error('Login failed:', loginResponse.data.message);
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                }

            } catch (error: any) {
                console.error('Error in auth-success:', error);

                if (error.backendError) {
                    console.error('Backend error:', error.backendError.message);
                }

                toast.error(t('auth_success.authentication_error'));
                setTimeout(() => {
                    navigate({ to: '/' });
                }, 2000);
            }
        };

        authenticateUser();
    }, [email, navigate, setToken, setUser, t]);

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
        provider: search.provider || '',
        email: search.email || '',
        redirectTo: search.redirectTo || '',
        ...search
    }),
    component: AuthSuccessComponent
});
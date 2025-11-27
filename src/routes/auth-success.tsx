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
    status?: string;
    provider?: string;
    email?: string;
    exists?: string;
    user?: string;
    profile?: string;
    redirectTo?: string;
}

interface OAuthProfile {
    email: string;
    firstName?: string;
    lastName?: string;
    googleId?: string;
    appleId?: string;
}

const AuthSuccessComponent = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setUser, setToken } = useAuthStore();
    const searchParams = Route.useSearch();

    const { status, provider, email, exists, profile } = searchParams;

    console.log('OAuth Response:', searchParams);

    useEffect(() => {
        const authenticateUser = async () => {
            try {
                // Validar que tengamos los datos básicos
                if (status !== 'success' || !email) {
                    console.error('OAuth failed or no email provided');
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                    return;
                }

                // Usuario NO existe → redirigir a registro con los datos del profile
                if (exists === 'false') {
                    const profileData: OAuthProfile | null = profile ? JSON.parse(profile) : null;

                    toast.info(t('auth_success.user_not_registered'));
                    setTimeout(() => {
                        navigate({
                            to: '/oauth',
                            state: {
                                oauthEmail: email,
                                provider,
                                profile: profileData
                            } as any
                        });
                    }, 1500);
                    return;
                }

                // Usuario EXISTE → verificar y hacer login
                if (exists === 'true') {
                    // 1. Verificar el email para obtener country y phone
                    const verifyResponse = await axiosInstance.post<VerifyResponse>(
                        '/v2/auth/verify',
                        { email }
                    );

                    if (!verifyResponse.data.data.exists) {
                        // El usuario no existe en verify (caso raro, pero por seguridad)
                        navigate({
                            to: '/oauth',
                            state: { oauthEmail: email, provider } as any
                        });
                        return;
                    }

                    const { country, phone } = verifyResponse.data.data;

                    if (!country || !phone) {
                        console.error('Missing country or phone in verify response');
                        toast.error(t('auth_success.authentication_error'));
                        setTimeout(() => {
                            navigate({
                                to: '/oauth',
                                state: { oauthEmail: email, provider } as any
                            });
                        }, 2000);
                        return;
                    }

                    // 2. Hacer login con country y phone
                    const loginResponse = await axiosInstance.post<LoginResponse>(
                        '/v2/auth/login',
                        { country, phone }
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
                            throw new Error('Missing token or user in login response');
                        }
                    } else {
                        throw new Error(loginResponse.data.message || 'Login failed');
                    }
                } else {
                    console.error('Invalid OAuth response state');
                    toast.error(t('auth_success.authentication_error'));
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 2000);
                }

            } catch (error: any) {
                console.error('Error in auth-success:', error);

                const errorMessage = error.backendError?.message || error.message || 'Unknown error';
                console.error('Error details:', errorMessage);

                toast.error(t('auth_success.authentication_error'));
                setTimeout(() => {
                    navigate({ to: '/' });
                }, 2000);
            }
        };

        authenticateUser();
    }, [status, provider, email, exists, profile, navigate, setToken, setUser, t]);

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
        redirectTo: search.redirectTo || ''
    }),
    component: AuthSuccessComponent
});
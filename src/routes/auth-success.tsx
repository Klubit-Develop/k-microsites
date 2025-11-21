import { createFileRoute, redirect } from '@tanstack/react-router';
import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';

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

export const Route = createFileRoute('/auth-success')({
    beforeLoad: async ({ location, search }: { location: any; search: SearchParams }) => {
        try {
            const email = search.email;

            // Validar que existe el email
            if (!email) {
                console.error('No email provided in search params');
                throw redirect({
                    to: '/',
                    throw: true
                });
            }

            // 1. Verificar si el usuario existe
            const verifyResponse = await axiosInstance.post<VerifyResponse>(
                '/v2/auth/verify',
                { email }
            );

            // Si el usuario no existe, redirigir a la página principal con el email en el state
            if (!verifyResponse.data.data.exists) {
                throw redirect({
                    to: '/',
                    search: { oauthEmail: email },
                    throw: true
                });
            }

            // 2. Si el usuario existe, hacer login
            const { country, phone } = verifyResponse.data.data;

            if (!country || !phone) {
                console.error('Missing country or phone in verify response');
                throw redirect({
                    to: '/',
                    throw: true
                });
            }

            const loginResponse = await axiosInstance.post<LoginResponse>(
                '/v2/auth/login',
                {
                    country,
                    phone
                }
            );

            // 3. Manejar la respuesta del login
            if (loginResponse.data.status === 'success' && loginResponse.data.data) {
                const { token, user } = loginResponse.data.data;

                // Guardar token y usuario en el store
                if (token && user) {
                    // Acceder al store sin hook (desde fuera de un componente React)
                    const authStore = useAuthStore.getState();
                    authStore.setToken(token);
                    authStore.setUser(user);

                    // Redirigir a /manager/klaudia
                    throw redirect({
                        to: '/manager/klaudia',
                        throw: true
                    });
                } else {
                    console.error('Missing token or user in login response');
                    throw redirect({
                        to: '/',
                        throw: true
                    });
                }
            } else {
                // Si el login falla, redirigir a home
                console.error('Login failed:', loginResponse.data.message);
                throw redirect({
                    to: '/',
                    throw: true
                });
            }

        } catch (error: any) {
            // Si es un redirect, dejarlo pasar
            if (error?.throw) {
                throw error;
            }

            // Manejar errores de la API
            console.error('Error in auth-success beforeLoad:', error);

            if (error.backendError) {
                console.error('Backend error:', error.backendError.message);
            }

            // En caso de error, redirigir a home
            throw redirect({
                to: '/',
                throw: true
            });
        }
    },
    validateSearch: (search: Record<string, any>): SearchParams => ({
        provider: search.provider || '',
        email: search.email || '',
        redirectTo: search.redirectTo || '',
        ...search
    }),
    // Componente mínimo ya que toda la lógica está en beforeLoad
    component: () => {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff336d]"></div>
                    <p className="mt-4 text-gray-600 font-helvetica">Autenticando...</p>
                </div>
            </div>
        );
    }
});
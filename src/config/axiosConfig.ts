import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import i18n from '@/i18n/config';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://api.klubit.io',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        config.headers['Accept-Language'] = i18n.language || 'es';
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            const { token, logout } = useAuthStore.getState();
            
            // Solo limpiar sesión si HABÍA un token (token expirado)
            // No redirigir - la app es mayormente pública
            if (token) {
                logout();
            }
        }
        
        // Info del backend para fácil acceso en catch blocks
        if (error.response?.data) {
            error.backendError = {
                code: error.response.data.code,
                message: error.response.data.message,
                details: error.response.data.details,
            };
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;
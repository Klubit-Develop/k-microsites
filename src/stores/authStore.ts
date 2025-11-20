import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    user: any;
    token: string | null;

    setUser: (user: any) => void;
    setToken: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,

            setUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            logout: () => set({ user: null, token: null }),
        }),
        {
            name: 'klubit-auth',
        }
    )
);
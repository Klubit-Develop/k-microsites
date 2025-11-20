import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    user: any | null;
    token: string | null;
    clubs: any[];

    setUser: (user: any | null) => void;
    setToken: (token: string | null) => void;
    setClubs: (clubs: any[]) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            clubs: [],

            setUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            setClubs: (clubs) => set({ clubs }),
            logout: () => set({ user: null, token: null, clubs: [] }),
        }),
        {
            name: 'manager-klubit-auth',
        }
    )
);
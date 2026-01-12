import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country?: string;
    avatar?: string;
    [key: string]: unknown;
}

interface AuthState {
    user: User | null;
    token: string | null;
    clubs: unknown[];
    _hasHydrated: boolean;

    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setAuth: (token: string, user: User) => void;
    setClubs: (clubs: unknown[]) => void;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            clubs: [],
            _hasHydrated: false,

            setUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            setAuth: (token, user) => set({ token, user }),
            setClubs: (clubs) => set({ clubs }),
            logout: () => set({ user: null, token: null, clubs: [] }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'manager-klubit-auth',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

export const waitForHydration = (): Promise<void> => {
    return new Promise((resolve) => {
        if (useAuthStore.getState()._hasHydrated) {
            resolve();
            return;
        }
        const unsubscribe = useAuthStore.subscribe((state) => {
            if (state._hasHydrated) {
                unsubscribe();
                resolve();
            }
        });
    });
};
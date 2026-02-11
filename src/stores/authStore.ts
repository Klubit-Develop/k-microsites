import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cookieStorage } from '@/utils/cookieStorage';

interface AuthState {
    user: any | null;
    token: string | null;
    clubs: any[];
    _hasHydrated: boolean;

    setUser: (user: any | null) => void;
    setToken: (token: string | null) => void;
    setAuth: (token: string, user: any) => void;
    setClubs: (clubs: any[]) => void;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
}

const fetchMe = async (token: string): Promise<any | null> => {
    try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://api.klubit.io';
        const response = await fetch(`${baseURL}/v2/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (data.status === 'success' && data.data?.user) {
            return data.data.user;
        }
        return null;
    } catch {
        return null;
    }
};

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
            name: 'klubit-auth',
            storage: {
                getItem: (name) => {
                    const raw = cookieStorage.getItem(name) as string | null;
                    return raw ? JSON.parse(raw) : null;
                },
                setItem: (name, value) => {
                    cookieStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: (name) => {
                    cookieStorage.removeItem(name);
                },
            },
            partialize: (state) => ({
                token: state.token,
            }) as unknown as AuthState,
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                state.setHasHydrated(true);

                if (state.token && !state.user) {
                    fetchMe(state.token).then((user) => {
                        if (user) {
                            useAuthStore.getState().setUser(user);
                        } else {
                            useAuthStore.getState().logout();
                        }
                    });
                }
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
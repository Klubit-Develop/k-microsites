import type { StateStorage } from 'zustand/middleware';

const getBaseDomain = (): string => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2) {
        return `.${parts.slice(-2).join('.')}`;
    }
    return hostname;
};

const setCookie = (name: string, value: string, days = 7): void => {
    const domain = getBaseDomain();
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; domain=${domain}; SameSite=Lax; Secure`;
};

const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
};

const deleteCookie = (name: string): void => {
    const domain = getBaseDomain();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
};

export const cookieStorage: StateStorage = {
    getItem: (name: string): string | null => {
        return getCookie(name);
    },
    setItem: (name: string, value: string): void => {
        setCookie(name, value);
    },
    removeItem: (name: string): void => {
        deleteCookie(name);
    },
};
import { useEffect } from 'react';

const KLUBIT_CDN_ICON = 'https://klubit.fra1.cdn.digitaloceanspaces.com/icon@2x.png';

interface SEOConfig {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    siteName?: string;
    type?: string;
    locale?: string;
}

const getBaseUrl = (): string => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }

    return `${protocol}//${hostname}`;
};

const getSubdomain = (): string | null => {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return null;
    }

    const parts = hostname.split('.');
    if (parts.length >= 3) {
        return parts[0];
    }

    return null;
};

const updateMetaTag = (
    selector: string,
    attribute: string,
    value: string
): void => {
    const element = document.querySelector(selector);
    if (element) {
        element.setAttribute(attribute, value);
    }
};

const createMetaTag = (
    property: string,
    content: string,
    isName: boolean = false
): void => {
    const attr = isName ? 'name' : 'property';
    const selector = `meta[${attr}="${property}"]`;
    let element = document.querySelector(selector);

    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, property);
        document.head.appendChild(element);
    }

    element.setAttribute('content', content);
};

export const useSEO = (config?: SEOConfig): void => {
    useEffect(() => {
        const baseUrl = getBaseUrl();
        const subdomain = getSubdomain();
        const currentUrl = window.location.href;

        const title = config?.title || document.title;
        const description = config?.description ||
            document.querySelector('meta[name="description"]')?.getAttribute('content') ||
            'Descubre los mejores eventos, compra entradas, reserva mesas y gestiona tu experiencia nocturna con Klubit.';
        const image = config?.image || KLUBIT_CDN_ICON;
        const siteName = config?.siteName || (subdomain ? `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} | Klubit` : 'Klubit');
        const type = config?.type || 'website';
        const locale = config?.locale || 'es_ES';

        createMetaTag('og:url', config?.url || currentUrl);
        createMetaTag('og:title', title);
        createMetaTag('og:description', description);
        createMetaTag('og:image', image);
        createMetaTag('og:site_name', siteName);
        createMetaTag('og:type', type);
        createMetaTag('og:locale', locale);

        createMetaTag('twitter:url', config?.url || currentUrl, true);
        createMetaTag('twitter:title', title, true);
        createMetaTag('twitter:description', description, true);
        createMetaTag('twitter:image', image, true);

        const canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
            canonicalLink.setAttribute('href', baseUrl);
        }
    }, [config?.title, config?.description, config?.image, config?.url, config?.siteName, config?.type, config?.locale]);
};

export const updateSEO = (config: SEOConfig): void => {
    const currentUrl = window.location.href;

    if (config.title) {
        document.title = config.title;
        createMetaTag('og:title', config.title);
        createMetaTag('twitter:title', config.title, true);
    }

    if (config.description) {
        updateMetaTag('meta[name="description"]', 'content', config.description);
        createMetaTag('og:description', config.description);
        createMetaTag('twitter:description', config.description, true);
    }

    if (config.image) {
        createMetaTag('og:image', config.image);
        createMetaTag('twitter:image', config.image, true);
    }

    const url = config.url || currentUrl;
    createMetaTag('og:url', url);
    createMetaTag('twitter:url', url, true);

    if (config.siteName) {
        createMetaTag('og:site_name', config.siteName);
    }

    if (config.type) {
        createMetaTag('og:type', config.type);
    }

    if (config.locale) {
        createMetaTag('og:locale', config.locale);
    }

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink && config.url) {
        canonicalLink.setAttribute('href', config.url);
    }
};

export const initializeSEO = (): void => {
    const baseUrl = getBaseUrl();
    const subdomain = getSubdomain();
    const currentUrl = window.location.href;

    createMetaTag('og:url', currentUrl);
    createMetaTag('og:image', KLUBIT_CDN_ICON);
    createMetaTag('twitter:url', currentUrl, true);
    createMetaTag('twitter:image', KLUBIT_CDN_ICON, true);

    if (subdomain) {
        const siteName = `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} | Klubit`;
        createMetaTag('og:site_name', siteName);
    }

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
        canonicalLink.setAttribute('href', baseUrl);
    }
};

export default useSEO;
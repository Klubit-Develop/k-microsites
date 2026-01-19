import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ShareData {
    title?: string;
    text?: string;
    url?: string;
}

interface UseShareOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    onFallback?: () => void;
}

interface UseShareReturn {
    share: (data?: ShareData) => Promise<boolean>;
    canShare: boolean;
    copyToClipboard: (text?: string) => Promise<boolean>;
}

const getCurrentUrl = (): string => {
    return window.location.href;
};

const getShareTitle = (): string => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    if (parts.length >= 3 && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const subdomain = parts[0];
        return `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} | Klubit`;
    }

    return document.title || 'Klubit';
};

export const useShare = (options: UseShareOptions = {}): UseShareReturn => {
    const { t } = useTranslation();
    const { onSuccess, onError, onFallback } = options;

    const canShare = typeof navigator !== 'undefined' && !!navigator.share;

    const copyToClipboard = useCallback(async (text?: string): Promise<boolean> => {
        const textToCopy = text || getCurrentUrl();

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textToCopy);
                toast.success(t('share.copied', 'Enlace copiado al portapapeles'));
                onFallback?.();
                return true;
            }

            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                toast.success(t('share.copied', 'Enlace copiado al portapapeles'));
                onFallback?.();
                return true;
            }

            throw new Error('Copy command failed');
        } catch (error) {
            toast.error(t('share.copy_error', 'No se pudo copiar el enlace'));
            onError?.(error instanceof Error ? error : new Error('Copy failed'));
            return false;
        }
    }, [t, onError, onFallback]);

    const share = useCallback(async (data?: ShareData): Promise<boolean> => {
        const shareData: ShareData = {
            title: data?.title || getShareTitle(),
            text: data?.text,
            url: data?.url || getCurrentUrl(),
        };

        if (canShare) {
            try {
                await navigator.share(shareData);
                onSuccess?.();
                return true;
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return false;
                }
                return copyToClipboard(shareData.url);
            }
        }

        return copyToClipboard(shareData.url);
    }, [canShare, copyToClipboard, onSuccess]);

    return {
        share,
        canShare,
        copyToClipboard,
    };
};

export const shareUrl = async (data?: ShareData): Promise<boolean> => {
    const shareData: ShareData = {
        title: data?.title || getShareTitle(),
        text: data?.text,
        url: data?.url || getCurrentUrl(),
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return true;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return false;
            }
        }
    }

    try {
        await navigator.clipboard.writeText(shareData.url || getCurrentUrl());
        return true;
    } catch {
        return false;
    }
};

export default useShare;
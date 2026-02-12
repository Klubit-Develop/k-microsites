import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';

import axiosInstance from '@/config/axiosConfig';

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PASSBOOK_STRIP_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/strip.png';
const PASSBOOK_ICON_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/icon.png';

export interface PassbookModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress: string;
    userId: string;
    clubId: string;
    clubName: string;
    clubLogo: string;
    userName: string;
    passbookUrl?: string;
    googleWalletUrl?: string | null;
}

const PassbookModal = ({ isOpen, onClose, walletAddress, userId, clubId, clubName, clubLogo, userName, passbookUrl, googleWalletUrl }: PassbookModalProps) => {
    const { t, i18n } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setIsAnimating(false);
            onClose();
        }, 300);
    };

    const { data: passbookConfig } = useQuery({
        queryKey: ['passbookConfig', clubId],
        queryFn: async () => {
            const response = await axiosInstance.get(`/v2/wallet/clubs/${clubId}/config`);
            if (response.data?.status === 'success') {
                return response.data.data.config as {
                    backgroundColor?: string;
                    foregroundColor?: string;
                    labelColor?: string;
                    stripUrl?: string;
                };
            }
            return null;
        },
        enabled: isOpen && !!clubId,
        staleTime: 5 * 60 * 1000,
    });

    const { data: existingPassbook } = useQuery({
        queryKey: ['userPassbook', userId, clubId],
        queryFn: async () => {
            const response = await axiosInstance.get(`/v2/wallet/user/${userId}/club/${clubId}`);
            if (response.data?.status === 'success') {
                const raw = response.data.data;
                const passbook = raw?.userPassbook ?? raw;
                return passbook as {
                    kardLevel?: string;
                    passbookUrl?: string;
                    googleWalletUrl?: string | null;
                } | null;
            }
            return null;
        },
        enabled: isOpen && !!userId && !!clubId,
        staleTime: 5 * 60 * 1000,
    });

    const bgColor = passbookConfig?.backgroundColor || '#141414';
    const fgColor = passbookConfig?.foregroundColor || '#FFFFFF';
    const lblColor = passbookConfig?.labelColor || '#E5FF88';
    const stripUrl = passbookConfig?.stripUrl || PASSBOOK_STRIP_URL;
    const kardLevel = existingPassbook?.kardLevel || 'Member';

    const resolvedPassbookUrl = passbookUrl || existingPassbook?.passbookUrl;
    const resolvedGoogleWalletUrl = googleWalletUrl || existingPassbook?.googleWalletUrl;

    const walletBadge = useMemo(() => {
        const lang = i18n.language === 'en' ? 'en' : 'es';
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod|Macintosh/.test(ua) && 'ontouchend' in document;

        if (isIOS && resolvedPassbookUrl) {
            return {
                url: resolvedPassbookUrl,
                badge: `/assets/images/apple_${lang}.svg`,
                alt: t('transaction.add_to_apple_wallet', 'Añadir a Apple Wallet'),
            };
        }

        if (!isIOS && resolvedGoogleWalletUrl) {
            return {
                url: resolvedGoogleWalletUrl,
                badge: `/assets/images/google_${lang}.svg`,
                alt: t('transaction.add_to_google_wallet', 'Añadir a Google Wallet'),
            };
        }

        return null;
    }, [resolvedPassbookUrl, resolvedGoogleWalletUrl, i18n.language, t]);

    if (!isAnimating && !isOpen) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[60] flex items-end justify-center transition-all duration-300 ease-out overscroll-none touch-none ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={handleClose}
        >
            <div
                className={`relative w-full max-w-[500px] max-h-[90vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center px-6 pt-4 pb-8 overflow-y-auto max-h-[90vh]">
                    <div className="flex items-center justify-between w-full mb-6">
                        <span className="text-[18px] font-borna font-semibold text-[#F6F6F6]">
                            {t('passbook.title', 'Tu Kard')}
                        </span>
                        <button
                            onClick={handleClose}
                            className="flex items-center justify-center size-8 rounded-full bg-[#232323] cursor-pointer"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <div
                        className="w-full max-w-[342px] rounded-[14px] overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]"
                        style={{ backgroundColor: bgColor }}
                    >
                        <div className="flex items-start justify-between px-4 pt-3 pb-2">
                            <div className="relative size-[40px] rounded-full overflow-hidden border border-[#323232]" style={{ backgroundColor: bgColor }}>
                                {clubLogo ? (
                                    <img src={clubLogo} alt={clubName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#323232]" />
                                )}
                            </div>
                            <div className="flex flex-col items-end text-right">
                                <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: lblColor, fontFamily: "'SF Pro Text', sans-serif" }}>
                                    {t('passbook.club_name_label', 'NOMBRE KLUB')}
                                </span>
                                <span className="text-[20px]" style={{ color: fgColor, fontFamily: "'SF Pro Display', sans-serif" }}>
                                    {clubName}
                                </span>
                            </div>
                        </div>

                        <div className="relative w-full h-[118px] overflow-hidden">
                            <img
                                src={stripUrl}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex items-start justify-between px-4 py-3">
                            <div className="flex flex-col">
                                <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: lblColor, fontFamily: "'SF Pro Text', sans-serif" }}>
                                    {t('passbook.full_name', 'NOMBRE COMPLETO')}
                                </span>
                                <span className="text-[20px]" style={{ color: fgColor, fontFamily: "'SF Pro Display', sans-serif" }}>
                                    {userName}
                                </span>
                            </div>
                            <div className="flex flex-col items-end text-right">
                                <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: lblColor, fontFamily: "'SF Pro Text', sans-serif" }}>
                                    {t('passbook.kard_label', 'KARD')}
                                </span>
                                <span className="text-[20px]" style={{ color: fgColor, fontFamily: "'SF Pro Display', sans-serif" }}>
                                    {kardLevel}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center py-4">
                            <div className="bg-white rounded-[5px] p-3">
                                <QRCodeSVG
                                    value={walletAddress}
                                    size={120}
                                    level="H"
                                    bgColor="transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center px-1.5 pb-1.5">
                            <div className="size-5 rounded-[6.44px] overflow-hidden">
                                <img src={PASSBOOK_ICON_URL} alt="Klubit" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>

                    {walletBadge && (
                        <div className="flex items-center justify-center mt-6 w-full max-w-[342px]">
                            <a
                                href={walletBadge.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer transition-opacity hover:opacity-80 active:opacity-60"
                            >
                                <img
                                    src={walletBadge.badge}
                                    alt={walletBadge.alt}
                                    className="h-[44px] w-auto object-contain"
                                />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PassbookModal;
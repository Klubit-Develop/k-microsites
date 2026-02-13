import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';

import axiosInstance from '@/config/axiosConfig';
import useCardSpin from '@/hooks/useCardSpin';

const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

    const { cardInnerRef, shimmerFrontRef, shimmerBackRef, handlers } = useCardSpin({
        baseSpeed: 0.4,
    });

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

    const faceClasses = 'absolute inset-0 flex flex-col w-full h-full rounded-[14px] overflow-hidden select-none';

    return createPortal(
        <div
            className={`fixed inset-0 z-[60] flex items-end justify-center transition-all duration-300 ease-out overscroll-none touch-none ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={handleClose}
        >
            <div
                className={`relative w-full max-w-[500px] max-h-[80vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center px-6 pt-4 pb-8 overflow-y-auto max-h-[80vh]">
                    <div className="flex items-center justify-start w-full mb-6">
                        <button
                            onClick={handleClose}
                            className="flex items-center justify-center size-9 bg-[#232323]/80 rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer backdrop-blur-sm"
                        >
                            <BackIcon />
                        </button>
                    </div>

                    <div
                        style={{ perspective: 1200, touchAction: 'none' }}
                        className="w-full max-w-[342px] h-[480px] cursor-grab active:cursor-grabbing"
                        {...handlers}
                    >
                        <div
                            ref={cardInnerRef}
                            className="relative w-full h-full"
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* ══ FRONT ══ */}
                            <div
                                className={faceClasses}
                                style={{
                                    backgroundColor: bgColor,
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    boxShadow: `0 20px 60px -12px ${bgColor}33, 0 8px 24px rgba(0,0,0,0.5)`,
                                }}
                            >
                                <div
                                    ref={shimmerFrontRef}
                                    className="absolute inset-0 pointer-events-none z-[3]"
                                />
                                <div
                                    className="absolute inset-0 pointer-events-none z-[2] opacity-[0.03]"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                    }}
                                />

                                <div className="relative z-[2] flex flex-col h-full">
                                    <div className="flex items-start justify-between px-4 pt-3 pb-2">
                                        <div className="relative size-[40px] rounded-full overflow-hidden border border-[#323232]" style={{ backgroundColor: bgColor }}>
                                            {clubLogo ? (
                                                <img src={clubLogo} alt={clubName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span style={{ color: fgColor }} className="text-[14px] font-bold font-borna">
                                                        {clubName.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p style={{ color: lblColor }} className="text-[10px] font-bold font-helvetica uppercase tracking-wider">
                                                {t('passbook.club_name_label', 'NOMBRE KLUB')}
                                            </p>
                                            <p style={{ color: fgColor }} className="text-[16px] font-bold font-borna leading-tight">
                                                {clubName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative w-full h-[120px] overflow-hidden">
                                        <img src={stripUrl} alt="" className="w-full h-full object-cover" />
                                    </div>

                                    <div className="flex items-start justify-between px-4 pt-3 pb-2">
                                        <div>
                                            <p style={{ color: lblColor }} className="text-[10px] font-bold font-helvetica uppercase tracking-wider">
                                                {t('passbook.full_name_label', 'NOMBRE COMPLETO')}
                                            </p>
                                            <p style={{ color: fgColor }} className="text-[16px] font-bold font-borna leading-tight">
                                                {userName}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p style={{ color: lblColor }} className="text-[10px] font-bold font-helvetica uppercase tracking-wider">
                                                {t('passbook.kard_label', 'KARD')}
                                            </p>
                                            <p style={{ color: fgColor }} className="text-[14px] font-bold font-borna uppercase">
                                                {kardLevel}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center px-4 py-3">
                                        <div className="bg-white p-3 rounded-xl">
                                            <QRCodeSVG
                                                value={walletAddress}
                                                size={160}
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
                            </div>

                            {/* ══ BACK ══ */}
                            <div
                                className={faceClasses}
                                style={{
                                    backgroundColor: bgColor,
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    boxShadow: `0 20px 60px -12px ${bgColor}33, 0 8px 24px rgba(0,0,0,0.5)`,
                                }}
                            >
                                <div
                                    ref={shimmerBackRef}
                                    className="absolute inset-0 pointer-events-none z-[3]"
                                />
                                <div
                                    className="absolute inset-0 pointer-events-none z-[2] opacity-[0.03]"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                    }}
                                />

                                <div className="relative z-[2] flex flex-col items-center justify-center h-full px-6">
                                    <div className="relative size-[80px] rounded-full overflow-hidden border-2 border-[#323232] mb-4" style={{ backgroundColor: bgColor }}>
                                        {clubLogo ? (
                                            <img src={clubLogo} alt={clubName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span style={{ color: fgColor }} className="text-[28px] font-bold font-borna">
                                                    {clubName.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ color: fgColor }} className="text-[20px] font-bold font-borna text-center mb-1">
                                        {clubName}
                                    </p>
                                    <p style={{ color: lblColor }} className="text-[12px] font-bold font-helvetica uppercase tracking-wider mb-6">
                                        {kardLevel}
                                    </p>
                                    <p style={{ color: fgColor }} className="text-[14px] font-helvetica text-center opacity-70">
                                        {userName}
                                    </p>
                                    <div className="absolute bottom-3 left-3">
                                        <div className="size-5 rounded-[6.44px] overflow-hidden">
                                            <img src={PASSBOOK_ICON_URL} alt="Klubit" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                </div>
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
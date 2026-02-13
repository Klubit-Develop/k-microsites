import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';

import axiosInstance from '@/config/axiosConfig';

const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PASSBOOK_STRIP_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/strip.png';
const PASSBOOK_ICON_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/icon.png';

const CARD_THICKNESS = 8;
const MAX_TILT = 18;
const SENSITIVITY = 0.12;
const SPRING_MS = 500;

export interface PassbookModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress?: string;
    userId: string;
    clubId: string;
    clubName: string;
    clubLogo: string;
    userName: string;
    passbookUrl?: string;
    googleWalletUrl?: string | null;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const PassbookModal = ({ isOpen, onClose, walletAddress, userId, clubId, clubName, clubLogo, userName, passbookUrl, googleWalletUrl }: PassbookModalProps) => {
    const { t, i18n } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);
    const [rotX, setRotX] = useState(0);
    const [rotY, setRotY] = useState(0);
    const [isSpring, setIsSpring] = useState(false);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        isDragging.current = true;
        startX.current = e.clientX;
        startY.current = e.clientY;
        setIsSpring(false);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - startX.current;
        const dy = e.clientY - startY.current;
        setRotY(clamp(dx * SENSITIVITY, -MAX_TILT, MAX_TILT));
        setRotX(clamp(-dy * SENSITIVITY, -MAX_TILT, MAX_TILT));
    }, []);

    const onPointerUp = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        setIsSpring(true);
        setRotX(0);
        setRotY(0);
    }, []);

    const onPointerCancel = useCallback(() => {
        isDragging.current = false;
        setIsSpring(true);
        setRotX(0);
        setRotY(0);
    }, []);

    useEffect(() => {
        if (!isSpring) return;
        const timer = setTimeout(() => setIsSpring(false), SPRING_MS);
        return () => clearTimeout(timer);
    }, [isSpring]);

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
                    walletAddress?: string | null;
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

    const edgeColor = useMemo(() => {
        const hex = bgColor.replace('#', '');
        const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 20);
        const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 20);
        const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 20);
        return `rgb(${r}, ${g}, ${b})`;
    }, [bgColor]);

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

    const cardTransform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    const cardTransition = isSpring
        ? `transform ${SPRING_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
        : 'none';

    return createPortal(
        <div
            className={`fixed inset-0 z-[60] flex items-end justify-center transition-all duration-300 ease-out overscroll-none touch-none ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={handleClose}
        >
            <div
                className={`relative w-full max-w-[500px] max-h-[95vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
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
                        ref={cardRef}
                        style={{ perspective: 800, touchAction: 'none' }}
                        className="w-full max-w-[342px] cursor-grab active:cursor-grabbing"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerCancel}
                    >
                        <div
                            className="relative w-full"
                            style={{
                                transform: cardTransform,
                                transition: cardTransition,
                                transformStyle: 'preserve-3d',
                                willChange: 'transform',
                            }}
                        >
                            <div
                                className="relative w-full rounded-[14px] overflow-hidden"
                                style={{
                                    backgroundColor: bgColor,
                                    boxShadow: `0 20px 60px -12px ${bgColor}44, 0 8px 24px rgba(0,0,0,0.5)`,
                                }}
                            >
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
                                        <p style={{ color: fgColor }} className="text-[16px] font-medium font-borna leading-tight">
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
                                        <p style={{ color: fgColor }} className="text-[16px] font-medium font-borna leading-tight">
                                            {userName}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p style={{ color: lblColor }} className="text-[10px] font-bold font-helvetica uppercase tracking-wider">
                                            {t('passbook.kard_label', 'KARD')}
                                        </p>
                                        <p style={{ color: fgColor }} className="text-[14px] font-medium font-borna uppercase">
                                            {kardLevel}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center px-4 py-3">
                                    <div className="bg-white p-3 rounded-xl">
                                        <QRCodeSVG
                                            value={existingPassbook?.walletAddress || walletAddress || ''}
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

                            {/* ══ RIGHT EDGE ══ */}
                            <div
                                className="absolute top-0 right-0 h-full pointer-events-none"
                                style={{
                                    width: `${CARD_THICKNESS}px`,
                                    background: `linear-gradient(to right, ${edgeColor}, ${bgColor})`,
                                    transform: `translateX(${CARD_THICKNESS / 2}px) rotateY(90deg)`,
                                    transformOrigin: 'left center',
                                    borderRadius: '0 2px 2px 0',
                                }}
                            />
                            {/* ══ LEFT EDGE ══ */}
                            <div
                                className="absolute top-0 left-0 h-full pointer-events-none"
                                style={{
                                    width: `${CARD_THICKNESS}px`,
                                    background: `linear-gradient(to left, ${edgeColor}, ${bgColor})`,
                                    transform: `translateX(-${CARD_THICKNESS / 2}px) rotateY(-90deg)`,
                                    transformOrigin: 'right center',
                                    borderRadius: '2px 0 0 2px',
                                }}
                            />
                            {/* ══ TOP EDGE ══ */}
                            <div
                                className="absolute top-0 left-0 w-full pointer-events-none"
                                style={{
                                    height: `${CARD_THICKNESS}px`,
                                    background: `linear-gradient(to top, ${edgeColor}, ${bgColor})`,
                                    transform: `translateY(-${CARD_THICKNESS / 2}px) rotateX(90deg)`,
                                    transformOrigin: 'center bottom',
                                    borderRadius: '2px 2px 0 0',
                                }}
                            />
                            {/* ══ BOTTOM EDGE ══ */}
                            <div
                                className="absolute bottom-0 left-0 w-full pointer-events-none"
                                style={{
                                    height: `${CARD_THICKNESS}px`,
                                    background: `linear-gradient(to bottom, ${edgeColor}, ${bgColor})`,
                                    transform: `translateY(${CARD_THICKNESS / 2}px) rotateX(-90deg)`,
                                    transformOrigin: 'center top',
                                    borderRadius: '0 0 2px 2px',
                                }}
                            />
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
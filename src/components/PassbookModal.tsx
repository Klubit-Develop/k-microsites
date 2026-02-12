import { useState, useEffect } from 'react';
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
    const { t } = useTranslation();
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
                return response.data.data as {
                    kardLevel?: string;
                };
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
                <div className="absolute inset-x-0 top-0 h-[489px] pointer-events-none">
                    <div className="absolute inset-0" style={{ backgroundColor: bgColor }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0a0a0a 40%)' }} />
                    <div className="absolute inset-0 backdrop-blur-[1.5px]" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.5) 40%)' }} />
                </div>

                <div className="absolute top-0 left-1/2 -translate-x-1/2 pt-[5px] opacity-50 z-10">
                    <div className="w-9 h-[5px] bg-[#F6F6F6]/50 rounded-full" />
                </div>

                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleClose(); }}
                        className="flex items-center justify-center size-9 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className="relative z-10 flex flex-col items-center px-6 pt-[84px] pb-10 overflow-y-auto max-h-[90vh] overscroll-contain touch-pan-y">
                    <div className="w-full max-w-[342px] rounded-[11px] overflow-hidden border border-[rgba(0,0,0,0.16)]" style={{ backgroundColor: bgColor }}>
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="size-7 rounded-full border-[1.15px] border-[#232323] overflow-hidden shadow-[0px_0px_6.37px_0px_rgba(0,0,0,0.5)]">
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

                    {(passbookUrl || googleWalletUrl) && (
                        <div className="flex flex-col items-center gap-3 mt-6 w-full max-w-[342px]">
                            {passbookUrl && (
                                <button
                                    onClick={() => window.open(passbookUrl, '_blank')}
                                    className="h-[48px] w-full bg-black rounded-xl flex items-center justify-center gap-2 border border-white/20 cursor-pointer transition-opacity hover:opacity-80"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M17.25 2.25H6.75C5.50736 2.25 4.5 3.25736 4.5 4.5V19.5C4.5 20.7426 5.50736 21.75 6.75 21.75H17.25C18.4926 21.75 19.5 20.7426 19.5 19.5V4.5C19.5 3.25736 18.4926 2.25 17.25 2.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M8.25 6.75H15.75" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                        <path d="M8.25 10.5H15.75" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                        <path d="M12 14.25V18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                        <path d="M9.75 16.5L12 18.75L14.25 16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span className="text-[15px] font-semibold text-white" style={{ fontFamily: "'SF Pro Display', sans-serif" }}>
                                        {t('transaction.add_to_apple_wallet', 'Añadir a Apple Wallet')}
                                    </span>
                                </button>
                            )}
                            {googleWalletUrl && (
                                <button
                                    onClick={() => window.open(googleWalletUrl, '_blank')}
                                    className="h-[48px] w-full bg-black rounded-xl flex items-center justify-center gap-2 border border-white/20 cursor-pointer transition-opacity hover:opacity-80"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M21.3998 12.1523C21.3764 12.4602 21.3494 12.7669 21.3093 13.0732C21.2613 13.4406 21.1956 13.8042 21.1117 14.1643C20.8901 15.115 20.557 16.0231 20.0798 16.8764C19.9625 17.0861 19.8444 17.2956 19.7138 17.4963C19.4727 17.8669 19.2103 18.2217 18.9222 18.5582C18.6866 18.8335 18.4296 19.0857 18.1709 19.3373L12 12L18.1709 4.66272C18.4296 4.91432 18.6866 5.16652 18.9222 5.44182C19.2103 5.77832 19.4727 6.13312 19.7138 6.50372C19.8444 6.70442 19.9625 6.91392 20.0798 7.12362C20.557 7.97692 20.8901 8.88502 21.1117 9.83572C21.1956 10.1958 21.2613 10.5594 21.3093 10.9268C21.3494 11.2331 21.3764 11.5398 21.3998 11.8477V12.1523Z" fill="#4285F4"/>
                                        <path d="M12 12L18.171 19.3373C17.6 19.8705 16.965 20.3345 16.278 20.7122C15.126 21.344 13.854 21.75 12.504 21.936C12.336 21.96 12.168 21.972 12 21.996C11.544 21.996 11.088 21.96 10.638 21.894C9.408 21.714 8.262 21.306 7.218 20.7C6.6 20.346 6.024 19.926 5.502 19.446C4.392 18.438 3.546 17.16 3.042 15.726C2.826 15.096 2.67 14.448 2.58 13.782C2.526 13.388 2.496 12.99 2.484 12.588C2.478 12.396 2.484 12.198 2.484 12.006L12 12Z" fill="#34A853"/>
                                        <path d="M2.484 12.006C2.484 11.814 2.478 11.616 2.484 11.424C2.496 11.022 2.526 10.624 2.58 10.23C2.67 9.564 2.826 8.916 3.042 8.286C3.546 6.852 4.392 5.574 5.502 4.566C6.024 4.086 6.6 3.666 7.218 3.312C8.262 2.706 9.408 2.298 10.638 2.118C11.088 2.052 11.544 2.016 12 2.016C12.168 2.04 12.336 2.052 12.504 2.076C13.854 2.262 15.126 2.668 16.278 3.3C16.965 3.678 17.6 4.142 18.171 4.675L12 12L2.484 12.006Z" fill="#FBBC04"/>
                                        <path d="M12 12L5.502 4.566C4.392 5.574 3.546 6.852 3.042 8.286C2.826 8.916 2.67 9.564 2.58 10.23C2.526 10.624 2.496 11.022 2.484 11.424C2.478 11.616 2.484 11.814 2.484 12.006L12 12Z" fill="#EA4335"/>
                                    </svg>
                                    <span className="text-[15px] font-semibold text-white" style={{ fontFamily: "'SF Pro Display', sans-serif" }}>
                                        {t('transaction.add_to_google_wallet', 'Añadir a Google Wallet')}
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PassbookModal;
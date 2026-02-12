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
}

const PassbookModal = ({ isOpen, onClose, walletAddress, userId, clubId, clubName, clubLogo, userName }: PassbookModalProps) => {
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
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PassbookModal;
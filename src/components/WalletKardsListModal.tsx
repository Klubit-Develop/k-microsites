import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';

type KardLevel = 'MEMBER' | 'BRONZE' | 'SILVER' | 'GOLD';
type VenueType = 'CLUB' | 'PUB' | 'BAR' | 'LOUNGE' | 'RESTAURANT' | 'PROMOTER' | 'OTHER';
type BenefitType = 'ACCESS' | 'CONSUME' | 'CREDIT' | 'DISCOUNT' | 'ZONES';

interface BenefitItem {
    name: string;
    quantity: number;
}

interface KardBenefit {
    id: string;
    type: BenefitType;
    name: string;
    description?: string;
    items?: BenefitItem[];
    totalAmount?: number;
    availableAmount?: number;
    discountPercentage?: number;
    discountAppliesTo?: string[];
    maxDiscount?: number;
    zones?: string[];
    accessType?: string;
    usageFrequency: 'UNLIMITED' | 'PER_DAY' | 'PER_WEEK' | 'PER_MONTH' | 'SINGLE_USE';
    duration: 'PERMANENT' | 'SINGLE_USE' | 'EXPIRES_DAYS';
    expirationDays?: number;
    events: string[] | 'ALL';
    rates: string[] | 'ALL';
}

interface UserPassbook {
    id: string;
    serialNumber: string;
    authenticationToken: string;
    kardLevel: KardLevel;
    passbookUrl: string;
    googleWalletUrl: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    clubId: string;
    benefits?: KardBenefit[];
    club: {
        id: string;
        name: string;
        slug: string;
        logo: string;
        venueType: VenueType;
        passbookConfig: {
            backgroundColor: string;
            foregroundColor: string;
            labelColor: string;
        };
    };
}

interface PassbooksResponse {
    status: 'success' | 'error';
    code: string;
    data: {
        passbooks: UserPassbook[];
    };
    message: string;
}

interface WalletKardsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onKardClick: (passbook: UserPassbook) => void;
}

const getVenueTypeLabel = (venueType: VenueType, t: (key: string, fallback: string) => string): string => {
    switch (venueType) {
        case 'CLUB': return t('wallet.venue_club', 'Discoteca');
        case 'PUB': return t('wallet.venue_pub', 'Pub');
        case 'BAR': return t('wallet.venue_bar', 'Bar');
        case 'LOUNGE': return t('wallet.venue_lounge', 'Lounge');
        case 'RESTAURANT': return t('wallet.venue_restaurant', 'Restaurante');
        case 'PROMOTER': return t('wallet.venue_promoter', 'Promotora');
        case 'OTHER': return t('wallet.venue_other', 'Venue');
        default: return '';
    }
};

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z"
            stroke="#939393"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M15.75 15.75L12.4875 12.4875"
            stroke="#939393"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

interface KardRowProps {
    passbook: UserPassbook;
    venueLabel: string;
    onClick: () => void;
}

const KardRow = ({ passbook, venueLabel, onClick }: KardRowProps) => {
    const config = passbook.club.passbookConfig;
    const bgColor = config?.backgroundColor || '#141414';
    const clubLogo = passbook.club.logo;
    const clubName = passbook.club.name;

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-[12px] p-[12px] bg-[#141414] border-2 border-[#232323] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer transition-colors duration-200 hover:bg-[#1a1a1a] text-left w-full"
        >
            <div
                className="relative shrink-0 w-[50px] h-[31px] rounded-[4px] border border-[#232323] overflow-hidden flex flex-col justify-between p-[3.5px]"
                style={{ background: `linear-gradient(to right, ${bgColor} 50%, #141414)` }}
            >
                <div className="relative size-[8px] rounded-full border border-[#232323] overflow-hidden shrink-0" style={{ backgroundColor: bgColor }}>
                    {clubLogo ? (
                        <img
                            src={clubLogo}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : null}
                </div>
                <div className="flex flex-col w-full">
                    <span className="text-[3.5px] font-borna font-semibold text-[#F6F6F6] truncate leading-none">
                        {clubName}
                    </span>
                    <span className="text-[2px] font-helvetica text-[#939393] truncate leading-none">
                        {venueLabel}
                    </span>
                </div>
            </div>

            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6] truncate">
                    {clubName} Kard
                </span>
                <span className="text-[14px] font-helvetica text-[#939393] truncate">
                    {venueLabel}
                </span>
            </div>
        </button>
    );
};

const ListSkeleton = () => (
    <div className="flex flex-col gap-2 w-full animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[55px] w-full bg-[#232323] rounded-2xl" />
        ))}
    </div>
);

const WalletKardsListModal = ({ isOpen, onClose, onKardClick }: WalletKardsListModalProps) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: passbooks, isLoading } = useQuery({
        queryKey: ['wallet-kards-list', user?.id],
        queryFn: async () => {
            const response = await axiosInstance.get<PassbooksResponse>(
                `/v2/wallet/user/${user?.id}`
            );
            return response.data.data.passbooks;
        },
        enabled: isOpen && !!user?.id,
    });

    const filteredPassbooks = useMemo(() => {
        if (!passbooks) return [];
        const query = searchQuery.trim().toLowerCase();
        if (query.length < 1) return passbooks;
        return passbooks.filter((pb) => {
            const clubName = pb.club.name.toLowerCase();
            const venueLabel = getVenueTypeLabel(pb.club.venueType, t).toLowerCase();
            return clubName.includes(query) || venueLabel.includes(query);
        });
    }, [passbooks, searchQuery, t]);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => {
            setIsAnimating(false);
            setSearchQuery('');
            document.body.style.overflow = '';
            onClose();
        }, 300);
    }, [onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) handleClose();
    };

    const handleKardClick = (passbook: UserPassbook) => {
        onKardClick(passbook);
    };

    if (!isAnimating && !isOpen) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`relative w-full max-w-[500px] max-h-[90vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden flex flex-col transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-[10px] pb-[6px]">
                    <div className="w-9 h-[5px] bg-[#F6F6F6] opacity-30 rounded-full" />
                </div>

                <div className="flex flex-col gap-5 px-5 pt-8 pb-3 shrink-0">
                    <h2 className="text-[24px] font-borna font-semibold text-[#FF336D]">
                        {t('wallet.klub_kards', 'Kards')}
                    </h2>

                    <div className="relative w-full">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('wallet.search_placeholder', 'Buscar...')}
                            className="w-full h-[44px] pl-10 pr-4 bg-[#141414] border-2 border-[#232323] rounded-xl text-[15px] font-helvetica text-[#F6F6F6] placeholder:text-[#939393] outline-none focus:border-[#393939] transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {isLoading ? (
                        <ListSkeleton />
                    ) : filteredPassbooks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <span className="text-3xl">💳</span>
                            <p className="text-[14px] font-helvetica text-[#939393] text-center">
                                {searchQuery.trim().length >= 1
                                    ? t('wallet.no_search_results', 'No se encontraron resultados')
                                    : t('wallet.no_kards', 'No tienes kards')
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filteredPassbooks.map((passbook) => (
                                <KardRow
                                    key={passbook.id}
                                    passbook={passbook}
                                    venueLabel={getVenueTypeLabel(passbook.club.venueType, t)}
                                    onClick={() => handleKardClick(passbook)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default WalletKardsListModal;
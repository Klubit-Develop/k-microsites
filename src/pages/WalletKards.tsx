import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';
import { ChevronRightIcon, LogoIcon } from '@/components/icons';
import WalletEventCard, { WalletEventCardSkeleton } from '@/components/WalletEventCard';
import TransactionItemsModal from '@/components/TransactionItemsModal';
import WalletEventsListModal from '@/components/WalletEventsListModal';
import PassbookModal from '@/components/PassbookModal';
import useDragTilt from '@/hooks/useDragTilt';

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
    walletAddress: string | null;
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

interface Transaction {
    id: string;
    type: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
    totalPrice: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
    event: {
        id: string;
        name: string;
        slug: string;
        flyer: string;
        startDate: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
    };
    club: {
        id: string;
        name: string;
        slug: string;
        logo: string;
        address?: string;
    };
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string;
    };
    _count: {
        items: number;
    };
}

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: {
        data: Transaction[];
        meta: {
            total: number;
            count: number;
            limit: number;
            hasMore: boolean;
        };
    };
    message: string;
}

const getVenueTypeLabel = (venueType: VenueType, t: (key: string, fallback: string) => string): string => {
    switch (venueType) {
        case 'CLUB': return t('wallet.venue_club', 'Club');
        case 'PUB': return t('wallet.venue_pub', 'Pub');
        case 'BAR': return t('wallet.venue_bar', 'Bar');
        case 'LOUNGE': return t('wallet.venue_lounge', 'Lounge');
        case 'RESTAURANT': return t('wallet.venue_restaurant', 'Restaurant');
        case 'PROMOTER': return t('wallet.venue_promoter', 'Promoter');
        case 'OTHER': return t('wallet.venue_other', 'Venue');
        default: return '';
    }
};

const getBenefitTypeLabel = (type: BenefitType, t: (key: string, fallback: string) => string): string => {
    switch (type) {
        case 'ACCESS': return t('wallet.benefit_type_access', 'Beneficio de acceso');
        case 'CONSUME': return t('wallet.benefit_type_consume', 'Beneficio de consumo');
        case 'CREDIT': return t('wallet.benefit_type_credit', 'Beneficio de crédito');
        case 'DISCOUNT': return t('wallet.benefit_type_discount', 'Beneficio de descuento');
        case 'ZONES': return t('wallet.benefit_type_zones', 'Beneficio de zonas');
        default: return '';
    }
};

const getKardLevelLabel = (level: KardLevel): string => {
    switch (level) {
        case 'MEMBER': return 'Member';
        case 'BRONZE': return 'Bronze';
        case 'SILVER': return 'Silver';
        case 'GOLD': return 'Gold';
        default: return '';
    }
};

const isEventUpcoming = (startDate: string): boolean => {
    const eventDate = dayjs(startDate);
    const now = dayjs();
    return eventDate.isSame(now, 'day') || eventDate.isAfter(now, 'day');
};

const formatEventDate = (dateString: string, locale: string): string => {
    return dayjs(dateString).locale(locale).format('ddd, D MMMM');
};

const formatEventTimeRange = (startDate: string, startTime?: string, endTime?: string): string => {
    if (startTime && endTime) {
        return `${startTime} - ${endTime}`;
    }
    const start = dayjs(startDate);
    const startFormatted = start.format('HH:mm');
    const endFormatted = start.add(6, 'hour').format('HH:mm');
    return `${startFormatted} - ${endFormatted}`;
};

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const BenefitBadgeIcon = () => (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="45" cy="45" r="40" stroke="url(#gold_gradient)" strokeWidth="2" />
        <circle cx="45" cy="45" r="32" stroke="url(#gold_gradient)" strokeWidth="1.5" />
        <path d="M45 25L49.5 37H62L51.75 44.5L55.5 57L45 49L34.5 57L38.25 44.5L28 37H40.5L45 25Z" fill="url(#gold_gradient)" />
        <defs>
            <linearGradient id="gold_gradient" x1="45" y1="5" x2="45" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0.25" stopColor="#978061" />
                <stop offset="1" stopColor="#7f6649" />
            </linearGradient>
        </defs>
    </svg>
);

interface KlubKardDetailProps {
    passbook: UserPassbook;
    onQrClick: () => void;
}

const KlubKardDetail = ({ passbook, onQrClick }: KlubKardDetailProps) => {
    const { t } = useTranslation();
    const bgColor = passbook.club.passbookConfig?.backgroundColor || '#033f3e';
    const fgColor = passbook.club.passbookConfig?.foregroundColor || '#F6F6F6';
    const lblColor = passbook.club.passbookConfig?.labelColor || '#c1922e';
    const venueLabel = getVenueTypeLabel(passbook.club.venueType, t);

    const {
        cardInnerRef,
        shimmerFrontRef,
        shimmerBackRef,
        containerStyle,
        edgeSlices,
        handlers,
    } = useDragTilt({
        mode: 'spin',
        enableShadow: true,
        enableShimmer: true,
        enableWobble: true,
        onTap: onQrClick,
    });

    const faceBase = 'absolute inset-0 flex flex-col w-full h-full rounded-[16px] border-[3px] border-[#232323] overflow-hidden select-none';

    return (
        <div
            style={containerStyle}
            className="w-full max-w-[340px] h-[210px] cursor-grab active:cursor-grabbing mb-8"
            {...handlers}
        >
            <div
                ref={cardInnerRef}
                className="relative w-full h-full rounded-[16px]"
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* ══ FRONT ══ */}
                <div
                    className={faceBase}
                    style={{
                        background: `linear-gradient(to right, ${bgColor} 50%, #141414 100%)`,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'translateZ(2px)',
                    }}
                >
                    <div
                        ref={shimmerFrontRef}
                        className="absolute inset-0 pointer-events-none z-[3]"
                    />
                    <div
                        className="absolute inset-0 pointer-events-none z-[2] opacity-[0.03]"
                        style={{ backgroundImage: NOISE_SVG }}
                    />

                    <div className="relative z-[2] flex flex-col justify-between h-full p-6">
                        <div className="relative w-[50px] h-[50px] rounded-full border-2 border-[#232323] overflow-hidden shadow-[0px_0px_11px_0px_rgba(0,0,0,0.5)]">
                            {passbook.club.logo ? (
                                <img
                                    src={passbook.club.logo}
                                    alt={passbook.club.name}
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#232323]">
                                    <span className="text-[20px] font-borna font-bold" style={{ color: fgColor }}>
                                        {passbook.club.name.charAt(0)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-start w-full">
                            <h2
                                className="text-[24px] font-borna font-semibold leading-none truncate w-full"
                                style={{ color: fgColor }}
                            >
                                {passbook.club.name}
                            </h2>
                            <span className="text-[14px] font-borna leading-[20px]" style={{ color: lblColor }}>
                                {venueLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ══ EDGE ══ */}
                {edgeSlices.map((z, i) => (
                    <div
                        key={i}
                        className="absolute w-full h-full rounded-[16px]"
                        style={{
                            background: 'rgba(160,170,195,0.15)',
                            transform: `translateZ(${z.toFixed(1)}px)`,
                        }}
                    />
                ))}

                {/* ══ BACK ══ */}
                <div
                    className={faceBase}
                    style={{
                        background: `linear-gradient(to right, #141414 0%, ${bgColor} 50%)`,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg) translateZ(2px)',
                    }}
                >
                    <div
                        ref={shimmerBackRef}
                        className="absolute inset-0 pointer-events-none z-[5]"
                    />
                    <div
                        className="absolute inset-0 pointer-events-none z-[4] opacity-[0.03]"
                        style={{ backgroundImage: NOISE_SVG }}
                    />

                    <div className="relative z-[2] flex flex-col justify-between items-center h-full py-6">
                        <div
                            className="w-full h-[50px] shrink-0"
                            style={{
                                background: 'linear-gradient(to right, #141414 0%, #232323 75%, #141414 100%)',
                            }}
                        />

                        <div className="flex items-end justify-between gap-4 w-full px-6">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[14px] font-borna leading-[20px] truncate" style={{ color: lblColor }}>
                                    {t('passbook.kard_label', 'Kard')}
                                </span>
                                <span className="text-[14px] font-borna leading-[20px] truncate" style={{ color: fgColor }}>
                                    {getKardLevelLabel(passbook.kardLevel)}
                                </span>
                            </div>

                            <LogoIcon width={71} height={20} color={fgColor} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface BenefitCardRowProps {
    benefit: KardBenefit;
    onClick?: () => void;
}

const BenefitCardRow = ({ benefit, onClick }: BenefitCardRowProps) => {
    const { t } = useTranslation();

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] text-left w-full transition-colors duration-200 hover:bg-[#1a1a1a]"
        >
            <div className="flex items-center justify-center shrink-0 size-[90px] p-[2px]">
                <BenefitBadgeIcon />
            </div>

            <div className="flex flex-col flex-1 min-w-0 justify-center">
                <span
                    className="text-[16px] font-borna font-medium leading-[24px] truncate"
                    style={{
                        background: 'linear-gradient(to bottom, #978061 25%, #7f6649)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    {benefit.name}
                </span>
                <span className="text-[14px] font-borna text-[#939393] leading-[20px] truncate">
                    {getBenefitTypeLabel(benefit.type, t)}
                </span>
            </div>
        </button>
    );
};

const SectionHeader = ({ title, onClick, showArrow = false }: { title: string; onClick?: () => void; showArrow?: boolean }) => {
    const isClickable = showArrow && !!onClick;

    return (
        <button
            onClick={isClickable ? onClick : undefined}
            className={`flex gap-2 items-center px-1.5 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!isClickable}
        >
            <span className="text-[#FF336D] text-[24px] font-semibold leading-none whitespace-nowrap overflow-hidden text-ellipsis font-borna">
                {title}
            </span>
            {isClickable && (
                <div className="flex items-center pt-1">
                    <ChevronRightIcon />
                </div>
            )}
        </button>
    );
};

const KardSkeleton = () => (
    <div className="w-full max-w-[370px] h-[250px] bg-[#232323] rounded-2xl animate-pulse" />
);

const BenefitsSkeleton = () => (
    <div className="flex flex-col gap-2 w-full animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="h-[114px] w-full bg-[#232323] rounded-2xl" />
        ))}
    </div>
);

const TransactionsSkeleton = () => (
    <div className="flex flex-col gap-3 items-start w-full">
        <div className="h-[24px] w-[120px] bg-[#232323] rounded-lg animate-pulse ml-1.5" />
        <div className="flex flex-col gap-2 w-full">
            <WalletEventCardSkeleton />
            <WalletEventCardSkeleton />
        </div>
    </div>
);

const WalletKards = () => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const { user } = useAuthStore();
    const { idKard } = useParams({ from: '/_authenticated/wallet/kards/$idKard' });

    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventsListVariant, setEventsListVariant] = useState<'upcoming' | 'past' | null>(null);
    const [showPassbookModal, setShowPassbookModal] = useState(false);

    const { data: passbooks, isLoading: isLoadingPassbooks } = useQuery({
        queryKey: ['wallet-passbooks', user?.id],
        queryFn: async () => {
            const response = await axiosInstance.get<PassbooksResponse>(
                `/v2/wallet/user/${user?.id}`
            );
            return response.data.data.passbooks;
        },
        enabled: !!user?.id,
    });

    const passbook = useMemo(() => {
        if (!passbooks || !idKard) return null;
        return passbooks.find((p) => p.id === idKard) || null;
    }, [passbooks, idKard]);

    const clubId = passbook?.clubId;
    const backgroundColor = passbook?.club.passbookConfig?.backgroundColor || null;

    const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
        queryKey: ['wallet-transactions'],
        queryFn: async () => {
            const response = await axiosInstance.get<BackendResponse>(
                '/v2/transactions/me?status=COMPLETED&limit=50'
            );
            return response.data.data.data;
        },
        enabled: !!user?.id,
    });

    const { upcomingTransactions, pastTransactions } = useMemo(() => {
        if (!transactions || !clubId) {
            return { upcomingTransactions: [], pastTransactions: [] };
        }

        const clubTransactions = transactions.filter((tx) => tx.club.id === clubId);
        const upcoming: Transaction[] = [];
        const past: Transaction[] = [];

        for (const transaction of clubTransactions) {
            if (isEventUpcoming(transaction.event.startDate)) {
                upcoming.push(transaction);
            } else {
                past.push(transaction);
            }
        }

        upcoming.sort((a, b) => dayjs(a.event.startDate).diff(dayjs(b.event.startDate)));
        past.sort((a, b) => dayjs(b.event.startDate).diff(dayjs(a.event.startDate)));

        return { upcomingTransactions: upcoming, pastTransactions: past };
    }, [transactions, clubId]);

    const benefits = passbook?.benefits || [];
    const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

    const formatTransactionForCard = (transaction: Transaction) => ({
        title: transaction.event.name,
        date: formatEventDate(transaction.event.startDate, locale),
        time: formatEventTimeRange(transaction.event.startDate, transaction.event.startTime, transaction.event.endTime),
        location: transaction.club.address || transaction.club.name,
        imageUrl: transaction.event.flyer,
    });

    const handleTransactionClick = (transactionId: string) => {
        setSelectedTransactionId(transactionId);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedTransactionId(null);
    };

    return (
        <div className="relative min-h-screen bg-[#050505]">
            {backgroundColor && (
                <div className="absolute top-0 left-0 right-0 h-[504px] z-0">
                    <div
                        className="absolute inset-0"
                        style={{ backgroundColor }}
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(5,5,5,0) 0%, #050505 40%)',
                        }}
                    />
                </div>
            )}

            <div className="relative z-10 flex flex-col gap-8 items-center w-full max-w-[450px] mx-auto px-4 pt-[60px] pb-[60px]">
                {(isLoadingPassbooks || !passbooks) ? (
                    <>
                        <KardSkeleton />
                        <BenefitsSkeleton />
                        <TransactionsSkeleton />
                    </>
                ) : passbook ? (
                    <>
                        <KlubKardDetail
                            passbook={passbook}
                            onQrClick={() => setShowPassbookModal(true)}
                        />

                        {benefits.length > 0 && (
                            <div className="flex flex-col gap-3 items-start w-full">
                                <SectionHeader title={t('wallet.your_benefits', 'Tus beneficios')} />
                                <div className="flex flex-col gap-2 w-full">
                                    {benefits.map((benefit) => (
                                        <BenefitCardRow key={benefit.id} benefit={benefit} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {(isLoadingTransactions || upcomingTransactions.length > 0) && (
                            <div className="flex flex-col gap-3 items-start w-full">
                                <SectionHeader
                                    title={t('wallet.upcoming', 'Próximos')}
                                    onClick={() => setEventsListVariant('upcoming')}
                                    showArrow={upcomingTransactions.length > 3}
                                />
                                {isLoadingTransactions ? (
                                    <div className="flex flex-col gap-2 w-full">
                                        <WalletEventCardSkeleton />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 w-full">
                                        {upcomingTransactions.slice(0, 3).map((transaction) => {
                                            const cardProps = formatTransactionForCard(transaction);
                                            return (
                                                <WalletEventCard
                                                    key={transaction.id}
                                                    title={cardProps.title}
                                                    date={cardProps.date}
                                                    time={cardProps.time}
                                                    location={cardProps.location}
                                                    imageUrl={cardProps.imageUrl}
                                                    variant="upcoming"
                                                    onClick={() => handleTransactionClick(transaction.id)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {pastTransactions.length > 0 && (
                            <div className="flex flex-col gap-3 items-start w-full">
                                <SectionHeader
                                    title={t('wallet.past', 'Pasados')}
                                    onClick={() => setEventsListVariant('past')}
                                    showArrow={pastTransactions.length > 1}
                                />
                                <div className="flex flex-col gap-2 w-full">
                                    {(() => {
                                        const cardProps = formatTransactionForCard(pastTransactions[0]);
                                        return (
                                            <WalletEventCard
                                                key={pastTransactions[0].id}
                                                title={cardProps.title}
                                                date={cardProps.date}
                                                time={cardProps.time}
                                                location={cardProps.location}
                                                imageUrl={cardProps.imageUrl}
                                                variant="past"
                                                onClick={() => handleTransactionClick(pastTransactions[0].id)}
                                            />
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center py-8">
                        <span className="text-[14px] font-helvetica text-[#939393]">
                            {t('wallet.kard_not_found', 'Kard no encontrada')}
                        </span>
                    </div>
                )}
            </div>

            {selectedTransactionId && (
                <TransactionItemsModal
                    transactionId={selectedTransactionId}
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                />
            )}

            {eventsListVariant && (
                <WalletEventsListModal
                    isOpen={!!eventsListVariant}
                    onClose={() => setEventsListVariant(null)}
                    variant={eventsListVariant}
                />
            )}

            {passbook && (
                <PassbookModal
                    isOpen={showPassbookModal}
                    onClose={() => setShowPassbookModal(false)}
                    walletAddress={passbook.walletAddress || undefined}
                    userId={user?.id || ''}
                    clubId={passbook.clubId}
                    clubName={passbook.club.name}
                    clubLogo={passbook.club.logo}
                    userName={userName}
                    passbookUrl={passbook.passbookUrl}
                    googleWalletUrl={passbook.googleWalletUrl}
                />
            )}
        </div>
    );
};

export default WalletKards;
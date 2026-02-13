import { useMemo, useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';
import { ChevronRightIcon } from '@/components/icons';
import TransactionItemsModal from '@/components/TransactionItemsModal';
import EmptyUpcomingEvents from '@/components/EmptyUpcomingEvents';

import WalletEventCard from '@/components/WalletEventCard';
import WalletEventsListModal from '@/components/WalletEventsListModal';
import WalletKardsListModal from '@/components/WalletKardsListModal';

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

const isEventToday = (startDate: string): boolean => {
    const eventDate = dayjs(startDate);
    const today = dayjs();
    return eventDate.isSame(today, 'day');
};

const isEventUpcoming = (startDate: string): boolean => {
    const eventDate = dayjs(startDate);
    const today = dayjs();
    return eventDate.isAfter(today, 'day');
};

const isEventLive = (startDate: string, endDate?: string, endTime?: string): boolean => {
    const now = dayjs();
    const start = dayjs(startDate);

    if (now.isBefore(start)) return false;

    let end: dayjs.Dayjs;
    if (endDate) {
        end = dayjs(endDate);
    } else if (endTime) {
        const [endHour, endMinute = 0] = endTime.split(':').map(Number);
        const startHour = start.hour();
        if (endHour < startHour) {
            end = start.add(1, 'day').startOf('day').hour(endHour).minute(endMinute);
        } else {
            end = start.hour(endHour).minute(endMinute);
        }
    } else {
        end = start.add(6, 'hour');
    }

    return now.isBefore(end);
};

const getHoursUntilEvent = (startDate: string): number => {
    const now = dayjs();
    const start = dayjs(startDate);
    const hours = start.diff(now, 'hour');
    return Math.max(0, hours);
};

const formatEventDate = (dateString: string, locale: string): string => {
    const date = dayjs(dateString).locale(locale);
    return date.format('ddd, D MMMM');
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

const formatFeaturedDate = (startDate: string, t: (key: string, fallback: string) => string): string => {
    const eventDate = dayjs(startDate);
    const today = dayjs();

    if (eventDate.isSame(today, 'day')) {
        return t('wallet.today', 'Hoy');
    }

    const tomorrow = today.add(1, 'day');
    if (eventDate.isSame(tomorrow, 'day')) {
        return t('wallet.tomorrow', 'Mañana');
    }

    return eventDate.format('ddd, D MMM');
};

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

const HomeIcon = () => (
    <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M2.25 7.25L9 2L15.75 7.25V15.5C15.75 15.8978 15.592 16.2794 15.3107 16.5607C15.0294 16.842 14.6478 17 14.25 17H3.75C3.35218 17 2.97064 16.842 2.68934 16.5607C2.40804 16.2794 2.25 15.8978 2.25 15.5V7.25Z"
            stroke="#939393"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M6.75 17V9.5H11.25V17"
            stroke="#939393"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const PersonIcon = () => (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_4603_12338)">
            <path d="M10.8411 13.7607L9.56114 9.91992H1.88034L0.600342 13.7607" stroke="#939393" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="bevel" />
            <path d="M5.72138 7.35828C7.13523 7.35828 8.28138 6.21213 8.28138 4.79828C8.28138 3.38443 7.13523 2.23828 5.72138 2.23828C4.30753 2.23828 3.16138 3.38443 3.16138 4.79828C3.16138 6.21213 4.30753 7.35828 5.72138 7.35828Z" stroke="#939393" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="bevel" />
        </g>
        <defs>
            <clipPath id="clip0_4603_12338">
                <rect width="11.4408" height="12.7216" fill="white" transform="translate(0 1.63867)" />
            </clipPath>
        </defs>
    </svg>
);

interface TicketWalletProps {
    transaction: Transaction;
    isLive?: boolean;
    onClick: () => void;
}

const TicketWallet = ({ transaction, isLive = false, onClick }: TicketWalletProps) => {
    const { t } = useTranslation();

    const { event, club, _count } = transaction;
    const totalQuantity = _count.items;

    const eventToday = isEventToday(event.startDate);
    const hoursUntil = getHoursUntilEvent(event.startDate);
    const showCountdown = eventToday && !isLive && hoursUntil > 0;

    const timeRange = formatEventTimeRange(event.startDate, event.startTime, event.endTime);
    const dateLabel = formatFeaturedDate(event.startDate, t);
    const location = club.address || club.name;

    return (
        <button
            onClick={onClick}
            className="relative flex h-[200px] flex-col w-full rounded-2xl border-2 border-[#232323] overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
        >
            <div className="absolute inset-0 pointer-events-none rounded-2xl">
                <img
                    src={event.flyer}
                    alt={event.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] from-[25%] to-transparent rounded-2xl" />
            </div>

            <div className="relative flex flex-col items-start gap-[42px] pt-[130px] pb-4 px-4 w-full">
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    {isLive ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                            <span className="text-[14px] font-borna text-[#F6F6F6]">
                                {t('wallet.event_live', 'Evento en curso')}
                            </span>
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2323] opacity-75" />
                                <span className="relative inline-flex rounded-full size-2 bg-[#FF2323]" />
                            </span>
                        </div>
                    ) : showCountdown ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                            <span className="text-[14px] font-borna text-[#F6F6F6]">
                                {t('wallet.starts_in_hours', 'Empieza en {{hours}}h').replace('{{hours}}', String(hoursUntil))}
                            </span>
                        </div>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-1 px-2 py-1 bg-[#232323] border-[1.5px] border-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                        <span className="text-[14px] font-borna text-[#939393]">
                            {totalQuantity}
                        </span>
                        <div className="flex items-center justify-center h-4">
                            <PersonIcon />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-0.5 items-center justify-end w-full" style={{ textShadow: '0px 0px 30px black' }}>
                    <h3 className="text-[20px] font-borna font-semibold text-[#F6F6F6] leading-none text-center w-full truncate">
                        {event.name}
                    </h3>

                    <div className="flex items-center gap-1 justify-center w-full">
                        <span className="text-[14px] font-borna text-[#E5FF88] leading-5 truncate">
                            {dateLabel}
                        </span>
                        <span className="size-[3px] bg-[#E5FF88] rounded-full shrink-0" />
                        <span className="text-[14px] font-borna text-[#E5FF88] leading-5 whitespace-nowrap">
                            {timeRange}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 justify-center py-px w-full">
                        <span className="text-[13px] leading-none pt-0.5">📍</span>
                        <span className="text-[14px] font-borna text-[#939393] leading-5 truncate">
                            {location}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
};

interface FeaturedCarouselProps {
    transactions: Transaction[];
    isLive: boolean;
    onTransactionClick: (transactionId: string) => void;
}

const FeaturedCarousel = ({ transactions, isLive, onTransactionClick }: FeaturedCarouselProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || transactions.length <= 1) return;

        const handleScroll = () => {
            const scrollLeft = scrollContainer.scrollLeft;
            const cardWidth = scrollContainer.offsetWidth;
            const newIndex = Math.round(scrollLeft / cardWidth);
            setCurrentIndex(Math.min(newIndex, transactions.length - 1));
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [transactions.length]);

    if (transactions.length === 1) {
        return (
            <TicketWallet
                transaction={transactions[0]}
                isLive={isLive}
                onClick={() => onTransactionClick(transactions[0].id)}
            />
        );
    }

    return (
        <div className="flex flex-col gap-2 items-center w-full">
            <div className="relative w-full -mx-4">
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {transactions.map((transaction, index) => (
                        <div key={transaction.id} className="shrink-0 w-full snap-center">
                            <TicketWallet
                                transaction={transaction}
                                isLive={index === 0 && isLive}
                                onClick={() => onTransactionClick(transaction.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <PageDots total={transactions.length} current={currentIndex} />
        </div>
    );
};

interface KlubKardProps {
    clubName: string;
    clubLogo: string;
    venueType: VenueType;
    backgroundColor: string;
    foregroundColor: string;
    labelColor: string;
    kardLevel?: KardLevel;
    onClick: () => void;
}

const KlubKard = ({
    clubName,
    clubLogo,
    venueType,
    backgroundColor,
    foregroundColor,
    labelColor,
    onClick,
}: KlubKardProps) => {
    const { t } = useTranslation();
    const venueLabel = getVenueTypeLabel(venueType, t);

    return (
        <button
            onClick={onClick}
            className="flex flex-col justify-between w-full h-[250px] p-[24px] rounded-[20px] border-[3px] border-[#232323] overflow-hidden select-none cursor-pointer text-left"
            style={{
                background: `linear-gradient(to right, ${backgroundColor} 50%, #141414 100%)`,
            }}
        >
            <div
                className="relative size-[54px] rounded-full border-[1.5px] border-[#232323] overflow-hidden shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] shrink-0"
                style={{ backgroundColor }}
            >
                {clubLogo ? (
                    <img
                        src={clubLogo}
                        alt={clubName}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <HomeIcon />
                    </div>
                )}
            </div>

            <div className="flex flex-col items-start gap-0 w-full min-w-0">
                <h3
                    className="text-[24px] font-borna font-semibold leading-normal truncate w-full text-left"
                    style={{ color: foregroundColor }}
                >
                    {clubName}
                </h3>

                {venueLabel && (
                    <span
                        className="text-[13px] font-helvetica"
                        style={{ color: labelColor }}
                    >
                        {venueLabel}
                    </span>
                )}
            </div>
        </button>
    );
};

interface PageDotsProps {
    total: number;
    current: number;
}

const PageDots = ({ total, current }: PageDotsProps) => {
    if (total <= 1) return null;

    const maxDots = 5;
    const dotsToShow = Math.min(total, maxDots);

    return (
        <div className="flex items-center justify-center gap-2 px-3 py-2">
            {Array.from({ length: dotsToShow }).map((_, index) => {
                const isEdge = index === 0 || index === dotsToShow - 1;
                const isActive = index === current % dotsToShow;

                return (
                    <div
                        key={index}
                        className={`rounded-full transition-all ${isActive
                            ? 'bg-[#F6F6F6] size-2'
                            : isEdge && dotsToShow === maxDots
                                ? 'bg-[#F6F6F6] opacity-30 size-1.5'
                                : 'bg-[#F6F6F6] opacity-30 size-2'
                            }`}
                    />
                );
            })}
        </div>
    );
};

interface KardsCarouselProps {
    kards: UserPassbook[];
    onKardClick: (passbook: UserPassbook) => void;
    onHeaderClick?: () => void;
}

const KardsCarousel = ({ kards, onKardClick, onHeaderClick }: KardsCarouselProps) => {
    const { t } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || kards.length <= 1) return;

        const handleScroll = () => {
            const scrollLeft = scrollContainer.scrollLeft;
            const cardWidth = scrollContainer.offsetWidth;
            const newIndex = Math.round(scrollLeft / cardWidth);
            setCurrentIndex(Math.min(newIndex, kards.length - 1));
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [kards.length]);

    const handleHeaderClick = () => {
        if (kards.length > 3 && onHeaderClick) {
            onHeaderClick();
        }
    };

    const renderKard = (passbook: UserPassbook) => {
        const config = passbook.club.passbookConfig;
        return (
            <KlubKard
                clubName={passbook.club.name}
                clubLogo={passbook.club.logo}
                venueType={passbook.club.venueType}
                backgroundColor={config?.backgroundColor || '#141414'}
                foregroundColor={config?.foregroundColor || '#F6F6F6'}
                labelColor={config?.labelColor || '#939393'}
                kardLevel={passbook.kardLevel}
                onClick={() => onKardClick(passbook)}
            />
        );
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <button
                onClick={handleHeaderClick}
                className={`flex gap-2 items-center px-1.5 ${kards.length > 3 ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={kards.length <= 3}
            >
                <span className="text-[#FF336D] text-[24px] font-semibold leading-none whitespace-nowrap overflow-hidden text-ellipsis font-borna">
                    {t('wallet.klub_kards', 'Klub Kards')}
                </span>
                {kards.length > 3 && (
                    <div className="flex items-center pt-1">
                        <ChevronRightIcon />
                    </div>
                )}
            </button>

            {kards.length === 1 ? (
                renderKard(kards[0])
            ) : (
                <div className="flex flex-col gap-2 items-center w-full">
                    <div className="relative w-full -mx-4">
                        <div
                            ref={scrollRef}
                            className="flex gap-3 overflow-x-auto px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        >
                            {kards.map((passbook) => (
                                <div key={passbook.id} className="shrink-0 w-full snap-center">
                                    {renderKard(passbook)}
                                </div>
                            ))}
                        </div>
                    </div>

                    <PageDots total={kards.length} current={currentIndex} />
                </div>
            )}
        </div>
    );
};

interface SectionHeaderProps {
    title: string;
    to?: string;
    onClick?: () => void;
    showArrow?: boolean;
}

const SectionHeader = ({ title, to, onClick, showArrow = false }: SectionHeaderProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (to) {
            navigate({ to });
        }
    };

    const isClickable = showArrow && (!!onClick || !!to);

    return (
        <button
            onClick={handleClick}
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

const WalletSkeleton = () => {
    return (
        <div className="flex flex-col gap-9 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-8 animate-pulse">
            <div className="w-full h-[200px] bg-[#232323] rounded-2xl" />
            <div className="flex flex-col gap-3">
                <div className="w-32 h-7 bg-[#232323] rounded-lg" />
                <div className="flex flex-col gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[88px] bg-[#232323] rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    );
};

const WalletEmpty = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const firstName = user?.firstName || '';

    const WALLET_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/icon-wallet.png';

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-16">
            <div className="flex flex-col gap-8 items-center justify-center py-8 w-full">
                <div className="flex flex-col gap-6 items-center w-full">

                    <div className="relative w-[144px] h-[152px]">
                        <img
                            src={WALLET_URL}
                            alt="Disco ball"
                            className="w-full h-full object-contain"
                            style={{ filter: 'drop-shadow(0px 0px 30px rgba(255, 255, 255, 0.25))' }}
                        />
                    </div>

                    <div className="flex flex-col gap-2 items-center text-center">
                        <h2 className="text-[24px] font-borna font-semibold text-[#F6F6F6] leading-none">
                            {t('wallet.hello_name', 'Hola, {{name}}').replace('{{name}}', firstName || t('wallet.user', 'Usuario'))}
                        </h2>
                        <p className="text-[14px] font-helvetica text-[#939393]">
                            {t('wallet.empty_description', 'Aún no tienes entradas. Descubre eventos cerca de ti.')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Wallet = () => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? 'en' : 'es';
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [eventsListVariant, setEventsListVariant] = useState<'upcoming' | 'past' | null>(null);
    const [isKardsListOpen, setIsKardsListOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['wallet-transactions'],
        queryFn: async () => {
            const response = await axiosInstance.get<BackendResponse>(
                '/v2/transactions/me?status=COMPLETED&limit=50'
            );
            return response.data.data.data;
        },
    });

    const { data: kardsData } = useQuery({
        queryKey: ['wallet-kards', user?.id],
        queryFn: async () => {
            const response = await axiosInstance.get<PassbooksResponse>(
                `/v2/wallet/user/${user?.id}`
            );
            return response.data.data.passbooks;
        },
        enabled: !!user?.id,
    });

    const handleKardClick = (passbook: UserPassbook) => {
        navigate({ to: '/wallet/kards/$idKard', params: { idKard: passbook.id } });
    };

    const { featuredTransactions, upcomingTransactions, pastTransactions, isLive } = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                featuredTransactions: [],
                upcomingTransactions: [],
                pastTransactions: [],
                isLive: false,
            };
        }

        const featured: Transaction[] = [];
        const upcoming: Transaction[] = [];
        const past: Transaction[] = [];
        let live = false;

        for (const transaction of data) {
            const { event } = transaction;

            if (isEventLive(event.startDate, event.endDate, event.endTime)) {
                live = true;
                featured.push(transaction);
            } else if (isEventToday(event.startDate)) {
                featured.push(transaction);
            } else if (isEventUpcoming(event.startDate)) {
                upcoming.push(transaction);
            } else {
                past.push(transaction);
            }
        }

        featured.sort((a, b) => dayjs(a.event.startDate).diff(dayjs(b.event.startDate)));
        upcoming.sort((a, b) => dayjs(a.event.startDate).diff(dayjs(b.event.startDate)));
        past.sort((a, b) => dayjs(b.event.startDate).diff(dayjs(a.event.startDate)));

        return {
            featuredTransactions: featured,
            upcomingTransactions: upcoming,
            pastTransactions: past,
            isLive: live,
        };
    }, [data]);

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

    if (isLoading) {
        return <WalletSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-16">
                <span className="text-[14px] font-helvetica text-[#FF2323]">
                    {t('common.error_loading', 'Error al cargar')}
                </span>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return <WalletEmpty />;
    }

    return (
        <div className="flex flex-col gap-9 w-full max-w-[450px] mx-auto px-4 pt-[60px] pb-[60px] md:py-8">
            {featuredTransactions.length > 0 && (
                <FeaturedCarousel
                    transactions={featuredTransactions}
                    isLive={isLive}
                    onTransactionClick={handleTransactionClick}
                />
            )}

            {kardsData && kardsData.length > 0 && (
                <KardsCarousel
                    kards={kardsData}
                    onKardClick={handleKardClick}
                    onHeaderClick={() => setIsKardsListOpen(true)}
                />
            )}

            {upcomingTransactions.length > 0 && (
                <div className="flex flex-col gap-3">
                    <SectionHeader
                        title={t('wallet.upcoming', 'Próximos')}
                        onClick={() => setEventsListVariant('upcoming')}
                        showArrow={upcomingTransactions.length > 5}
                    />
                    {upcomingTransactions.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {upcomingTransactions.slice(0, 5).map((transaction) => {
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
                    ) : (
                        <EmptyUpcomingEvents
                            title={t('wallet.empty_upcoming_title', 'Nada por aquí')}
                            description={t('wallet.empty_upcoming_subtitle', 'Cuando compres entradas, aparecerán aquí')}
                        />
                    )}
                </div>
            )}

            {pastTransactions.length > 0 && (
                <div className="flex flex-col gap-3">
                    <SectionHeader
                        title={t('wallet.past', 'Pasados')}
                        onClick={() => setEventsListVariant('past')}
                        showArrow={pastTransactions.length > 1}
                    />
                    <div className="flex flex-col gap-2">
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

            <WalletKardsListModal
                isOpen={isKardsListOpen}
                onClose={() => setIsKardsListOpen(false)}
                onKardClick={(passbook) => {
                    setIsKardsListOpen(false);
                    navigate({ to: '/wallet/kards/$idKard', params: { idKard: passbook.id } });
                }}
            />
        </div>
    );
};

export default Wallet;
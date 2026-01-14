import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';
import { ChevronRightIcon } from '@/components/icons';
import Button from '@/components/ui/Button';

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

interface TicketWalletProps {
    transaction: Transaction;
    isLive?: boolean;
}

const TicketWallet = ({ transaction, isLive = false }: TicketWalletProps) => {
    const { i18n, t } = useTranslation();
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const { event, club, _count } = transaction;
    const totalQuantity = _count.items;

    const formattedDate = formatEventDate(event.startDate, locale);
    const timeRange = formatEventTimeRange(event.startDate, event.startTime, event.endTime);

    return (
        <Link
            to="/wallet/$transactionId"
            params={{ transactionId: transaction.id }}
            className="relative flex flex-col w-full rounded-2xl border-2 border-[#232323] overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]"
        >
            <div className="absolute inset-0">
                <img
                    src={event.flyer}
                    alt={event.name}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="relative flex flex-col items-start justify-end h-[240px] p-4 bg-gradient-to-t from-[#141414] from-50% to-transparent">
                {isLive && (
                    <div className="absolute top-[13px] left-[13px] flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                        <span className="text-[14px] font-helvetica text-[#F6F6F6]">
                            {t('wallet.event_live', 'Evento en curso')}
                        </span>
                        <span className="size-2 bg-[#22C55E] rounded-full animate-pulse" />
                    </div>
                )}

                <div className="absolute top-[13px] right-[13px] flex items-center justify-center min-w-[24px] px-2 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    <span className="text-[14px] font-helvetica font-bold text-[#F6F6F6]">
                        x{totalQuantity}
                    </span>
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <h2 className="text-[24px] font-borna font-semibold text-[#F6F6F6] leading-none">
                        {event.name}
                    </h2>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                            <span className="text-[14px] font-helvetica text-[#E5FF88]">
                                {formattedDate}
                            </span>
                            <span className="size-[3px] bg-[#E5FF88] rounded-full" />
                            <span className="text-[14px] font-helvetica text-[#E5FF88]">
                                {timeRange}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 py-px">
                            <span className="text-[13px]">📍</span>
                            <span className="text-[14px] font-helvetica text-[#939393] truncate">
                                {club.address || club.name}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

interface WalletEventCardProps {
    title: string;
    date: string;
    time: string;
    location: string;
    imageUrl: string;
    onClick?: () => void;
}

const WalletEventCard = ({ title, date, time, location, imageUrl, onClick }: WalletEventCardProps) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 w-full p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer text-left"
        >
            <div className="relative shrink-0 w-[54px] h-[68px] rounded-[4px] border-2 border-[#232323] overflow-hidden shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                <img
                    src={imageUrl}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6] truncate">
                    {title}
                </span>

                <div className="flex items-center gap-1">
                    <span className="text-[14px] font-helvetica text-[#E5FF88] truncate">
                        {date}
                    </span>
                    <span className="size-[3px] bg-[#E5FF88] rounded-full shrink-0" />
                    <span className="text-[14px] font-helvetica text-[#E5FF88]">
                        {time}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 py-px">
                    <span className="text-[13px]">📍</span>
                    <span className="text-[14px] font-helvetica text-[#939393] truncate">
                        {location}
                    </span>
                </div>
            </div>
        </button>
    );
};

interface SectionHeaderProps {
    title: string;
    to?: string;
    showArrow?: boolean;
}

const SectionHeader = ({ title, to, showArrow = false }: SectionHeaderProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to && showArrow) {
            navigate({ to });
        }
    };

    return (
        <div className="flex gap-0.5 items-center px-1.5 w-full">
            {showArrow && to ? (
                <button
                    onClick={handleClick}
                    className="flex gap-2 items-center cursor-pointer"
                >
                    <h3 className="text-[24px] font-borna font-bold text-[#FF336D]">
                        {title}
                    </h3>
                    <div className="flex items-center pt-1">
                        <ChevronRightIcon />
                    </div>
                </button>
            ) : (
                <h3 className="text-[24px] font-borna font-bold text-[#FF336D]">
                    {title}
                </h3>
            )}
        </div>
    );
};

const WalletSkeleton = () => (
    <div className="flex flex-col gap-9 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-8 animate-pulse">
        <div className="h-[240px] w-full bg-[#232323] rounded-2xl" />
        <div className="flex flex-col gap-4">
            <div className="h-6 w-32 bg-[#232323] rounded" />
            <div className="h-[92px] w-full bg-[#232323] rounded-2xl" />
        </div>
    </div>
);

const WalletEmpty = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center gap-6 w-full max-w-[500px] mx-auto px-4 min-h-[calc(100vh-200px)]">
            <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-[20px] font-helvetica font-bold text-[#F6F6F6]">
                    {t('wallet.empty_title', 'Tu wallet está vacía')}
                </h2>
                <p className="text-[14px] font-helvetica text-[#939393]">
                    {t('wallet.empty_description', 'Cuando compres entradas, aparecerán aquí')}
                </p>
            </div>
            <Button
                variant="primary"
                onClick={() => navigate({ to: '/' })}
                className="!w-auto !px-8"
            >
                {t('wallet.explore_events', 'Explorar eventos')}
            </Button>
        </div>
    );
};

const getVenueTypeLabel = (venueType: VenueType): string => {
    switch (venueType) {
        case 'CLUB': return 'Discoteca';
        case 'PUB': return 'Pub';
        case 'BAR': return 'Bar';
        case 'LOUNGE': return 'Lounge';
        case 'RESTAURANT': return 'Restaurante';
        case 'PROMOTER': return 'Promotora';
        case 'OTHER': return '';
        default: return '';
    }
};

interface KlubKardProps {
    clubName: string;
    clubLogo: string;
    kardLevel: KardLevel;
    venueType?: VenueType;
    backgroundColor?: string;
    onClick?: () => void;
}

const KlubKard = ({
    clubName,
    clubLogo,
    venueType,
    backgroundColor = '#141414',
    onClick
}: KlubKardProps) => {
    const venueLabel = venueType ? getVenueTypeLabel(venueType) : '';

    return (
        <button
            onClick={onClick}
            className="relative flex flex-col justify-between shrink-0 w-[336px] h-[200px] p-6 rounded-[20px] border-[3px] border-[#232323] cursor-pointer overflow-hidden snap-start"
            style={{
                background: `linear-gradient(135deg, ${backgroundColor} 0%, #141414 100%)`,
            }}
        >
            <div
                className="relative size-[54px] rounded-full border-[1.5px] border-[#232323] overflow-hidden shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]"
                style={{ backgroundColor: `${backgroundColor}80` }}
            >
                {clubLogo ? (
                    <img
                        src={clubLogo}
                        alt={clubName}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[20px]">🏠</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-start gap-0 w-full">
                <h3 className="text-[24px] font-borna font-semibold text-[#F6F6F6] leading-none truncate w-full text-left">
                    {clubName}
                </h3>
                <div className="flex items-center gap-2">
                    {venueLabel && (
                        <span className="text-[14px] font-helvetica text-[#939393]">
                            {venueLabel}
                        </span>
                    )}
                </div>
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

    return (
        <div className="flex items-center justify-center gap-2 py-2">
            {Array.from({ length: Math.min(total, 5) }).map((_, index) => (
                <div
                    key={index}
                    className={`size-2 rounded-full transition-opacity ${index === current ? 'bg-[#F6F6F6]' : 'bg-[#F6F6F6] opacity-30'
                        }`}
                />
            ))}
        </div>
    );
};

const Wallet = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const locale = i18n.language === 'en' ? 'en' : 'es';
    const { user } = useAuthStore();

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

    const [currentKardIndex, setCurrentKardIndex] = useState(0);

    const handleKardClick = (passbook: UserPassbook) => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const url = isIOS ? passbook.passbookUrl : passbook.googleWalletUrl;

        if (url) {
            window.open(url, '_blank');
        }
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
        navigate({ to: '/wallet/$transactionId', params: { transactionId } });
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
        <div className="flex flex-col gap-9 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-8">
            <button
                onClick={() => navigate({ to: '/' })}
                className="flex items-center gap-2 text-[#939393] hover:text-[#F6F6F6] transition-colors self-start cursor-pointer"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[14px] font-helvetica font-medium">
                    {t('common.back', 'Volver')}
                </span>
            </button>

            {featuredTransactions.length > 0 && (
                <div className="flex flex-col gap-4">
                    {featuredTransactions.map((transaction, index) => (
                        <TicketWallet
                            key={transaction.id}
                            transaction={transaction}
                            isLive={index === 0 && isLive}
                        />
                    ))}
                </div>
            )}

            {upcomingTransactions.length > 0 && (
                <div className="flex flex-col gap-3">
                    <SectionHeader
                        title={t('wallet.upcoming', 'Próximos')}
                        to="/wallet/upcoming"
                        showArrow={upcomingTransactions.length > 5}
                    />
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
                                    onClick={() => handleTransactionClick(transaction.id)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {kardsData && kardsData.length > 0 && (
                <div className="flex flex-col gap-4">
                    <SectionHeader
                        title={t('wallet.your_kards', 'Tus kards')}
                        to="/wallet/kards"
                        showArrow={kardsData.length > 5}
                    />

                    <div className="relative -mx-4">
                        <div
                            className="flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            onScroll={(e) => {
                                const scrollLeft = e.currentTarget.scrollLeft;
                                const cardWidth = 336 + 16;
                                const newIndex = Math.round(scrollLeft / cardWidth);
                                setCurrentKardIndex(Math.min(newIndex, kardsData.length - 1));
                            }}
                        >
                            {kardsData.map((passbook) => (
                                <KlubKard
                                    key={passbook.id}
                                    clubName={passbook.club.name}
                                    clubLogo={passbook.club.logo}
                                    kardLevel={passbook.kardLevel}
                                    venueType={passbook.club.venueType}
                                    backgroundColor={passbook.club.passbookConfig.backgroundColor}
                                    onClick={() => handleKardClick(passbook)}
                                />
                            ))}
                        </div>

                        <PageDots total={kardsData.length} current={currentKardIndex} />
                    </div>
                </div>
            )}

            {pastTransactions.length > 0 && (
                <div className="flex flex-col gap-3">
                    <SectionHeader
                        title={t('wallet.past', 'Pasados')}
                        to="/wallet/past"
                        showArrow={pastTransactions.length > 5}
                    />
                    <div className="flex flex-col gap-2">
                        {pastTransactions.slice(0, 5).map((transaction) => {
                            const cardProps = formatTransactionForCard(transaction);
                            return (
                                <WalletEventCard
                                    key={transaction.id}
                                    title={cardProps.title}
                                    date={cardProps.date}
                                    time={cardProps.time}
                                    location={cardProps.location}
                                    imageUrl={cardProps.imageUrl}
                                    onClick={() => handleTransactionClick(transaction.id)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
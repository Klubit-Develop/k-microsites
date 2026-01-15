import { useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { ChevronRightIcon } from '@/components/icons';

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
    return Math.max(0, start.diff(now, 'hour'));
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
    const { t } = useTranslation();

    const { event, club, _count } = transaction;
    const totalQuantity = _count.items;

    const timeRange = formatEventTimeRange(event.startDate, event.startTime, event.endTime);
    const hoursUntil = getHoursUntilEvent(event.startDate);

    const getBadgeContent = () => {
        if (isLive) {
            return (
                <>
                    <span className="text-[14px] font-helvetica text-[#F6F6F6]">
                        {t('wallet.event_live', 'Evento en curso')}
                    </span>
                    <span className="size-2 bg-[#22C55E] rounded-full animate-pulse" />
                </>
            );
        }
        if (hoursUntil > 0) {
            return (
                <span className="text-[14px] font-helvetica text-[#F6F6F6]">
                    {t('wallet.starts_in', 'Empieza en {{hours}}h', { hours: hoursUntil })}   ⏰
                </span>
            );
        }
        return null;
    };

    const badgeContent = getBadgeContent();

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
                {badgeContent && (
                    <div className="absolute top-[13px] left-[13px] flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                        {badgeContent}
                    </div>
                )}

                <div className="absolute top-[13px] right-[13px] flex items-center justify-center min-w-[24px] px-2 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    <span className="text-[14px] font-helvetica font-bold text-[#F6F6F6]">
                        x{totalQuantity}
                    </span>
                </div>

                <div className="flex flex-col gap-[2px] w-full shadow-[0px_0px_30px_0px_black]">
                    <h2 className="text-[24px] font-borna font-semibold text-[#F6F6F6] leading-none">
                        {event.name}
                    </h2>

                    <div className="flex items-center gap-1">
                        <span className="text-[14px] font-helvetica text-[#E5FF88]">
                            {t('wallet.today', 'Hoy')}
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
        </Link>
    );
};

interface WalletEventCardProps {
    title: string;
    date: string;
    time: string;
    location: string;
    imageUrl: string;
    variant?: 'upcoming' | 'past';
    onClick?: () => void;
}

const WalletEventCard = ({ title, date, time, location, imageUrl, variant = 'upcoming', onClick }: WalletEventCardProps) => {
    const dateTimeColor = variant === 'upcoming' ? 'text-[#E5FF88]' : 'text-[#939393]';
    const dotColor = variant === 'upcoming' ? 'bg-[#E5FF88]' : 'bg-[#939393]';

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
                    <span className={`text-[14px] font-helvetica ${dateTimeColor} truncate`}>
                        {date}
                    </span>
                    <span className={`size-[3px] ${dotColor} rounded-full shrink-0`} />
                    <span className={`text-[14px] font-helvetica ${dateTimeColor}`}>
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
        <div className="flex gap-2 items-center px-1.5 w-full">
            {showArrow && to ? (
                <button
                    onClick={handleClick}
                    className="flex gap-2 items-center cursor-pointer"
                >
                    <h3 className="text-[24px] font-borna font-semibold text-[#FF336D]">
                        {title}
                    </h3>
                    <div className="flex items-center pt-1">
                        <ChevronRightIcon />
                    </div>
                </button>
            ) : (
                <h3 className="text-[24px] font-borna font-semibold text-[#FF336D]">
                    {title}
                </h3>
            )}
        </div>
    );
};

const WalletSkeleton = () => (
    <div className="flex flex-col gap-8 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-8 animate-pulse">
        <div className="h-[240px] w-full bg-[#232323] rounded-2xl" />
        <div className="flex flex-col gap-4">
            <div className="h-6 w-32 bg-[#232323] rounded" />
            <div className="h-[92px] w-full bg-[#232323] rounded-2xl" />
            <div className="h-[92px] w-full bg-[#232323] rounded-2xl" />
        </div>
        <div className="flex flex-col gap-4">
            <div className="h-6 w-32 bg-[#232323] rounded" />
            <div className="h-[92px] w-full bg-[#232323] rounded-2xl" />
        </div>
    </div>
);

const UpcomingEmptyState = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center w-full py-8">
            <div className="flex flex-col gap-8 items-center w-full">
                <div className="flex flex-col gap-6 items-center w-full">
                    <div className="flex items-center justify-center size-[90px]">
                        <img
                            src="https://klubit.fra1.cdn.digitaloceanspaces.com/icon-ticket.png"
                            alt=""
                            className="w-full h-auto object-contain"
                        />
                    </div>

                    <div className="flex flex-col gap-2 items-center text-center px-4 w-full">
                        <h3 className="font-borna font-semibold text-[24px] text-[#F6F6F6]">
                            {t('wallet.empty_upcoming_title', 'No tienes próximos eventos')}
                        </h3>
                        <p className="font-helvetica font-medium text-[16px] text-[#939393]">
                            {t('wallet.empty_upcoming_subtitle', 'Descubre planes cerca de ti y organiza tu próxima salida.')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate({ to: '/' })}
                    className="flex items-center justify-center w-full h-12 bg-[#232323] rounded-xl hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                    <span className="font-helvetica font-bold text-[16px] text-[#F6F6F6]">
                        {t('wallet.discover_events', 'Descubrir eventos')}
                    </span>
                </button>
            </div>
        </div>
    );
};

const Wallet = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const { data, isLoading, error } = useQuery({
        queryKey: ['wallet-transactions'],
        queryFn: async () => {
            const response = await axiosInstance.get<BackendResponse>(
                '/v2/transactions/me?status=COMPLETED&limit=50'
            );
            return response.data.data.data;
        },
    });

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

    const hasNoUpcoming = upcomingTransactions.length === 0;
    const hasPastOrFeatured = pastTransactions.length > 0 || featuredTransactions.length > 0;
    const showUpcomingEmptyState = hasNoUpcoming && hasPastOrFeatured;
    const hasNoData = !data || data.length === 0;

    const containerClasses = hasNoData 
        ? "flex flex-col gap-8 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:pt-0 md:pb-0 md:min-h-[calc(100vh-178px)] md:justify-center"
        : "flex flex-col gap-8 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-8";

    return (
        <div className={containerClasses}>
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
                <div className="flex flex-col gap-4">
                    <SectionHeader
                        title={t('wallet.upcoming', 'Próximos')}
                        showArrow={false}
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
                                    variant="upcoming"
                                    onClick={() => handleTransactionClick(transaction.id)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {(showUpcomingEmptyState || hasNoData) && (
                <div className="flex flex-col gap-4">
                    <SectionHeader title={t('wallet.upcoming', 'Próximos')} />
                    <UpcomingEmptyState />
                </div>
            )}

            {pastTransactions.length > 0 && (
                <div className="flex flex-col gap-4">
                    <SectionHeader
                        title={t('wallet.past', 'Pasados')}
                        to="/wallet/past"
                        showArrow={true}
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
                                    variant="past"
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
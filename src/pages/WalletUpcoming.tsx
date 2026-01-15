import { useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';

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

const isEventUpcoming = (startDate: string): boolean => {
    const eventDate = dayjs(startDate);
    const today = dayjs();
    return eventDate.isAfter(today, 'day');
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

const WalletListSkeleton = () => (
    <div className="flex flex-col gap-2 w-full animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[92px] w-full bg-[#232323] rounded-2xl" />
        ))}
    </div>
);

const WalletListEmpty = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleDiscoverEvents = () => {
        navigate({ to: '/' });
    };

    return (
        <div className="flex flex-col items-center justify-center w-full py-8">
            <div className="flex flex-col gap-8 items-center w-full max-w-[400px]">
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
                            {t('wallet.empty_title', 'No tienes próximos eventos')}
                        </h3>
                        <p className="font-helvetica font-medium text-[16px] text-[#939393]">
                            {t('wallet.empty_subtitle', 'Descubre planes cerca de ti y organiza tu próxima salida.')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleDiscoverEvents}
                    className="flex items-center justify-center w-full h-12 bg-[#232323] rounded-xl hover:bg-[#2a2a2a] transition-colors"
                >
                    <span className="font-helvetica font-bold text-[16px] text-[#F6F6F6]">
                        {t('wallet.discover_events', 'Descubrir eventos')}
                    </span>
                </button>
            </div>
        </div>
    );
};

const WalletUpcoming = () => {
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

    const upcomingTransactions = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data
            .filter((transaction) => isEventUpcoming(transaction.event.startDate))
            .sort((a, b) => dayjs(a.event.startDate).diff(dayjs(b.event.startDate)));
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

    return (
        <div className="min-h-screen bg-black">
            <div className="flex flex-col gap-2 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-4 md:pb-8">
                {isLoading ? (
                    <WalletListSkeleton />
                ) : error ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="text-[14px] font-helvetica text-[#FF2323]">
                            {t('common.error_loading', 'Error al cargar')}
                        </span>
                    </div>
                ) : upcomingTransactions.length === 0 ? (
                    <WalletListEmpty />
                ) : (
                    upcomingTransactions.map((transaction) => {
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
                    })
                )}
            </div>
        </div>
    );
};

export default WalletUpcoming;
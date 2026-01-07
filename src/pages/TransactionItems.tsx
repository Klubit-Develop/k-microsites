import { useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';

// =============================================================================
// INTERFACES
// =============================================================================

interface TransactionItem {
    id: string;
    itemType: 'TICKET' | 'GUESTLIST' | 'RESERVATION' | 'PRODUCT' | 'PROMOTION';
    status: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    isForMe: boolean;
    walletAddress: string;
    ticketId?: string | null;
    guestlistId?: string | null;
    reservationId?: string | null;
    productId?: string | null;
    promotionId?: string | null;
    ticket?: {
        id: string;
        name: string;
        ageRequired?: string;
        termsAndConditions?: string;
    } | null;
    guestlist?: {
        id: string;
        name: string;
        startTime?: string;
        endTime?: string;
    } | null;
    reservation?: {
        id: string;
        name: string;
    } | null;
    product?: {
        id: string;
        name: string;
    } | null;
    promotion?: {
        id: string;
        name: string;
    } | null;
    // Legacy fields
    ticketPrice?: {
        id: string;
        name: string;
    } | null;
    guestlistPrice?: {
        id: string;
        name: string;
    } | null;
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
    items: TransactionItem[];
}

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: Transaction;
    message: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const isEventLive = (startDate: string, startTime?: string, endTime?: string): boolean => {
    const now = dayjs();
    const eventStart = dayjs(startDate);

    // Si el evento es hoy
    if (eventStart.isSame(now, 'day')) {
        // Si tenemos hora de inicio y fin, verificar si estamos dentro del rango
        if (startTime && endTime) {
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);

            const eventStartTime = eventStart.hour(startHour).minute(startMin);
            let eventEndTime = eventStart.hour(endHour).minute(endMin);

            // Si la hora de fin es menor que la de inicio, el evento termina al día siguiente
            if (endHour < startHour) {
                eventEndTime = eventEndTime.add(1, 'day');
            }

            return now.isAfter(eventStartTime) && now.isBefore(eventEndTime);
        }
        return true;
    }

    // Si el evento empezó ayer pero termina hoy (eventos nocturnos)
    if (eventStart.isSame(now.subtract(1, 'day'), 'day') && endTime) {
        const [endHour, endMin] = endTime.split(':').map(Number);
        const eventEndTime = now.hour(endHour).minute(endMin);

        // Solo si la hora de fin es en la madrugada (antes de las 12)
        if (endHour < 12) {
            return now.isBefore(eventEndTime);
        }
    }

    return false;
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

const getItemTypeDotColor = (itemType: string): string => {
    switch (itemType) {
        case 'TICKET':
            return '#D591FF'; // Purple
        case 'GUESTLIST':
            return '#FFCE1F'; // Yellow
        case 'RESERVATION':
            return '#FF336D'; // Pink
        case 'PRODUCT':
            return '#22C55E'; // Green
        case 'PROMOTION':
            return '#3B82F6'; // Blue
        default:
            return '#939393'; // Grey
    }
};

const getItemName = (item: TransactionItem): string => {
    // El backend devuelve ticket/guestlist/etc. directamente con name
    if (item.ticket?.name) return item.ticket.name;
    if (item.guestlist?.name) return item.guestlist.name;
    if (item.reservation?.name) return item.reservation.name;
    if (item.product?.name) return item.product.name;
    if (item.promotion?.name) return item.promotion.name;
    // Fallback a ticketPrice/guestlistPrice si existen
    if (item.ticketPrice?.name) return item.ticketPrice.name;
    if (item.guestlistPrice?.name) return item.guestlistPrice.name;
    return 'Item';
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ItemCardProps {
    eventName: string;
    eventDate: string;
    eventTime: string;
    location: string;
    imageUrl: string;
    itemName: string;
    itemType: string;
    quantity: number;
    isLive: boolean;
    onClick?: () => void;
}

const ItemCard = ({
    eventName,
    eventDate,
    eventTime,
    location,
    imageUrl,
    itemName,
    itemType,
    quantity,
    isLive,
    onClick,
}: ItemCardProps) => {
    const { t } = useTranslation();
    const dotColor = getItemTypeDotColor(itemType);

    return (
        <button
            onClick={onClick}
            className="relative w-full h-[240px] rounded-2xl border-2 border-[#232323] overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer text-left"
        >
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={imageUrl}
                    alt={eventName}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] from-50% to-transparent" />

            {/* Content */}
            <div className="relative flex flex-col justify-end h-full p-4">
                <div className="flex flex-col gap-2">
                    {/* Event Name */}
                    <h3 className="text-[24px] font-borna font-semibold text-[#F6F6F6] leading-none">
                        {eventName}
                    </h3>

                    {/* Event Info */}
                    <div className="flex flex-col gap-0.5">
                        {/* Date & Time */}
                        <div className="flex items-center gap-1">
                            <span className="text-[14px] font-helvetica text-[#E5FF88] truncate">
                                {eventDate}
                            </span>
                            <span className="size-[3px] bg-[#E5FF88] rounded-full shrink-0" />
                            <span className="text-[14px] font-helvetica text-[#E5FF88]">
                                {eventTime}
                            </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 py-px">
                            <span className="text-[13px]">📍</span>
                            <span className="text-[14px] font-helvetica text-[#939393] truncate">
                                {location}
                            </span>
                        </div>
                    </div>

                    {/* Rate Info - with top border */}
                    <div className="flex items-center gap-1.5 pt-2 border-t-[1.5px] border-[#232323]">
                        <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: dotColor }}
                        />
                        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                            {itemName}
                        </span>
                    </div>
                </div>
            </div>

            {/* Badges */}
            {/* Live Badge */}
            {isLive && (
                <div className="absolute top-[13px] left-[13px] flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    <span className="text-[14px] font-helvetica text-[#F6F6F6]">
                        {t('wallet.event_live', 'Evento en curso')}
                    </span>
                    <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
                        <span className="relative inline-flex rounded-full size-2 bg-[#22C55E]" />
                    </span>
                </div>
            )}

            {/* Quantity Badge */}
            <div className="absolute top-[13px] right-[13px] flex items-center justify-center px-2 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] min-w-[24px]">
                <span className="text-[14px] font-helvetica font-bold text-[#F6F6F6]">
                    x{quantity}
                </span>
            </div>
        </button>
    );
};

const TransactionItemsSkeleton = () => (
    <div className="flex flex-col gap-4 w-full animate-pulse">
        {[1, 2].map((i) => (
            <div key={i} className="h-[240px] w-full bg-[#232323] rounded-2xl" />
        ))}
    </div>
);

const TransactionItemsError = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center gap-4 w-full py-16">
            <div className="flex items-center justify-center size-16 bg-[#232323] rounded-full">
                <span className="text-3xl">❌</span>
            </div>
            <p className="text-[14px] font-helvetica text-[#FF2323] text-center">
                {t('common.error_loading', 'Error al cargar')}
            </p>
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const TransactionItems = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const { transactionId } = useParams({ from: '/_authenticated/wallet/$transactionId' });
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const { data: transaction, isLoading, error } = useQuery({
        queryKey: ['transaction', transactionId],
        queryFn: async () => {
            const response = await axiosInstance.get<BackendResponse>(
                `/v2/transactions/${transactionId}`
            );
            // El backend puede devolver data.transaction o data directamente
            const data = response.data.data;
            return (data as any).transaction || data;
        },
        enabled: !!transactionId,
    });

    const isLive = useMemo(() => {
        if (!transaction?.event) return false;
        return isEventLive(
            transaction.event.startDate,
            transaction.event.endDate,
            transaction.event.startTime,
            transaction.event.endTime
        );
    }, [transaction]);

    const handleItemClick = (itemId: string) => {
        navigate({
            to: '/wallet/$transactionId/$itemId',
            params: { transactionId, itemId },
        });
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Content */}
            <div className="flex flex-col gap-4 w-full max-w-[500px] mx-auto px-4 py-4 pb-8">
                {isLoading ? (
                    <TransactionItemsSkeleton />
                ) : error || !transaction ? (
                    <TransactionItemsError />
                ) : (
                    transaction.items.map((item: TransactionItem) => (
                        <ItemCard
                            key={item.id}
                            eventName={transaction.event.name}
                            eventDate={formatEventDate(transaction.event.startDate, locale)}
                            eventTime={formatEventTimeRange(
                                transaction.event.startDate,
                                transaction.event.startTime,
                                transaction.event.endTime
                            )}
                            location={transaction.club.address || transaction.club.name}
                            imageUrl={transaction.event.flyer}
                            itemName={getItemName(item)}
                            itemType={item.itemType}
                            quantity={item.quantity}
                            isLive={isLive}
                            onClick={() => handleItemClick(item.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default TransactionItems;
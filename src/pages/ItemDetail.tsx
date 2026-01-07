import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import axiosInstance from '@/config/axiosConfig';
import LocationCard from '@/components/LocationCard';
import { useAuthStore } from '@/stores/authStore';

// =============================================================================
// INTERFACES
// =============================================================================

interface TransactionItem {
    id: string;
    itemType: 'TICKET' | 'GUESTLIST' | 'RESERVATION' | 'PROMOTION' | 'PRODUCT';
    status: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    isForMe: boolean;
    walletAddress?: string;
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
    promotion?: {
        id: string;
        name: string;
    } | null;
    product?: {
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
        addressLocation?: {
            lat: number;
            lng: number;
        } | null;
    };
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string;
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

const formatEventDate = (dateString: string, locale: string): string => {
    const date = dayjs(dateString).locale(locale);
    return date.format('ddd, D MMMM');
};

const formatPrice = (price: number): string => {
    if (price === 0) return 'Gratis';
    return `${price.toFixed(2)}€`;
};

const formatTimeRange = (startTime?: string, endTime?: string): string => {
    if (startTime && endTime) {
        return `${startTime}h - ${endTime}h`;
    }
    return '';
};

const getItemTypeDotColor = (itemType: string): string => {
    switch (itemType) {
        case 'TICKET':
            return 'bg-[#D591FF]';
        case 'GUESTLIST':
            return 'bg-[#FFCE1F]';
        case 'RESERVATION':
            return 'bg-[#FF336D]';
        case 'PROMOTION':
            return 'bg-[#4ECDC4]';
        case 'PRODUCT':
            return 'bg-[#95E1D3]';
        default:
            return 'bg-[#FFCE1F]';
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

const getItemTimeRange = (item: TransactionItem): string => {
    if (item.guestlist?.startTime && item.guestlist?.endTime) {
        return formatTimeRange(item.guestlist.startTime, item.guestlist.endTime);
    }
    return '';
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface EventCardInfoProps {
    event: Transaction['event'];
    locale: string;
}

const EventCardInfo = ({ event, locale }: EventCardInfoProps) => {
    const formattedDate = formatEventDate(event.startDate, locale);

    return (
        <div className="flex flex-col gap-1 w-full">
            <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                Evento
            </span>
            <div className="flex flex-col bg-[#141414] border-2 border-[#232323] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b-[1.5px] border-[#232323]">
                    {/* Event thumbnail */}
                    <div className="relative shrink-0 w-[30px] h-[37.5px] rounded-[2px] border border-[#232323] overflow-hidden shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                        <img
                            src={event.flyer}
                            alt={event.name}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                    {/* Event info */}
                    <div className="flex items-center gap-1">
                        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                            {event.name}
                        </span>
                        <span className="size-[3px] bg-[#E5FF88] rounded-full" />
                        <span className="text-[14px] font-helvetica text-[#E5FF88]">
                            {formattedDate}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TarifaCardInfoProps {
    item: TransactionItem;
}

const TarifaCardInfo = ({ item }: TarifaCardInfoProps) => {
    const { t } = useTranslation();
    const itemName = getItemName(item);
    const dotColor = getItemTypeDotColor(item.itemType);
    const price = formatPrice(item.unitPrice);
    const timeRange = getItemTimeRange(item);

    return (
        <div className="flex flex-col gap-1 w-full">
            <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                {t('transaction.tarifa', 'Tarifa')}
            </span>
            <div className="flex flex-col bg-[#141414] border-2 border-[#232323] rounded-2xl overflow-hidden">
                {/* Header - Nombre de tarifa y cantidad */}
                <div className="flex items-center justify-between px-4 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${dotColor}`} />
                        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                            {itemName}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[#939393]">
                        <Users size={14} />
                        <span className="text-[14px] font-helvetica">
                            {item.quantity}
                        </span>
                    </div>
                </div>

                {/* Precio */}
                <div className="flex items-center justify-between px-4 py-3 border-b-[1.5px] border-[#232323]">
                    <span className="text-[16px] font-helvetica font-medium text-[#939393]">
                        {t('transaction.price', 'Precio:')}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                            {price}
                        </span>
                        {item.unitPrice === 0 && (
                            <span className="text-[18px]">🆓</span>
                        )}
                    </div>
                </div>

                {/* Horario */}
                {timeRange && (
                    <div className="flex items-center justify-between px-4 py-3 border-b-[1.5px] border-[#232323]">
                        <span className="text-[16px] font-helvetica font-medium text-[#939393]">
                            {t('transaction.schedule', 'Horario:')}
                        </span>
                        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                            {timeRange}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

interface PassbookCardProps {
    walletAddress: string;
    userId: string;
    clubId: string;
}

const PassbookCard = ({ walletAddress, userId, clubId }: PassbookCardProps) => {
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [walletLinks, setWalletLinks] = useState<{ ios: string; android: string | null } | null>(null);

    const displayAddress = walletAddress.length > 20
        ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-10)}`
        : walletAddress;

    // Detectar plataforma
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    const handleAddToWallet = async () => {
        // Si ya tenemos los links, abrir directamente
        if (walletLinks) {
            const url = isIOS ? walletLinks.ios : walletLinks.android;
            if (url) {
                window.open(url, '_blank');
            }
            return;
        }

        // Generar el passbook
        setIsGenerating(true);
        try {
            const response = await axiosInstance.post('/v2/wallet/generate', {
                userId,
                clubId,
                kardLevel: 'MEMBER',
                qrContent: walletAddress,
            });

            const links = response.data.data.walletLinks;
            setWalletLinks(links);

            // Abrir la URL correspondiente
            const url = isIOS ? links.ios : links.android;
            if (url) {
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Error generating passbook:', error);
            toast.error(t('transaction.passbook_error', 'Error al generar el pase'));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-1 w-full">
            <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                Passbook*
            </span>
            <div className="flex flex-col items-center gap-4 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                {/* QR Code Container */}
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-[5px]">
                    <QRCodeSVG
                        value={walletAddress}
                        size={157}
                        level="M"
                        includeMargin={false}
                    />
                    <span className="text-[14px] font-sans text-black text-center">
                        {displayAddress}
                    </span>
                </div>

                {/* Add to Wallet Button */}
                <button
                    onClick={handleAddToWallet}
                    disabled={isGenerating}
                    className={`
                        flex items-center justify-center gap-2 h-[44px] px-4 bg-black rounded-lg 
                        transition-opacity
                        ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                    `}
                >
                    {isGenerating ? (
                        <span className="text-[14px] font-helvetica font-medium text-white">
                            {t('common.loading', 'Cargando...')}
                        </span>
                    ) : isIOS ? (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 16.97 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                            </svg>
                            <span className="text-[14px] font-helvetica font-medium text-white">
                                {t('transaction.add_to_apple_wallet', 'Añadir a Cartera de Apple')}
                            </span>
                        </>
                    ) : isAndroid ? (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
                            </svg>
                            <span className="text-[14px] font-helvetica font-medium text-white">
                                {t('transaction.add_to_google_wallet', 'Añadir a Google Wallet')}
                            </span>
                        </>
                    ) : (
                        <span className="text-[14px] font-helvetica font-medium text-white">
                            {t('transaction.download_pass', 'Descargar pase')}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

// =============================================================================
// LOADING & ERROR STATES
// =============================================================================

const ItemDetailSkeleton = () => (
    <div className="flex flex-col gap-9 w-full max-w-[500px] mx-auto px-4 py-8 animate-pulse">
        <div className="h-[100px] w-full bg-[#232323] rounded-2xl" />
        <div className="h-[180px] w-full bg-[#232323] rounded-2xl" />
        <div className="h-[300px] w-full bg-[#232323] rounded-2xl" />
        <div className="h-[280px] w-full bg-[#232323] rounded-2xl" />
    </div>
);

const ItemDetailError = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center gap-4 w-full max-w-[500px] mx-auto px-4 py-16">
            <div className="flex items-center justify-center size-20 bg-[#232323] rounded-full">
                <span className="text-4xl">❌</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-[20px] font-helvetica font-bold text-[#F6F6F6]">
                    {t('transaction.error_title', 'Item no encontrado')}
                </h2>
                <p className="text-[14px] font-helvetica text-[#939393]">
                    {t('transaction.error_description', 'No pudimos encontrar este item')}
                </p>
            </div>
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ItemDetail = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const { transactionId, itemId } = useParams({
        from: '/_authenticated/wallet/$transactionId/$itemId'
    });
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

    // Encontrar el item específico
    const item = transaction?.items?.find((i: { id: string; }) => i.id === itemId);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black">
                <ItemDetailSkeleton />
            </div>
        );
    }

    if (error || !transaction || !item) {
        return (
            <div className="min-h-screen bg-black">
                <ItemDetailError />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Content */}
            <div className="flex flex-col gap-9 w-full max-w-[500px] mx-auto px-4 py-4 pb-8">
                {/* Evento Card */}
                <EventCardInfo event={transaction.event} locale={locale} />

                {/* Tarifa Card */}
                <TarifaCardInfo item={item} />

                {/* Passbook con QR */}
                {item.walletAddress && user?.id && (
                    <PassbookCard
                        walletAddress={item.walletAddress}
                        userId={user.id}
                        clubId={transaction.club.id}
                    />
                )}

                {/* Dirección con mapa */}
                {transaction.club.address && transaction.club.addressLocation && (
                    <LocationCard
                        address={transaction.club.address}
                        coordinates={{
                            lat: transaction.club.addressLocation.lat,
                            lng: transaction.club.addressLocation.lng,
                        }}
                    />
                )}

                {/* Link a términos */}
                <button className="px-1.5 text-left cursor-pointer">
                    <span className="text-[12px] font-helvetica font-medium text-[#F6F6F6]/50 underline">
                        {t('transaction.read_terms', 'Leer los términos de compra de la tarifa')}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default ItemDetail;
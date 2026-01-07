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
                {/* QR Code Container - Solo QR, sin texto */}
                <div className="flex items-center justify-center p-4 bg-white rounded-[5px]">
                    <QRCodeSVG
                        value={walletAddress}
                        size={157}
                        level="M"
                        includeMargin={false}
                    />
                </div>

                {/* Add to Wallet Button - Badges oficiales */}
                <button
                    onClick={handleAddToWallet}
                    disabled={isGenerating}
                    className={`
                        transition-opacity
                        ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                    `}
                >
                    {isGenerating ? (
                        /* Skeleton del botón */
                        <div className="w-[156px] h-[48px] bg-[#232323] rounded-md animate-pulse" />
                    ) : isIOS ? (
                        /* Apple Wallet Badge oficial */
                        <svg xmlns="http://www.w3.org/2000/svg" width="156" height="48" viewBox="0 0 156 48">
                            <g fill="none" fillRule="evenodd">
                                <rect width="156" height="48" fill="#000" rx="6" />
                                <path fill="#FFF" d="M49.856 19.448c-.063.048-1.144.655-1.144 2.013 0 1.57 1.382 2.125 1.42 2.137-.012.036-.219.758-.726 1.5-.444.648-.906 1.294-1.632 1.294-.713 0-.9-.412-1.72-.412-.8 0-1.088.425-1.744.425-.713 0-1.163-.6-1.688-1.338-.619-.88-1.119-2.244-1.119-3.53 0-2.076 1.356-3.176 2.688-3.176.707 0 1.294.463 1.738.463.425 0 1.088-.488 1.888-.488.306 0 1.407.025 2.039.892zm-2.406-1.632c.331-.387.563-.925.563-1.463 0-.075-.006-.15-.019-.213-.538.02-1.181.356-1.568.8-.306.344-.588.881-.588 1.425 0 .082.013.163.019.188.031.006.081.012.131.012.481 0 1.094-.319 1.462-.75z" />
                                <path fill="#FFF" d="M54.14 26.266h-1.294l-.706-2.225h-2.456l-.675 2.225h-1.263l2.431-7.522h1.507l2.456 7.522zm-2.225-3.144l-.637-1.962c-.069-.2-.194-.681-.381-1.444h-.025a26.057 26.057 0 01-.363 1.444l-.625 1.962h2.031zm7.028 1.581c0 .519-.175.932-.525 1.238-.35.306-.825.46-1.425.46-.556 0-1.006-.107-1.35-.319v-1.094c.463.287.9.431 1.313.431.512 0 .769-.194.769-.581 0-.2-.069-.362-.206-.488-.138-.125-.406-.287-.806-.487-.519-.263-.887-.531-1.106-.806-.219-.275-.331-.619-.331-1.031 0-.494.181-.894.544-1.2.363-.306.838-.456 1.425-.456.525 0 1 .087 1.425.263v1.05c-.406-.237-.85-.356-1.331-.356-.444 0-.669.169-.669.506 0 .181.063.331.188.45.125.119.375.275.75.469.481.244.838.506 1.069.787.231.281.344.631.344 1.05v.131zm6.247 1.563h-1.294l-.706-2.225h-2.456l-.675 2.225h-1.263l2.431-7.522h1.507l2.456 7.522zm-2.225-3.144l-.637-1.962c-.069-.2-.194-.681-.381-1.444h-.025a26.057 26.057 0 01-.363 1.444l-.625 1.962h2.031zm6.916 3.144h-1.188v-4.528c0-.569.019-1.063.056-1.481h-.025l-1.6 6.009h-.925l-1.587-6.009h-.025c.025.294.037.788.037 1.481v4.528h-1.1v-7.522h1.681l1.431 5.284c.1.369.169.65.206.844h.031c.081-.381.163-.669.244-.862l1.481-5.266h1.581v7.522h-.298zm5.203 0h-3.4v-7.522h3.275v1.056h-2.075v2.025h1.919v1.056h-1.919v2.331h2.2v1.054zm6.166 0h-1.294l-.706-2.225h-2.456l-.675 2.225h-1.263l2.431-7.522h1.507l2.456 7.522zm-2.225-3.144l-.637-1.962c-.069-.2-.194-.681-.381-1.444h-.025a26.057 26.057 0 01-.363 1.444l-.625 1.962h2.031zm2.756 3.144v-7.522h1.2v6.466h2.181v1.056h-3.381zm7.259 0h-1.2v-6.466h-1.544v-1.056h4.281v1.056h-1.537v6.466zm5.603 0h-1.2v-6.466h-1.544v-1.056h4.281v1.056h-1.537v6.466zm5.603 0h-1.2v-3.431h-2.431v3.431h-1.2v-7.522h1.2v3.035h2.431v-3.035h1.2v7.522z" />
                                <path fill="#FFF" d="M97.497 19.448c-.063.048-1.144.655-1.144 2.013 0 1.57 1.382 2.125 1.42 2.137-.012.036-.219.758-.726 1.5-.444.648-.906 1.294-1.632 1.294-.713 0-.9-.412-1.72-.412-.8 0-1.088.425-1.744.425-.713 0-1.163-.6-1.688-1.338-.619-.88-1.119-2.244-1.119-3.53 0-2.076 1.356-3.176 2.688-3.176.707 0 1.294.463 1.738.463.425 0 1.088-.488 1.888-.488.306 0 1.407.025 2.039.892zm-2.406-1.632c.331-.387.563-.925.563-1.463 0-.075-.006-.15-.019-.213-.538.02-1.181.356-1.568.8-.306.344-.588.881-.588 1.425 0 .082.013.163.019.188.031.006.081.012.131.012.481 0 1.094-.319 1.462-.75z" />
                                <path fill="#FFF" d="M100.14 26.266h-1.294l-.706-2.225h-2.456l-.675 2.225h-1.263l2.431-7.522h1.507l2.456 7.522zm-2.225-3.144l-.637-1.962c-.069-.2-.194-.681-.381-1.444h-.025a26.057 26.057 0 01-.363 1.444l-.625 1.962h2.031zm7.028 1.581c0 .519-.175.932-.525 1.238-.35.306-.825.46-1.425.46-.556 0-1.006-.107-1.35-.319v-1.094c.463.287.9.431 1.313.431.512 0 .769-.194.769-.581 0-.2-.069-.362-.206-.488-.138-.125-.406-.287-.806-.487-.519-.263-.887-.531-1.106-.806-.219-.275-.331-.619-.331-1.031 0-.494.181-.894.544-1.2.363-.306.838-.456 1.425-.456.525 0 1 .087 1.425.263v1.05c-.406-.237-.85-.356-1.331-.356-.444 0-.669.169-.669.506 0 .181.063.331.188.45.125.119.375.275.75.469.481.244.838.506 1.069.787.231.281.344.631.344 1.05v.131z" />
                            </g>
                        </svg>
                    ) : isAndroid ? (
                        /* Google Wallet Badge oficial */
                        <svg xmlns="http://www.w3.org/2000/svg" width="156" height="48" viewBox="0 0 156 48">
                            <g fill="none" fillRule="evenodd">
                                <rect width="156" height="48" fill="#000" rx="6" />
                                <path fill="#FFF" d="M43.14 26.266h-1.294l-.706-2.225h-2.456l-.675 2.225h-1.263l2.431-7.522h1.507l2.456 7.522zm-2.225-3.144l-.637-1.962c-.069-.2-.194-.681-.381-1.444h-.025a26.057 26.057 0 01-.363 1.444l-.625 1.962h2.031zm7.028 1.581c0 .519-.175.932-.525 1.238-.35.306-.825.46-1.425.46-.556 0-1.006-.107-1.35-.319v-1.094c.463.287.9.431 1.313.431.512 0 .769-.194.769-.581 0-.2-.069-.362-.206-.488-.138-.125-.406-.287-.806-.487-.519-.263-.887-.531-1.106-.806-.219-.275-.331-.619-.331-1.031 0-.494.181-.894.544-1.2.363-.306.838-.456 1.425-.456.525 0 1 .087 1.425.263v1.05c-.406-.237-.85-.356-1.331-.356-.444 0-.669.169-.669.506 0 .181.063.331.188.45.125.119.375.275.75.469.481.244.838.506 1.069.787.231.281.344.631.344 1.05v.131zm6.247 1.563h-1.294l-.706-2.225h-2.456l-.675 2.225h-1.263l2.431-7.522h1.507l2.456 7.522zm-2.225-3.144l-.637-1.962c-.069-.2-.194-.681-.381-1.444h-.025a26.057 26.057 0 01-.363 1.444l-.625 1.962h2.031z" />
                                <text fill="#FFF" fontFamily="Roboto-Medium, Roboto" fontSize="11" fontWeight="400">
                                    <tspan x="60" y="28">Add to Google Wallet</tspan>
                                </text>
                                <g transform="translate(12, 12)">
                                    <path fill="#4285F4" d="M10.44 12.324c-.18-.78-.276-1.596-.276-2.436 0-.84.096-1.656.276-2.436l-3.972-3.084A12.036 12.036 0 005 9.888c0 1.944.456 3.78 1.284 5.4l4.156-2.964z" />
                                    <path fill="#34A853" d="M17 6.12c1.476 0 2.796.504 3.84 1.5l2.88-2.88C21.6 2.82 19.5 1.92 17 1.92c-4.14 0-7.68 2.376-9.408 5.832l3.972 3.084C12.38 8.292 14.432 6.12 17 6.12z" />
                                    <path fill="#FBBC04" d="M17 17.76c-2.568 0-4.62-1.632-5.436-3.876l-3.972 3.084C9.32 20.424 12.86 22.8 17 22.8c2.4 0 4.692-.828 6.432-2.388l-3.768-2.916c-1.044.696-2.376 1.092-3.664 1.092v1.172z" />
                                    <path fill="#EA4335" d="M28.44 12.24c0-.72-.06-1.404-.18-2.064H17v4.128h6.42c-.3 1.476-1.14 2.712-2.316 3.552l3.768 2.916c2.208-2.04 3.48-5.04 3.48-8.532h.088z" />
                                </g>
                            </g>
                        </svg>
                    ) : (
                        /* Fallback para desktop - Apple Wallet */
                        <svg xmlns="http://www.w3.org/2000/svg" width="156" height="48" viewBox="0 0 156 48">
                            <g fill="none" fillRule="evenodd">
                                <rect width="156" height="48" fill="#000" rx="6" />
                                <path fill="#FFF" d="M49.856 19.448c-.063.048-1.144.655-1.144 2.013 0 1.57 1.382 2.125 1.42 2.137-.012.036-.219.758-.726 1.5-.444.648-.906 1.294-1.632 1.294-.713 0-.9-.412-1.72-.412-.8 0-1.088.425-1.744.425-.713 0-1.163-.6-1.688-1.338-.619-.88-1.119-2.244-1.119-3.53 0-2.076 1.356-3.176 2.688-3.176.707 0 1.294.463 1.738.463.425 0 1.088-.488 1.888-.488.306 0 1.407.025 2.039.892zm-2.406-1.632c.331-.387.563-.925.563-1.463 0-.075-.006-.15-.019-.213-.538.02-1.181.356-1.568.8-.306.344-.588.881-.588 1.425 0 .082.013.163.019.188.031.006.081.012.131.012.481 0 1.094-.319 1.462-.75z" />
                                <text fill="#FFF" fontFamily="SF Pro Display, -apple-system, sans-serif" fontSize="11" fontWeight="500">
                                    <tspan x="54" y="28">Add to Apple Wallet</tspan>
                                </text>
                            </g>
                        </svg>
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
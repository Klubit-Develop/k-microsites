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
    status: 'ACTIVE' | 'PENDING_CLAIM' | 'TRANSFERRED' | 'VALIDATED' | 'CANCELLED';
    quantity: number;
    unitPrice: number;
    subtotal: number;
    isForMe: boolean;
    walletAddress?: string | null;
    purchasedById?: string | null;
    assignedToUserId?: string | null;
    assignedToPhone?: string | null;
    assignedToCountry?: string | null;
    assignedToEmail?: string | null;
    assignedToUser?: {
        id: string;
        firstName: string;
        lastName: string;
        username?: string;
        avatar?: string;
    } | null;
    purchasedBy?: {
        id: string;
        firstName: string;
        lastName: string;
        username?: string;
        avatar?: string;
    } | null;
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
    const formattedTime = event.startTime && event.endTime 
        ? `${event.startTime}h - ${event.endTime}h`
        : event.startTime 
            ? `${event.startTime}h`
            : '';

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
                    <div className="flex flex-col gap-1">
                        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                            {event.name}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-[14px] font-helvetica text-[#E5FF88]">
                                {formattedDate}
                            </span>
                            {formattedTime && (
                                <>
                                    <span className="size-[3px] bg-[#E5FF88] rounded-full" />
                                    <span className="text-[14px] font-helvetica text-[#E5FF88]">
                                        {formattedTime}
                                    </span>
                                </>
                            )}
                        </div>
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
                            <span className="text-[18px]">🎁</span>
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
    const { t, i18n } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [walletLinks, setWalletLinks] = useState<{ ios: string; android: string | null } | null>(null);

    // Detectar plataforma e idioma
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isSpanish = i18n.language === 'es' || i18n.language.startsWith('es-');
    
    // En desktop (ni iOS ni Android), usamos Apple Wallet como default
    const useAppleWallet = isIOS || (!isIOS && !isAndroid);

    const handleAddToWallet = async () => {
        // Si ya tenemos los links, abrir directamente
        if (walletLinks) {
            const url = useAppleWallet ? walletLinks.ios : walletLinks.android;
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

            // Abrir la URL correspondiente según plataforma
            const url = useAppleWallet ? links.ios : links.android;
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

                {/* Add to Wallet Button - Badges según idioma y plataforma */}
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
                    ) : useAppleWallet ? (
                        /* Apple Wallet Badge - según idioma */
                        <img 
                            src={isSpanish ? '/assets/images/apple_es.svg' : '/assets/images/apple_en.svg'}
                            alt={t('transaction.add_to_apple_wallet', 'Add to Apple Wallet')}
                            className="h-[48px] w-auto"
                        />
                    ) : (
                        /* Google Wallet Badge - según idioma */
                        <img 
                            src={isSpanish ? '/assets/images/google_es.svg' : '/assets/images/google_en.svg'}
                            alt={t('transaction.add_to_google_wallet', 'Add to Google Wallet')}
                            className="h-[55px] w-auto"
                        />
                    )}
                </button>
            </div>
        </div>
    );
};

// =============================================================================
// ASSIGNMENT STATUS CARD
// =============================================================================

interface AssignmentStatusCardProps {
    item: TransactionItem;
    currentUserId: string;
    transactionUserId: string;
}

const AssignmentStatusCard = ({ item, currentUserId, transactionUserId }: AssignmentStatusCardProps) => {
    const { t } = useTranslation();
    
    const isPurchaser = currentUserId === transactionUserId || currentUserId === item.purchasedById;
    const isRecipient = currentUserId === item.assignedToUserId;
    const isSentToOther = !item.isForMe && (item.assignedToUserId || item.status === 'PENDING_CLAIM');
    
    if (item.isForMe || (!isSentToOther)) {
        return null;
    }

    // Caso: Usuario destinatario existe (found)
    if (item.assignedToUser && isPurchaser) {
        return (
            <div className="flex flex-col gap-1 w-full">
                <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                    {t('wallet.sent_to', 'Enviado a')}
                </span>
                <div className="flex items-center gap-3 p-4 bg-[#141414] border-2 border-[#232323] rounded-2xl">
                    {item.assignedToUser.avatar ? (
                        <img 
                            src={item.assignedToUser.avatar} 
                            alt={item.assignedToUser.firstName}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-[#232323] flex items-center justify-center">
                            <Users className="w-6 h-6 text-[#939393]" />
                        </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                            {item.assignedToUser.firstName} {item.assignedToUser.lastName}
                        </span>
                        {item.assignedToUser.username && (
                            <span className="text-[14px] font-helvetica text-[#939393]">
                                @{item.assignedToUser.username}
                            </span>
                        )}
                    </div>
                    <div className="ml-auto">
                        <div className="px-3 py-1 bg-[#22C55E]/20 rounded-full">
                            <span className="text-[12px] font-helvetica font-medium text-[#22C55E]">
                                {t('wallet.delivered', 'Entregado')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Caso: Usuario no existe (pending_claim) - visto por el comprador
    if (item.status === 'PENDING_CLAIM' && isPurchaser) {
        const formattedPhone = item.assignedToPhone 
            ? `+${item.assignedToCountry || ''} ${item.assignedToPhone.slice(0, 3)}...${item.assignedToPhone.slice(-2)}`
            : '';
        
        return (
            <div className="flex flex-col gap-1 w-full">
                <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                    {t('wallet.sent_to', 'Enviado a')}
                </span>
                <div className="flex items-center gap-3 p-4 bg-[#141414] border-2 border-[#232323] rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-[#232323] flex items-center justify-center">
                        <Users className="w-6 h-6 text-[#939393]" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                            {formattedPhone}
                        </span>
                        <span className="text-[13px] font-helvetica text-[#939393]">
                            {t('wallet.pending_registration', 'Pendiente de registro')}
                        </span>
                    </div>
                    <div className="ml-auto">
                        <div className="px-3 py-1 bg-[#FFCE1F]/20 rounded-full">
                            <span className="text-[12px] font-helvetica font-medium text-[#FFCE1F]">
                                {t('wallet.pending', 'Pendiente')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Caso: El destinatario ve quien se lo envió
    if (isRecipient && item.purchasedBy) {
        return (
            <div className="flex flex-col gap-1 w-full">
                <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                    {t('wallet.received_from', 'Recibido de')}
                </span>
                <div className="flex items-center gap-3 p-4 bg-[#141414] border-2 border-[#232323] rounded-2xl">
                    {item.purchasedBy.avatar ? (
                        <img 
                            src={item.purchasedBy.avatar} 
                            alt={item.purchasedBy.firstName}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-[#232323] flex items-center justify-center">
                            <Users className="w-6 h-6 text-[#939393]" />
                        </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                            {item.purchasedBy.firstName} {item.purchasedBy.lastName}
                        </span>
                        {item.purchasedBy.username && (
                            <span className="text-[14px] font-helvetica text-[#939393]">
                                @{item.purchasedBy.username}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

// =============================================================================
// LOADING & ERROR STATES
// =============================================================================

const ItemDetailSkeleton = () => (
    <div className="flex flex-col gap-9 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-8 animate-pulse">
        <div className="h-[100px] w-full bg-[#232323] rounded-2xl" />
        <div className="h-[180px] w-full bg-[#232323] rounded-2xl" />
        <div className="h-[300px] w-full bg-[#232323] rounded-2xl" />
        <div className="h-[280px] w-full bg-[#232323] rounded-2xl" />
    </div>
);

const ItemDetailError = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center gap-4 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-16">
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
            const data = response.data.data;
            return (data as any).transaction || data;
        },
        enabled: !!transactionId,
    });

    const item = transaction?.items?.find((i: { id: string; }) => i.id === itemId) as TransactionItem | undefined;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black">
                <ItemDetailSkeleton />
            </div>
        );
    }

    if (error || !transaction || !item || !user?.id) {
        return (
            <div className="min-h-screen bg-black">
                <ItemDetailError />
            </div>
        );
    }

    // Lógica para determinar quién puede ver el QR:
    // - Caso 1 (isForMe): El comprador puede ver el QR
    // - Caso 2 (found): El DESTINATARIO puede ver el QR, el comprador NO
    // - Caso 3 (PENDING_CLAIM): El COMPRADOR puede ver el QR hasta que el destinatario reclame
    const isPurchaser = user.id === transaction.user.id || user.id === item.purchasedById;
    const isRecipient = user.id === item.assignedToUserId;
    const isPendingClaim = item.status === 'PENDING_CLAIM';
    
    // Puede ver QR si:
    // 1. Es para mí (isForMe)
    // 2. Soy el destinatario (found)
    // 3. Soy el comprador Y está pendiente de claim
    const canViewQR = item.isForMe || isRecipient || (isPurchaser && isPendingClaim);

    return (
        <div className="min-h-screen bg-black">
            <div className="flex flex-col gap-9 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-4 md:pb-8">
                {/* Evento Card */}
                <EventCardInfo event={transaction.event} locale={locale} />

                {/* Tarifa Card */}
                <TarifaCardInfo item={item} />

                {/* Estado de asignación */}
                <AssignmentStatusCard
                    item={item}
                    currentUserId={user.id}
                    transactionUserId={transaction.user.id}
                />

                {/* Passbook con QR - Solo si puede verlo */}
                {canViewQR && item.walletAddress && (
                    <PassbookCard
                        walletAddress={item.walletAddress}
                        userId={user.id}
                        clubId={transaction.club.id}
                    />
                )}

                {/* Mensaje cuando el comprador NO puede ver el QR (ya enviado a usuario existente) */}
                {!canViewQR && isPurchaser && item.assignedToUserId && (
                    <div className="flex flex-col gap-1 w-full">
                        <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                            Passbook
                        </span>
                        <div className="flex flex-col items-center gap-3 p-6 bg-[#141414] border-2 border-[#232323] rounded-2xl">
                            <div className="w-16 h-16 rounded-full bg-[#232323] flex items-center justify-center">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="text-[14px] font-helvetica text-[#939393]">
                                    {t('wallet.qr_transferred', 'Esta entrada ya está en la wallet del destinatario')}
                                </p>
                            </div>
                        </div>
                    </div>
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
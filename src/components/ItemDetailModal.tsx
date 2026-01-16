import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { QRCodeSVG } from 'qrcode.react';

import axiosInstance from '@/config/axiosConfig';
import LocationCard from '@/components/LocationCard';
import { useAuthStore } from '@/stores/authStore';

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

interface ItemDetailModalProps {
    transactionId: string;
    itemId: string;
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
}

const formatEventDate = (dateString: string, locale: string): string => {
    const date = dayjs(dateString).locale(locale);
    return date.format('ddd, D MMMM');
};

const formatPrice = (price: number, t: (key: string, fallback: string) => string): string => {
    if (price === 0) return t('checkout.free', 'Gratis');
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
            return '#D591FF';
        case 'GUESTLIST':
            return '#FFCE1F';
        case 'RESERVATION':
            return '#3FE8E8';
        case 'PROMOTION':
            return '#FF336D';
        case 'PRODUCT':
            return '#00D1FF';
        default:
            return '#939393';
    }
};

const getItemName = (item: TransactionItem): string => {
    if (item.ticket?.name) return item.ticket.name;
    if (item.guestlist?.name) return item.guestlist.name;
    if (item.reservation?.name) return item.reservation.name;
    if (item.product?.name) return item.product.name;
    if (item.promotion?.name) return item.promotion.name;
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

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" />
        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" />
    </svg>
);

interface EventCardInfoProps {
    event: Transaction['event'];
    locale: string;
}

const EventCardInfo = ({ event, locale }: EventCardInfoProps) => {
    const { t } = useTranslation();
    const formattedDate = formatEventDate(event.startDate, locale);
    const formattedTime = event.startTime && event.endTime 
        ? `${event.startTime}h - ${event.endTime}h`
        : event.startTime 
            ? `${event.startTime}h`
            : '';

    return (
        <div className="flex flex-col gap-1 w-full">
            <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                {t('checkout.event', 'Evento')}
            </span>
            <div className="flex flex-col bg-[#141414] border-2 border-[#232323] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="relative shrink-0 w-[30px] h-[37.5px] rounded-[2px] border border-[#232323] overflow-hidden shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                        <img
                            src={event.flyer}
                            alt={event.name}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
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
    const price = formatPrice(item.unitPrice, t);
    const timeRange = getItemTimeRange(item);

    return (
        <div className="flex flex-col gap-1 w-full">
            <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                {t('transaction.rate', 'Tarifa')}
            </span>
            <div className="flex flex-col bg-[#141414] border-2 border-[#232323] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="flex items-center gap-1.5">
                        <span 
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: dotColor }}
                        />
                        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                            {itemName}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-[#939393]">
                        <UsersIcon className="w-3.5 h-3.5" />
                        <span className="text-[14px] font-helvetica">
                            {item.quantity}
                        </span>
                    </div>
                </div>

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

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isSpanish = i18n.language === 'es' || i18n.language.startsWith('es-');
    const useAppleWallet = isIOS || (!isIOS && !isAndroid);

    const handleAddToWallet = async () => {
        if (walletLinks) {
            const url = useAppleWallet ? walletLinks.ios : walletLinks.android;
            if (url) {
                window.open(url, '_blank');
            }
            return;
        }

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

            const url = useAppleWallet ? links.ios : links.android;
            if (url) {
                window.open(url, '_blank');
            }
        } catch {
            toast.error(t('transaction.passbook_error', 'Error al generar el pase'));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-1 w-full">
            <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                {t('transaction.passbook', 'Passbook')}*
            </span>
            <div className="flex flex-col items-center gap-4 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-center p-4 bg-white rounded-[5px]">
                    <QRCodeSVG
                        value={walletAddress}
                        size={157}
                        level="M"
                        includeMargin={false}
                    />
                </div>

                <button
                    onClick={handleAddToWallet}
                    disabled={isGenerating}
                    className={`transition-opacity ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                >
                    {isGenerating ? (
                        <div className="w-[156px] h-[48px] bg-[#232323] rounded-md animate-pulse" />
                    ) : useAppleWallet ? (
                        <img 
                            src={isSpanish ? '/assets/images/apple_es.svg' : '/assets/images/apple_en.svg'}
                            alt={t('transaction.add_to_apple_wallet', 'Add to Apple Wallet')}
                            className="h-[48px] w-auto"
                        />
                    ) : (
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
                            <UsersIcon className="w-6 h-6 text-[#939393]" />
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
                        <UsersIcon className="w-6 h-6 text-[#939393]" />
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
                            <UsersIcon className="w-6 h-6 text-[#939393]" />
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

const ModalSkeleton = () => (
    <div className="flex flex-col gap-6 w-full animate-pulse p-6">
        <div className="h-[100px] w-full bg-[#232323] rounded-2xl" />
        <div className="h-[120px] w-full bg-[#232323] rounded-2xl" />
        <div className="h-[250px] w-full bg-[#232323] rounded-2xl" />
    </div>
);

const ItemDetailModal = ({ transactionId, itemId, isOpen, onClose, onBack }: ItemDetailModalProps) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

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

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setIsAnimating(false);
            document.body.style.overflow = '';
            onClose();
        }, 300);
    };

    const { data: transaction, isLoading } = useQuery({
        queryKey: ['transaction', transactionId],
        queryFn: async () => {
            const response = await axiosInstance.get<BackendResponse>(
                `/v2/transactions/${transactionId}`
            );
            const data = response.data.data;
            return (data as unknown as { transaction?: Transaction }).transaction || data;
        },
        enabled: isOpen && !!transactionId,
    });

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isAnimating && !isOpen) return null;

    const item = transaction?.items?.find((i: { id: string }) => i.id === itemId) as TransactionItem | undefined;

    const isPurchaser = user?.id === transaction?.user?.id || user?.id === item?.purchasedById;
    const isRecipient = user?.id === item?.assignedToUserId;
    const isPendingClaim = item?.status === 'PENDING_CLAIM';
    const canViewQR = item?.isForMe || isRecipient || (isPurchaser && isPendingClaim);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`relative w-full max-w-[500px] max-h-[90vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 pt-[5px] opacity-50 z-10">
                    <div className="w-9 h-[5px] bg-[#F6F6F6]/50 rounded-full" />
                </div>

                <div className="relative flex flex-col gap-6 px-6 pt-6 pb-8 overflow-y-auto max-h-[90vh] scrollbar-hide">
                    <div className="flex items-center justify-between h-9">
                        {onBack ? (
                            <button
                                onClick={onBack}
                                className="flex items-center justify-center size-9 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                            >
                                <BackIcon />
                            </button>
                        ) : (
                            <div />
                        )}
                        <button
                            onClick={handleClose}
                            className="flex items-center justify-center size-9 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {isLoading || !transaction || !item ? (
                        <ModalSkeleton />
                    ) : (
                        <>
                            <EventCardInfo event={transaction.event} locale={locale} />

                            <TarifaCardInfo item={item} />

                            <AssignmentStatusCard
                                item={item}
                                currentUserId={user?.id || ''}
                                transactionUserId={transaction.user.id}
                            />

                            {canViewQR && item.walletAddress && (
                                <PassbookCard
                                    walletAddress={item.walletAddress}
                                    userId={user?.id || ''}
                                    clubId={transaction.club.id}
                                />
                            )}

                            {!canViewQR && isPurchaser && item.assignedToUserId && (
                                <div className="flex flex-col gap-1 w-full">
                                    <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                                        {t('transaction.passbook', 'Passbook')}
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

                            {transaction.club.address && transaction.club.addressLocation && (
                                <LocationCard
                                    address={transaction.club.address}
                                    coordinates={{
                                        lat: transaction.club.addressLocation.lat,
                                        lng: transaction.club.addressLocation.lng,
                                    }}
                                />
                            )}

                            <Link 
                                to="/purchase-terms"
                                className="px-1.5 text-left"
                            >
                                <span className="text-[12px] font-helvetica font-medium text-[#F6F6F6]/50 underline">
                                    {t('transaction.read_terms', 'Leer los términos de compra de la tarifa')}
                                </span>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDetailModal;
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import axiosInstance from '@/config/axiosConfig';
import LocationCard from '@/components/LocationCard';
import IncidentModal from '@/components/IncidentModal';
import { useAuthStore } from '@/stores/authStore';
import PassbookModal from '@/components/PassbookModal';

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
    validatedAt?: string | null;
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
        zones?: Array<{ id: string; name: string }>;
        benefits?: Array<{ id: string; name: string; type?: string }>;
    } | null;
    guestlist?: {
        id: string;
        name: string;
        startTime?: string;
        endTime?: string;
        zones?: Array<{ id: string; name: string }>;
        benefits?: Array<{ id: string; name: string; type?: string }>;
    } | null;
    reservation?: {
        id: string;
        name: string;
        partySize?: number;
        maxPersonsPerReservation?: number;
        zones?: Array<{ id: string; name: string }>;
        benefits?: Array<{ id: string; name: string; type?: string }>;
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
    history?: Array<{
        id: string;
        action: string;
        createdAt: string;
        performedBy?: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    }>;
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
        minimumAge?: number;
        vibes?: Array<{ id: string; name: string }>;
        musics?: Array<{ id: string; name: string }>;
        tags?: string[];
        tickets?: Array<{
            id: string;
            name: string;
            zones?: Array<{ id: string; name: string }>;
            benefits?: Array<{ id: string; name: string; type?: string }>;
        }>;
        guestlists?: Array<{
            id: string;
            name: string;
            zones?: Array<{ id: string; name: string }>;
            benefits?: Array<{ id: string; name: string; type?: string }>;
        }>;
        reservations?: Array<{
            id: string;
            name: string;
            zones?: Array<{ id: string; name: string }>;
            benefits?: Array<{ id: string; name: string; type?: string }>;
        }>;
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
        venueType?: string;
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

interface EventResponse {
    status: 'success' | 'error';
    code: string;
    data: { event: FullEvent };
    message: string;
}

interface FullEvent {
    id: string;
    minimumAge?: number;
    vibes?: Array<{ id: string; name: string }>;
    musics?: Array<{ id: string; name: string }>;
    tickets?: Array<{
        id: string;
        name: string;
        zones?: Array<{ id: string; name: string }>;
        benefits?: Array<{ id: string; name: string; type?: string }>;
    }>;
    guestlists?: Array<{
        id: string;
        name: string;
        zones?: Array<{ id: string; name: string }>;
        benefits?: Array<{ id: string; name: string; type?: string }>;
    }>;
    reservations?: Array<{
        id: string;
        name: string;
        zones?: Array<{ id: string; name: string }>;
        benefits?: Array<{ id: string; name: string; type?: string }>;
    }>;
    products?: Array<{ id: string; name: string }>;
}

interface ItemDetailModalProps {
    transactionId: string;
    itemId: string;
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
}

const VENUE_TYPE_MAP: Record<string, string> = {
    CLUB: 'Discoteca',
    DISCO: 'Discoteca',
    BAR: 'Bar',
    LOUNGE: 'Lounge',
    PUB: 'Pub',
    RESTAURANT: 'Restaurante',
};

const isEventToday = (startDate: string): boolean => {
    return dayjs(startDate).isSame(dayjs(), 'day');
};

const isEventPast = (startDate: string): boolean => {
    return dayjs(startDate).isBefore(dayjs(), 'day');
};

const formatEventDate = (dateString: string, locale: string): string => {
    const date = dayjs(dateString).locale(locale);
    return date.format('ddd, D MMMM');
};

const getItemTypeDotColor = (itemType: string): string => {
    switch (itemType) {
        case 'TICKET': return '#D591FF';
        case 'GUESTLIST': return '#FFCE1F';
        case 'RESERVATION': return '#3FE8E8';
        case 'PROMOTION': return '#FF336D';
        case 'PRODUCT': return '#00D1FF';
        default: return '#939393';
    }
};

const getItemName = (item: TransactionItem): string => {
    if (item.ticketPrice?.name) return item.ticketPrice.name;
    if (item.guestlistPrice?.name) return item.guestlistPrice.name;
    if (item.ticket?.name) return item.ticket.name;
    if (item.guestlist?.name) return item.guestlist.name;
    if (item.reservation?.name) return item.reservation.name;
    if (item.product?.name) return item.product.name;
    if (item.promotion?.name) return item.promotion.name;
    return 'Item';
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

const ThreeDotsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5" r="1.5" fill="#F6F6F6" />
        <circle cx="12" cy="12" r="1.5" fill="#F6F6F6" />
        <circle cx="12" cy="19" r="1.5" fill="#F6F6F6" />
    </svg>
);

const PersonIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#939393" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#939393" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M6 9L12 15L18 9" stroke="#939393" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChevronUpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M18 15L12 9L6 15" stroke="#939393" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface EventTagsProps {
    minimumAge?: number;
    venueType?: string;
    vibes?: Array<{ name: string }>;
    musics?: Array<{ name: string }>;
}

const EventTags = ({ minimumAge, venueType, vibes, musics }: EventTagsProps) => {
    const tags: string[] = [];

    if (minimumAge && minimumAge > 0) {
        tags.push(`+${minimumAge} años`);
    }

    if (venueType) {
        const mapped = VENUE_TYPE_MAP[venueType];
        if (mapped) tags.push(mapped);
    }

    if (vibes) {
        vibes.forEach(v => tags.push(v.name));
    }

    if (musics) {
        musics.forEach(m => tags.push(m.name));
    }

    if (tags.length === 0) return null;

    return (
        <div className="w-full overflow-x-auto scrollbar-hide -mx-6 px-6">
            <div className="flex gap-2 w-max mx-auto">
                {tags.map((tag, i) => (
                    <span
                        key={i}
                        className="h-9 flex items-center justify-center px-3.5 text-[14px] font-borna text-[#F6F6F6] bg-[#050505] border-[1.5px] border-[#232323] rounded-[20px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] whitespace-nowrap shrink-0"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
};

interface InfoRowProps {
    label: string;
    value: React.ReactNode;
    hasBorder?: boolean;
}

const InfoRow = ({ label, value, hasBorder = true }: InfoRowProps) => (
    <div className={`flex items-center justify-between px-2 py-3 min-h-[56px] ${hasBorder ? 'border-b-[1.5px] border-[#232323]' : ''}`}>
        <span className="text-[16px] font-borna font-medium text-[#F6F6F6] shrink-0">{label}</span>
        <div className="flex-1 ml-6 text-right">
            <span className="text-[16px] font-borna font-medium text-[#939393]">{value}</span>
        </div>
    </div>
);

interface AccessProgressBarProps {
    remaining: number;
    total: number;
}

const AccessProgressBar = ({ remaining, total }: AccessProgressBarProps) => {
    const percentage = total > 0 ? (remaining / total) * 100 : 0;
    const isFullyUsed = remaining <= 0;
    const barColor = isFullyUsed ? '#FF336D' : '#50DD77';

    return (
        <div className="px-1.5 pb-4 pt-1">
            <div className="w-full h-[4px] bg-[#232323] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: barColor }}
                />
            </div>
        </div>
    );
};

interface TarifaCardProps {
    item: TransactionItem;
    zones: string[];
    products: string[];
    titularName?: string;
    accessRemaining: number;
    accessTotal: number;
}

const TarifaCard = ({ item, zones, products, titularName, accessRemaining, accessTotal }: TarifaCardProps) => {
    const { t } = useTranslation();
    const itemName = getItemName(item);
    const dotColor = getItemTypeDotColor(item.itemType);
    const isProduct = item.itemType === 'PRODUCT';
    const partySize = item.reservation?.partySize || item.reservation?.maxPersonsPerReservation;

    const sectionTitle = isProduct
        ? t('item_detail.product_section', 'Producto')
        : t('transaction.rate', 'Tarifa');

    return (
        <div className="flex flex-col gap-1 w-full">
            <span className="text-[16px] font-borna font-medium text-[#939393] px-1.5">
                {sectionTitle}
            </span>
            <div className="flex flex-col bg-[#141414] border-2 border-[#232323] rounded-2xl overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] px-2">
                <div className="flex items-center justify-between px-2 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="flex items-center gap-1.5">
                        <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: dotColor }}
                        />
                        <span className="text-[16px] font-borna font-medium text-[#F6F6F6]">
                            {itemName}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#232323] border-[1.5px] border-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                        <span className="text-[14px] font-borna text-[#939393]">
                            {partySize || item.quantity}
                        </span>
                        <PersonIcon />
                    </div>
                </div>

                {titularName && (
                    <InfoRow
                        label={t('item_detail.titular', 'Titular')}
                        value={titularName}
                    />
                )}

                {!isProduct && (
                    <InfoRow
                        label={t('item_detail.product', 'Producto')}
                        value={products.length > 0 ? products.join(', ') : t('item_detail.no_consumption', 'Sin consumición')}
                    />
                )}

                {zones.length > 0 && (
                    <InfoRow
                        label={t('item_detail.accessible_zones', 'Zonas accesibles')}
                        value={zones.join(', ')}
                    />
                )}

                <div className="flex items-center justify-between px-2 py-3">
                    <span className="text-[16px] font-borna font-medium text-[#F6F6F6] shrink-0">
                        {isProduct
                            ? t('item_detail.availability', 'Disponibilidad')
                            : t('item_detail.available_accesses', 'Accesos disponibles')
                        }
                    </span>
                    <div className="flex items-center gap-0.5 ml-6">
                        <span className={`text-[16px] font-borna font-medium ${accessRemaining <= 0 ? 'text-[#FF336D]' : 'text-[#50DD77]'}`}>
                            {accessRemaining}
                        </span>
                        <span className="text-[16px] font-borna font-medium text-[#939393]">
                            / {accessTotal}
                        </span>
                    </div>
                </div>
                <AccessProgressBar remaining={accessRemaining} total={accessTotal} />
            </div>
        </div>
    );
};

interface ActivitySectionProps {
    item: TransactionItem;
}

const ActivitySection = ({ item }: ActivitySectionProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(true);

    const history = item.history || [];

    const hasActivity = history.length > 0 || item.validatedAt;

    return (
        <div className="flex flex-col gap-1 w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between px-1.5 cursor-pointer w-full"
            >
                <span className="text-[16px] font-borna font-medium text-[#939393]">
                    {t('item_detail.activity', 'Actividad')}
                </span>
                {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>
            {isOpen && (
                <div className="flex flex-col gap-2">
                    {!hasActivity && (
                        <p className="text-[14px] font-borna text-[#939393]/60 text-center py-4">
                            {t('item_detail.no_activity', 'Aún no tienes actividad en esta tarifa')}
                        </p>
                    )}

                    {item.validatedAt && (
                        <div className="flex items-center gap-2.5 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                            <div className="relative shrink-0 size-9 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-[#50DD77]/20" />
                                <div className="absolute inset-[3px] rounded-full bg-[#50DD77]/40" />
                                <div className="absolute inset-[6px] rounded-full bg-[#50DD77]" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-[14px] font-borna text-[#F6F6F6] truncate">
                                    {t('item_detail.access_validated', 'Acceso validado')}
                                </span>
                                <span className="text-[14px] font-borna text-[#939393]">
                                    {dayjs(item.validatedAt).format('D MMM YYYY, HH:mm')}
                                </span>
                            </div>
                        </div>
                    )}

                    {history.map((entry) => {
                        const isValidation = entry.action === 'VALIDATED';
                        const isDenied = entry.action === 'DENIED' || entry.action === 'REJECTED';
                        const isSent = entry.action === 'SENT' || entry.action === 'TRANSFERRED';

                        let iconBg = '#50DD77';
                        let label = entry.action;
                        let sublabel = '';

                        if (isValidation) {
                            iconBg = '#50DD77';
                            label = t('item_detail.access_validated', 'Acceso validado');
                        } else if (isDenied) {
                            iconBg = '#FF336D';
                            label = t('item_detail.access_denied_short', 'Acceso denegado');
                            sublabel = t('item_detail.out_of_hours', 'Fuera de horario');
                        } else if (isSent) {
                            iconBg = '#5B8DEF';
                            const toName = entry.performedBy
                                ? `${entry.performedBy.firstName} ${entry.performedBy.lastName?.charAt(0)}.`
                                : '';
                            label = toName
                                ? `${t('item_detail.access_sent_to', 'Acceso enviado a')} ${toName}`
                                : t('item_detail.access_sent', 'Acceso enviado');
                        }

                        if (isValidation && item.validatedAt) return null;

                        return (
                            <div key={entry.id} className="flex items-center gap-2.5 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                                <div className="relative shrink-0 size-9 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full" style={{ backgroundColor: `${iconBg}20` }} />
                                    <div className="absolute inset-[3px] rounded-full" style={{ backgroundColor: `${iconBg}40` }} />
                                    <div className="absolute inset-[6px] rounded-full" style={{ backgroundColor: iconBg }} />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[14px] font-borna text-[#F6F6F6] truncate">
                                            {label}
                                        </span>
                                        {sublabel && (
                                            <>
                                                <span className="size-[3px] bg-[#939393] rounded-full shrink-0" />
                                                <span className="text-[14px] font-borna text-[#939393] shrink-0">
                                                    {sublabel}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <span className="text-[14px] font-borna text-[#939393]">
                                        {dayjs(entry.createdAt).format('D MMM YYYY, HH:mm')}
                                    </span>
                                </div>
                                {isSent && (
                                    <ChevronDownIcon />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const formatPrice = (price: number): string => {
    if (price === 0) return 'Gratis';
    return `${price.toFixed(2).replace('.', ',')}€`;
};

const PaymentStatusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#50DD77" fillOpacity="0.2" />
        <circle cx="12" cy="12" r="9" fill="#50DD77" />
        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface OrganizerCardProps {
    club: Transaction['club'];
}

const OrganizerCard = ({ club }: OrganizerCardProps) => {
    const { t } = useTranslation();
    const venueLabel = club.venueType ? VENUE_TYPE_MAP[club.venueType] : undefined;

    return (
        <div className="flex flex-col gap-1 w-full">
            <span className="text-[16px] font-borna font-medium text-[#939393] px-1.5">
                {t('item_detail.organizer', 'Organizador')}
            </span>
            <div className="flex items-center gap-2 px-4 py-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                <div className="relative shrink-0 size-8 rounded-full border-[1.5px] border-[#232323] overflow-hidden shadow-[0px_0px_10.667px_0px_rgba(0,0,0,0.5)]">
                    {club.logo ? (
                        <img
                            src={club.logo}
                            alt={club.name}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-[#323232]" />
                    )}
                </div>
                <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[16px] font-borna font-medium text-[#F6F6F6] truncate">
                        {club.name}
                    </span>
                    {venueLabel && (
                        <>
                            <span className="size-[3px] bg-[#939393] rounded-full shrink-0" />
                            <span className="text-[14px] font-borna text-[#939393] shrink-0">
                                {venueLabel}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

interface PurchaseDetailCardProps {
    transaction: Transaction;
    item: TransactionItem;
}

const PurchaseDetailCard = ({ transaction, item }: PurchaseDetailCardProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const price = formatPrice(item.unitPrice * item.quantity);
    const purchaseDate = transaction.completedAt || transaction.createdAt;
    const formattedDate = dayjs(purchaseDate).format('D MMM YYYY, HH:mm');
    const reference = transaction.id
        ? `LST-${dayjs(purchaseDate).format('YYYY')}-${transaction.id.slice(-6).toUpperCase()}`
        : '-';

    const isPaid = transaction.status === 'COMPLETED';

    return (
        <div className="flex flex-col gap-1 w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between px-1.5 cursor-pointer w-full"
            >
                <span className="text-[16px] font-borna font-medium text-[#939393]">
                    {t('item_detail.purchase_detail', 'Detalle compra')}
                </span>
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon />
                </div>
            </button>
            {isOpen && (
                <div className="flex flex-col bg-[#141414] border-2 border-[#232323] rounded-2xl overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] px-2">
                    <InfoRow
                        label={t('item_detail.price', 'Precio')}
                        value={<span className="text-[#50DD77]">{price}</span>}
                    />
                    <InfoRow
                        label={t('item_detail.payment_status', 'Estado de pago')}
                        value={
                            <span className="flex items-center gap-1.5 justify-end">
                                <span className="text-[#50DD77]">{price}</span>
                                {isPaid && <PaymentStatusIcon />}
                            </span>
                        }
                    />
                    <InfoRow
                        label={t('item_detail.purchase_date', 'Fecha de compra')}
                        value={formattedDate}
                    />
                    <InfoRow
                        label={t('item_detail.reference', 'Referencia')}
                        value={reference}
                        hasBorder={false}
                    />
                </div>
            )}
        </div>
    );
};

const ModalSkeleton = () => (
    <div className="flex flex-col gap-8 px-6 -mt-20 relative z-10 pb-8 animate-pulse">
        <div className="flex flex-col items-center gap-[2px] pt-4">
            <div className="h-7 w-[260px] bg-[#232323] rounded-lg" />
            <div className="h-4 w-[160px] bg-[#232323] rounded mt-1" />
            <div className="h-4 w-[200px] bg-[#232323] rounded mt-1" />
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
            <div className="h-[30px] w-[70px] bg-[#232323] rounded-full" />
            <div className="h-[30px] w-[90px] bg-[#232323] rounded-full" />
            <div className="h-[30px] w-[75px] bg-[#232323] rounded-full" />
            <div className="h-[30px] w-[60px] bg-[#232323] rounded-full" />
        </div>

        <div className="flex flex-col gap-1 w-full">
            <div className="h-5 w-[60px] bg-[#232323] rounded ml-1.5 mb-1" />
            <div className="flex flex-col bg-[#141414] border-2 border-[#232323] rounded-2xl overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] px-2">
                <div className="flex items-center justify-between px-2 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="h-5 w-[140px] bg-[#232323] rounded" />
                    <div className="h-7 w-[52px] bg-[#232323] rounded-full" />
                </div>
                <div className="flex items-center justify-between px-2 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="h-4 w-[80px] bg-[#232323] rounded" />
                    <div className="h-4 w-[120px] bg-[#232323] rounded" />
                </div>
                <div className="flex items-center justify-between px-2 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="h-4 w-[70px] bg-[#232323] rounded" />
                    <div className="h-4 w-[100px] bg-[#232323] rounded" />
                </div>
                <div className="flex items-center justify-between px-2 py-3">
                    <div className="h-5 w-[160px] bg-[#232323] rounded" />
                    <div className="h-5 w-[40px] bg-[#232323] rounded" />
                </div>
                <div className="px-6 pb-4 pt-1">
                    <div className="w-full h-[4px] bg-[#232323] rounded-full" />
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-1 w-full">
            <div className="h-5 w-[140px] bg-[#232323] rounded ml-1.5 mb-1" />
            <div className="flex flex-col bg-[#141414] border-2 border-[#232323] rounded-2xl overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] px-2">
                <div className="flex items-center justify-between px-2 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="h-4 w-[100px] bg-[#232323] rounded" />
                    <div className="h-4 w-[80px] bg-[#232323] rounded" />
                </div>
                <div className="flex items-center justify-between px-2 py-3">
                    <div className="h-4 w-[90px] bg-[#232323] rounded" />
                    <div className="h-4 w-[60px] bg-[#232323] rounded" />
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-1 w-full">
            <div className="h-5 w-[100px] bg-[#232323] rounded ml-1.5 mb-1" />
            <div className="flex items-center gap-3 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                <div className="size-[54px] rounded-full bg-[#232323] shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-5 w-[120px] bg-[#232323] rounded" />
                    <div className="h-4 w-[80px] bg-[#232323] rounded" />
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-1 w-full">
            <div className="h-5 w-[120px] bg-[#232323] rounded ml-1.5 mb-1" />
            <div className="flex flex-col bg-[#141414] border-2 border-[#232323] rounded-2xl overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] px-2">
                <div className="flex items-center justify-between px-2 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="h-4 w-[60px] bg-[#232323] rounded" />
                    <div className="h-4 w-[70px] bg-[#232323] rounded" />
                </div>
                <div className="flex items-center justify-between px-2 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="h-4 w-[110px] bg-[#232323] rounded" />
                    <div className="h-4 w-[80px] bg-[#232323] rounded" />
                </div>
                <div className="flex items-center justify-between px-2 py-3 border-b-[1.5px] border-[#232323]">
                    <div className="h-4 w-[130px] bg-[#232323] rounded" />
                    <div className="h-4 w-[90px] bg-[#232323] rounded" />
                </div>
                <div className="flex items-center justify-between px-2 py-3">
                    <div className="h-4 w-[80px] bg-[#232323] rounded" />
                    <div className="h-4 w-[100px] bg-[#232323] rounded" />
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
            <div className="h-7 w-[100px] bg-[#232323] rounded ml-1.5" />
            <div className="flex flex-col gap-3 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                <div className="w-full h-[224px] bg-[#1a1a1a] rounded-sm" />
                <div className="h-4 w-[200px] bg-[#232323] rounded ml-1.5" />
            </div>
        </div>

        <div className="h-4 w-[260px] bg-[#232323] rounded ml-1.5" />
    </div>
);

const ItemDetailModal = ({ transactionId, itemId, isOpen, onClose, onBack }: ItemDetailModalProps) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showPassbookModal, setShowPassbookModal] = useState(false);
    const [showIncidentModal, setShowIncidentModal] = useState(false);

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
            setShowOptionsMenu(false);
            document.body.style.overflow = '';
            onClose();
        }, 300);
    };

    const hideMutation = useMutation({
        mutationFn: async () => {
            const response = await axiosInstance.post(`/v2/transactions/${transactionId}/hide`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-events-list'] });
            toast.success(t('item_detail.hidden_success', 'Transacción ocultada de tu actividad'));
            setShowOptionsMenu(false);
            handleClose();
        },
        onError: () => {
            toast.error(t('item_detail.hidden_error', 'Error al ocultar la transacción'));
        },
    });

    const handleReportIncident = () => {
        setShowOptionsMenu(false);
        setShowIncidentModal(true);
    };

    const handleHideActivity = () => {
        hideMutation.mutate();
    };

    const handleAddToCalendar = async () => {
        try {
            const response = await axiosInstance.get(`/api/calendar/links/${transactionId}`);
            const links = response.data?.data?.links;
            if (!links) {
                toast.error(t('item_detail.calendar_error', 'Error al generar enlaces de calendario'));
                return;
            }

            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/.test(navigator.userAgent);

            if (isIOS) {
                window.open(links.apple, '_blank');
            } else if (isAndroid) {
                window.open(links.google, '_blank');
            } else {
                window.open(links.google, '_blank');
            }

            setShowOptionsMenu(false);
        } catch {
            toast.error(t('item_detail.calendar_error', 'Error al generar enlaces de calendario'));
        }
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

    const eventSlug = transaction?.event?.slug;
    const { data: fullEvent } = useQuery({
        queryKey: ['event-detail', eventSlug],
        queryFn: async () => {
            const response = await axiosInstance.get<EventResponse>(
                `/v2/events/slug/${eventSlug}`
            );
            return response.data.data.event;
        },
        enabled: !!eventSlug,
    });

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const item = transaction?.items?.find((i: { id: string }) => i.id === itemId) as TransactionItem | undefined;

    const isPurchaser = user?.id === transaction?.user?.id || user?.id === item?.purchasedById;
    const isRecipient = user?.id === item?.assignedToUserId;
    const isPendingClaim = item?.status === 'PENDING_CLAIM';
    const canViewQR = item?.isForMe || isRecipient || (isPurchaser && isPendingClaim);
    const isValidated = item?.status === 'VALIDATED';
    const isCancelled = item?.status === 'CANCELLED';
    const isDeniedAccess = isCancelled;

    const eventData = transaction?.event;
    const eventPast = eventData ? isEventPast(eventData.startDate) : false;
    const eventToday = eventData ? isEventToday(eventData.startDate) : false;

    const enrichedData = useMemo(() => {
        if (!item || !fullEvent) {
            return { zones: [] as string[], products: [] as string[], titularName: undefined as string | undefined };
        }

        let zones: string[] = [];
        let products: string[] = [];

        if (item.itemType === 'TICKET' && item.ticketId) {
            const ticket = item.ticket;
            const eventTicket = fullEvent.tickets?.find(t => t.id === item.ticketId);
            const source = eventTicket || ticket;
            if (source?.zones) zones = source.zones.map(z => z.name);
            if (source?.benefits) {
                products = source.benefits
                    .filter(b => b.type === 'PRODUCT')
                    .map(b => b.name);
            }
        } else if (item.itemType === 'GUESTLIST' && item.guestlistId) {
            const guestlist = item.guestlist;
            const eventGuestlist = fullEvent.guestlists?.find(g => g.id === item.guestlistId);
            const source = eventGuestlist || guestlist;
            if (source?.zones) zones = source.zones.map(z => z.name);
            if (source?.benefits) {
                products = source.benefits
                    .filter(b => b.type === 'PRODUCT')
                    .map(b => b.name);
            }
        } else if (item.itemType === 'RESERVATION' && item.reservationId) {
            const reservation = item.reservation;
            const eventReservation = fullEvent.reservations?.find(r => r.id === item.reservationId);
            const source = eventReservation || reservation;
            if (source?.zones) zones = source.zones.map(z => z.name);
            if (source?.benefits) {
                products = source.benefits
                    .filter(b => b.type === 'PRODUCT')
                    .map(b => b.name);
            }
        }

        let titularName: string | undefined;
        if (item.itemType === 'TICKET' || item.itemType === 'RESERVATION') {
            if (item.isForMe && user) {
                titularName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined;
            } else if (item.assignedToUser) {
                titularName = `${item.assignedToUser.firstName} ${item.assignedToUser.lastName}`.trim();
            }
        }

        return { zones, products, titularName };
    }, [item, fullEvent, user]);

    const accessTotal = item?.quantity || 1;
    const accessRemaining = useMemo(() => {
        if (!item) return 0;
        if (isValidated) return 0;
        if (item.status === 'CANCELLED' || item.status === 'TRANSFERRED') return 0;
        if (item.status === 'ACTIVE' || item.status === 'PENDING_CLAIM') return accessTotal;
        return accessTotal;
    }, [item, isValidated, accessTotal]);

    const dateDisplay = eventData
        ? eventToday
            ? t('wallet.today', 'Hoy')
            : formatEventDate(eventData.startDate, locale)
        : '';

    const timeDisplay = eventData?.startTime && eventData?.endTime
        ? `${eventData.startTime} - ${eventData.endTime}`
        : eventData?.startTime || '';

    const showMostrarKard = canViewQR && item?.walletAddress && !eventPast && !isCancelled;

    if (!isAnimating && !isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out overscroll-none touch-none ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`relative w-full max-w-[500px] max-h-[90vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="absolute top-0 left-0 right-0 h-[140px] z-20 pointer-events-none rounded-t-[32px]" style={{ background: 'linear-gradient(to bottom, #0a0a0a 0%, #0a0a0a 40%, rgba(10,10,10,0.85) 60%, rgba(10,10,10,0.4) 80%, transparent 100%)' }} />

                <div className="absolute top-0 left-1/2 -translate-x-1/2 pt-[5px] opacity-50 z-30">
                    <div className="w-9 h-[5px] bg-[#F6F6F6]/50 rounded-full" />
                </div>

                <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
                    <div>
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center justify-center size-9 bg-[#232323]/80 rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer backdrop-blur-sm"
                            >
                                <BackIcon />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                            className="flex items-center justify-center size-9 bg-[#232323]/80 rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer backdrop-blur-sm"
                        >
                            <ThreeDotsIcon />
                        </button>
                        <button
                            onClick={handleClose}
                            className="flex items-center justify-center size-9 bg-[#232323]/80 rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer backdrop-blur-sm"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className="relative flex flex-col overflow-y-auto max-h-[90vh] scrollbar-hide overscroll-contain touch-pan-y" style={{ paddingBottom: showMostrarKard ? '96px' : '32px' }}>
                    <div className="relative w-full h-[300px] shrink-0">
                        {eventData?.flyer && (
                            <img
                                src={eventData.flyer}
                                alt={eventData.name}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0a0a0a 40%)' }} />
                        <div className="absolute inset-0 backdrop-blur-[1.5px]" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.5) 40%)' }} />
                    </div>

                    {isLoading || !transaction || !item ? (
                        <ModalSkeleton />
                    ) : (
                        <div className="flex flex-col gap-8 px-6 -mt-20 relative z-10 pb-8">
                            {(eventPast || isCancelled) && (
                                <div className="flex justify-center">
                                    <div className={`px-2.5 py-1 rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] ${isCancelled ? 'bg-[#FF336D]/20' : 'bg-[#141414]'}`}>
                                        <span className={`text-[14px] font-borna ${isCancelled ? 'text-[#FF336D]' : 'text-[#939393]'}`}>
                                            {isCancelled
                                                ? `${t('item_detail.event_cancelled', 'Evento cancelado')} ❌`
                                                : `${t('item_detail.event_finished', 'Evento finalizado')}  👋`
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-[2px] pt-4">
                                <h2 className="text-[24px] font-borna font-semibold text-[#F6F6F6] text-center leading-tight w-full">
                                    {eventData?.name}
                                </h2>
                                <div className="flex items-center gap-1">
                                    <span className={`text-[14px] font-borna ${eventPast || isCancelled ? 'text-[#939393]' : 'text-[#E5FF88]'}`}>
                                        {dateDisplay}
                                    </span>
                                    {timeDisplay && (
                                        <>
                                            <span className={`size-[3px] rounded-full ${eventPast || isCancelled ? 'bg-[#939393]' : 'bg-[#E5FF88]'}`} />
                                            <span className={`text-[14px] font-borna ${eventPast || isCancelled ? 'text-[#939393]' : 'text-[#E5FF88]'}`}>
                                                {timeDisplay}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 py-px">
                                    <span className="text-[13px]">📍</span>
                                    <span className="text-[14px] font-borna text-[#939393]">
                                        {transaction.club?.address || transaction.club?.name}
                                    </span>
                                </div>
                            </div>

                            <EventTags
                                minimumAge={fullEvent?.minimumAge}
                                venueType={transaction.club?.venueType}
                                vibes={fullEvent?.vibes}
                                musics={fullEvent?.musics}
                            />

                            {item.itemType === 'GUESTLIST' && !isDeniedAccess && (
                                <p className="text-[14px] font-helvetica text-[#939393] text-center leading-relaxed">
                                    {t('item_detail.guestlist_disclaimer', 'Las guestlists no garantizan el acceso. Está sujeta a aforo y criterio del local.')}
                                </p>
                            )}

                            {isDeniedAccess && (
                                <p className="text-[14px] font-helvetica text-[#FF336D] text-center leading-relaxed">
                                    {t('item_detail.access_denied', 'Este acceso ha sido denegado por lo que ya no será posible acceder con el mismo al evento')}
                                </p>
                            )}

                            <TarifaCard
                                item={item}
                                zones={enrichedData.zones}
                                products={enrichedData.products}
                                titularName={enrichedData.titularName}
                                accessRemaining={accessRemaining}
                                accessTotal={accessTotal}
                            />

                            {!canViewQR && isPurchaser && item.assignedToUserId && (
                                <div className="flex flex-col items-center gap-3 p-6 bg-[#141414] border-2 border-[#232323] rounded-2xl">
                                    <div className="w-16 h-16 rounded-full bg-[#232323] flex items-center justify-center">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <p className="text-[14px] font-helvetica text-[#939393] text-center">
                                        {t('wallet.qr_transferred', 'Esta entrada ya está en la wallet del destinatario')}
                                    </p>
                                </div>
                            )}

                            <ActivitySection item={item} />

                            <OrganizerCard club={transaction.club} />

                            <PurchaseDetailCard
                                transaction={transaction}
                                item={item}
                            />

                            {transaction.club.address && transaction.club.addressLocation && (
                                <LocationCard
                                    address={transaction.club.address}
                                    coordinates={{
                                        lat: transaction.club.addressLocation.lat,
                                        lng: transaction.club.addressLocation.lng,
                                    }}
                                    title={t('item_detail.direction', 'Dirección')}
                                    onMapClick={() => {
                                        const loc = transaction.club.addressLocation;
                                        if (loc) window.open(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`, '_blank');
                                    }}
                                />
                            )}

                            <Link
                                to="/purchase-terms"
                                className="px-1.5 text-left"
                            >
                                <span className="text-[16px] font-borna font-medium text-[#939393]">
                                    {t('item_detail.terms_prefix', 'Ver los ')}{' '}
                                </span>
                                <span className="text-[12px] font-helvetica font-medium text-[#939393] underline">
                                    {t('item_detail.terms_link', 'Términos de uso y condiciones')}
                                </span>
                                <span className="text-[16px] font-borna font-medium text-[#939393]">
                                    {t('item_detail.terms_suffix', ' de la tarifa.')}
                                </span>
                            </Link>
                        </div>
                    )}
                </div>

                {showMostrarKard && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none" style={{ background: 'linear-gradient(to top, #0a0a0a 0%, #0a0a0a 40%, rgba(10,10,10,0.85) 60%, rgba(10,10,10,0.4) 80%, transparent 100%)', height: '140px' }}>
                        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pointer-events-auto">
                            <button
                                onClick={() => setShowPassbookModal(true)}
                                className="w-full h-[48px] bg-[#232323] rounded-full flex items-center justify-center cursor-pointer border-2 border-[#232323] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]"
                            >
                                <span className="text-[16px] font-borna font-medium text-[#F6F6F6]">
                                    {t('item_detail.show_kard', 'Mostrar Kard')}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {showOptionsMenu && (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center overscroll-none touch-none"
                        onClick={() => setShowOptionsMenu(false)}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <div
                            className="relative w-full max-w-[500px] bg-[#141414] border-2 border-[#232323] rounded-t-[32px] p-6 z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col gap-1 mb-4">
                                <button
                                    onClick={() => setShowOptionsMenu(false)}
                                    className="absolute top-6 right-6 flex items-center justify-center size-9 bg-[#232323] rounded-full cursor-pointer"
                                >
                                    <CloseIcon />
                                </button>
                                <h3 className="text-[18px] font-borna font-semibold text-[#F6F6F6]">
                                    {t('item_detail.rate_options', 'Opciones de la tarifa')}
                                </h3>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleReportIncident}
                                    className="w-full h-[44px] bg-[#232323] rounded-xl flex items-center justify-center cursor-pointer"
                                >
                                    <span className="text-[14px] font-helvetica font-medium text-[#F6F6F6]">
                                        {t('item_detail.report_incident', 'Reportar incidencia')}
                                    </span>
                                </button>
                                <button
                                    onClick={handleHideActivity}
                                    disabled={hideMutation.isPending}
                                    className="w-full h-[44px] bg-[#232323] rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-50"
                                >
                                    <span className="text-[14px] font-helvetica font-medium text-[#F6F6F6]">
                                        {hideMutation.isPending
                                            ? t('common.loading', 'Cargando...')
                                            : t('item_detail.hide_activity', 'Ocultar de mi actividad')
                                        }
                                    </span>
                                </button>
                                <button
                                    onClick={handleAddToCalendar}
                                    className="w-full h-[44px] bg-[#232323] rounded-xl flex items-center justify-center cursor-pointer"
                                >
                                    <span className="text-[14px] font-helvetica font-medium text-[#F6F6F6]">
                                        {t('item_detail.add_to_calendar', 'Añadir al calendario')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showPassbookModal && item?.walletAddress && transaction && (
                    <PassbookModal
                        isOpen={showPassbookModal}
                        onClose={() => setShowPassbookModal(false)}
                        walletAddress={item.walletAddress}
                        userId={user?.id || ''}
                        clubId={transaction.club.id}
                        clubName={transaction.club.name}
                        clubLogo={transaction.club.logo}
                        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                    />
                )}

                <IncidentModal
                    isOpen={showIncidentModal}
                    onClose={() => setShowIncidentModal(false)}
                    context={{
                        eventName: transaction?.event?.name,
                        transactionId,
                    }}
                />
            </div>
        </div>
    );
};

export default ItemDetailModal;
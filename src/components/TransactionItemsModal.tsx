import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import ItemDetailModal from '@/components/ItemDetailModal';

interface TransactionItem {
    id: string;
    itemType: 'TICKET' | 'GUESTLIST' | 'RESERVATION' | 'PRODUCT' | 'PROMOTION';
    status: 'ACTIVE' | 'PENDING_CLAIM' | 'TRANSFERRED' | 'VALIDATED' | 'CANCELLED';
    quantity: number;
    unitPrice: number;
    subtotal: number;
    isForMe: boolean;
    ticket?: { id: string; name: string } | null;
    guestlist?: { id: string; name: string } | null;
    reservation?: { id: string; name: string; partySize?: number } | null;
    product?: { id: string; name: string } | null;
    promotion?: { id: string; name: string } | null;
    ticketPrice?: { id: string; name: string } | null;
    guestlistPrice?: { id: string; name: string } | null;
}

interface Transaction {
    id: string;
    event: {
        id: string;
        name: string;
        slug: string;
        flyer: string;
        startDate: string;
        startTime?: string;
        endTime?: string;
    };
    club: {
        id: string;
        name: string;
        slug: string;
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

interface TransactionItemsModalProps {
    transactionId: string;
    isOpen: boolean;
    onClose: () => void;
}

const isEventToday = (startDate: string): boolean => {
    return dayjs(startDate).isSame(dayjs(), 'day');
};

const formatEventDate = (dateString: string, locale: string): string => {
    const date = dayjs(dateString).locale(locale);
    return date.format('ddd, D MMMM');
};

const formatEventTimeRange = (startTime?: string, endTime?: string): string => {
    if (startTime && endTime) {
        return `${startTime} - ${endTime}`;
    }
    return '';
};

const getItemName = (item: TransactionItem): string => {
    if (item.ticket?.name) return item.ticket.name;
    if (item.guestlist?.name) return item.guestlist.name;
    if (item.reservation?.name) return `${item.reservation.name}:`;
    if (item.product?.name) return item.product.name;
    if (item.promotion?.name) return item.promotion.name;
    if (item.ticketPrice?.name) return item.ticketPrice.name;
    if (item.guestlistPrice?.name) return item.guestlistPrice.name;
    return 'Item';
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

const TicketIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M2 9V7C2 5.89543 2.89543 5 4 5H20C21.1046 5 22 5.89543 22 7V9C20.8954 9 20 9.89543 20 11C20 12.1046 20.8954 13 22 13V15C22 16.1046 21.1046 17 20 17H4C2.89543 17 2 16.1046 2 15V13C3.10457 13 4 12.1046 4 11C4 9.89543 3.10457 9 2 9Z" stroke="#939393" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const GuestlistIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="#939393" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="#939393" strokeWidth="1.5" />
        <path d="M9 12H15" stroke="#939393" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 16H12" stroke="#939393" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const ReservationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 3V21M12 3C7.02944 3 3 7.02944 3 12H12V3ZM12 3C16.9706 3 21 7.02944 21 12H12V3Z" stroke="#939393" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ProductIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M8 21H6C4.89543 21 4 20.1046 4 19V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H16" stroke="#939393" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 21V11" stroke="#939393" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 11H16" stroke="#939393" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const PromoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#939393" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const getItemIcon = (itemType: string) => {
    switch (itemType) {
        case 'TICKET':
            return <TicketIcon />;
        case 'GUESTLIST':
            return <GuestlistIcon />;
        case 'RESERVATION':
            return <ReservationIcon />;
        case 'PRODUCT':
            return <ProductIcon />;
        case 'PROMOTION':
            return <PromoIcon />;
        default:
            return <TicketIcon />;
    }
};

const PersonIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="rgba(246,246,246,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="rgba(246,246,246,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface ItemRowProps {
    item: TransactionItem;
    onClick: () => void;
}

const ItemRow = ({ item, onClick }: ItemRowProps) => {
    const dotColor = getItemTypeDotColor(item.itemType);
    const itemName = getItemName(item);
    const isReservation = item.itemType === 'RESERVATION';
    const partySize = item.reservation?.partySize;

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 w-full p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
        >
            <div className="flex items-center justify-center size-12 bg-[rgba(35,35,35,0.5)] border-[1.5px] border-[#232323] rounded-[4px] shrink-0">
                {getItemIcon(item.itemType)}
            </div>

            <div className="flex flex-1 items-center gap-1 py-2">
                <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: dotColor }}
                />
                <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                    {itemName}
                </span>
                <span className="text-[16px] font-helvetica font-bold text-[#F6F6F6]">
                    x{item.quantity}
                </span>
            </div>

            {isReservation && partySize && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    <span className="text-[16px] font-helvetica font-medium text-[rgba(246,246,246,0.5)]">
                        {partySize}
                    </span>
                    <PersonIcon />
                </div>
            )}
        </button>
    );
};

const ModalSkeleton = () => (
    <div className="flex flex-col gap-8 px-6 -mt-20 relative z-10 pb-8">
        <div className="flex flex-col items-center gap-2 pt-4 animate-pulse">
            <div className="h-7 w-48 bg-[#232323] rounded" />
            <div className="h-4 w-32 bg-[#232323] rounded" />
            <div className="h-4 w-24 bg-[#232323] rounded" />
        </div>
        <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-6 w-40 bg-[#232323] rounded" />
            <div className="flex flex-col gap-2">
                <div className="h-[72px] w-full bg-[#232323] rounded-2xl" />
                <div className="h-[72px] w-full bg-[#232323] rounded-2xl" />
            </div>
        </div>
    </div>
);

const TransactionItemsModal = ({ transactionId, isOpen, onClose }: TransactionItemsModalProps) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [showItemDetail, setShowItemDetail] = useState(false);

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
            setShowItemDetail(false);
            setSelectedItemId(null);
            document.body.style.overflow = '';
            onClose();
        }, 300);
    };

    useEffect(() => {
        if (transaction && transaction.items?.length === 1 && !showItemDetail) {
            const singleItem = transaction.items[0];
            setSelectedItemId(singleItem.id);
            setShowItemDetail(true);
        }
    }, [transaction, showItemDetail]);

    const handleItemClick = (itemId: string) => {
        setSelectedItemId(itemId);
        setShowItemDetail(true);
    };

    const handleItemDetailClose = () => {
        handleClose();
    };

    const handleItemDetailBack = () => {
        if (transaction && transaction.items?.length > 1) {
            setShowItemDetail(false);
            setSelectedItemId(null);
        } else {
            handleClose();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (showItemDetail && selectedItemId) {
        return (
            <ItemDetailModal
                transactionId={transactionId}
                itemId={selectedItemId}
                isOpen={true}
                onClose={handleItemDetailClose}
                onBack={transaction && transaction.items?.length > 1 ? handleItemDetailBack : undefined}
            />
        );
    }

    if (!isAnimating && !isOpen) return null;

    const event = transaction?.event;
    const items = transaction?.items || [];
    const club = transaction?.club;

    const dateDisplay = event
        ? isEventToday(event.startDate)
            ? t('wallet.today', 'Hoy')
            : formatEventDate(event.startDate, locale)
        : '';
    const timeDisplay = event ? formatEventTimeRange(event.startTime, event.endTime) : '';

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`relative w-full max-w-[500px] max-h-[90vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 pt-[5px] z-20">
                    <div className="w-9 h-[5px] bg-[#F6F6F6]/50 rounded-full" />
                </div>

                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={handleClose}
                        className="flex items-center justify-center size-9 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[90vh] scrollbar-hide">
                    <div className="relative w-full h-[300px] shrink-0">
                        {event?.flyer && (
                            <img
                                src={event.flyer}
                                alt={event.name}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}
                        <div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0a0a0a 40%)' }}
                        />
                        <div
                            className="absolute inset-0 backdrop-blur-[1.5px]"
                            style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.5) 40%)' }}
                        />
                    </div>

                    {isLoading || !transaction ? (
                        <ModalSkeleton />
                    ) : (
                        <div className="flex flex-col gap-8 px-6 -mt-20 relative z-10 pb-8">
                            <div className="flex flex-col items-center gap-[2px] pt-4">
                                <h2 className="text-[24px] font-borna font-semibold text-[#F6F6F6] text-center leading-tight w-full">
                                    {event?.name}
                                </h2>
                                <div className="flex items-center gap-1">
                                    <span className="text-[14px] font-borna text-[#E5FF88]">
                                        {dateDisplay}
                                    </span>
                                    {timeDisplay && (
                                        <>
                                            <span className="size-[3px] bg-[#E5FF88] rounded-full" />
                                            <span className="text-[14px] font-borna text-[#E5FF88]">
                                                {timeDisplay}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 py-px">
                                    <span className="text-[13px]">📍</span>
                                    <span className="text-[14px] font-helvetica text-[#939393]">
                                        {club?.address || club?.name}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="px-1.5">
                                    <h3 className="text-[24px] font-borna font-semibold text-[#FF336D]">
                                        {t('wallet.for_this_event', 'Para este evento')}
                                    </h3>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {items.map((item) => (
                                        <ItemRow
                                            key={item.id}
                                            item={item}
                                            onClick={() => handleItemClick(item.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionItemsModal;
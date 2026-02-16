import { useEffect, useMemo, useState } from 'react';
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
    validatedAt?: string | null;
    ticket?: { id: string; name: string } | null;
    guestlist?: { id: string; name: string } | null;
    reservation?: { id: string; name: string; partySize?: number } | null;
    product?: { id: string; name: string } | null;
    promotion?: { id: string; name: string } | null;
    ticketPrice?: { id: string; name: string } | null;
    guestlistPrice?: { id: string; name: string } | null;
    _transactionId?: string;
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
    transactionIds: string[];
    isOpen: boolean;
    onClose: () => void;
}

type ItemType = TransactionItem['itemType'];

interface GroupedRate {
    rateName: string;
    itemType: ItemType;
    items: TransactionItem[];
    totalCapacity: number;
    usedCapacity: number;
    isFullyConsumed: boolean;
    hasPartialConsumption: boolean;
}

const isEventToday = (startDate: string): boolean => {
    return dayjs(startDate).isSame(dayjs(), 'day');
};

const formatEventDate = (dateString: string, locale: string): string => {
    const date = dayjs(dateString).locale(locale);
    return date.format('ddd., D MMMM');
};

const formatEventTimeRange = (startTime?: string, endTime?: string): string => {
    if (startTime && endTime) return `${startTime} - ${endTime}`;
    return '';
};

const getRateName = (item: TransactionItem): string => {
    if (item.ticket?.name) return item.ticket.name;
    if (item.guestlist?.name) return item.guestlist.name;
    if (item.reservation?.name) return item.reservation.name;
    if (item.product?.name) return item.product.name;
    if (item.promotion?.name) return item.promotion.name;
    if (item.ticketPrice?.name) return item.ticketPrice.name;
    if (item.guestlistPrice?.name) return item.guestlistPrice.name;
    return 'Item';
};

const getItemTypeDotColor = (itemType: ItemType): string => {
    switch (itemType) {
        case 'TICKET': return '#D591FF';
        case 'GUESTLIST': return '#FFCE1F';
        case 'RESERVATION': return '#3FE8E8';
        case 'PROMOTION': return '#FF336D';
        case 'PRODUCT': return '#00D1FF';
        default: return '#939393';
    }
};

const isAccessType = (itemType: ItemType): boolean =>
    itemType === 'TICKET' || itemType === 'GUESTLIST' || itemType === 'RESERVATION';

const isProductType = (itemType: ItemType): boolean =>
    itemType === 'PRODUCT' || itemType === 'PROMOTION';

const getItemCapacity = (item: TransactionItem): number => {
    if (item.reservation?.partySize) return item.reservation.partySize;
    return item.quantity;
};

const isItemConsumed = (item: TransactionItem): boolean =>
    item.status === 'VALIDATED' || !!item.validatedAt;

const PersonXsIcon = () => (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" style={{ width: '11.441px', height: '12.722px' }}>
        <path
            d="M10.441 12.222V11.055C10.441 10.432 10.1935 9.834 9.7529 9.39341C9.31231 8.95282 8.71452 8.70532 8.09153 8.70532H3.39135C2.76836 8.70532 2.17058 8.95282 1.72999 9.39341C1.2894 9.834 1.0419 10.432 1.0419 11.055V12.222"
            stroke="rgba(246,246,246,0.5)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
            d="M5.74109 6.35563C7.03908 6.35563 8.09119 5.30352 8.09119 4.00553C8.09119 2.70754 7.03908 1.65543 5.74109 1.65543C4.4431 1.65543 3.39099 2.70754 3.39099 4.00553C3.39099 5.30352 4.4431 6.35563 5.74109 6.35563Z"
            stroke="rgba(246,246,246,0.5)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
    </svg>
);

const ChevronRightIcon = ({ color = '#939393' }: { color?: string }) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
        <path d="M7.5 15L12.5 10L7.5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

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

const GroupGuestlistIcon = () => (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
        <rect x="18" y="10" width="54" height="70" rx="8" stroke="#939393" strokeWidth="2.5" />
        <path d="M34 10V6C34 3.79086 35.7909 2 38 2H52C54.2091 2 56 3.79086 56 6V10" stroke="#939393" strokeWidth="2.5" />
        <path d="M33 34L41 42L57 26" stroke="#50DD77" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M33 58L41 66L57 50" stroke="#50DD77" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const GroupTicketIcon = () => (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
        <path d="M8 34V26C8 21.5817 11.5817 18 16 18H74C78.4183 18 82 21.5817 82 26V34C77.5817 34 74 37.5817 74 42C74 46.4183 77.5817 50 82 50V58C82 62.4183 78.4183 66 74 66H16C11.5817 66 8 62.4183 8 58V50C12.4183 50 16 46.4183 16 42C16 37.5817 12.4183 34 8 34Z" stroke="#939393" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 30V54" stroke="#939393" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 6" />
    </svg>
);

const GroupReservationIcon = () => (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
        <circle cx="45" cy="45" r="34" stroke="#939393" strokeWidth="2.5" />
        <path d="M45 22V45L60 53" stroke="#939393" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const getGroupIcon = (itemType: ItemType) => {
    switch (itemType) {
        case 'GUESTLIST': return <GroupGuestlistIcon />;
        case 'TICKET': return <GroupTicketIcon />;
        case 'RESERVATION': return <GroupReservationIcon />;
        default: return <GroupGuestlistIcon />;
    }
};

interface CapacityPillProps {
    used: number;
    total: number;
    showUsed: boolean;
    showPerson?: boolean;
}

const CapacityPill = ({ used, total, showUsed, showPerson = true }: CapacityPillProps) => (
    <div className="flex gap-[4px] items-center justify-center bg-[#232323] border-[1.5px] border-solid border-[#232323] rounded-[25px] px-[8px] py-[4px] min-w-[29px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] shrink-0 relative">
        <div className="flex gap-[2px] items-center shrink-0 relative">
            <div className="flex flex-col font-borna justify-center leading-[0] shrink-0 text-[#939393] text-[14px] text-center whitespace-nowrap relative">
                <p className="leading-[20px]">{showUsed ? `${used}/${total}` : total}</p>
            </div>
        </div>
        {showPerson && (
            <div className="flex flex-col h-[16px] items-center justify-center shrink-0 relative">
                <PersonXsIcon />
            </div>
        )}
    </div>
);

interface RateGroupCardProps {
    group: GroupedRate;
    onClick: () => void;
    isBenefit?: boolean;
}

const RateGroupCard = ({ group, onClick, isBenefit = false }: RateGroupCardProps) => {
    const { t } = useTranslation();
    const dotColor = getItemTypeDotColor(group.itemType);
    const isGrouped = group.items.length > 1;
    const showUsedCapacity = group.hasPartialConsumption || group.isFullyConsumed;
    const isProduct = isProductType(group.itemType);
    const chevronColor = (showUsedCapacity && !group.isFullyConsumed) ? '#FF336D' : '#939393';

    const getSubtitle = (): string | null => {
        if (!isGrouped) return null;
        const count = group.items.length;
        if (group.itemType === 'GUESTLIST') return `${count} ${t('transaction.lists', 'listas')}`;
        if (group.itemType === 'TICKET') return `${count} ${t('transaction.tickets_count', 'entradas')}`;
        if (group.itemType === 'RESERVATION') return `${count} ${t('transaction.reservations_count', 'reservas')}`;
        return `${count} ${t('transaction.items_count', 'items')}`;
    };

    const subtitle = getSubtitle();

    return (
        <button
            onClick={onClick}
            className={`flex gap-[8px] items-center w-full pl-[16px] pr-[12px] py-[12px] bg-[#141414] border-2 border-solid border-[#232323] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer text-left transition-opacity ${group.isFullyConsumed ? 'opacity-50' : 'opacity-100'}`}
        >
            <div className="flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative">
                <div className="flex gap-[4px] items-center shrink-0 w-full relative">
                    <div
                        className="relative shrink-0 size-[6px] rounded-full"
                        style={{ backgroundColor: dotColor }}
                    />
                    {isBenefit ? (
                        <div
                            className="flex flex-[1_0_0] flex-col font-borna font-medium justify-center leading-[0] min-h-px min-w-px overflow-hidden relative text-[16px] text-ellipsis whitespace-nowrap"
                            style={{
                                backgroundImage: 'linear-gradient(180deg, #978061 25%, #7F6649 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            <p className="leading-[24px] overflow-hidden">{group.rateName}</p>
                        </div>
                    ) : (
                        <div className="flex flex-[1_0_0] flex-col font-borna font-medium justify-center leading-[0] min-h-px min-w-px overflow-hidden relative text-[#F6F6F6] text-[16px] text-ellipsis whitespace-nowrap">
                            <p className="leading-[24px] overflow-hidden">{group.rateName}</p>
                        </div>
                    )}
                </div>
                {subtitle && (
                    <div className="flex flex-col font-borna justify-center leading-[0] relative shrink-0 text-[#939393] text-[14px] text-justify w-full">
                        <p className="leading-[20px] whitespace-pre-wrap">{subtitle}</p>
                    </div>
                )}
            </div>

            <CapacityPill
                used={group.usedCapacity}
                total={group.totalCapacity}
                showUsed={showUsedCapacity}
                showPerson={!isProduct}
            />

            <ChevronRightIcon color={chevronColor} />
        </button>
    );
};

interface IndividualItemCardProps {
    item: TransactionItem;
    index: number;
    totalInGroup: number;
    onClick: () => void;
}

const IndividualItemCard = ({ item, index, totalInGroup, onClick }: IndividualItemCardProps) => {
    const dotColor = getItemTypeDotColor(item.itemType);
    const rateName = getRateName(item);
    const capacity = getItemCapacity(item);
    const consumed = isItemConsumed(item);
    const displayName = totalInGroup > 1 ? `${rateName} #${index + 1}` : rateName;
    const chevronColor = consumed ? '#FF336D' : '#939393';

    return (
        <button
            onClick={onClick}
            className={`flex gap-[8px] items-center w-full pl-[16px] pr-[12px] py-[12px] bg-[#141414] border-2 border-solid border-[#232323] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer text-left transition-opacity ${consumed ? 'opacity-50' : 'opacity-100'}`}
        >
            <div className="flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative">
                <div className="flex gap-[4px] items-center shrink-0 w-full relative">
                    <div
                        className="relative shrink-0 size-[6px] rounded-full"
                        style={{ backgroundColor: dotColor }}
                    />
                    <div className="flex flex-[1_0_0] flex-col font-borna font-medium justify-center leading-[0] min-h-px min-w-px overflow-hidden relative text-[#F6F6F6] text-[16px] text-ellipsis whitespace-nowrap">
                        <p className="leading-[24px] overflow-hidden">{displayName}</p>
                    </div>
                </div>
            </div>

            <CapacityPill
                used={consumed ? 0 : capacity}
                total={capacity}
                showUsed={consumed}
            />

            <ChevronRightIcon color={chevronColor} />
        </button>
    );
};

interface RateDetailViewProps {
    group: GroupedRate;
    onBack: () => void;
    onClose: () => void;
    onItemClick: (itemId: string) => void;
}

const RateDetailView = ({ group, onBack, onClose, onItemClick }: RateDetailViewProps) => {
    const sortedItems = useMemo(() => {
        return [...group.items].sort((a, b) => {
            const aConsumed = isItemConsumed(a);
            const bConsumed = isItemConsumed(b);
            if (aConsumed && !bConsumed) return 1;
            if (!aConsumed && bConsumed) return -1;
            return 0;
        });
    }, [group.items]);

    return (
        <div className="flex flex-col items-center w-full pt-[24px] pb-[32px] px-[24px]">
            <div className="flex items-start justify-between w-full h-[36px]">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center size-[36px] bg-[#232323] rounded-[36px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                >
                    <BackIcon />
                </button>
                <button
                    onClick={onClose}
                    className="flex items-center justify-center size-[36px] bg-[#232323] rounded-[36px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                >
                    <CloseIcon />
                </button>
            </div>

            <div className="flex flex-col items-center gap-[16px] pt-[52px] pb-[24px] w-full">
                <div className="flex items-center justify-center size-[90px]">
                    {getGroupIcon(group.itemType)}
                </div>
                <h2 className="font-borna font-semibold text-[24px] text-[#F6F6F6] text-center leading-normal">
                    {group.rateName}
                </h2>
            </div>

            <div className="flex flex-col gap-[8px] w-full">
                {sortedItems.map((item, index) => (
                    <IndividualItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        totalInGroup={group.items.length}
                        onClick={() => onItemClick(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};

const ModalSkeleton = () => (
    <div className="flex flex-col gap-[32px] relative z-10 pb-[32px]" style={{ width: '342px', margin: '0 auto' }}>
        <div className="flex flex-col items-center gap-[2px] pt-[16px] animate-pulse">
            <div className="h-[28px] w-[200px] bg-[#232323] rounded" />
            <div className="h-[20px] w-[140px] bg-[#232323] rounded mt-[2px]" />
            <div className="h-[20px] w-[180px] bg-[#232323] rounded mt-[2px]" />
        </div>
        <div className="flex flex-col gap-[16px] animate-pulse">
            <div className="h-[24px] w-[80px] bg-[#232323] rounded ml-[6px]" />
            <div className="flex flex-col gap-[8px]">
                <div className="h-[52px] w-full bg-[#141414] border-2 border-[#232323] rounded-[16px]" />
                <div className="h-[52px] w-full bg-[#141414] border-2 border-[#232323] rounded-[16px]" />
                <div className="h-[52px] w-full bg-[#141414] border-2 border-[#232323] rounded-[16px]" />
            </div>
        </div>
    </div>
);

const Grabber = () => (
    <div className="absolute left-1/2 -translate-x-1/2 top-[-2px] flex flex-col items-start h-[16px] pt-[5px] opacity-50">
        <div className="w-[36px] h-[5px] bg-[#333] rounded-[100px] mix-blend-plus-lighter" />
    </div>
);

const TransactionItemsModal = ({ transactionIds, isOpen, onClose }: TransactionItemsModalProps) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [showItemDetail, setShowItemDetail] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupedRate | null>(null);

    const { data: transaction, isLoading } = useQuery({
        queryKey: ['transactions-merged', ...transactionIds],
        queryFn: async () => {
            const results = await Promise.all(
                transactionIds.map((id) =>
                    axiosInstance
                        .get<BackendResponse>(`/v2/transactions/${id}`)
                        .then((res) => {
                            const d = res.data.data;
                            return (
                                (d as unknown as { transaction?: Transaction }).transaction || d
                            ) as Transaction;
                        })
                )
            );

            const first = results[0];
            if (!first) return null;

            const allItems: TransactionItem[] = results.flatMap((tx, idx) =>
                (tx.items || []).map((item) => ({
                    ...item,
                    _transactionId: transactionIds[idx],
                }))
            );

            return {
                ...first,
                items: allItems,
            } as Transaction;
        },
        enabled: isOpen && transactionIds.length > 0,
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
            setSelectedGroup(null);
            document.body.style.overflow = '';
            onClose();
        }, 300);
    };

    const { accessGroups, productGroups } = useMemo(() => {
        const items = transaction?.items || [];
        const accessItems = items.filter((item) => isAccessType(item.itemType));
        const productItems = items.filter((item) => isProductType(item.itemType));

        const groupByRate = (itemsList: TransactionItem[]): GroupedRate[] => {
            const map = new Map<string, TransactionItem[]>();
            for (const item of itemsList) {
                const key = `${item.itemType}::${getRateName(item)}`;
                const existing = map.get(key);
                if (existing) {
                    existing.push(item);
                } else {
                    map.set(key, [item]);
                }
            }

            const groups: GroupedRate[] = [];
            for (const [, groupItems] of map) {
                const firstItem = groupItems[0];
                const totalCapacity = groupItems.reduce((sum, item) => sum + getItemCapacity(item), 0);
                const usedCapacity = groupItems.reduce((sum, item) => {
                    if (isItemConsumed(item)) return sum + getItemCapacity(item);
                    return sum;
                }, 0);
                const allConsumed = groupItems.every((item) => isItemConsumed(item));
                const someConsumed = groupItems.some((item) => isItemConsumed(item));

                groups.push({
                    rateName: getRateName(firstItem),
                    itemType: firstItem.itemType,
                    items: groupItems,
                    totalCapacity,
                    usedCapacity,
                    isFullyConsumed: allConsumed,
                    hasPartialConsumption: someConsumed && !allConsumed,
                });
            }

            return groups.sort((a, b) => {
                if (a.isFullyConsumed && !b.isFullyConsumed) return 1;
                if (!a.isFullyConsumed && b.isFullyConsumed) return -1;
                return 0;
            });
        };

        return {
            accessGroups: groupByRate(accessItems),
            productGroups: groupByRate(productItems),
        };
    }, [transaction]);

    useEffect(() => {
        if (transaction && transaction.items?.length === 1 && !showItemDetail && !selectedGroup) {
            const singleItem = transaction.items[0];
            setSelectedItemId(singleItem.id);
            setShowItemDetail(true);
        }
    }, [transaction, showItemDetail, selectedGroup]);

    const handleGroupClick = (group: GroupedRate) => {
        if (group.items.length === 1) {
            setSelectedItemId(group.items[0].id);
            setShowItemDetail(true);
        } else {
            setSelectedGroup(group);
        }
    };

    const handleItemClick = (itemId: string) => {
        setSelectedItemId(itemId);
        setShowItemDetail(true);
    };

    const handleItemDetailClose = () => {
        handleClose();
    };

    const handleItemDetailBack = () => {
        if (selectedGroup) {
            setShowItemDetail(false);
            setSelectedItemId(null);
        } else if (transaction && transaction.items?.length > 1) {
            setShowItemDetail(false);
            setSelectedItemId(null);
            setSelectedGroup(null);
        } else {
            handleClose();
        }
    };

    const handleGroupBack = () => {
        setSelectedGroup(null);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) handleClose();
    };

    if (showItemDetail && selectedItemId) {
        const hasMultipleItems = (transaction?.items?.length ?? 0) > 1;
        const selectedItem = transaction?.items?.find((i) => i.id === selectedItemId);
        const itemTransactionId = selectedItem?._transactionId || transactionIds[0];
        return (
            <ItemDetailModal
                transactionId={itemTransactionId}
                itemId={selectedItemId}
                isOpen={true}
                onClose={handleItemDetailClose}
                onBack={hasMultipleItems ? handleItemDetailBack : undefined}
            />
        );
    }

    if (!isAnimating && !isOpen) return null;

    const event = transaction?.event;
    const club = transaction?.club;
    const dateDisplay = event
        ? isEventToday(event.startDate)
            ? t('wallet.today', 'Hoy')
            : formatEventDate(event.startDate, locale)
        : '';
    const timeDisplay = event ? formatEventTimeRange(event.startTime, event.endTime) : '';
    const hasMultipleItems = (transaction?.items?.length ?? 0) > 1;

    if (selectedGroup) {
        return (
            <div
                className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
                onClick={handleBackdropClick}
            >
                <div
                    className={`relative w-full max-w-[500px] max-h-[80dvh] bg-[#0a0a0a] border-2 border-solid border-[#232323] rounded-t-[32px] overflow-hidden transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                >
                    <Grabber />
                    <div className="overflow-y-auto max-h-[calc(80dvh-2px)] scrollbar-hide">
                        <RateDetailView
                            group={selectedGroup}
                            onBack={handleGroupBack}
                            onClose={handleClose}
                            onItemClick={handleItemClick}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`relative w-full max-w-[500px] max-h-[80dvh] bg-[#0a0a0a] border-2 border-solid border-[#232323] rounded-t-[32px] overflow-clip transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <Grabber />

                <div className="overflow-y-auto max-h-[80dvh] scrollbar-hide">
                    <div className="relative pt-[24px] px-[24px]">
                        {/* bg: flyer + gradients */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-[-2px] w-full h-[489px] overflow-hidden">
                            {event?.flyer && (
                                <img
                                    src={event.flyer}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                />
                            )}
                            <div
                                className="absolute inset-0"
                                style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0) 0%, #0a0a0a 40%)' }}
                            />
                            <div
                                className="absolute inset-0 backdrop-blur-[1.5px]"
                                style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.5) 40%)' }}
                            />
                        </div>

                        {/* navigation-buttons */}
                        <div className="relative flex items-start justify-between h-[36px]">
                            <div className="flex flex-[1_0_0] flex-col items-end justify-center min-h-px min-w-px">
                                <button
                                    onClick={handleClose}
                                    className="flex items-center justify-center size-[36px] bg-[#232323] rounded-[36px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer shrink-0"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        {/* content */}
                        {isLoading || !transaction ? (
                            <div className="relative pt-[90px]">
                                <ModalSkeleton />
                            </div>
                        ) : (
                            <div className="relative flex flex-col gap-[32px] items-start pt-[90px] pb-[32px]" style={{ width: '342px', margin: '0 auto' }}>
                                {/* title-event */}
                                <div className="flex flex-col gap-[2px] items-center justify-end pt-[16px] w-full">
                                    <p className="font-borna font-semibold text-[24px] text-[#F6F6F6] text-center leading-normal w-full">
                                        {event?.name}
                                    </p>
                                    <div className="flex gap-[4px] items-center justify-center w-full">
                                        <span className="font-borna text-[14px] text-[#E5FF88] leading-[20px] whitespace-nowrap overflow-hidden text-ellipsis">
                                            {dateDisplay}
                                        </span>
                                        {timeDisplay && (
                                            <>
                                                <span className="size-[3px] bg-[#E5FF88] rounded-full shrink-0" />
                                                <span className="font-borna text-[14px] text-[#E5FF88] leading-[20px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {timeDisplay}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex gap-[6px] items-center justify-center py-px w-full">
                                        <span className="flex items-center justify-center pt-[2px] w-[4px]">
                                            <span className="font-helvetica font-medium text-[13px] text-[#F6F6F6] leading-normal overflow-hidden whitespace-nowrap text-ellipsis">📍</span>
                                        </span>
                                        <span className="font-borna text-[14px] text-[#939393] leading-[20px] overflow-hidden whitespace-nowrap text-ellipsis">
                                            {club?.address || club?.name}
                                        </span>
                                    </div>
                                </div>

                                {/* description text */}
                                {hasMultipleItems && (
                                    <div className="flex gap-[2px] items-center px-[6px] w-full">
                                        <span className="flex-[1_0_0] min-h-px min-w-px font-borna font-medium text-[16px] text-[#939393] leading-[24px]">
                                            {t('transaction.passbook_description', 'Todo en un mismo Passbook: accesos y consumos.')}
                                        </span>
                                    </div>
                                )}

                                {/* contenido: sections */}
                                <div className="flex flex-col gap-[24px] items-start w-full">
                                    {/* Accesos section */}
                                    {accessGroups.length > 0 && (
                                        <div className="flex flex-col gap-[16px] items-start w-full">
                                            <div className="flex items-end justify-between px-[6px] w-full">
                                                <div className="flex flex-[1_0_0] items-center min-h-px min-w-px">
                                                    <span className="font-borna font-semibold text-[20px] text-[#FF336D] leading-normal overflow-hidden whitespace-nowrap text-ellipsis">
                                                        {t('transaction.accesses', 'Accesos')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-[8px] items-start w-full">
                                                {accessGroups.map((group) => (
                                                    <RateGroupCard
                                                        key={`${group.itemType}-${group.rateName}`}
                                                        group={group}
                                                        onClick={() => handleGroupClick(group)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Productos section */}
                                    {productGroups.length > 0 && (
                                        <div className="flex flex-col gap-[16px] items-start w-full">
                                            <div className="flex items-end justify-between px-[6px] w-full">
                                                <div className="flex flex-[1_0_0] items-center min-h-px min-w-px">
                                                    <span className="font-borna font-semibold text-[20px] text-[#FF336D] leading-normal overflow-hidden whitespace-nowrap text-ellipsis">
                                                        {t('transaction.products', 'Productos')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-[8px] items-start w-full">
                                                {productGroups.map((group) => (
                                                    <RateGroupCard
                                                        key={`${group.itemType}-${group.rateName}`}
                                                        group={group}
                                                        onClick={() => handleGroupClick(group)}
                                                        isBenefit={group.itemType === 'PROMOTION'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionItemsModal;
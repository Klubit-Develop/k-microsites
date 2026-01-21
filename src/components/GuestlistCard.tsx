import { useTranslation } from 'react-i18next';

interface GuestlistPrice {
    id: string;
    name: string;
    netPrice: number;
    finalPrice: number;
    currency: string;
    isActive: boolean;
    maxQuantity: number | null;
    soldQuantity: number;
    isSoldOut: boolean;
}

interface Guestlist {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    maxPerUser: number;
    maxPersonsPerGuestlist: number;
    ageRequired: string;
    termsAndConditions: string | null;
    isTransferable: boolean;
    isActive: boolean;
    gendersRequired?: string[];
    accessLevel?: string;
    prices: GuestlistPrice[];
    zones?: Array<{ id: string; name: string }>;
    benefits?: Array<{ id: string; name: string; type?: string }>;
}

interface GuestlistCardProps {
    guestlist: Guestlist;
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onMoreInfo?: (guestlist: Guestlist, price: GuestlistPrice) => void;
    isLoading?: boolean;
    className?: string;
}

const MinusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10H16" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10H16" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 4V16" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const GuestlistCard = ({
    guestlist,
    selectedQuantities,
    onQuantityChange,
    onMoreInfo,
    isLoading = false,
    className = '',
}: GuestlistCardProps) => {
    const { t } = useTranslation();

    const GUESTLIST_COLOR = '#ffce1f';

    if (isLoading) {
        return (
            <div className={`relative flex flex-col bg-[#141414] border-2 border-[#232323] rounded-[16px] w-full overflow-visible animate-pulse ${className}`}>
                <div
                    className="absolute right-[152px] top-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-b-full z-10"
                    style={{
                        borderLeft: '2px solid #232323',
                        borderRight: '2px solid #232323',
                        borderBottom: '2px solid #232323',
                    }}
                />

                <div
                    className="absolute right-[152px] bottom-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-t-full z-10"
                    style={{
                        borderLeft: '2px solid #232323',
                        borderRight: '2px solid #232323',
                        borderTop: '2px solid #232323',
                    }}
                />

                <div className="absolute right-[160px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

                <div className="flex items-center h-[56px] px-[16px] border-b-[1.5px] border-[#232323]">
                    <div className="h-5 w-32 bg-[#232323] rounded" />
                </div>

                <div className="flex items-center justify-between px-[16px] py-[12px]">
                    <div className="flex flex-col gap-[10px]">
                        <div className="h-5 w-20 bg-[#232323] rounded" />
                        <div className="h-4 w-24 bg-[#232323] rounded" />
                    </div>
                    <div className="flex items-center gap-[6px]">
                        <div className="w-[36px] h-[36px] bg-[#232323] rounded-[8px]" />
                        <div className="w-[32px] h-6 bg-[#232323] rounded" />
                        <div className="w-[36px] h-[36px] bg-[#232323] rounded-[8px]" />
                    </div>
                </div>
            </div>
        );
    }

    const maxPerUser = guestlist.maxPerUser || 1;

    const getAvailability = (price: GuestlistPrice): number => {
        if (price.isSoldOut) return 0;
        if (price.maxQuantity === null) return maxPerUser;
        return Math.max(0, price.maxQuantity - price.soldQuantity);
    };

    const isGuestlistSoldOut = guestlist.prices?.every(price => {
        const available = getAvailability(price);
        return available <= 0;
    });

    const hasSelectedQuantity = guestlist.prices?.some(
        price => (selectedQuantities[price.id] || 0) > 0
    );

    const getBorderColor = () => {
        if (isGuestlistSoldOut) return '#232323';
        if (hasSelectedQuantity) return '#e5ff88';
        return '#232323';
    };

    const borderColor = getBorderColor();

    const firstPrice = guestlist.prices?.[0];

    return (
        <div
            className={`
                relative flex flex-col bg-[#141414] border-2 rounded-[16px] w-full overflow-visible
                ${isGuestlistSoldOut ? 'opacity-50 pointer-events-none' : ''}
                ${hasSelectedQuantity && !isGuestlistSoldOut ? 'border-[#e5ff88]' : 'border-[#232323]'}
                ${className}
            `}
        >
            <div
                className="absolute right-[152px] top-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-b-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderBottom: `2px solid ${borderColor}`,
                }}
            />

            <div
                className="absolute right-[152px] bottom-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-t-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderTop: `2px solid ${borderColor}`,
                }}
            />

            <div className="absolute right-[160px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

            {isGuestlistSoldOut && (
                <div className="absolute top-[-12px] right-[-8px] z-20">
                    <div className="flex items-center px-3 py-1.5 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                        <span className="text-[#ff4d4d] text-sm font-medium font-helvetica">
                            {t('event.sold_out', 'Agotado')}
                        </span>
                    </div>
                </div>
            )}

            <div
                className="flex items-center h-[56px] px-[16px] border-b-[1.5px] border-[#232323] cursor-pointer"
                onClick={() => firstPrice && onMoreInfo?.(guestlist, firstPrice)}
            >
                <div className="flex items-center gap-[6px]">
                    <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: GUESTLIST_COLOR }}
                    />
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                        {guestlist.name}
                    </span>
                </div>
            </div>

            {guestlist.prices?.map((price, priceIndex) => {
                const quantity = selectedQuantities[price.id] || 0;
                const isLast = priceIndex === (guestlist.prices?.length ?? 0) - 1;
                const showPriceName = guestlist.prices.length > 1;

                const available = getAvailability(price);
                const isPriceSoldOut = available <= 0;
                const isAtMax = quantity >= Math.min(maxPerUser, available);

                const isLowStock = !isPriceSoldOut && available > 0 && available < 5;

                return (
                    <div
                        key={price.id}
                        className={`
                            flex items-center justify-between px-[16px] py-[12px] cursor-pointer
                            ${!isLast ? 'border-b-[1.5px] border-[#232323]' : ''}
                        `}
                        onClick={() => onMoreInfo?.(guestlist, price)}
                    >
                        <div className="flex flex-col gap-[10px]">
                            <div className="flex flex-col">
                                {showPriceName && (
                                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                        {price.name}
                                    </span>
                                )}
                                <div className="flex items-center gap-[8px]">
                                    <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                                        {price.finalPrice === 0 ? t('event.free', 'Gratis') : `${price.finalPrice.toFixed(2).replace('.', ',')}€`}
                                    </span>
                                    {isLowStock && (
                                        <div className="flex items-center px-[8px] py-[2px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                                            <span className="text-[#f6f6f6] text-[12px] font-medium font-helvetica">
                                                Hot 🔥
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-[6px]">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onQuantityChange(price.id, -1);
                                }}
                                disabled={quantity === 0 || isPriceSoldOut}
                                className={`
                                    flex items-center justify-center w-[36px] h-[36px] bg-[#232323] rounded-[8px]
                                    ${quantity === 0 || isPriceSoldOut ? 'opacity-50' : 'cursor-pointer'}
                                `}
                            >
                                <MinusIcon />
                            </button>
                            <span className={`
                                w-[32px] text-center text-[24px] font-bold font-helvetica leading-none
                                ${quantity > 0 ? 'text-[#e5ff88]' : 'text-[#f6f6f6]'}
                            `}>
                                {quantity}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!isAtMax && !isPriceSoldOut) {
                                        onQuantityChange(price.id, 1);
                                    }
                                }}
                                disabled={isAtMax || isPriceSoldOut}
                                className={`
                                    flex items-center justify-center w-[36px] h-[36px] bg-[#232323] rounded-[8px]
                                    ${isAtMax || isPriceSoldOut ? 'opacity-50' : 'cursor-pointer'}
                                `}
                            >
                                <PlusIcon />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default GuestlistCard;
export type { Guestlist, GuestlistPrice };
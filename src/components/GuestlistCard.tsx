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
            <div className={`relative flex flex-col bg-[#141414] border-2 border-[#232323] rounded-2xl w-full overflow-visible animate-pulse ${className}`}>
                <div
                    className="absolute right-[120px] md:right-[152px] top-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-b-full z-10"
                    style={{
                        borderLeft: '2px solid #232323',
                        borderRight: '2px solid #232323',
                        borderBottom: '2px solid #232323',
                    }}
                />

                <div
                    className="absolute right-[120px] md:right-[152px] bottom-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-t-full z-10"
                    style={{
                        borderLeft: '2px solid #232323',
                        borderRight: '2px solid #232323',
                        borderTop: '2px solid #232323',
                    }}
                />

                <div className="absolute right-[128px] md:right-[160px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

                <div className="flex items-center h-14 px-4 border-b-[1.5px] border-[#232323]">
                    <div className="h-5 w-32 bg-[#232323] rounded" />
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex flex-col gap-2.5">
                        <div className="h-5 w-20 bg-[#232323] rounded" />
                        <div className="h-4 w-24 bg-[#232323] rounded" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-9 h-9 bg-[#232323] rounded-lg" />
                        <div className="w-8 h-6 bg-[#232323] rounded" />
                        <div className="w-9 h-9 bg-[#232323] rounded-lg" />
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

    const productBenefits = guestlist.benefits?.filter(b => b.type === 'PRODUCT') || [];
    const productText = productBenefits.length > 0 
        ? productBenefits.map(b => b.name).join(', ')
        : null;

    const timeRange = guestlist.startTime && guestlist.endTime 
        ? `${guestlist.startTime}h - ${guestlist.endTime}h`
        : null;

    return (
        <div
            className={`
                relative flex flex-col bg-[#141414] border-2 rounded-2xl w-full overflow-visible
                ${isGuestlistSoldOut ? 'opacity-50 pointer-events-none' : ''}
                ${hasSelectedQuantity && !isGuestlistSoldOut ? 'border-[#e5ff88]' : 'border-[#232323]'}
                ${className}
            `}
        >
            <div
                className="absolute right-[120px] md:right-[152px] top-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-b-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderBottom: `2px solid ${borderColor}`,
                }}
            />

            <div
                className="absolute right-[120px] md:right-[152px] bottom-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-t-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderTop: `2px solid ${borderColor}`,
                }}
            />

            <div className="absolute right-[128px] md:right-[160px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

            <div className="flex items-center h-14 px-4 border-b-[1.5px] border-[#232323]">
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: GUESTLIST_COLOR }}
                    />
                    <span className="text-[#f6f6f6] text-base font-medium font-helvetica">
                        {guestlist.name}
                    </span>
                </div>
            </div>

            {guestlist.prices?.map((price, priceIndex) => {
                const quantity = selectedQuantities[price.id] || 0;
                const available = getAvailability(price);
                const isPriceSoldOut = available <= 0;
                const isLast = priceIndex === (guestlist.prices?.length ?? 0) - 1;
                const showPriceName = guestlist.prices.length > 1;

                const totalSelected = Object.values(selectedQuantities).reduce((sum, q) => sum + q, 0);
                const isAtMax = totalSelected >= maxPerUser && quantity === 0;

                return (
                    <div
                        key={price.id}
                        className={`
                            flex items-center justify-between px-4 py-3
                            ${!isLast ? 'border-b-[1.5px] border-[#232323]' : ''}
                            ${isPriceSoldOut ? 'opacity-50' : ''}
                        `}
                    >
                        <div className="flex flex-col gap-[4px]">
                            <div className="flex flex-col">
                                {showPriceName && (
                                    <span className="text-[#939393] text-sm font-normal font-helvetica">
                                        {price.name}
                                    </span>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-[#f6f6f6] text-base font-bold font-helvetica">
                                        {price.finalPrice === 0 
                                            ? t('checkout.free', 'Gratis')
                                            : `${(price.finalPrice ?? 0).toFixed(2).replace('.', ',')}€`
                                        }
                                    </span>
                                    {price.maxQuantity && (price.maxQuantity - price.soldQuantity) < 20 && !isPriceSoldOut && (
                                        <div className="flex items-center px-2 py-0.5 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                                            <span className="text-[#f6f6f6] text-xs font-medium font-helvetica">
                                                Hot 🔥
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {timeRange && (
                                <span className="text-[#939393] text-[12px] font-medium font-helvetica">
                                    {timeRange}
                                </span>
                            )}
                            {productText && (
                                <span className="text-[#939393] text-[12px] font-medium font-helvetica">
                                    {productText}
                                </span>
                            )}
                            <span 
                                className="text-[#939393] text-[12px] font-medium font-helvetica cursor-pointer hover:text-[#f6f6f6] transition-colors"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onMoreInfo?.(guestlist, price);
                                }}
                            >
                                {t('event.more_info', 'Más información')}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onQuantityChange(price.id, -1);
                                }}
                                disabled={quantity === 0 || isPriceSoldOut}
                                className={`
                                    flex items-center justify-center w-9 h-9 bg-[#232323] rounded-lg
                                    ${quantity === 0 || isPriceSoldOut ? 'opacity-50' : 'cursor-pointer'}
                                `}
                            >
                                <MinusIcon />
                            </button>
                            <span className={`
                                w-8 text-center text-2xl font-bold font-helvetica leading-none
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
                                    flex items-center justify-center w-9 h-9 bg-[#232323] rounded-lg
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
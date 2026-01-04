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

const PersonIcon = () => (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
        <path d="M6 6.5C7.38071 6.5 8.5 5.38071 8.5 4C8.5 2.61929 7.38071 1.5 6 1.5C4.61929 1.5 3.5 2.61929 3.5 4C3.5 5.38071 4.61929 6.5 6 6.5Z" fill="#939393" />
        <path d="M6 8C3.79086 8 2 9.79086 2 12H10C10 9.79086 8.20914 8 6 8Z" fill="#939393" />
    </svg>
);

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

    // Color amarillo para guestlists
    const GUESTLIST_COLOR = '#ffce1f';

    if (isLoading) {
        return (
            <div className={`relative flex flex-col bg-[#141414] border-2 border-[#232323] rounded-[16px] w-full overflow-visible animate-pulse ${className}`}>
                {/* Top semicircle skeleton */}
                <div
                    className="absolute right-[152px] top-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-b-full z-10"
                    style={{
                        borderLeft: '2px solid #232323',
                        borderRight: '2px solid #232323',
                        borderBottom: '2px solid #232323',
                    }}
                />

                {/* Bottom semicircle skeleton */}
                <div
                    className="absolute right-[152px] bottom-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-t-full z-10"
                    style={{
                        borderLeft: '2px solid #232323',
                        borderRight: '2px solid #232323',
                        borderTop: '2px solid #232323',
                    }}
                />

                {/* Dashed line skeleton */}
                <div className="absolute right-[160px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

                {/* Header skeleton */}
                <div className="flex items-center justify-between h-[56px] px-[16px] border-b-[1.5px] border-[#232323]">
                    <div className="h-5 w-32 bg-[#232323] rounded" />
                    <div className="h-7 w-16 bg-[#232323] rounded-[25px]" />
                </div>

                {/* Price row skeleton */}
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

    const hasSelectedQuantity = guestlist.prices?.some(
        price => (selectedQuantities[price.id] || 0) > 0
    );
    const borderColor = hasSelectedQuantity ? '#e5ff88' : '#232323';

    // Format time range
    const timeRange = `${guestlist.startTime} - ${guestlist.endTime}`;

    return (
        <div
            className={`
                relative flex flex-col bg-[#141414] border-2 rounded-[16px] w-full overflow-visible
                ${hasSelectedQuantity ? 'border-[#e5ff88]' : 'border-[#232323]'}
                ${className}
            `}
        >
            {/* Top semicircle */}
            <div
                className="absolute right-[152px] top-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-b-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderBottom: `2px solid ${borderColor}`,
                }}
            />

            {/* Bottom semicircle */}
            <div
                className="absolute right-[152px] bottom-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-t-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderTop: `2px solid ${borderColor}`,
                }}
            />

            {/* Dashed vertical line */}
            <div className="absolute right-[160px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

            {/* Guestlist Header */}
            <div className="flex items-center justify-between h-[56px] px-[16px] border-b-[1.5px] border-[#232323]">
                {/* Left: Name with yellow indicator */}
                <div className="flex flex-col gap-[2px]">
                    <div className="flex items-center gap-[6px]">
                        <div
                            className="w-[6px] h-[6px] rounded-full shrink-0"
                            style={{ backgroundColor: GUESTLIST_COLOR }}
                        />
                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                            {guestlist.name}
                        </span>
                    </div>
                    {/* Time range */}
                    <span className="text-[#939393] text-[12px] font-normal font-helvetica ml-[12px]">
                        {timeRange}
                    </span>
                </div>

                {/* Right: Capacity pill */}
                <div className="flex items-center gap-[4px] px-[10px] py-[4px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                        {guestlist.maxPersonsPerGuestlist}
                    </span>
                    <PersonIcon />
                </div>
            </div>

            {/* Prices */}
            {guestlist.prices?.map((price, priceIndex) => {
                const quantity = selectedQuantities[price.id] || 0;
                const isLast = priceIndex === (guestlist.prices?.length ?? 0) - 1;
                const showPriceName = guestlist.prices.length > 1;
                const isFree = price.finalPrice === 0;

                return (
                    <div
                        key={price.id}
                        className={`
                            flex items-center justify-between px-[16px] py-[12px]
                            ${!isLast ? 'border-b-[1.5px] border-[#232323]' : ''}
                        `}
                    >
                        {/* Info section */}
                        <div className="flex flex-col gap-[10px]">
                            {/* Price info */}
                            <div className="flex flex-col">
                                {showPriceName && (
                                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                        {price.name}
                                    </span>
                                )}
                                <div className="flex items-center gap-[8px]">
                                    <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                                        {isFree
                                            ? t('event.free', 'Gratis')
                                            : `${(price.finalPrice ?? 0).toFixed(2).replace('.', ',')}€`
                                        }
                                    </span>
                                    {price.maxQuantity && (price.maxQuantity - price.soldQuantity) < 20 && !price.isSoldOut && (
                                        <div className="flex items-center px-[8px] py-[2px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                                            <span className="text-[#f6f6f6] text-[12px] font-medium font-helvetica">
                                                Hot 🔥
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span
                                className="text-[#939393] text-[12px] font-medium font-helvetica cursor-pointer hover:text-[#f6f6f6] transition-colors"
                                onClick={() => onMoreInfo?.(guestlist, price)}
                            >
                                {t('event.more_info', 'Más información')}
                            </span>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-[6px]">
                            <button
                                onClick={() => onQuantityChange(price.id, -1)}
                                disabled={quantity === 0}
                                className={`
                                    flex items-center justify-center w-[36px] h-[36px] bg-[#232323] rounded-[8px]
                                    ${quantity === 0 ? 'opacity-50' : 'cursor-pointer'}
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
                                onClick={() => onQuantityChange(price.id, 1)}
                                className="flex items-center justify-center w-[36px] h-[36px] bg-[#232323] rounded-[8px] cursor-pointer"
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
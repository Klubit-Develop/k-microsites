import { useTranslation } from 'react-i18next';

interface TicketPrice {
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

interface Ticket {
    id: string;
    name: string;
    ageRequired: string;
    termsAndConditions: string;
    maxPurchasePerUser: number;
    isNominative: boolean;
    isTransferable: boolean;
    isActive: boolean;
    gendersRequired?: string[];
    accessLevel?: string;
    prices: TicketPrice[];
    zones?: Array<{ id: string; name: string }>;
    benefits?: Array<{ id: string; name: string; type?: string }>;
}

interface TicketCardProps {
    ticket: Ticket;
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onMoreInfo?: (ticket: Ticket, price: TicketPrice) => void;
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

const TicketCard = ({
    ticket,
    selectedQuantities,
    onQuantityChange,
    onMoreInfo,
    isLoading = false,
    className = '',
}: TicketCardProps) => {
    const { t } = useTranslation();

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

    const hasSelectedQuantity = ticket.prices?.some(
        price => (selectedQuantities[price.id] || 0) > 0
    );
    const borderColor = hasSelectedQuantity ? '#e5ff88' : '#232323';

    return (
        <div
            className={`
                relative flex flex-col bg-[#141414] border-2 rounded-[16px] w-full overflow-visible
                ${hasSelectedQuantity ? 'border-[#e5ff88]' : 'border-[#232323]'}
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

            <div className="flex items-center h-[56px] px-[16px] border-b-[1.5px] border-[#232323]">
                <div className="flex items-center gap-[6px]">
                    <div className="w-[6px] h-[6px] bg-[#d591ff] rounded-full shrink-0" />
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                        {ticket.name}
                    </span>
                </div>
            </div>

            {ticket.prices?.map((price, priceIndex) => {
                const quantity = selectedQuantities[price.id] || 0;
                const isLast = priceIndex === (ticket.prices?.length ?? 0) - 1;
                const showPriceName = ticket.prices.length > 1;

                return (
                    <div
                        key={price.id}
                        className={`
                            flex items-center justify-between px-[16px] py-[12px] cursor-pointer
                            ${!isLast ? 'border-b-[1.5px] border-[#232323]' : ''}
                        `}
                        onClick={() => onMoreInfo?.(ticket, price)}
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
                                        {(price.finalPrice ?? 0).toFixed(2).replace('.', ',')}€
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
                        </div>

                        <div className="flex items-center gap-[6px]">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onQuantityChange(price.id, -1);
                                }}
                                disabled={quantity === 0}
                                className={`
                                    flex items-center justify-center w-[36px] h-[36px] bg-[#232323] rounded-[8px]
                                    ${quantity === 0 ? 'opacity-50' : 'cursor-pointer'}
                                `}
                            >
                                <MinusIcon />
                            </button>
                            <span className={`
                                w-[32px] text-center text-[24px] font-semibold font-borna leading-none
                                ${quantity > 0 ? 'text-[#e5ff88]' : 'text-[#f6f6f6]'}
                            `}>
                                {quantity}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onQuantityChange(price.id, 1);
                                }}
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

export default TicketCard;
export type { Ticket, TicketPrice };
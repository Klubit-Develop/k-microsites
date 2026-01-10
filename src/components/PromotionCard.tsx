import { useTranslation } from 'react-i18next';

interface PromotionProduct {
    product: {
        id: string;
        name: string;
        description: string | null;
        price: number;
        iconName: string | null;
    };
}

interface Promotion {
    id: string;
    name: string;
    description: string | null;
    type: 'PERCENTAGE' | 'FIXED_PRICE' | 'FIXED_AMOUNT';
    value: number;
    maxPurchasePerUser: number;
    geolocation: boolean;
    termsAndConditions: string | null;
    isActive: boolean;
    accessLevel: string;
    products: PromotionProduct[];
}

interface PromotionCardProps {
    promotion: Promotion;
    quantity: number;
    onQuantityChange: (promotionId: string, delta: number) => void;
    onMoreInfo?: (promotion: Promotion) => void;
    eventStartDate?: string;
    eventStartTime?: string;
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

const PROMOTION_COLOR = '#ff336d';

const PromotionCard = ({
    promotion,
    quantity,
    onQuantityChange,
    onMoreInfo,
    eventStartDate,
    eventStartTime,
    isLoading = false,
    className = '',
}: PromotionCardProps) => {
    const { t, i18n } = useTranslation();

    const formattedDateTime = (() => {
        if (!eventStartDate) return '';
        const locale = i18n.language === 'es' ? 'es' : 'en';
        const date = new Date(eventStartDate);
        const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
        const day = date.getDate();
        const month = date.toLocaleDateString(locale, { month: 'short' });
        const datePart = `${dayName}, ${day} ${month}`;
        if (eventStartTime) {
            return `${datePart} · ${eventStartTime}h`;
        }
        return datePart;
    })();

    const formatPromotionPrice = (): string => {
        switch (promotion.type) {
            case 'PERCENTAGE':
                return `-${promotion.value}%`;
            case 'FIXED_PRICE':
                return `${promotion.value.toFixed(2).replace('.', ',')}€`;
            case 'FIXED_AMOUNT':
                return `-${promotion.value.toFixed(2).replace('.', ',')}€`;
            default:
                return `${promotion.value}€`;
        }
    };

    if (isLoading) {
        return (
            <div className={`relative flex flex-col bg-[#141414] border-2 border-[#232323] rounded-[16px] w-full overflow-visible animate-pulse ${className}`}>
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

    const isSelected = quantity > 0;
    const borderColor = isSelected ? '#e5ff88' : '#232323';

    return (
        <div
            className={`
                relative flex flex-col bg-[#141414] border-2 rounded-[16px] w-full overflow-visible
                ${isSelected ? 'border-[#e5ff88]' : 'border-[#232323]'}
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

            <div className="flex items-center h-[56px] px-[16px] border-b-[1.5px] border-[#232323]">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-[6px]">
                        <div
                            className="w-[6px] h-[6px] rounded-full shrink-0"
                            style={{ backgroundColor: PROMOTION_COLOR }}
                        />
                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                            {promotion.name}
                        </span>
                    </div>
                    {formattedDateTime && (
                        <span className="text-[#939393] text-xs font-normal font-helvetica ml-3">
                            {formattedDateTime}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between px-[16px] py-[12px]">
                <div className="flex flex-col gap-[10px]">
                    <div className="flex items-center gap-[8px]">
                        <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                            {formatPromotionPrice()}
                        </span>
                    </div>
                    <span
                        className="text-[#939393] text-[12px] font-medium font-helvetica cursor-pointer hover:text-[#f6f6f6] transition-colors"
                        onClick={() => onMoreInfo?.(promotion)}
                    >
                        {t('event.more_info', 'Más información')}
                    </span>
                </div>

                <div className="flex items-center gap-[6px]">
                    <button
                        onClick={() => onQuantityChange(promotion.id, -1)}
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
                        ${isSelected ? 'text-[#e5ff88]' : 'text-[#f6f6f6]'}
                    `}>
                        {quantity}
                    </span>
                    <button
                        onClick={() => onQuantityChange(promotion.id, 1)}
                        className="flex items-center justify-center w-[36px] h-[36px] bg-[#232323] rounded-[8px] cursor-pointer"
                    >
                        <PlusIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromotionCard;
export type { Promotion, PromotionProduct, PromotionCardProps };
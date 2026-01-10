import { useTranslation } from 'react-i18next';

interface ReservationPrice {
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

interface ReservationZone {
    id: string;
    name: string;
    description?: string | null;
    coverImage?: string | null;
    floorPlan?: string | null;
    isActive?: boolean;
}

interface Reservation {
    id: string;
    name: string;
    maxPerUser: number;
    maxPersonsPerReservation: number;
    ageRequired: string;
    termsAndConditions: string | null;
    isTransferable: boolean;
    isActive: boolean;
    gendersRequired?: string[];
    accessLevel?: string;
    prices: ReservationPrice[];
    zones?: ReservationZone[];
}

interface ReservationCardProps {
    reservation: Reservation;
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onMoreInfo?: (reservation: Reservation, price: ReservationPrice) => void;
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

const RESERVATION_COLOR = '#3fe8e8';

const ReservationCard = ({
    reservation,
    selectedQuantities,
    onQuantityChange,
    onMoreInfo,
}: ReservationCardProps) => {
    const { t } = useTranslation();

    const hasSelectedQuantity = reservation.prices?.some(
        price => (selectedQuantities[price.id] || 0) > 0
    );
    const borderColor = hasSelectedQuantity ? '#e5ff88' : '#232323';

    return (
        <div
            className="relative flex flex-col bg-[#141414] border-2 rounded-[16px] w-full overflow-visible"
            style={{ borderColor }}
        >
            <div
                className="absolute right-[145px] md:right-[165px] top-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-b-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderBottom: `2px solid ${borderColor}`,
                }}
            />

            <div
                className="absolute right-[145px] md:right-[165px] bottom-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-t-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderTop: `2px solid ${borderColor}`,
                }}
            />

            <div className="absolute right-[153px] md:right-[173px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

            <div className="flex items-center justify-between h-[56px] px-[16px] border-b-[1.5px] border-[#232323]">
                <div className="flex items-center gap-[6px] flex-1 min-w-0 pr-[170px] md:pr-[190px]">
                    <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: RESERVATION_COLOR }}
                    />
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                        {reservation.name}
                    </span>
                </div>

                <div className="absolute right-[16px] flex items-center gap-[4px] px-[10px] py-[4px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                        {reservation.maxPersonsPerReservation}
                    </span>
                    <PersonIcon />
                </div>
            </div>

            {reservation.prices?.map((price, priceIndex) => {
                const quantity = selectedQuantities[price.id] || 0;
                const isLast = priceIndex === (reservation.prices?.length ?? 0) - 1;
                const showPriceName = reservation.prices.length > 1;

                return (
                    <div
                        key={price.id}
                        className={`flex items-center justify-between px-[16px] py-[12px] ${!isLast ? 'border-b-[1.5px] border-[#232323]' : ''}`}
                    >
                        <div className="flex flex-col gap-[10px] flex-1 min-w-0 pr-[170px] md:pr-[190px]">
                            {showPriceName && (
                                <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                    {price.name}
                                </span>
                            )}
                            <div className="flex items-center gap-[8px] flex-wrap">
                                <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                                    {price.finalPrice.toFixed(2).replace('.', ',')}€
                                </span>
                            </div>
                            <span
                                className="text-[#939393] text-[12px] font-medium font-helvetica cursor-pointer hover:text-[#f6f6f6] transition-colors"
                                onClick={() => onMoreInfo?.(reservation, price)}
                            >
                                {t('event.more_info', 'Más información')}
                            </span>
                        </div>

                        <div className="absolute right-[16px] flex items-center gap-[6px] w-[120px] md:w-[140px] justify-center">
                            <button
                                onClick={() => onQuantityChange(price.id, -1)}
                                disabled={quantity === 0}
                                className={`flex-1 flex items-center justify-center h-[36px] bg-[#232323] rounded-[8px] ${quantity === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <MinusIcon />
                            </button>
                            <span className={`w-[40px] text-center text-[32px] font-semibold font-borna leading-none ${quantity > 0 ? 'text-[#e5ff88]' : 'text-[#f6f6f6]'}`}>
                                {quantity}
                            </span>
                            <button
                                onClick={() => onQuantityChange(price.id, 1)}
                                disabled={price.isSoldOut}
                                className={`flex-1 flex items-center justify-center h-[36px] bg-[#232323] rounded-[8px] ${price.isSoldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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

const ReservationCardSkeleton = () => (
    <div className="flex flex-col bg-[#141414] border-2 border-[#232323] rounded-[16px] w-full animate-pulse">
        <div className="flex items-center justify-between h-[56px] px-[16px] border-b-[1.5px] border-[#232323]">
            <div className="flex items-center gap-[6px]">
                <div className="w-[6px] h-[6px] rounded-full bg-[#232323]" />
                <div className="h-4 w-32 bg-[#232323] rounded" />
            </div>
            <div className="h-6 w-16 bg-[#232323] rounded-full" />
        </div>
        <div className="flex items-center justify-between px-[16px] py-[12px]">
            <div className="flex flex-col gap-[10px]">
                <div className="h-4 w-20 bg-[#232323] rounded" />
                <div className="h-3 w-24 bg-[#232323] rounded" />
            </div>
            <div className="flex items-center gap-[6px]">
                <div className="h-[36px] w-[36px] bg-[#232323] rounded-[8px]" />
                <div className="h-6 w-[32px] bg-[#232323] rounded" />
                <div className="h-[36px] w-[36px] bg-[#232323] rounded-[8px]" />
            </div>
        </div>
    </div>
);

export default ReservationCard;
export { ReservationCardSkeleton };
export type { Reservation, ReservationPrice, ReservationZone };
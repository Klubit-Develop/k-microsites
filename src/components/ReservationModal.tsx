import { useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

// ============================================
// TYPES
// ============================================

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
    description: string | null;
    coverImage: string | null;
    floorPlan: string | null;
    isActive: boolean;
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
    gendersRequired: string[];
    accessLevel: string;
    prices: ReservationPrice[];
    zones: ReservationZone[];
}

interface ZoneWithReservations {
    zone: ReservationZone;
    reservations: Reservation[];
    minPrice: number;
}

interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    zoneData: ZoneWithReservations | null;
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

// ============================================
// ICONS
// ============================================

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

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

// Color cyan para reservas
const RESERVATION_COLOR = '#3fe8e8';

// ============================================
// RESERVATION CARD (dentro del modal)
// ============================================

interface ReservationCardInModalProps {
    reservation: Reservation;
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
}

const ReservationCardInModal = ({
    reservation,
    selectedQuantities,
    onQuantityChange,
}: ReservationCardInModalProps) => {
    const { t } = useTranslation();

    const hasSelectedQuantity = reservation.prices?.some(
        price => (selectedQuantities[price.id] || 0) > 0
    );
    const borderColor = hasSelectedQuantity ? '#e5ff88' : '#232323';

    return (
        <div
            className={`
                relative flex flex-col bg-[#141414] border-2 rounded-[16px] w-full overflow-visible
                ${hasSelectedQuantity ? 'border-[#e5ff88]' : 'border-[#232323]'}
            `}
        >
            {/* Top semicircle */}
            <div
                className="absolute right-[120px] top-[-2px] w-[18px] h-[10px] bg-[#0A0A0A] rounded-b-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderBottom: `2px solid ${borderColor}`,
                }}
            />

            {/* Bottom semicircle */}
            <div
                className="absolute right-[120px] bottom-[-2px] w-[18px] h-[10px] bg-[#0A0A0A] rounded-t-full z-10"
                style={{
                    borderLeft: `2px solid ${borderColor}`,
                    borderRight: `2px solid ${borderColor}`,
                    borderTop: `2px solid ${borderColor}`,
                }}
            />

            {/* Dashed vertical line */}
            <div className="absolute right-[128px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

            {/* Reservation Header */}
            <div className="flex items-center justify-between h-[56px] px-[16px] border-b-[1.5px] border-[#232323]">
                {/* Left: Name with cyan indicator */}
                <div className="flex items-center gap-[6px] flex-1 min-w-0">
                    <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: RESERVATION_COLOR }}
                    />
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                        {reservation.name}
                    </span>
                </div>

                {/* Right: Capacity pill */}
                <div className="flex items-center gap-[4px] px-[10px] py-[4px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] shrink-0">
                    <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                        {reservation.maxPersonsPerReservation}
                    </span>
                    <PersonIcon />
                </div>
            </div>

            {/* Prices */}
            {reservation.prices?.map((price, priceIndex) => {
                const quantity = selectedQuantities[price.id] || 0;
                const isLast = priceIndex === (reservation.prices?.length ?? 0) - 1;
                const showPriceName = reservation.prices.length > 1;

                return (
                    <div
                        key={price.id}
                        className={`
                            flex items-center justify-between px-[16px] py-[12px]
                            ${!isLast ? 'border-b-[1.5px] border-[#232323]' : ''}
                        `}
                    >
                        {/* Info section */}
                        <div className="flex flex-col gap-[6px]">
                            {showPriceName && (
                                <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                    {price.name}
                                </span>
                            )}
                            <div className="flex items-center gap-[8px]">
                                <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                                    {price.finalPrice.toFixed(2).replace('.', ',')}€
                                </span>
                                {price.maxQuantity && (price.maxQuantity - price.soldQuantity) < 5 && !price.isSoldOut && (
                                    <div className="flex items-center px-[8px] py-[2px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                                        <span className="text-[#f6f6f6] text-[12px] font-medium font-helvetica">
                                            Hot 🔥
                                        </span>
                                    </div>
                                )}
                            </div>
                            <span className="text-[#939393] text-[12px] font-medium font-helvetica">
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
                                w-[32px] text-center text-[24px] font-semibold font-borna leading-none
                                ${quantity > 0 ? 'text-[#e5ff88]' : 'text-[#f6f6f6]'}
                            `}>
                                {quantity}
                            </span>
                            <button
                                onClick={() => onQuantityChange(price.id, 1)}
                                disabled={price.isSoldOut}
                                className={`
                                    flex items-center justify-center w-[36px] h-[36px] bg-[#232323] rounded-[8px]
                                    ${price.isSoldOut ? 'opacity-50' : 'cursor-pointer'}
                                `}
                            >
                                <PlusIcon />
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* Terms if exists */}
            {reservation.termsAndConditions && (
                <div className="px-[16px] py-[10px] border-t-[1.5px] border-[#232323]">
                    <p className="text-[#939393] text-[12px] font-normal font-helvetica">
                        {reservation.termsAndConditions}
                    </p>
                </div>
            )}
        </div>
    );
};

// ============================================
// MAIN MODAL COMPONENT
// ============================================

const ReservationModal = ({
    isOpen,
    onClose,
    zoneData,
    selectedQuantities,
    onQuantityChange,
    onConfirm,
    isLoading = false,
}: ReservationModalProps) => {
    const { t } = useTranslation();

    // Keyboard handler
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
            onClose();
        }
    }, [onClose, isLoading]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    // Calculate total for this zone
    const total = useMemo(() => {
        if (!zoneData) return 0;
        let sum = 0;
        zoneData.reservations.forEach(reservation => {
            reservation.prices.forEach(price => {
                const qty = selectedQuantities[price.id] || 0;
                sum += price.finalPrice * qty;
            });
        });
        return sum;
    }, [zoneData, selectedQuantities]);

    const hasSelection = total > 0;

    if (!isOpen || !zoneData) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70" />

            {/* Modal Content */}
            <div className="relative bg-[#0A0A0A] border-2 border-[#232323] rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
                {/* Drag indicator (mobile) */}
                <div className="sm:hidden flex justify-center pt-[12px] pb-[8px]">
                    <div className="w-9 h-[5px] bg-[#F6F6F6] opacity-30 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#232323]">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-[8px] h-[8px] rounded-full shrink-0"
                            style={{ backgroundColor: RESERVATION_COLOR }}
                        />
                        <h2
                            className="text-[#F6F6F6] text-[20px] font-semibold"
                            style={{ fontFamily: "'Borna', sans-serif" }}
                        >
                            {zoneData.zone.name}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 rounded-full hover:bg-[#232323] transition-colors"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Zone description if exists */}
                {zoneData.zone.description && (
                    <div className="px-6 py-3 border-b border-[#232323]">
                        <p className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {zoneData.zone.description}
                        </p>
                    </div>
                )}

                {/* Reservations list */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="flex flex-col gap-4">
                        {zoneData.reservations.map(reservation => (
                            <ReservationCardInModal
                                key={reservation.id}
                                reservation={reservation}
                                selectedQuantities={selectedQuantities}
                                onQuantityChange={onQuantityChange}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer with confirm button */}
                <div className="px-6 py-4 border-t border-[#232323]">
                    <button
                        onClick={onConfirm}
                        disabled={!hasSelection || isLoading}
                        className={`
                            w-full h-[48px] rounded-[12px] flex items-center justify-center
                            font-bold text-[16px] font-helvetica transition-opacity
                            ${hasSelection
                                ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90'
                                : 'bg-[#232323] text-[#939393] cursor-not-allowed'
                            }
                        `}
                    >
                        {isLoading
                            ? t('common.loading', 'Cargando...')
                            : hasSelection
                                ? `${t('event.add_to_cart', 'Añadir')} - ${total.toFixed(2).replace('.', ',')}€`
                                : t('event.select_reservation', 'Selecciona una reserva')
                        }
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ReservationModal;
export type { ZoneWithReservations, Reservation, ReservationPrice, ReservationZone };
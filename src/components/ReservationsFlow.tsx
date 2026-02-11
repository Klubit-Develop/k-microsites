import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReservationCard, { type Reservation, type ReservationZone, type ReservationPrice } from './ReservationCard';
import { scrollToTop } from '@/hooks/useScrollToTop';
import Button from './ui/Button';

interface ZoneWithReservations {
    zone: ReservationZone;
    reservations: Reservation[];
    minPrice: number;
}

interface ReservationFormData {
    reservationName: string;
    partySize: number;
    observations: string;
}

interface SelectedReservationInfo {
    reservation: Reservation;
    priceId: string;
    quantity: number;
}

interface ReservationsFlowProps {
    reservations: Reservation[];
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onContinue: (formData: ReservationFormData) => void;
    onMoreInfo?: (reservation: Reservation, price: ReservationPrice) => void;
    total: number;
    isLoading?: boolean;
    storedFormData?: ReservationFormData | null;
}

const RESERVATION_COLOR = '#939393';

const ChevronLeftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12.5 15L7.5 10L12.5 5" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MinusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 12H19" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 12H19" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 5V19" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const PersonIcon = () => (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
        <path d="M6 6.5C7.38071 6.5 8.5 5.38071 8.5 4C8.5 2.61929 7.38071 1.5 6 1.5C4.61929 1.5 3.5 2.61929 3.5 4C3.5 5.38071 4.61929 6.5 6 6.5Z" fill="#939393" />
        <path d="M6 8C3.79086 8 2 9.79086 2 12H10C10 9.79086 8.20914 8 6 8Z" fill="#939393" />
    </svg>
);

interface ZoneCardProps {
    zoneData: ZoneWithReservations;
    onClick: () => void;
    hasSelectedItems?: boolean;
}

const ZoneCard = ({ zoneData, onClick, hasSelectedItems = false }: ZoneCardProps) => {
    const { t } = useTranslation();
    const borderClass = hasSelectedItems
        ? 'border-[#e5ff88]'
        : 'border-[#232323] hover:bg-[#232323]';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full bg-[#141414] border-2 rounded-[16px] px-[16px] py-[16px] cursor-pointer transition-colors group text-left ${borderClass}`}
        >
            <div className="flex flex-col gap-[10px]">
                <div className="flex items-center gap-[8px]">
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                        {t('event.reservations_zone', 'Reservas')}: {zoneData.zone.name}
                    </span>
                </div>
                <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                    {t('event.from_price', 'Desde')} {zoneData.minPrice.toFixed(2).replace('.', ',')}€
                </span>
            </div>
        </button>
    );
};

const ZoneCardSkeleton = () => (
    <div className="w-full bg-[#141414] border-2 border-[#232323] rounded-[16px] px-[16px] py-[16px] animate-pulse">
        <div className="flex flex-col gap-[2px]">
            <div className="flex items-center gap-[6px]">
                <div className="w-[6px] h-[6px] rounded-full bg-[#232323]" />
                <div className="h-4 w-40 bg-[#232323] rounded" />
            </div>
            <div className="h-4 w-24 bg-[#232323] rounded ml-[12px]" />
        </div>
    </div>
);

interface SelectionStepProps {
    zoneData: ZoneWithReservations;
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onMoreInfo?: (reservation: Reservation, price: ReservationPrice) => void;
    partySize: number;
    onPartySizeChange: (delta: number) => void;
    onBack: () => void;
    onContinue: () => void;
}

const SelectionStep = ({
    zoneData,
    selectedQuantities,
    onQuantityChange,
    onMoreInfo,
    partySize,
    onPartySizeChange,
    onBack,
    onContinue,
}: SelectionStepProps) => {
    const { t } = useTranslation();

    const getAvailableStock = (reservation: Reservation): number => {
        if (!reservation.prices || reservation.prices.length === 0) return 0;
        return reservation.prices.reduce((total, price) => {
            if (price.isSoldOut) return total;
            if (price.maxQuantity === null) return total + reservation.maxPerUser;
            return total + Math.max(0, price.maxQuantity - price.soldQuantity);
        }, 0);
    };

    const maxPersonsAvailable = useMemo(() => {
        let maxPersons = 1;
        zoneData.reservations.forEach(reservation => {
            const rawValue = reservation.maxPerUser;
            let reservationMax = 1;
            if (typeof rawValue === 'bigint') {
                reservationMax = Number(rawValue);
            } else if (typeof rawValue === 'string') {
                reservationMax = parseInt(rawValue, 10);
            } else if (typeof rawValue === 'number') {
                reservationMax = rawValue;
            }
            if (!isNaN(reservationMax) && reservationMax > 0 && reservationMax > maxPersons) {
                maxPersons = reservationMax;
            }
        });
        return Math.max(maxPersons, 1);
    }, [zoneData.reservations]);

    const reservationsWithAvailability = useMemo(() => {
        return zoneData.reservations
            .filter(reservation => getAvailableStock(reservation) > 0)
            .map(reservation => {
                const maxPersonsPerReservation = Number(reservation.maxPersonsPerReservation) || 1;
                const fitsPartySize = maxPersonsPerReservation >= partySize;
                return {
                    reservation,
                    isDisabledByPartySize: !fitsPartySize,
                };
            });
    }, [zoneData.reservations, partySize]);

    const hasAvailableReservationsForPartySize = reservationsWithAvailability.some(r => !r.isDisabledByPartySize);

    const selectedReservationId = useMemo(() => {
        for (const reservation of zoneData.reservations) {
            const hasSelection = reservation.prices?.some(
                price => (selectedQuantities[price.id] || 0) > 0
            );
            if (hasSelection) return reservation.id;
        }
        return null;
    }, [zoneData.reservations, selectedQuantities]);

    const hasSelection = selectedReservationId !== null;

    const handleQuantityChange = useCallback((priceId: string, delta: number) => {
        const targetReservation = zoneData.reservations.find(r =>
            r.prices?.some(p => p.id === priceId)
        );

        if (!targetReservation) return;

        if (selectedReservationId && selectedReservationId !== targetReservation.id && delta > 0) {
            return;
        }

        onQuantityChange(priceId, delta);
    }, [zoneData.reservations, selectedReservationId, onQuantityChange]);

    const handlePartySizeChange = useCallback((delta: number) => {
        const newSize = partySize + delta;
        if (newSize < 1 || newSize > maxPersonsAvailable) return;
        onPartySizeChange(delta);
    }, [partySize, maxPersonsAvailable, onPartySizeChange]);

    return (
        <div className="flex flex-col gap-[24px]">
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-[4px] text-[#f6f6f6] text-[14px] font-medium font-helvetica cursor-pointer w-fit"
            >
                <ChevronLeftIcon />
                <span>{t('event.back_to_zones', 'Volver a zonas')}</span>
            </button>

            <div className="flex flex-col gap-[16px]">
                <div className="bg-[#141414] border-2 border-[#232323] rounded-[16px] px-[8px]">
                    <div className="flex items-center gap-[24px] h-[56px] px-[8px] border-b-[1.5px] border-[#232323]">
                        <span className="text-[#939393] text-[16px] font-medium font-helvetica whitespace-nowrap">
                            {t('event.zone_label', 'Zona')}:
                        </span>
                        <span className="flex-1 text-[#f6f6f6] text-[16px] font-medium font-helvetica text-right truncate">
                            {zoneData.zone.name}
                        </span>
                    </div>
                </div>

                {zoneData.zone.floorPlan && (
                    <div className="flex flex-col gap-[8px]">
                        <div className="px-[6px]">
                            <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                {t('event.zone_floor_plan', 'Plano zona')}
                            </span>
                        </div>
                        <div className="bg-[#141414] border-2 border-[#232323] rounded-[16px] p-[12px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                            <img
                                src={zoneData.zone.floorPlan}
                                alt={zoneData.zone.name}
                                className="w-full h-auto rounded-[4px] border-[1.5px] border-[#252e39]"
                            />
                        </div>
                    </div>
                )}

                <div className="hidden md:flex flex-col gap-[4px]">
                    <div className="px-[6px]">
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {t('event.attendees_count', 'Cantidad de asistentes')}*
                        </span>
                    </div>
                    <div className="bg-[#141414] border-[1.5px] border-[#232323] rounded-[12px] px-[16px] py-[8px] flex items-center gap-[24px]">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePartySizeChange(-1);
                            }}
                            disabled={partySize <= 1}
                            className={`shrink-0 flex items-center justify-center size-[36px] bg-[#232323] rounded-full ${partySize <= 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <MinusIcon />
                        </button>
                        <span className="flex-1 text-center text-[#f6f6f6] text-[32px] font-semibold font-borna leading-none">
                            {partySize}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePartySizeChange(1);
                            }}
                            disabled={partySize >= maxPersonsAvailable}
                            className={`shrink-0 flex items-center justify-center size-[36px] bg-[#232323] rounded-full ${partySize >= maxPersonsAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <PlusIcon />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-[16px]">
                    {reservationsWithAvailability.length > 0 ? (
                        reservationsWithAvailability.map(({ reservation, isDisabledByPartySize }) => {
                            const isDisabledBySelection = selectedReservationId !== null && selectedReservationId !== reservation.id;

                            return (
                                <div
                                    key={reservation.id}
                                    className={isDisabledBySelection ? 'opacity-50 pointer-events-none' : ''}
                                >
                                    <ReservationCard
                                        reservation={reservation}
                                        selectedQuantities={selectedQuantities}
                                        onQuantityChange={handleQuantityChange}
                                        onMoreInfo={onMoreInfo}
                                        partySize={partySize}
                                        selectionMode="checkbox"
                                        isDisabledByPartySize={isDisabledByPartySize}
                                    />
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-[#939393] text-[14px] font-helvetica text-center">
                                {t('event.no_reservations_available', 'No hay reservas disponibles')}
                            </p>
                        </div>
                    )}
                </div>

                <Button
                    variant="cta"
                    onClick={onContinue}
                    disabled={!hasSelection}
                    className={`hidden md:flex w-full h-[48px] rounded-[12px] items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${hasSelection ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90' : 'bg-[#232323] text-[#939393] cursor-not-allowed'}`}
                >
                    {t('event.continue', 'Continuar')}
                </Button>
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <div className="h-[24px] bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
                <div className="bg-[#050505] px-[16px] pb-[24px] flex flex-col gap-[16px]">
                    <div className="flex flex-col gap-[4px]">
                        <div className="px-[6px]">
                            <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                {t('event.attendees_count', 'Cantidad de asistentes')}*
                            </span>
                        </div>
                        <div className="bg-[#141414] border-[1.5px] border-[#232323] rounded-[12px] px-[16px] py-[8px] flex items-center gap-[24px]">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handlePartySizeChange(-1);
                                }}
                                disabled={partySize <= 1}
                                className={`shrink-0 flex items-center justify-center size-[36px] bg-[#232323] rounded-full ${partySize <= 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <MinusIcon />
                            </button>
                            <span className="flex-1 text-center text-[#f6f6f6] text-[32px] font-semibold font-borna leading-none">
                                {partySize}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handlePartySizeChange(1);
                                }}
                                disabled={partySize >= maxPersonsAvailable}
                                className={`shrink-0 flex items-center justify-center size-[36px] bg-[#232323] rounded-full ${partySize >= maxPersonsAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <PlusIcon />
                            </button>
                        </div>
                        <Button
                            variant="cta"
                            onClick={onContinue}
                            disabled={!hasSelection}
                            className={`w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${hasSelection ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90' : 'bg-[#232323] text-[#939393] cursor-not-allowed'}`}
                        >
                            {t('event.continue', 'Continuar')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ReservationSummaryCardProps {
    reservation: Reservation;
    priceId: string;
    quantity: number;
    zoneName?: string;
    partySize?: number;
}

const ReservationSummaryCard = ({ reservation, priceId, quantity, zoneName, partySize = 1 }: ReservationSummaryCardProps) => {
    const { t } = useTranslation();

    const price = reservation.prices?.find(p => p.id === priceId);
    if (!price) return null;

    const maxPersonsPerReservation = Number(reservation.maxPersonsPerReservation) || 1;
    const tablesRequired = Math.ceil(partySize / maxPersonsPerReservation);
    const showMultiplier = tablesRequired > 1 || quantity > 1;
    const displayMultiplier = Math.max(tablesRequired, quantity);

    return (
        <div className="flex flex-col bg-[#141414] border-[1.5px] border-[#232323] rounded-[16px] w-full overflow-hidden">
            <div className="flex items-center justify-between px-[16px] py-[16px] border-b-[1.5px] border-[#232323]">
                <div className="flex items-center gap-[6px] flex-1 min-w-0">
                    <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: RESERVATION_COLOR }}
                    />
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                        {reservation.name}
                    </span>
                    {showMultiplier && (
                        <span className="text-[#e5ff88] text-[16px] font-medium font-helvetica ml-1">
                            x{displayMultiplier}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-[4px] px-[10px] py-[4px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {maxPersonsPerReservation}
                    </span>
                    <PersonIcon />
                </div>
            </div>

            {zoneName && (
                <div className="flex items-center justify-between px-[16px] py-[12px]">
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {t('event.zone', 'Zona')}:
                    </span>
                    <span className="text-[#f6f6f6] text-[14px] font-medium font-helvetica">
                        {zoneName}
                    </span>
                </div>
            )}
        </div>
    );
};

interface FormStepProps {
    selectedReservation: SelectedReservationInfo;
    formData: ReservationFormData;
    onFormChange: (data: ReservationFormData) => void;
    onBack: () => void;
    onContinue: () => void;
    total: number;
    zoneName?: string;
    partySize?: number;
}

const FormStep = ({
    selectedReservation,
    formData,
    onFormChange,
    onBack,
    onContinue,
    total,
    zoneName,
    partySize = 1,
}: FormStepProps) => {
    const { t } = useTranslation();

    const isFormValid = formData.reservationName.trim().length > 0;

    return (
        <div className="flex flex-col gap-[24px] pb-[10px] md:pb-0">
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-[4px] text-[#f6f6f6] text-[14px] font-medium font-helvetica cursor-pointer w-fit"
            >
                <ChevronLeftIcon />
                <span>{t('event.back_to_selection', 'Volver a selección')}</span>
            </button>

            <div className="flex flex-col gap-[16px]">

                <div className="px-[6px]">
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {t('event.reservation', 'Reserva')}*
                    </span>
                </div>

                <ReservationSummaryCard
                    reservation={selectedReservation.reservation}
                    priceId={selectedReservation.priceId}
                    quantity={selectedReservation.quantity}
                    zoneName={zoneName}
                    partySize={partySize}
                />

                <div className="flex flex-col gap-[4px]">
                    <div className="px-[6px] py-2.5">
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {t('event.reservation_name', 'Nombre de la reserva')}*
                        </span>
                    </div>
                    <input
                        type="text"
                        value={formData.reservationName}
                        onChange={(e) => onFormChange({ ...formData, reservationName: e.target.value })}
                        placeholder={t('event.reservation_name_placeholder', 'Ej: Mesa de Juan')}
                        className="w-full h-[48px] border-[1.5px] border-[#232323] rounded-[12px] px-[16px] text-[#f6f6f6] text-[16px] font-normal font-helvetica placeholder:text-[#939393] focus:outline-none focus:border-[#939393]"
                    />
                </div>

                <div className="flex flex-col gap-[4px]">
                    <div className="px-[6px] py-2.5">
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {t('event.observations', 'Observaciones')}
                        </span>
                    </div>
                    <textarea
                        value={formData.observations}
                        onChange={(e) => onFormChange({ ...formData, observations: e.target.value })}
                        placeholder={t('event.observations_placeholder', 'Ej: Celebramos un cumpleaños')}
                        rows={3}
                        className="w-full border-[1.5px] border-[#232323] rounded-[12px] px-[16px] py-[12px] text-[#f6f6f6] text-[16px] font-normal font-helvetica placeholder:text-[#939393] focus:outline-none focus:border-[#939393] resize-none"
                    />
                </div>

                <Button
                    variant="cta"
                    onClick={onContinue}
                    disabled={!isFormValid}
                    className={`hidden md:flex w-full h-[48px] rounded-[12px] items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${isFormValid ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90' : 'bg-[#232323] text-[#939393] cursor-not-allowed'}`}
                >
                    {t('event.pay', 'Pagar')} - {total.toFixed(2).replace('.', ',')}€
                </Button>

                <div className="px-[6px]">
                    <p className="text-[#939393] text-[12px] font-normal font-helvetica">
                        {t('event.purchase_terms', 'Al comprar esta entrada, crearás una cuenta y aceptarás nuestros Términos y Condiciones Generales de Uso, Política de Privacidad y Condiciones de Compra de Entradas. Procesamos tus datos personales de acuerdo con nuestra Política de Privacidad.')}
                    </p>
                </div>
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <div className="h-[24px] bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
                <div className="bg-[#050505] px-[16px] pb-[24px]">
                    <Button
                        variant="cta"
                        onClick={onContinue}
                        disabled={!isFormValid}
                        className={`w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${isFormValid ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90' : 'bg-[#232323] text-[#939393] cursor-not-allowed'}`}
                    >
                        {t('event.pay', 'Pagar')} - {total.toFixed(2).replace('.', ',')}€
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ReservationsFlow = ({
    reservations,
    selectedQuantities,
    onQuantityChange,
    onContinue,
    onMoreInfo,
    total,
    isLoading = false,
    storedFormData,
}: ReservationsFlowProps) => {
    const { t } = useTranslation();

    const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
    const [selectedZone, setSelectedZone] = useState<ZoneWithReservations | null>(null);
    const [partySize, setPartySize] = useState(1);
    const [formData, setFormData] = useState<ReservationFormData>(() =>
        storedFormData || {
            reservationName: '',
            partySize: 1,
            observations: '',
        }
    );
    const [hasInitialized, setHasInitialized] = useState(false);

    const zonesWithReservations = useMemo<ZoneWithReservations[]>(() => {
        const zoneMap = new Map<string, ZoneWithReservations>();

        reservations.forEach(reservation => {
            const zones = (reservation.zones && reservation.zones.length > 0)
                ? reservation.zones
                : [{ id: 'default', name: 'General', isActive: true }];

            zones.forEach(zone => {
                if (!zoneMap.has(zone.id)) {
                    zoneMap.set(zone.id, {
                        zone: zone as ReservationZone,
                        reservations: [],
                        minPrice: Infinity,
                    });
                }

                const zoneData = zoneMap.get(zone.id)!;
                zoneData.reservations.push(reservation);

                const minReservationPrice = reservation.prices?.reduce((min, price) => {
                    return price.finalPrice < min ? price.finalPrice : min;
                }, Infinity) || Infinity;

                if (minReservationPrice < zoneData.minPrice) {
                    zoneData.minPrice = minReservationPrice;
                }
            });
        });

        return Array.from(zoneMap.values()).filter(z => z.minPrice !== Infinity);
    }, [reservations]);

    const selectedReservationInfo = useMemo<SelectedReservationInfo | null>(() => {
        for (const reservation of reservations) {
            for (const price of reservation.prices || []) {
                const quantity = selectedQuantities[price.id] || 0;
                if (quantity > 0) {
                    return { reservation, priceId: price.id, quantity };
                }
            }
        }
        return null;
    }, [reservations, selectedQuantities]);

    useEffect(() => {
        if (hasInitialized || isLoading || zonesWithReservations.length === 0) return;

        if (storedFormData && storedFormData.partySize > 0) {
            setPartySize(storedFormData.partySize);
        }

        const hasSelection = Object.values(selectedQuantities).some(q => q > 0);
        if (hasSelection) {
            for (const zoneData of zonesWithReservations) {
                const hasSelectionInZone = zoneData.reservations.some(r =>
                    r.prices?.some(p => (selectedQuantities[p.id] || 0) > 0)
                );
                if (hasSelectionInZone) {
                    setSelectedZone(zoneData);
                    setCurrentStep(storedFormData ? 2 : 1);
                    break;
                }
            }
        }

        setHasInitialized(true);
    }, [hasInitialized, isLoading, zonesWithReservations, selectedQuantities, storedFormData]);

    const handleZoneClick = useCallback((zoneData: ZoneWithReservations) => {
        setSelectedZone(zoneData);
        setCurrentStep(1);
        scrollToTop();
    }, []);

    const handleBackToZones = useCallback(() => {
        setCurrentStep(0);
        setSelectedZone(null);
        scrollToTop();
    }, []);

    const handlePartySizeChange = useCallback((delta: number) => {
        setPartySize(prev => Math.max(1, prev + delta));
    }, []);

    const handleContinueToForm = useCallback(() => {
        setFormData(prev => ({ ...prev, partySize }));
        setCurrentStep(2);
        scrollToTop();
    }, [partySize]);

    const handleBackToSelection = useCallback(() => {
        setCurrentStep(1);
        scrollToTop();
    }, []);

    const handleSubmit = useCallback(() => {
        onContinue({ ...formData, partySize });
    }, [onContinue, formData, partySize]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                    <ZoneCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (reservations.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-[#939393] text-[14px] font-helvetica">
                    {t('event.no_reservations', 'No hay reservas disponibles')}
                </p>
            </div>
        );
    }

    switch (currentStep) {
        case 0:
            return (
                <div className="flex flex-col gap-4">
                    {zonesWithReservations.map(zoneData => {
                        const zoneHasSelection = zoneData.reservations.some(reservation =>
                            reservation.prices?.some(price => (selectedQuantities[price.id] || 0) > 0)
                        );
                        return (
                            <ZoneCard
                                key={zoneData.zone.id}
                                zoneData={zoneData}
                                onClick={() => handleZoneClick(zoneData)}
                                hasSelectedItems={zoneHasSelection}
                            />
                        );
                    })}
                </div>
            );

        case 1:
            if (!selectedZone) return null;
            return (
                <SelectionStep
                    zoneData={selectedZone}
                    selectedQuantities={selectedQuantities}
                    onQuantityChange={onQuantityChange}
                    onMoreInfo={onMoreInfo}
                    partySize={partySize}
                    onPartySizeChange={handlePartySizeChange}
                    onBack={handleBackToZones}
                    onContinue={handleContinueToForm}
                />
            );

        case 2:
            if (!selectedZone || !selectedReservationInfo) return null;
            return (
                <FormStep
                    selectedReservation={selectedReservationInfo}
                    formData={formData}
                    onFormChange={setFormData}
                    onBack={handleBackToSelection}
                    onContinue={handleSubmit}
                    total={total}
                    zoneName={selectedZone.zone.name}
                    partySize={partySize}
                />
            );

        default:
            return null;
    }
};

export default ReservationsFlow;
export type { Reservation, ReservationZone, ZoneWithReservations, ReservationFormData };
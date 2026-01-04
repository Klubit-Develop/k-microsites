import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ReservationCard, { type Reservation, type ReservationZone } from './ReservationCard';

// ============================================
// TYPES
// ============================================

interface ZoneWithReservations {
    zone: ReservationZone;
    reservations: Reservation[];
    minPrice: number;
}

interface ReservationFormData {
    reservationName: string;
    reservationTime: string;
    observations: string;
}

interface ReservationsFlowProps {
    reservations: Reservation[];
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onContinue: () => void;
    total: number;
    isLoading?: boolean;
}

// ============================================
// ICONS
// ============================================

const ChevronLeftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12.5 15L7.5 10L12.5 5" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M5 7.5L10 12.5L15 7.5" stroke="#939393" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Color cyan para reservas
const RESERVATION_COLOR = '#3fe8e8';

// ============================================
// STEP 0: ZONES LIST
// ============================================

interface ZoneCardProps {
    zoneData: ZoneWithReservations;
    onClick: () => void;
}

const ZoneCard = ({ zoneData, onClick }: ZoneCardProps) => {
    const { t } = useTranslation();

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-[#141414] border-2 border-[#232323] rounded-[16px] cursor-pointer transition-colors hover:border-[#3fe8e8] group"
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ backgroundColor: RESERVATION_COLOR }}
                />
                <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                    {t('event.reservations_zone', 'Reservas')}: {zoneData.zone.name}
                </span>
            </div>
            <span className="text-[#939393] text-[14px] font-medium font-helvetica group-hover:text-[#3fe8e8]">
                {t('event.from_price', 'Desde')} {zoneData.minPrice.toFixed(2).replace('.', ',')}€
            </span>
        </button>
    );
};

const ZoneCardSkeleton = () => (
    <div className="w-full flex items-center justify-between p-4 bg-[#141414] border-2 border-[#232323] rounded-[16px] animate-pulse">
        <div className="flex items-center gap-3">
            <div className="w-[6px] h-[6px] rounded-full bg-[#232323]" />
            <div className="h-4 w-40 bg-[#232323] rounded" />
        </div>
        <div className="h-4 w-20 bg-[#232323] rounded" />
    </div>
);

// ============================================
// STEP 1: ZONE DETAIL (Plano + Personas + Reservas)
// ============================================

interface ZoneDetailProps {
    zoneData: ZoneWithReservations;
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onBack: () => void;
    onContinue: () => void;
    partySize: number;
    onPartySizeChange: (size: number) => void;
}

const ZoneDetail = ({
    zoneData,
    selectedQuantities,
    onQuantityChange,
    onBack,
    onContinue,
    partySize,
    onPartySizeChange,
}: ZoneDetailProps) => {
    const { t } = useTranslation();

    const hasSelection = zoneData.reservations.some(reservation =>
        reservation.prices?.some(price => (selectedQuantities[price.id] || 0) > 0)
    );

    return (
        <div className="flex flex-col gap-[36px]">
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[#939393] hover:text-[#f6f6f6] transition-colors self-start"
            >
                <ChevronLeftIcon />
                <span className="text-[14px] font-medium font-helvetica">
                    {t('common.back', 'Volver')}
                </span>
            </button>

            {/* Zone floor plan */}
            {zoneData.zone.floorPlan && (
                <div className="flex flex-col gap-[4px]">
                    <div className="px-[6px]">
                        <span className="text-[#939393] text-[16px] font-medium font-helvetica">
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

            {/* Party size input */}
            <div className="flex flex-col gap-[16px]">
                <div className="flex flex-col gap-[4px]">
                    <div className="px-[6px]">
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {t('event.party_size', 'Cantidad de personas')}*
                        </span>
                    </div>
                    <div className="border-[1.5px] border-[#232323] rounded-[12px] px-[16px] py-[12px] flex items-center justify-between">
                        <input
                            type="number"
                            min="1"
                            value={partySize || ''}
                            onChange={(e) => onPartySizeChange(parseInt(e.target.value) || 0)}
                            placeholder={t('event.party_size_placeholder', 'Ej: 6')}
                            className="bg-transparent text-[#f6f6f6] text-[16px] font-medium font-helvetica outline-none flex-1 placeholder:text-[#939393]"
                        />
                    </div>
                </div>
                <div className="px-[6px]">
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {t('event.party_size_hint', 'Indica la cantidad de personas que sois para poder recomendar que reservados coger.')}
                    </span>
                </div>
            </div>

            {/* Reservation cards */}
            <div className="flex flex-col gap-[16px]">
                {zoneData.reservations.map(reservation => (
                    <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        selectedQuantities={selectedQuantities}
                        onQuantityChange={onQuantityChange}
                    />
                ))}
            </div>

            {/* Continue button */}
            <button
                onClick={onContinue}
                disabled={!hasSelection}
                className={`w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${hasSelection ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90' : 'bg-[#232323] text-[#939393] cursor-not-allowed'}`}
            >
                {t('event.continue_reservation', 'Continuar con la reserva')}
            </button>

            {/* Legal text */}
            <div className="px-[6px]">
                <p className="text-[12px] font-medium font-helvetica text-[rgba(246,246,246,0.5)]">
                    {t('event.purchase_terms', 'Comprando esta entrada, abrirás una cuenta y aceptarás nuestras Condiciones de Uso generales, la Política de Privacidad y las Condiciones de Compra de entradas. Procesamos tus datos personales de acuerdo con nuestra Política de Privacidad.')}
                </p>
            </div>
        </div>
    );
};

// ============================================
// STEP 2: RESERVATION FORM
// ============================================

interface ReservationFormProps {
    zoneData: ZoneWithReservations;
    selectedQuantities: Record<string, number>;
    formData: ReservationFormData;
    onFormChange: (data: ReservationFormData) => void;
    onBack: () => void;
    onContinue: () => void;
    total: number;
}

const ReservationForm = ({
    zoneData,
    selectedQuantities,
    formData,
    onFormChange,
    onBack,
    onContinue,
    total,
}: ReservationFormProps) => {
    const { t } = useTranslation();

    // Find selected reservation
    const selectedReservation = zoneData.reservations.find(reservation =>
        reservation.prices?.some(price => (selectedQuantities[price.id] || 0) > 0)
    );

    // Check if form is valid
    const isFormValid = formData.reservationName.trim() !== '' && formData.reservationTime !== '';

    // Generate time options (every 30 minutes from 22:00 to 05:00)
    const timeOptions = useMemo(() => {
        const options: string[] = [];
        for (let hour = 22; hour <= 23; hour++) {
            options.push(`${hour}:00`);
            options.push(`${hour}:30`);
        }
        for (let hour = 0; hour <= 5; hour++) {
            options.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 5) options.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return options;
    }, []);

    return (
        <div className="flex flex-col gap-[36px]">
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[#939393] hover:text-[#f6f6f6] transition-colors self-start"
            >
                <ChevronLeftIcon />
                <span className="text-[14px] font-medium font-helvetica">
                    {t('common.back', 'Volver')}
                </span>
            </button>

            {/* Selected reservation card (read-only view) */}
            {selectedReservation && (
                <ReservationCard
                    reservation={selectedReservation}
                    selectedQuantities={selectedQuantities}
                    onQuantityChange={() => { }} // Read-only in this step
                />
            )}

            {/* Form fields */}
            <div className="flex flex-col gap-[24px]">
                {/* Reservation name */}
                <div className="flex flex-col gap-[4px]">
                    <div className="px-[6px]">
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {t('event.reservation_name', 'Nombre de la reserva')}*
                        </span>
                    </div>
                    <input
                        type="text"
                        value={formData.reservationName}
                        onChange={(e) => onFormChange({ ...formData, reservationName: e.target.value })}
                        placeholder={t('event.reservation_name_placeholder', 'Ej: Cumpleaños de Borja')}
                        className="border-[1.5px] border-[#232323] rounded-[12px] px-[16px] py-[12px] bg-transparent text-[#f6f6f6] text-[16px] font-medium font-helvetica outline-none placeholder:text-[#939393] focus:border-[#3fe8e8] transition-colors"
                    />
                </div>

                {/* Reservation time */}
                <div className="flex flex-col gap-[4px]">
                    <div className="px-[6px]">
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {t('event.reservation_time', 'Hora de la reserva')}*
                        </span>
                    </div>
                    <div className="relative">
                        <select
                            value={formData.reservationTime}
                            onChange={(e) => onFormChange({ ...formData, reservationTime: e.target.value })}
                            className="w-full border-[1.5px] border-[#232323] rounded-[12px] px-[16px] py-[12px] bg-transparent text-[#f6f6f6] text-[16px] font-medium font-helvetica outline-none appearance-none cursor-pointer focus:border-[#3fe8e8] transition-colors"
                        >
                            <option value="" className="bg-[#141414]">
                                {t('event.reservation_time_placeholder', 'Selecciona una hora...')}
                            </option>
                            {timeOptions.map(time => (
                                <option key={time} value={time} className="bg-[#141414]">
                                    {time}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-[16px] top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDownIcon />
                        </div>
                    </div>
                </div>

                {/* Observations */}
                <div className="flex flex-col gap-[4px]">
                    <div className="px-[6px]">
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {t('event.observations', 'Observaciones')}
                        </span>
                    </div>
                    <textarea
                        value={formData.observations}
                        onChange={(e) => onFormChange({ ...formData, observations: e.target.value })}
                        placeholder={t('event.observations_placeholder', 'Ej: Ropero incluido')}
                        rows={4}
                        className="border-[1.5px] border-[#232323] rounded-[12px] px-[16px] py-[12px] bg-transparent text-[#f6f6f6] text-[16px] font-medium font-helvetica outline-none placeholder:text-[#939393] resize-none focus:border-[#3fe8e8] transition-colors"
                    />
                </div>
            </div>

            {/* Continue button */}
            <button
                onClick={onContinue}
                disabled={!isFormValid}
                className={`w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${isFormValid ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90' : 'bg-[#232323] text-[#939393] cursor-not-allowed'}`}
            >
                {t('event.continue', 'Continuar')} - {total.toFixed(2).replace('.', ',')}€
            </button>

            {/* Legal text */}
            <div className="px-[6px]">
                <p className="text-[12px] font-medium font-helvetica text-[rgba(246,246,246,0.5)]">
                    {t('event.purchase_terms', 'Comprando esta entrada, abrirás una cuenta y aceptarás nuestras Condiciones de Uso generales, la Política de Privacidad y las Condiciones de Compra de entradas. Procesamos tus datos personales de acuerdo con nuestra Política de Privacidad.')}
                </p>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT: RESERVATIONS FLOW
// ============================================

const ReservationsFlow = ({
    reservations,
    selectedQuantities,
    onQuantityChange,
    onContinue,
    total,
    isLoading = false,
}: ReservationsFlowProps) => {
    const { t } = useTranslation();

    // Flow state
    const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
    const [selectedZone, setSelectedZone] = useState<ZoneWithReservations | null>(null);
    const [partySize, setPartySize] = useState<number>(0);
    const [formData, setFormData] = useState<ReservationFormData>({
        reservationName: '',
        reservationTime: '',
        observations: '',
    });

    // Group reservations by zone
    const zonesWithReservations = useMemo<ZoneWithReservations[]>(() => {
        const zoneMap = new Map<string, ZoneWithReservations>();

        reservations.forEach(reservation => {
            const zones = (reservation.zones && reservation.zones.length > 0)
                ? reservation.zones
                : [{ id: 'general', name: t('event.general_zone', 'General'), description: null, coverImage: null, floorPlan: null, isActive: true }];

            zones.forEach(zone => {
                const existing = zoneMap.get(zone.id);
                const minPrice = Math.min(...(reservation.prices?.map(p => p.finalPrice) || [0]));

                if (existing) {
                    existing.reservations.push(reservation);
                    existing.minPrice = Math.min(existing.minPrice, minPrice);
                } else {
                    zoneMap.set(zone.id, {
                        zone,
                        reservations: [reservation],
                        minPrice,
                    });
                }
            });
        });

        return Array.from(zoneMap.values());
    }, [reservations, t]);

    // Handlers
    const handleZoneClick = useCallback((zoneData: ZoneWithReservations) => {
        setSelectedZone(zoneData);
        setCurrentStep(1);
    }, []);

    const handleBackToZones = useCallback(() => {
        setCurrentStep(0);
        setSelectedZone(null);
    }, []);

    const handleContinueToForm = useCallback(() => {
        setCurrentStep(2);
    }, []);

    const handleBackToDetail = useCallback(() => {
        setCurrentStep(1);
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                    <ZoneCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    // Empty state
    if (reservations.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-[#939393] text-[14px] font-helvetica">
                    {t('event.no_reservations', 'No hay reservados disponibles')}
                </p>
            </div>
        );
    }

    // Render based on current step
    switch (currentStep) {
        case 0:
            return (
                <div className="flex flex-col gap-4">
                    {zonesWithReservations.map(zoneData => (
                        <ZoneCard
                            key={zoneData.zone.id}
                            zoneData={zoneData}
                            onClick={() => handleZoneClick(zoneData)}
                        />
                    ))}
                </div>
            );

        case 1:
            if (!selectedZone) return null;
            return (
                <ZoneDetail
                    zoneData={selectedZone}
                    selectedQuantities={selectedQuantities}
                    onQuantityChange={onQuantityChange}
                    onBack={handleBackToZones}
                    onContinue={handleContinueToForm}
                    partySize={partySize}
                    onPartySizeChange={setPartySize}
                />
            );

        case 2:
            if (!selectedZone) return null;
            return (
                <ReservationForm
                    zoneData={selectedZone}
                    selectedQuantities={selectedQuantities}
                    formData={formData}
                    onFormChange={setFormData}
                    onBack={handleBackToDetail}
                    onContinue={onContinue}
                    total={total}
                />
            );

        default:
            return null;
    }
};

export default ReservationsFlow;
export type { Reservation, ReservationZone, ZoneWithReservations, ReservationFormData };
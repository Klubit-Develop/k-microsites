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
    partySize: number;
    observations: string;
}

interface ReservationsFlowProps {
    reservations: Reservation[];
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onContinue: (formData: ReservationFormData) => void;
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
            className="w-full bg-[#141414] border-2 border-[#232323] rounded-[16px] px-[16px] py-[16px] cursor-pointer transition-colors hover:border-[#3fe8e8] group text-left"
        >
            <div className="flex flex-col gap-[2px]">
                <div className="flex items-center gap-[6px]">
                    <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: RESERVATION_COLOR }}
                    />
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                        {t('event.reservations_zone', 'Reservas')}: {zoneData.zone.name}
                    </span>
                </div>
                <span className="text-[#939393] text-[14px] font-normal font-helvetica ml-[12px]">
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

// ============================================
// ZONE HEADER COMPONENT (reusable)
// ============================================

interface ZoneHeaderProps {
    zoneData: ZoneWithReservations;
}

const ZoneHeader = ({ zoneData }: ZoneHeaderProps) => {
    const { t } = useTranslation();

    return (
        <div className="w-full bg-[#141414] border-2 border-[#232323] rounded-[16px] px-[16px] py-[16px]">
            <div className="flex flex-col gap-[2px]">
                <div className="flex items-center gap-[6px]">
                    <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: RESERVATION_COLOR }}
                    />
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                        {t('event.reservations_zone', 'Reservas')}: {zoneData.zone.name}
                    </span>
                </div>
                <span className="text-[#939393] text-[14px] font-normal font-helvetica ml-[12px]">
                    {t('event.from_price', 'Desde')} {zoneData.minPrice.toFixed(2).replace('.', ',')}€
                </span>
            </div>
        </div>
    );
};

// ============================================
// STEP 1: RESERVATION FORM (Nombre, Cantidad personas, Observaciones)
// ============================================

interface ReservationFormStepProps {
    zoneData: ZoneWithReservations;
    formData: ReservationFormData;
    onFormChange: (data: ReservationFormData) => void;
    onBack: () => void;
    onContinue: () => void;
}

const ReservationFormStep = ({
    zoneData,
    formData,
    onFormChange,
    onBack,
    onContinue,
}: ReservationFormStepProps) => {
    const { t } = useTranslation();

    const handlePartySizeChange = (delta: number) => {
        const newSize = Math.max(1, formData.partySize + delta);
        onFormChange({ ...formData, partySize: newSize });
    };

    return (
        <div className="flex flex-col gap-[32px]">
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

            {/* Zone header */}
            <ZoneHeader zoneData={zoneData} />

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
                        placeholder={t('event.reservation_name_placeholder', '')}
                        className="border-[1.5px] border-[#232323] rounded-[12px] px-[16px] py-[12px] bg-transparent text-[#f6f6f6] text-[16px] font-medium font-helvetica outline-none placeholder:text-[#939393] focus:border-[#3fe8e8] transition-colors"
                    />
                </div>

                {/* Party size - Counter style like Figma */}
                <div className="flex flex-col gap-[4px]">
                    <div className="px-[6px]">
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {t('event.party_size', 'Cantidad de personas')}*
                        </span>
                    </div>
                    <div className="bg-[#141414] border-[1.5px] border-[#232323] rounded-[12px] px-[16px] py-[12px] flex items-center gap-[24px]">
                        <button
                            onClick={() => handlePartySizeChange(-1)}
                            disabled={formData.partySize <= 1}
                            className={`shrink-0 ${formData.partySize <= 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <MinusIcon />
                        </button>
                        <span className="flex-1 text-center text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                            {formData.partySize}
                        </span>
                        <button
                            onClick={() => handlePartySizeChange(1)}
                            className="shrink-0 cursor-pointer"
                        >
                            <PlusIcon />
                        </button>
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
                        placeholder={t('event.observations_placeholder', '')}
                        rows={5}
                        className="border-[1.5px] border-[#232323] rounded-[12px] px-[16px] py-[12px] bg-transparent text-[#f6f6f6] text-[16px] font-medium font-helvetica outline-none placeholder:text-[#939393] resize-none focus:border-[#3fe8e8] transition-colors h-[144px]"
                    />
                </div>
            </div>

            {/* Continue button */}
            <button
                onClick={onContinue}
                disabled={!formData.reservationName.trim()}
                className={`w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${formData.reservationName.trim() ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90' : 'bg-[#232323] text-[#939393] cursor-not-allowed'}`}
            >
                {t('event.view_reservations', 'Ver reservas')}
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
// STEP 2: RESERVATION SELECTION (Plano + Cards con selector)
// ============================================

interface ReservationSelectionStepProps {
    zoneData: ZoneWithReservations;
    selectedQuantities: Record<string, number>;
    onQuantityChange: (priceId: string, delta: number) => void;
    onBack: () => void;
    onContinue: () => void;
    total: number;
    formData: ReservationFormData;
}

const ReservationSelectionStep = ({
    zoneData,
    selectedQuantities,
    onQuantityChange,
    onBack,
    onContinue,
    total,
}: ReservationSelectionStepProps) => {
    const { t } = useTranslation();

    const hasSelection = zoneData.reservations.some(reservation =>
        reservation.prices?.some(price => (selectedQuantities[price.id] || 0) > 0)
    );

    return (
        <div className="flex flex-col gap-[32px]">
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

            {/* Zone header */}
            <ZoneHeader zoneData={zoneData} />

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

            {/* Pay button */}
            <button
                onClick={onContinue}
                disabled={!hasSelection}
                className={`w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${hasSelection ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90' : 'bg-[#232323] text-[#939393] cursor-not-allowed'}`}
            >
                {hasSelection
                    ? `${t('event.pay', 'Pagar')} - ${total.toFixed(2).replace('.', ',')}€`
                    : t('event.select_reservation', 'Selecciona una reserva')
                }
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

    // Flow state: 0 = zones list, 1 = form, 2 = selection
    const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
    const [selectedZone, setSelectedZone] = useState<ZoneWithReservations | null>(null);
    const [formData, setFormData] = useState<ReservationFormData>({
        reservationName: '',
        partySize: 1,
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
        setCurrentStep(1); // Go to form step
    }, []);

    const handleBackToZones = useCallback(() => {
        setCurrentStep(0);
        setSelectedZone(null);
        setFormData({
            reservationName: '',
            partySize: 1,
            observations: '',
        });
    }, []);

    const handleContinueToSelection = useCallback(() => {
        setCurrentStep(2); // Go to selection step
    }, []);

    const handleBackToForm = useCallback(() => {
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
            // Step 0: Zones list
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
            // Step 1: Form (nombre, cantidad personas, observaciones)
            if (!selectedZone) return null;
            return (
                <ReservationFormStep
                    zoneData={selectedZone}
                    formData={formData}
                    onFormChange={setFormData}
                    onBack={handleBackToZones}
                    onContinue={handleContinueToSelection}
                />
            );

        case 2:
            // Step 2: Selection (plano + cards)
            if (!selectedZone) return null;
            return (
                <ReservationSelectionStep
                    zoneData={selectedZone}
                    selectedQuantities={selectedQuantities}
                    onQuantityChange={onQuantityChange}
                    onBack={handleBackToForm}
                    onContinue={() => onContinue(formData)}
                    total={total}
                    formData={formData}
                />
            );

        default:
            return null;
    }
};

export default ReservationsFlow;
export type { Reservation, ReservationZone, ZoneWithReservations, ReservationFormData };
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

// Agrupación de reservas por zona
interface ZoneWithReservations {
    zone: ReservationZone;
    reservations: Reservation[];
    minPrice: number;
}

interface ReservationZoneCardProps {
    zoneData: ZoneWithReservations;
    onClick?: () => void;
    isLoading?: boolean;
    className?: string;
}

// Color cyan para reservas
const RESERVATION_COLOR = '#3fe8e8';

const ReservationZoneCard = ({
    zoneData,
    onClick,
    isLoading = false,
    className = '',
}: ReservationZoneCardProps) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className={`bg-[#141414] border-2 border-[#232323] rounded-[16px] px-[16px] py-[16px] w-full animate-pulse ${className}`}>
                <div className="flex flex-col gap-[2px]">
                    <div className="flex items-center gap-[6px]">
                        <div className="w-[6px] h-[6px] bg-[#232323] rounded-full" />
                        <div className="h-5 w-48 bg-[#232323] rounded" />
                    </div>
                    <div className="h-4 w-24 bg-[#232323] rounded ml-[12px]" />
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`
                bg-[#141414] border-2 border-[#232323] rounded-[16px] px-[16px] py-[16px] w-full
                text-left transition-colors
                hover:border-[#3fe8e8] hover:bg-[#1a1a1a]
                cursor-pointer
                ${className}
            `}
        >
            <div className="flex flex-col gap-[2px]">
                {/* Zone name with indicator */}
                <div className="flex items-center gap-[6px]">
                    <div
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ backgroundColor: RESERVATION_COLOR }}
                    />
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                        {t('event.reservations', 'Reservas')}: {zoneData.zone.name}
                    </span>
                </div>
                {/* Price from */}
                <span className="text-[#939393] text-[14px] font-normal font-helvetica ml-[12px]">
                    {t('event.from_price', 'Desde')} {zoneData.minPrice.toFixed(2).replace('.', ',')}€
                </span>
            </div>
        </button>
    );
};

// Componente para la lista completa de zonas de reserva
interface ReservationsListProps {
    reservations: Reservation[];
    onZoneClick?: (zone: ZoneWithReservations) => void;
    isLoading?: boolean;
    className?: string;
}

const ReservationsList = ({
    reservations,
    onZoneClick,
    isLoading = false,
    className = '',
}: ReservationsListProps) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[16px] w-full ${className}`}>
                {[1, 2, 3].map((index) => (
                    <ReservationZoneCard
                        key={index}
                        zoneData={{} as ZoneWithReservations}
                        isLoading={true}
                    />
                ))}
            </div>
        );
    }

    // Agrupar reservas por zona
    const groupedByZone = reservations.reduce<Record<string, ZoneWithReservations>>((acc, reservation) => {
        reservation.zones.forEach(zone => {
            if (!acc[zone.id]) {
                acc[zone.id] = {
                    zone,
                    reservations: [],
                    minPrice: Infinity,
                };
            }
            acc[zone.id].reservations.push(reservation);

            // Calcular precio mínimo
            const minPriceInReservation = Math.min(
                ...reservation.prices.map(p => p.finalPrice)
            );
            if (minPriceInReservation < acc[zone.id].minPrice) {
                acc[zone.id].minPrice = minPriceInReservation;
            }
        });
        return acc;
    }, {});

    const zonesList = Object.values(groupedByZone);

    // Si hay reservas sin zona, agruparlas como "General"
    const reservationsWithoutZone = reservations.filter(r => r.zones.length === 0);
    if (reservationsWithoutZone.length > 0) {
        const minPrice = Math.min(
            ...reservationsWithoutZone.flatMap(r => r.prices.map(p => p.finalPrice))
        );
        zonesList.push({
            zone: {
                id: 'general',
                name: t('event.general_zone', 'General'),
                description: null,
                coverImage: null,
                floorPlan: null,
                isActive: true,
            },
            reservations: reservationsWithoutZone,
            minPrice,
        });
    }

    if (zonesList.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-col gap-[16px] w-full ${className}`}>
            {zonesList.map(zoneData => (
                <ReservationZoneCard
                    key={zoneData.zone.id}
                    zoneData={zoneData}
                    onClick={() => onZoneClick?.(zoneData)}
                />
            ))}
        </div>
    );
};

export default ReservationsList;
export { ReservationZoneCard };
export type { Reservation, ReservationPrice, ReservationZone, ZoneWithReservations };
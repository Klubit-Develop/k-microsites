import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';

import LikesPill from '@/components/LikesPill';
import LocationCard from '@/components/LocationCard';
import PageError from '@/components/common/PageError';
import Button from '@/components/ui/Button';

interface Artist {
    id: string;
    artisticName: string;
    firstName: string;
    lastName: string;
    avatar: string;
}

interface Vibe {
    id: string;
    name: string;
}

interface Music {
    id: string;
    name: string;
}

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
    prices: TicketPrice[];
}

interface Guestlist {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    maxPerUser: number;
    maxPersonsPerGuestlist: number;
    prices: TicketPrice[];
}

interface Reservation {
    id: string;
    name: string;
    maxPerUser: number;
    maxPersonsPerReservation: number;
    termsAndConditions: string;
    prices: TicketPrice[];
}

interface Promotion {
    id: string;
    name: string;
    description: string;
    type: string;
    value: number;
    termsAndConditions: string;
}

interface Club {
    id: string;
    name: string;
    slug: string;
    logo: string;
    venueType: string;
}

interface Event {
    id: string;
    name: string;
    slug: string;
    description: string;
    flyer: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    minimumAge: number;
    address: string;
    addressLocation: { 
        type: string;
        coordinates: [number, number];
    };
    termsAndConditions: string;
    club: Club;
    artists: Artist[];
    vibes: Vibe[];
    musics: Music[];
    tickets: Ticket[];
    guestlists: Guestlist[];
    reservations: Reservation[];
    promotions: Promotion[];
    _count: {
        favorites: number;
    };
}

interface EventResponse {
    status: 'success' | 'error';
    code: string;
    data: { event: Event };
    message: string;
}

const VENUE_TYPE_MAP: Record<string, string> = {
    CLUB: 'Club',
    DISCO: 'Discoteca',
    BAR: 'Bar',
    LOUNGE: 'Lounge',
    PUB: 'Pub',
};

const EventPage = () => {
    const { slug } = useParams({ strict: false });
    const { i18n, t } = useTranslation();

    const locale = i18n.language === 'en' ? 'en' : 'es';

    const [activeTab, setActiveTab] = useState<'tickets' | 'guestlists' | 'reservations' | 'products' | 'promotions'>('tickets');
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const eventQuery = useQuery({
        queryKey: ['event', slug],
        queryFn: async (): Promise<Event> => {
            const response = await axiosInstance.get<EventResponse>(`/v2/events/slug/${slug}`);
            return response.data.data.event;
        },
        enabled: !!slug,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const formatEventDate = (dateString: string): string => {
        const formatted = dayjs(dateString).locale(locale).format('ddd, D MMMM');
        return formatted.charAt(0).toLowerCase() + formatted.slice(1);
    };

    const formatEventTime = (startTime: string, endTime: string): string => {
        return `${startTime} - ${endTime}`;
    };

    const handleQuantityChange = (priceId: string, delta: number) => {
        setSelectedQuantities(prev => {
            const current = prev[priceId] || 0;
            const newValue = Math.max(0, current + delta);
            return { ...prev, [priceId]: newValue };
        });
    };

    const calculateTotal = (): number => {
        if (!eventQuery.data?.tickets) return 0;
        
        let total = 0;
        eventQuery.data.tickets.forEach(ticket => {
            ticket.prices?.forEach(price => {
                const quantity = selectedQuantities[price.id] || 0;
                total += (price.finalPrice ?? 0) * quantity;
            });
        });
        return total;
    };

    const getTotalQuantity = (): number => {
        return Object.values(selectedQuantities).reduce((sum, qty) => sum + qty, 0);
    };

    if (eventQuery.isError) {
        return <PageError />;
    }

    if (eventQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050505]">
                <div className="w-8 h-8 border-2 border-[#ff336d] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const event = eventQuery.data;
    if (!event) return <PageError />;

    const total = calculateTotal();
    const totalQuantity = getTotalQuantity();

    const tabs = [
        { key: 'tickets', label: t('event.tabs.tickets', 'Entradas') },
        { key: 'guestlists', label: t('event.tabs.guestlists', 'Guestlists') },
        { key: 'reservations', label: t('event.tabs.reservations', 'Reservados') },
        { key: 'products', label: t('event.tabs.products', 'Productos') },
        { key: 'promotions', label: t('event.tabs.promotions', 'Promociones') },
    ];

    const allTags = [
        ...(event.minimumAge ? [`+${event.minimumAge}`] : []),
        ...(event.club?.venueType ? [VENUE_TYPE_MAP[event.club.venueType] || event.club.venueType] : []),
        ...event.vibes.map(v => v.name),
        ...event.musics.map(m => m.name),
    ];

    return (
        <div className="bg-[#050505] min-h-screen flex flex-col gap-[60px] items-center py-24">
            {/* Stepper */}
            <div className="flex items-center justify-center w-full px-[470px]">
                <div className="flex items-center gap-[7px] px-6">
                    <div className="flex items-center justify-center w-[23px] h-[23px] bg-[#e5ff88] border border-[#e5ff88] rounded-full">
                        <span className="text-[#141414] text-[16px] font-medium font-helvetica">1</span>
                    </div>
                    <span className="text-[#e5ff88] text-[14px] font-normal font-helvetica">
                        {t('event.stepper.rates', 'Tarifas')}
                    </span>
                </div>
                <div className="flex-1 h-px bg-[#939393]" />
                <div className="flex items-center gap-[7px] px-6">
                    <div className="flex items-center justify-center w-[23px] h-[23px] bg-[#939393] border border-[#939393] rounded-full">
                        <span className="text-[#141414] text-[16px] font-medium font-helvetica">2</span>
                    </div>
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {t('event.stepper.payment', 'Pago')}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex items-start justify-between w-full px-64 gap-8">
                {/* Left Column - Event Info */}
                <div className="flex flex-col gap-[36px] w-[500px] rounded-[10px]">
                    {/* Event Header */}
                    <div className="flex flex-col items-center h-[555px] relative">
                        <div className="relative w-full h-[504px]">
                            {/* Flyer */}
                            <div className="absolute left-1/2 -translate-x-1/2 w-[402px] h-[504px] rounded-2xl overflow-hidden">
                                <img
                                    src={event.flyer || '/placeholder-event.jpg'}
                                    alt={event.name}
                                    className="w-full h-full object-cover"
                                />
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-linear-to-b from-transparent from-50% to-[#050505] rounded-2xl" />
                                {/* Blur overlay */}
                                <div className="absolute inset-0 bg-linear-to-b from-transparent to-[rgba(5,5,5,0.5)] backdrop-blur-[1.5px] rounded-2xl" />
                            </div>

                            {/* Event Profile */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-[400px] w-[370px] flex flex-col gap-[16px] items-center justify-center rounded-[10px]">
                                <LikesPill
                                    count={event._count?.favorites || 0}
                                    isLiked={false}
                                    onClick={() => {}}
                                />

                                {/* Contenido */}
                                <div className="flex flex-col gap-[2px] items-center justify-center w-full px-[24px] py-[4px] shadow-[0px_0px_30px_0px_black]">
                                    <h1
                                        className="text-[#f6f6f6] text-[24px] font-semibold text-center leading-normal"
                                        style={{ fontFamily: "'Borna', sans-serif" }}
                                    >
                                        {event.name}
                                    </h1>
                                    {/* Fecha y hora */}
                                    <div className="flex gap-[6px] items-center justify-center w-full">
                                        <span className="text-[#e5ff88] text-[16px] font-medium font-helvetica">
                                            {formatEventDate(event.startDate)}
                                        </span>
                                        <div className="w-[3px] h-[3px] bg-[#e5ff88] rounded-full" />
                                        <span className="text-[#e5ff88] text-[16px] font-medium font-helvetica">
                                            {formatEventTime(event.startTime, event.endTime)}
                                        </span>
                                    </div>
                                    {/* Localización */}
                                    <div className="flex gap-[8px] items-center py-px">
                                        <div className="flex items-center justify-center w-[4px] pt-[2px]">
                                            <span className="text-[#f6f6f6] text-[14px] font-medium font-helvetica">📍</span>
                                        </div>
                                        <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                                            {event.address}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-[8px] items-center justify-center w-full mt-8">
                            {allTags.map((tag, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-center h-9 px-3.5 border-[1.5px] border-[#232323] rounded-[20px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]"
                                >
                                    <span className="text-[#f6f6f6] text-[14px] font-normal font-helvetica">
                                        {tag}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="flex flex-col gap-[12px] w-full">
                            <div className="px-[6px]">
                                <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                                    {t('event.about', 'Sobre el evento')}
                                </span>
                            </div>
                            <div className="px-[6px]">
                                {event.description.length > 150 ? (
                                    <button
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="text-left"
                                    >
                                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                            {isDescriptionExpanded 
                                                ? event.description 
                                                : `${event.description.slice(0, 150)}...`
                                            }
                                        </span>
                                        <span className="text-[#f6f6f6] text-[14px] font-bold font-helvetica ml-1">
                                            {isDescriptionExpanded 
                                                ? t('event.read_less', 'Leer menos') 
                                                : t('event.read_more', 'Leer más')
                                            }
                                        </span>
                                    </button>
                                ) : (
                                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                        {event.description}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Artists */}
                    {event.artists.length > 0 && (
                        <div className="flex flex-col gap-[16px] w-full">
                            <div className="flex items-center gap-[8px] px-[6px]">
                                <h2
                                    className="text-[#ff336d] text-[24px] font-semibold"
                                    style={{ fontFamily: "'Borna', sans-serif" }}
                                >
                                    {t('event.artists', 'Artistas')}
                                </h2>
                            </div>
                            {event.artists.map(artist => (
                                <div
                                    key={artist.id}
                                    className="flex gap-[12px] items-center p-[12px] bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] w-full"
                                >
                                    <div className="relative w-[54px] h-[54px] shrink-0">
                                        <img
                                            src={artist.avatar || '/placeholder-avatar.jpg'}
                                            alt={artist.artisticName}
                                            className="w-full h-full object-cover rounded-full border-2 border-[#232323] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]"
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                                            {artist.artisticName}
                                        </span>
                                        <div className="flex gap-[4px] items-center">
                                            <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                                {artist.firstName} {artist.lastName}
                                            </span>
                                            <div className="w-[3px] h-[3px] bg-[#939393] rounded-full" />
                                            <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                                DJ
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Organizer */}
                    {event.club && (
                        <div className="flex flex-col gap-[16px] w-full">
                            <div className="flex items-center gap-[2px] px-[6px]">
                                <h2
                                    className="text-[#ff336d] text-[24px] font-semibold"
                                    style={{ fontFamily: "'Borna', sans-serif" }}
                                >
                                    {t('event.organizer', 'Organizador')}
                                </h2>
                            </div>
                            <div className="flex gap-[12px] items-center p-[12px] bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] w-full">
                                <div className="relative w-[54px] h-[54px] shrink-0 flex items-center justify-center bg-[#323232] rounded-full border-[1.5px] border-[#232323] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                                    {event.club.logo ? (
                                        <img
                                            src={event.club.logo}
                                            alt={event.club.name}
                                            className="w-8 h-6 object-cover"
                                        />
                                    ) : (
                                        <span className="text-[#f6f6f6] text-[14px] font-bold">
                                            {event.club.name.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                                        {event.club.name}
                                    </span>
                                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                                        {VENUE_TYPE_MAP[event.club.venueType] || event.club.venueType}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    <div className="flex flex-col gap-[16px] w-full">
                        <LocationCard
                            title={t('event.location')}
                            address={event.address}
                            coordinates={{
                                lat: event.addressLocation?.coordinates?.[1] ?? 0,
                                lng: event.addressLocation?.coordinates?.[0] ?? 0,
                            }}
                        />
                    </div>
                </div>

                {/* Right Column - Tickets */}
                <div className="flex flex-col gap-[36px] w-[500px] rounded-[10px]">
                    {/* Tabs */}
                    <div className="flex items-center p-[6px] bg-[#141414] border-[1.5px] border-[#232323] rounded-2xl w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                                className={`
                                    flex-1 flex items-center justify-center h-[36px] px-[8px] rounded-[10px]
                                    text-[14px] font-bold font-helvetica transition-colors
                                    ${activeTab === tab.key
                                        ? 'bg-[#232323] text-[#f6f6f6]'
                                        : 'text-[#939393]'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tickets */}
                    {activeTab === 'tickets' && event.tickets && (
                        <div className="flex flex-col gap-[16px] w-full">
                            {event.tickets.map(ticket => {
                                // Verificar si algún precio de este ticket tiene cantidad > 0
                                const hasSelectedQuantity = ticket.prices?.some(
                                    price => (selectedQuantities[price.id] || 0) > 0
                                );
                                const borderColor = hasSelectedQuantity ? '#e5ff88' : '#232323';
                                
                                return (
                                    <div
                                        key={ticket.id}
                                        className={`
                                            relative flex flex-col bg-[#141414] border-2 rounded-[16px] w-full overflow-visible
                                            ${hasSelectedQuantity ? 'border-[#e5ff88]' : 'border-[#232323]'}
                                        `}
                                    >
                                        {/* Top semicircle - at the very top border */}
                                        <div 
                                            className="absolute right-[152px] top-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-b-full z-10"
                                            style={{ 
                                                borderLeft: `2px solid ${borderColor}`,
                                                borderRight: `2px solid ${borderColor}`,
                                                borderBottom: `2px solid ${borderColor}`,
                                            }}
                                        />
                                        
                                        {/* Bottom semicircle - at the very bottom border */}
                                        <div 
                                            className="absolute right-[152px] bottom-[-2px] w-[18px] h-[10px] bg-[#050505] rounded-t-full z-10"
                                            style={{ 
                                                borderLeft: `2px solid ${borderColor}`,
                                                borderRight: `2px solid ${borderColor}`,
                                                borderTop: `2px solid ${borderColor}`,
                                            }}
                                        />

                                        {/* Dashed vertical line - from top to bottom */}
                                        <div className="absolute right-[160px] top-[8px] bottom-[8px] w-0 border-l-[1.5px] border-dashed border-[#232323] z-0" />

                                        {/* Ticket Header */}
                                        <div className="flex items-center justify-between h-[56px] px-[16px] border-b-[1.5px] border-[#232323]">
                                            {/* Left: Name */}
                                            <div className="flex items-center gap-[6px]">
                                                <div className="w-[6px] h-[6px] bg-[#d591ff] rounded-full shrink-0" />
                                                <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                                                    {ticket.name}
                                                </span>
                                            </div>
                                            
                                            {/* Right: Capacity pill */}
                                            <div className="flex items-center gap-[4px] px-[10px] py-[4px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                                                <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                                                    {ticket.maxPurchasePerUser}
                                                </span>
                                                <PersonIcon />
                                            </div>
                                        </div>

                                        {/* Prices */}
                                        {ticket.prices?.map((price, priceIndex) => {
                                            const quantity = selectedQuantities[price.id] || 0;
                                            const isLast = priceIndex === (ticket.prices?.length ?? 0) - 1;
                                            const showPriceName = ticket.prices.length > 1;
                                            
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
                                                        <span className="text-[#939393] text-[12px] font-medium font-helvetica">
                                                            {t('event.more_info', 'Más información')}
                                                        </span>
                                                    </div>

                                                    {/* Quantity Selector */}
                                                    <div className="flex items-center gap-[6px]">
                                                        <button
                                                            onClick={() => handleQuantityChange(price.id, -1)}
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
                                                            onClick={() => handleQuantityChange(price.id, 1)}
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
                            })}
                        </div>
                    )}

                    {/* CTA Button */}
                    <Button
                        variant="cta"
                        disabled={totalQuantity === 0}
                        className="w-full h-[48px]"
                    >
                        {t('event.continue', 'Continuar')} - {(total ?? 0).toFixed(2).replace('.', ',')}€
                    </Button>

                    {/* Legal text */}
                    <div className="px-[6px]">
                        <p className="text-[rgba(246,246,246,0.5)] text-[12px] font-medium font-helvetica leading-normal">
                            {t('event.legal_text', 'Comprando esta entrada, abrirás una cuenta y aceptarás nuestras Condiciones de Uso generales, la Política de Privacidad y las Condiciones de Compra de entradas. Procesamos tus datos personales de acuerdo con nuestra Política de Privacidad.')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PersonIcon = () => (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
        <path d="M6 6.5C7.38071 6.5 8.5 5.38071 8.5 4C8.5 2.61929 7.38071 1.5 6 1.5C4.61929 1.5 3.5 2.61929 3.5 4C3.5 5.38071 4.61929 6.5 6 6.5Z" fill="#939393"/>
        <path d="M6 8C3.79086 8 2 9.79086 2 12H10C10 9.79086 8.20914 8 6 8Z" fill="#939393"/>
    </svg>
);

const MinusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10H16" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10H16" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 4V16" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export default EventPage;
import { useState } from 'react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';

import PageError from '@/components/common/PageError';
import LocationCard from '@/components/LocationCard';
import EventHeader from '@/components/EventHeader';
import EventTags from '@/components/EventTags';
import EventDescription from '@/components/EventDescription';
import ArtistsList from '@/components/ArtistsList';
import OrganizerCard from '@/components/OrganizerCard';
import TabSelector from '@/components/TabSelector';
import TicketsList from '@/components/TicketsList';
import EventStepper from '@/components/EventStepper';
import CheckoutFooter from '@/components/CheckoutFooter';

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

interface FavoritesCountResponse {
    status: 'success' | 'error';
    code: string;
    data: { eventId: string; count: number };
    message: string;
}

interface UserFavoritesResponse {
    status: 'success' | 'error';
    code: string;
    message: string;
    data: {
        favorites: {
            data: { id: string; eventId: string }[];
            meta: { total: number };
        };
    };
}

const VENUE_TYPE_MAP: Record<string, string> = {
    CLUB: 'Club',
    DISCO: 'Discoteca',
    BAR: 'Bar',
    LOUNGE: 'Lounge',
    PUB: 'Pub',
};

type TabKey = 'tickets' | 'guestlists' | 'reservations' | 'products' | 'promotions';

const EventPage = () => {
    const { slug } = useParams({ strict: false });
    const { i18n, t } = useTranslation();
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    const isAuthenticated = !!token;
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const [activeTab, setActiveTab] = useState<TabKey>('tickets');
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

    // Event Query
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

    const eventId = eventQuery.data?.id;

    // Favorites Count Query
    const favoritesCountQuery = useQuery({
        queryKey: ['favorites', 'count', 'event', eventId],
        queryFn: async (): Promise<number> => {
            const response = await axiosInstance.get<FavoritesCountResponse>(
                `/v2/favorites/count?eventId=${eventId}`
            );
            return response.data.data.count;
        },
        enabled: !!eventId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    // User Favorite Query
    const userFavoriteQuery = useQuery({
        queryKey: ['favorites', 'user', 'event', eventId],
        queryFn: async (): Promise<boolean> => {
            const response = await axiosInstance.get<UserFavoritesResponse>(
                `/v2/favorites?events=true&eventId=${eventId}`
            );
            return response.data.data.favorites.data.length > 0;
        },
        enabled: !!eventId && isAuthenticated,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    // Toggle Favorite Mutation
    const toggleFavoriteMutation = useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.post('/v2/favorites/toggle', { eventId: id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites', 'count', 'event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['favorites', 'user', 'event', eventId] });
        },
        onError: () => {
            toast.error(t('event.favorite_error', 'Error al actualizar favorito'));
        },
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

    const handleLike = () => {
        if (!eventId) return;
        toggleFavoriteMutation.mutate(eventId);
    };

    const handleCheckout = () => {
        // TODO: Implement checkout logic
        console.log('Checkout with quantities:', selectedQuantities);
    };

    if (eventQuery.isError) {
        return <PageError />;
    }

    const isLoading = eventQuery.isLoading;
    const event = eventQuery.data;
    const total = calculateTotal();
    const totalQuantity = getTotalQuantity();

    const isLikesLoading = favoritesCountQuery.isLoading || (isAuthenticated && userFavoriteQuery.isLoading);
    const likesCount = favoritesCountQuery.data ?? event?._count?.favorites ?? 0;
    const isLiked = userFavoriteQuery.data ?? false;

    const tabs = [
        { key: 'tickets', label: t('event.tabs.tickets', 'Entradas') },
        { key: 'guestlists', label: t('event.tabs.guestlists', 'Guestlists') },
        { key: 'reservations', label: t('event.tabs.reservations', 'Reservados') },
        { key: 'products', label: t('event.tabs.products', 'Productos') },
        { key: 'promotions', label: t('event.tabs.promotions', 'Promociones') },
    ];

    const allTags = event ? [
        ...(event.minimumAge ? [`+${event.minimumAge}`] : []),
        ...(event.club?.venueType ? [VENUE_TYPE_MAP[event.club.venueType] || event.club.venueType] : []),
        ...event.vibes.map(v => v.name),
        ...event.musics.map(m => m.name),
    ] : [];

    return (
        <div className="bg-[#050505] min-h-screen flex flex-col gap-[60px] items-center py-24">
            {/* Stepper */}
            <EventStepper
                currentStep={1}
                isLoading={isLoading}
            />

            {/* Content */}
            <div className="flex items-start justify-between w-full px-64 gap-8">
                {/* Left Column - Event Info */}
                <div className="flex flex-col gap-[36px] w-[500px] rounded-[10px]">
                    {/* Event Header */}
                    <EventHeader
                        name={event?.name || ''}
                        flyer={event?.flyer || ''}
                        date={event ? formatEventDate(event.startDate) : ''}
                        time={event ? formatEventTime(event.startTime, event.endTime) : ''}
                        address={event?.address || ''}
                        likesCount={likesCount}
                        isLiked={isLiked}
                        onLikeClick={handleLike}
                        isLoading={isLoading}
                        isLikesLoading={isLikesLoading}
                        canLike={isAuthenticated}
                        isLikeDisabled={toggleFavoriteMutation.isPending}
                    />

                    {/* Tags */}
                    <EventTags
                        tags={allTags}
                        isLoading={isLoading}
                    />

                    {/* Description */}
                    <EventDescription
                        title={t('event.about', 'Sobre el evento')}
                        description={event?.description || ''}
                        isLoading={isLoading}
                    />

                    {/* Artists */}
                    <ArtistsList
                        artists={event?.artists || []}
                        isLoading={isLoading}
                    />

                    {/* Organizer */}
                    {(isLoading || event?.club) && (
                        <OrganizerCard
                            organizer={event?.club || { id: '', name: '', slug: '', venueType: '' }}
                            venueTypeLabel={event?.club ? (VENUE_TYPE_MAP[event.club.venueType] || event.club.venueType) : ''}
                            isLoading={isLoading}
                        />
                    )}

                    {/* Location */}
                    {isLoading ? (
                        <div className="flex flex-col gap-[16px] w-full">
                            <div className="h-7 w-24 bg-[#232323] rounded animate-pulse" />
                            <div className="h-[200px] w-full bg-[#232323] rounded-2xl animate-pulse" />
                        </div>
                    ) : event?.address ? (
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
                    ) : null}
                </div>

                {/* Right Column - Tickets */}
                <div className="flex flex-col gap-[36px] w-[500px] rounded-[10px]">
                    {/* Tabs */}
                    <TabSelector
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={(key) => setActiveTab(key as TabKey)}
                        isLoading={isLoading}
                    />

                    {/* Tickets */}
                    {activeTab === 'tickets' && (
                        <TicketsList
                            tickets={event?.tickets || []}
                            selectedQuantities={selectedQuantities}
                            onQuantityChange={handleQuantityChange}
                            isLoading={isLoading}
                        />
                    )}

                    {/* Checkout Footer */}
                    <CheckoutFooter
                        total={total}
                        totalQuantity={totalQuantity}
                        onCheckout={handleCheckout}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default EventPage;
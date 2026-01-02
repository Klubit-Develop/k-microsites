import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';

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
    slug: string;
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

interface EventSearchParams {
    step?: number;
    tab?: TabKey;
    tickets?: string;
    guestlists?: string;
    reservations?: string;
    products?: string;
    promotions?: string;
}

interface SelectedQuantities {
    tickets: Record<string, number>;
    guestlists: Record<string, number>;
    reservations: Record<string, number>;
    products: Record<string, number>;
    promotions: Record<string, number>;
}

const parseQuantitiesFromUrl = (urlString: string | undefined): Record<string, number> => {
    if (!urlString) return {};
    const quantities: Record<string, number> = {};
    const pairs = urlString.split(',').filter(Boolean);
    for (const pair of pairs) {
        const [id, qty] = pair.split(':');
        if (id && qty) {
            const quantity = parseInt(qty, 10);
            if (!isNaN(quantity) && quantity > 0) {
                quantities[id] = quantity;
            }
        }
    }
    return quantities;
};

const serializeQuantitiesToUrl = (quantities: Record<string, number>): string | undefined => {
    const pairs = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => `${id}:${qty}`);
    return pairs.length > 0 ? pairs.join(',') : undefined;
};

const Event = () => {
    const { slug } = useParams({ strict: false });
    const { i18n, t } = useTranslation();
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const searchParams = useSearch({ strict: false }) as EventSearchParams;

    const isAuthenticated = !!token;
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const currentStep = searchParams.step ?? 1;
    const activeTab: TabKey = searchParams.tab ?? 'tickets';

    const selectedQuantities = useMemo<SelectedQuantities>(() => ({
        tickets: parseQuantitiesFromUrl(searchParams.tickets),
        guestlists: parseQuantitiesFromUrl(searchParams.guestlists),
        reservations: parseQuantitiesFromUrl(searchParams.reservations),
        products: parseQuantitiesFromUrl(searchParams.products),
        promotions: parseQuantitiesFromUrl(searchParams.promotions),
    }), [searchParams.tickets, searchParams.guestlists, searchParams.reservations, searchParams.products, searchParams.promotions]);

    const currentTabQuantities = useMemo(() => {
        return selectedQuantities[activeTab] || {};
    }, [selectedQuantities, activeTab]);

    const updateSearchParams = useCallback((updates: Partial<EventSearchParams>, addToHistory = false) => {
        const currentParams = searchParams;
        const newParams: EventSearchParams = { ...currentParams, ...updates };

        (Object.keys(newParams) as (keyof EventSearchParams)[]).forEach(key => {
            if (newParams[key] === undefined || newParams[key] === '') {
                delete newParams[key];
            }
        });

        if (newParams.step === 1) delete newParams.step;
        if (newParams.tab === 'tickets') delete newParams.tab;

        navigate({
            to: '.',
            search: newParams as Record<string, unknown>,
            replace: !addToHistory,
        } as const);
    }, [navigate, searchParams]);

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

    const handleStepChange = useCallback((step: number) => {
        updateSearchParams({ step }, true);
    }, [updateSearchParams]);

    const handleTabChange = useCallback((tab: string) => {
        updateSearchParams({ tab: tab as TabKey });
    }, [updateSearchParams]);

    const handleQuantityChange = useCallback((priceId: string, delta: number) => {
        const currentQuantities = selectedQuantities[activeTab] || {};
        const current = currentQuantities[priceId] || 0;
        const newValue = Math.max(0, current + delta);

        const updatedQuantities = { ...currentQuantities };
        if (newValue > 0) {
            updatedQuantities[priceId] = newValue;
        } else {
            delete updatedQuantities[priceId];
        }

        const serialized = serializeQuantitiesToUrl(updatedQuantities);
        updateSearchParams({ [activeTab]: serialized });
    }, [selectedQuantities, activeTab, updateSearchParams]);

    const calculateTotal = useCallback((): number => {
        if (!eventQuery.data) return 0;

        let total = 0;

        eventQuery.data.tickets?.forEach(ticket => {
            ticket.prices?.forEach(price => {
                const quantity = selectedQuantities.tickets[price.id] || 0;
                total += (price.finalPrice ?? 0) * quantity;
            });
        });

        eventQuery.data.guestlists?.forEach(guestlist => {
            guestlist.prices?.forEach(price => {
                const quantity = selectedQuantities.guestlists[price.id] || 0;
                total += (price.finalPrice ?? 0) * quantity;
            });
        });

        eventQuery.data.reservations?.forEach(reservation => {
            reservation.prices?.forEach(price => {
                const quantity = selectedQuantities.reservations[price.id] || 0;
                total += (price.finalPrice ?? 0) * quantity;
            });
        });

        return total;
    }, [eventQuery.data, selectedQuantities]);

    const getTotalQuantity = useCallback((): number => {
        return Object.values(selectedQuantities).reduce((sum, categoryQtys) => {
            return sum + Object.values(categoryQtys as Record<string, number>).reduce<number>((catSum, qty: number) => catSum + qty, 0);
        }, 0);
    }, [selectedQuantities]);

    const handleLike = () => {
        if (!eventId) return;
        toggleFavoriteMutation.mutate(eventId);
    };

    const handleCheckout = () => {
        handleStepChange(2);
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

    const guestlistsAsTickets: Ticket[] = (event?.guestlists || []).map(gl => ({
        id: gl.id,
        name: gl.name,
        ageRequired: '',
        termsAndConditions: '',
        maxPurchasePerUser: gl.maxPerUser,
        isNominative: false,
        isTransferable: false,
        isActive: true,
        prices: gl.prices,
    }));

    const reservationsAsTickets: Ticket[] = (event?.reservations || []).map(res => ({
        id: res.id,
        name: res.name,
        ageRequired: '',
        termsAndConditions: res.termsAndConditions,
        maxPurchasePerUser: res.maxPerUser,
        isNominative: false,
        isTransferable: false,
        isActive: true,
        prices: res.prices,
    }));

    const renderTabContent = () => {
        switch (activeTab) {
            case 'tickets':
                return (
                    <TicketsList
                        tickets={event?.tickets || []}
                        selectedQuantities={currentTabQuantities}
                        onQuantityChange={handleQuantityChange}
                        isLoading={isLoading}
                    />
                );

            case 'guestlists':
                if (!isLoading && guestlistsAsTickets.length === 0) {
                    return (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-[#939393] text-[14px] font-helvetica">
                                {t('event.no_guestlists', 'No hay guestlists disponibles')}
                            </p>
                        </div>
                    );
                }
                return (
                    <TicketsList
                        tickets={guestlistsAsTickets}
                        selectedQuantities={currentTabQuantities}
                        onQuantityChange={handleQuantityChange}
                        isLoading={isLoading}
                    />
                );

            case 'reservations':
                if (!isLoading && reservationsAsTickets.length === 0) {
                    return (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-[#939393] text-[14px] font-helvetica">
                                {t('event.no_reservations', 'No hay reservados disponibles')}
                            </p>
                        </div>
                    );
                }
                return (
                    <TicketsList
                        tickets={reservationsAsTickets}
                        selectedQuantities={currentTabQuantities}
                        onQuantityChange={handleQuantityChange}
                        isLoading={isLoading}
                    />
                );

            case 'products':
                return (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-[#939393] text-[14px] font-helvetica">
                            {t('event.no_products', 'No hay productos disponibles')}
                        </p>
                    </div>
                );

            case 'promotions':
                if (!isLoading && (!event?.promotions || event.promotions.length === 0)) {
                    return (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-[#939393] text-[14px] font-helvetica">
                                {t('event.no_promotions', 'No hay promociones disponibles')}
                            </p>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col gap-4">
                        {event?.promotions.map(promo => (
                            <div
                                key={promo.id}
                                className="flex flex-col gap-2 p-4 bg-[#141414] border-2 border-[#232323] rounded-2xl"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-[6px] h-[6px] bg-[#e5ff88] rounded-full" />
                                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                                        {promo.name}
                                    </span>
                                </div>
                                <p className="text-[#939393] text-[14px] font-helvetica">
                                    {promo.description}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[#e5ff88] text-[14px] font-bold font-helvetica">
                                        {promo.type === 'PERCENTAGE' ? `-${promo.value}%` : `-${promo.value}€`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-[#050505] min-h-screen flex flex-col gap-[60px] items-center py-24">
            <EventStepper
                currentStep={currentStep}
                onStepClick={handleStepChange}
                isLoading={isLoading}
            />

            <div className="flex items-start justify-between w-full px-96 gap-8">
                <div className="flex flex-col gap-[36px] w-[500px] rounded-[10px]">
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

                    <EventTags
                        tags={allTags}
                        isLoading={isLoading}
                    />

                    <EventDescription
                        title={t('event.about', 'Sobre el evento')}
                        description={event?.description || ''}
                        isLoading={isLoading}
                    />

                    <ArtistsList
                        artists={event?.artists || []}
                        isLoading={isLoading}
                    />

                    {(isLoading || event?.club) && (
                        <OrganizerCard
                            organizer={event?.club || { id: '', name: '', slug: '', venueType: '' }}
                            venueTypeLabel={event?.club ? (VENUE_TYPE_MAP[event.club.venueType] || event.club.venueType) : ''}
                            isLoading={isLoading}
                        />
                    )}

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

                <div className="flex flex-col gap-[36px] w-[500px] rounded-[10px]">
                    <TabSelector
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        isLoading={isLoading}
                    />

                    {renderTabContent()}

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

export default Event;
import { useState, useCallback, useMemo } from 'react';
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
import GuestlistsList from '@/components/GuestlistsList';
import ReservationsFlow from '@/components/ReservationsFlow';
import PromotionsList from '@/components/PromotionsList';
import ProductsList from '@/components/ProductsList';
import EventStepper from '@/components/EventStepper';
import CheckoutFooter from '@/components/CheckoutFooter';
import ItemInfoModal, { type ItemInfoData, type ModalVariant } from '@/components/ItemInfoModal';

// ============================================
// TYPES
// ============================================

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

interface Zone {
    id: string;
    name: string;
    description?: string | null;
    coverImage?: string | null;
    floorPlan?: string | null;
    isActive?: boolean;
}

interface Benefit {
    id: string;
    name: string;
    type?: string;
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
    gendersRequired?: string[];
    accessLevel?: string;
    prices: TicketPrice[];
    zones?: Zone[];
    benefits?: Benefit[];
}

interface Guestlist {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    maxPerUser: number;
    maxPersonsPerGuestlist: number;
    ageRequired: string;
    termsAndConditions: string | null;
    isTransferable: boolean;
    isActive: boolean;
    gendersRequired?: string[];
    accessLevel?: string;
    prices: TicketPrice[];
    zones?: Zone[];
    benefits?: Benefit[];
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
    prices: TicketPrice[];
    zones?: Zone[];
    benefits?: Benefit[];
}

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

interface Product {
    id: string;
    name: string;
    description: string | null;
    sku: string | null;
    iconName: string | null;
    price: number;
    isActive: boolean;
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
    products: Product[];
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

// ============================================
// URL SERIALIZATION HELPERS
// ============================================

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

// ============================================
// MAIN COMPONENT
// ============================================

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

    // Estado para el modal de información de ticket/guestlist/reservation
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [infoModalData, setInfoModalData] = useState<ItemInfoData | null>(null);
    const [infoModalPriceId, setInfoModalPriceId] = useState<string | null>(null);
    const [infoModalVariant, setInfoModalVariant] = useState<ModalVariant>('ticket');

    // ============================================
    // SELECTED QUANTITIES FROM URL
    // ============================================

    const selectedQuantities = useMemo<SelectedQuantities>(() => ({
        tickets: parseQuantitiesFromUrl(searchParams.tickets),
        guestlists: parseQuantitiesFromUrl(searchParams.guestlists),
        reservations: parseQuantitiesFromUrl(searchParams.reservations),
        products: parseQuantitiesFromUrl(searchParams.products),
        promotions: parseQuantitiesFromUrl(searchParams.promotions),
    }), [searchParams.tickets, searchParams.guestlists, searchParams.reservations, searchParams.products, searchParams.promotions]);

    // ============================================
    // URL NAVIGATION
    // ============================================

    const updateSearchParams = useCallback((updates: Partial<EventSearchParams>, addToHistory = false) => {
        const currentParams = searchParams;
        const newParams: EventSearchParams = { ...currentParams, ...updates };

        (Object.keys(newParams) as (keyof EventSearchParams)[]).forEach(key => {
            if (newParams[key] === undefined || newParams[key] === '') {
                delete newParams[key];
            }
        });

        // Clean default values
        if (newParams.step === 1) delete newParams.step;
        if (newParams.tab === 'tickets') delete newParams.tab;

        navigate({
            to: '.',
            search: newParams as Record<string, unknown>,
            replace: !addToHistory,
        } as const);
    }, [navigate, searchParams]);

    // ============================================
    // QUERIES
    // ============================================

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

    // ============================================
    // FORMATTERS
    // ============================================

    const formatEventDate = (dateString: string): string => {
        const formatted = dayjs(dateString).locale(locale).format('ddd, D MMMM');
        return formatted.charAt(0).toLowerCase() + formatted.slice(1);
    };

    const formatEventTime = (startTime: string, endTime: string): string => {
        return `${startTime} - ${endTime}`;
    };

    // ============================================
    // HANDLERS
    // ============================================

    const handleStepChange = useCallback((step: number) => {
        updateSearchParams({ step }, true);
    }, [updateSearchParams]);

    const handleTabChange = useCallback((tab: string) => {
        updateSearchParams({ tab: tab as TabKey });
    }, [updateSearchParams]);

    const handleQuantityChange = useCallback((itemId: string, delta: number, type?: TabKey) => {
        const tabKey = type || activeTab;
        const currentQuantities = selectedQuantities[tabKey] || {};
        const current = currentQuantities[itemId] || 0;
        const newValue = Math.max(0, current + delta);

        const updatedQuantities = { ...currentQuantities };
        if (newValue > 0) {
            updatedQuantities[itemId] = newValue;
        } else {
            delete updatedQuantities[itemId];
        }

        const serialized = serializeQuantitiesToUrl(updatedQuantities);
        updateSearchParams({ [tabKey]: serialized });
    }, [selectedQuantities, activeTab, updateSearchParams]);

    // ============================================
    // INFO MODAL HANDLERS
    // ============================================

    const handleOpenInfoModal = useCallback((
        item: Ticket | Guestlist | Promotion,
        price: TicketPrice | null,
        type: 'ticket' | 'guestlist' | 'promotion'
    ) => {
        const indicatorColors: Record<string, string> = {
            ticket: '#D591FF',
            guestlist: '#FFCE1F',
            promotion: '#FF336D',
        };
        const indicatorColor = indicatorColors[type];
        
        // Handle promotion variant
        if (type === 'promotion') {
            const promo = item as Promotion;
            const infoData: ItemInfoData = {
                id: promo.id,
                name: promo.name,
                indicatorColor,
                maxPersons: 1,
                finalPrice: promo.type === 'FIXED_PRICE' ? promo.value : 0,
                description: promo.description || undefined,
            };
            setInfoModalData(infoData);
            setInfoModalPriceId(promo.id);
            setInfoModalVariant('promotion');
            setInfoModalOpen(true);
            return;
        }

        // Handle ticket/guestlist variants
        if (!price) return;

        // Cast to the correct type (we know it's not Promotion at this point)
        const ticketOrGuestlist = item as Ticket | Guestlist;

        // Calculate low stock
        const isLowStock = price.maxQuantity 
            ? (price.maxQuantity - price.soldQuantity) <= 5 
            : false;

        // Check if guestlist is free
        const isFree = type === 'guestlist' && price.finalPrice === 0;

        // For guestlist, check if there's a precompra price option available
        const hasPrecompra = type === 'guestlist' && (ticketOrGuestlist as Guestlist).prices?.length > 1;
        
        // Get precompra data if available (the non-free price option)
        let precompraData = undefined;
        if (hasPrecompra && type === 'guestlist') {
            const guestlist = ticketOrGuestlist as Guestlist;
            const precompraPrice = guestlist.prices.find(p => p.finalPrice > 0 && p.id !== price.id);
            if (precompraPrice) {
                precompraData = {
                    products: [{ name: 'Consumición', quantity: 1 }],
                    startTime: '00:00',
                    endTime: '06:00',
                    price: precompraPrice.finalPrice,
                };
            }
        }

        const infoData: ItemInfoData = {
            id: price.id,
            name: ticketOrGuestlist.name,
            priceName: price.name !== ticketOrGuestlist.name ? price.name : undefined,
            indicatorColor,
            maxPersons: type === 'ticket' 
                ? 1 
                : (ticketOrGuestlist as Guestlist).maxPersonsPerGuestlist || 1,
            products: ticketOrGuestlist.benefits
                ?.filter(b => b.type === 'PRODUCT')
                .map(b => ({ name: b.name, quantity: 1 })) || [],
            zones: ticketOrGuestlist.zones?.map(z => z.name) || [],
            benefits: ticketOrGuestlist.benefits
                ?.filter(b => b.type !== 'PRODUCT')
                .map(b => b.name) || [],
            startTime: type === 'guestlist' ? (ticketOrGuestlist as Guestlist).startTime : undefined,
            endTime: type === 'guestlist' ? (ticketOrGuestlist as Guestlist).endTime : undefined,
            finalPrice: price.finalPrice,
            currency: price.currency || 'EUR',
            isLowStock,
            lowStockLabel: isLowStock ? 'Últimas 💣' : undefined,
            isFree,
            hasPrecompra,
            precompraData,
        };

        setInfoModalData(infoData);
        setInfoModalPriceId(price.id);
        setInfoModalVariant(type === 'ticket' ? 'ticket' : 'guestlist');
        setInfoModalOpen(true);
    }, []);

    const handleCloseInfoModal = useCallback(() => {
        setInfoModalOpen(false);
        // Limpiar datos después de la animación
        setTimeout(() => {
            setInfoModalData(null);
            setInfoModalPriceId(null);
            setInfoModalVariant('ticket');
        }, 300);
    }, []);

    const handleInfoModalQuantityChange = useCallback((delta: number) => {
        if (!infoModalPriceId) return;
        handleQuantityChange(infoModalPriceId, delta, activeTab);
    }, [infoModalPriceId, handleQuantityChange, activeTab]);

    const handleInfoModalConfirm = useCallback(() => {
        handleCloseInfoModal();
        // TODO: Navegar al checkout step 2
    }, [handleCloseInfoModal]);

    // Obtener cantidad actual del item del modal
    const infoModalQuantity = useMemo(() => {
        if (!infoModalPriceId) return 0;
        return selectedQuantities[activeTab]?.[infoModalPriceId] || 0;
    }, [infoModalPriceId, selectedQuantities, activeTab]);

    // ============================================
    // CALCULATIONS
    // ============================================

    const calculateTotal = useCallback((): number => {
        if (!eventQuery.data) return 0;

        let total = 0;

        // Tickets
        eventQuery.data.tickets?.forEach(ticket => {
            ticket.prices?.forEach(price => {
                const quantity = selectedQuantities.tickets[price.id] || 0;
                total += (price.finalPrice ?? 0) * quantity;
            });
        });

        // Guestlists
        eventQuery.data.guestlists?.forEach(guestlist => {
            guestlist.prices?.forEach(price => {
                const quantity = selectedQuantities.guestlists[price.id] || 0;
                total += (price.finalPrice ?? 0) * quantity;
            });
        });

        // Reservations
        eventQuery.data.reservations?.forEach(reservation => {
            reservation.prices?.forEach(price => {
                const quantity = selectedQuantities.reservations[price.id] || 0;
                total += (price.finalPrice ?? 0) * quantity;
            });
        });

        // Products
        eventQuery.data.products?.forEach(product => {
            const quantity = selectedQuantities.products[product.id] || 0;
            total += (product.price ?? 0) * quantity;
        });

        // Promotions (solo FIXED_PRICE tiene costo directo)
        eventQuery.data.promotions?.forEach(promotion => {
            const quantity = selectedQuantities.promotions[promotion.id] || 0;
            if (promotion.type === 'FIXED_PRICE') {
                total += (promotion.value ?? 0) * quantity;
            }
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

    // ============================================
    // ERROR STATE
    // ============================================

    if (eventQuery.isError) {
        return <PageError />;
    }

    // ============================================
    // DERIVED STATE
    // ============================================

    const isLoading = eventQuery.isLoading;
    const event = eventQuery.data;
    const total = calculateTotal();
    const totalQuantity = getTotalQuantity();

    const isLikesLoading = favoritesCountQuery.isLoading || (isAuthenticated && userFavoriteQuery.isLoading);
    const likesCount = favoritesCountQuery.data ?? event?._count?.favorites ?? 0;
    const isLiked = userFavoriteQuery.data ?? false;

    // ============================================
    // DYNAMIC TABS (solo mostrar tabs con contenido)
    // ============================================

    const availableTabs = useMemo(() => {
        if (isLoading) {
            // Durante loading, mostrar todos los tabs
            return [
                { key: 'tickets', label: t('event.tabs.tickets', 'Entradas') },
                { key: 'guestlists', label: t('event.tabs.guestlists', 'Guestlists') },
                { key: 'reservations', label: t('event.tabs.reservations', 'Reservados') },
                { key: 'promotions', label: t('event.tabs.promotions', 'Promociones') },
                { key: 'products', label: t('event.tabs.products', 'Productos') },
            ];
        }

        const tabs: { key: string; label: string }[] = [];

        if (event?.tickets && event.tickets.length > 0) {
            tabs.push({ key: 'tickets', label: t('event.tabs.tickets', 'Entradas') });
        }
        if (event?.guestlists && event.guestlists.length > 0) {
            tabs.push({ key: 'guestlists', label: t('event.tabs.guestlists', 'Guestlists') });
        }
        if (event?.reservations && event.reservations.length > 0) {
            tabs.push({ key: 'reservations', label: t('event.tabs.reservations', 'Reservados') });
        }
        if (event?.promotions && event.promotions.length > 0) {
            tabs.push({ key: 'promotions', label: t('event.tabs.promotions', 'Promociones') });
        }
        if (event?.products && event.products.length > 0) {
            tabs.push({ key: 'products', label: t('event.tabs.products', 'Productos') });
        }

        return tabs;
    }, [isLoading, event, t]);

    // Si el tab activo no está disponible, usar el primero
    const effectiveActiveTab = useMemo(() => {
        if (availableTabs.find(tab => tab.key === activeTab)) {
            return activeTab;
        }
        return (availableTabs[0]?.key as TabKey) || 'tickets';
    }, [availableTabs, activeTab]);

    const allTags = event ? [
        ...(event.minimumAge ? [`+${event.minimumAge}`] : []),
        ...(event.club?.venueType ? [VENUE_TYPE_MAP[event.club.venueType] || event.club.venueType] : []),
        ...event.vibes.map(v => v.name),
        ...event.musics.map(m => m.name),
    ] : [];

    // ============================================
    // RENDER TAB CONTENT
    // ============================================

    const renderTabContent = () => {
        switch (effectiveActiveTab) {
            case 'tickets':
                if (!isLoading && (!event?.tickets || event.tickets.length === 0)) {
                    return (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-[#939393] text-[14px] font-helvetica">
                                {t('event.no_tickets', 'No hay entradas disponibles')}
                            </p>
                        </div>
                    );
                }
                return (
                    <TicketsList
                        tickets={event?.tickets || []}
                        selectedQuantities={selectedQuantities.tickets}
                        onQuantityChange={(priceId, delta) => handleQuantityChange(priceId, delta, 'tickets')}
                        onMoreInfo={(ticket, price) => handleOpenInfoModal(ticket, price, 'ticket')}
                        isLoading={isLoading}
                    />
                );

            case 'guestlists':
                if (!isLoading && (!event?.guestlists || event.guestlists.length === 0)) {
                    return (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-[#939393] text-[14px] font-helvetica">
                                {t('event.no_guestlists', 'No hay guestlists disponibles')}
                            </p>
                        </div>
                    );
                }
                return (
                    <GuestlistsList
                        guestlists={event?.guestlists || []}
                        selectedQuantities={selectedQuantities.guestlists}
                        onQuantityChange={(priceId, delta) => handleQuantityChange(priceId, delta, 'guestlists')}
                        onMoreInfo={(guestlist, price) => handleOpenInfoModal(guestlist, price, 'guestlist')}
                        isLoading={isLoading}
                    />
                );

            case 'reservations':
                return (
                    <ReservationsFlow
                        reservations={event?.reservations || []}
                        selectedQuantities={selectedQuantities.reservations}
                        onQuantityChange={(priceId, delta) => handleQuantityChange(priceId, delta, 'reservations')}
                        onContinue={handleCheckout}
                        total={total}
                        isLoading={isLoading}
                    />
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
                    <PromotionsList
                        promotions={event?.promotions || []}
                        selectedQuantities={selectedQuantities.promotions}
                        onQuantityChange={(promotionId, delta) => handleQuantityChange(promotionId, delta, 'promotions')}
                        onMoreInfo={(promotion) => handleOpenInfoModal(promotion, null, 'promotion')}
                        isLoading={isLoading}
                    />
                );

            case 'products':
                if (!isLoading && (!event?.products || event.products.length === 0)) {
                    return (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-[#939393] text-[14px] font-helvetica">
                                {t('event.no_products', 'No hay productos disponibles')}
                            </p>
                        </div>
                    );
                }
                return (
                    <ProductsList
                        products={event?.products || []}
                        selectedQuantities={selectedQuantities.products}
                        onQuantityChange={(productId, delta) => handleQuantityChange(productId, delta, 'products')}
                        isLoading={isLoading}
                    />
                );

            default:
                return null;
        }
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="bg-[#050505] min-h-screen flex flex-col gap-[60px] items-center py-24">
            <EventStepper
                currentStep={currentStep}
                onStepClick={handleStepChange}
                isLoading={isLoading}
            />

            <div className="flex items-start justify-between w-full px-96 gap-8">
                {/* LEFT COLUMN - Event Info */}
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

                {/* RIGHT COLUMN - Rates & Checkout */}
                <div className="flex flex-col gap-[36px] w-[500px] rounded-[10px]">
                    {/* Tab Selector con scroll horizontal */}
                    <div className="overflow-x-auto overflow-y-hidden">
                        <div className="min-w-[500px]">
                            <TabSelector
                                tabs={availableTabs}
                                activeTab={effectiveActiveTab}
                                onTabChange={handleTabChange}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>

                    {/* Tab Content */}
                    {renderTabContent()}

                    {/* Checkout Footer - oculto en tab de reservas porque tiene su propio flujo */}
                    {activeTab !== 'reservations' && (
                        <CheckoutFooter
                            total={total}
                            totalQuantity={totalQuantity}
                            onCheckout={handleCheckout}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>

            {/* Ticket/Guestlist/Promotion Info Modal */}
            <ItemInfoModal
                isOpen={infoModalOpen}
                onClose={handleCloseInfoModal}
                data={infoModalData}
                variant={infoModalVariant}
                quantity={infoModalQuantity}
                onQuantityChange={handleInfoModalQuantityChange}
                onConfirm={handleInfoModalConfirm}
            />
        </div>
    );
};

export default Event;
import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';
import { useCheckoutStore, useCheckoutTimer } from '@/stores/useCheckoutStore';

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
import CheckoutSummary from '@/components/CheckoutSummary';
import TimeExpiredModal from '@/components/TimeExpiredModal';
import StripePayment from '@/components/StripePayment';

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

interface Fee {
    id: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    percentage: number | null;
    fixedAmount: number | null;
    currency: string;
    isActive: boolean;
}

interface FeeResponse {
    status: 'success' | 'error';
    code: string;
    data: { fee: Fee | null };
    message: string;
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

    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [infoModalData, setInfoModalData] = useState<ItemInfoData | null>(null);
    const [infoModalPriceId, setInfoModalPriceId] = useState<string | null>(null);
    const [infoModalVariant, setInfoModalVariant] = useState<ModalVariant>('ticket');

    const selectedQuantities = useMemo<SelectedQuantities>(() => ({
        tickets: parseQuantitiesFromUrl(searchParams.tickets),
        guestlists: parseQuantitiesFromUrl(searchParams.guestlists),
        reservations: parseQuantitiesFromUrl(searchParams.reservations),
        products: parseQuantitiesFromUrl(searchParams.products),
        promotions: parseQuantitiesFromUrl(searchParams.promotions),
    }), [searchParams.tickets, searchParams.guestlists, searchParams.reservations, searchParams.products, searchParams.promotions]);

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

    const {
        setStep: setCheckoutStep,
        hasItems: checkoutHasItems,
        goBack: goBackCheckout,
        goToSummary,
        goToPayment,
        setEvent,
        addItem,
        clearCart,
        step: checkoutStep,
        eventId: checkoutEventId,
        eventName: checkoutEventName,
        eventSlug: checkoutEventSlug,
        eventDisplayInfo: checkoutEventDisplayInfo,
        items: checkoutItems,
        setCoupon,
        setNominativeAssignments,
        isTimerExpired,
        resetTimer,
        expireTimer,
        setFee,
        getServiceFee,
        transactionId,
        setTransaction,
        clearTransaction,
    } = useCheckoutStore();

    useEffect(() => {
        if (currentStep === 3) {
            if (!transactionId) {
                updateSearchParams({ step: 2 }, true);
                return;
            }
            setCheckoutStep('payment');
        } else if (currentStep === 2) {
            if (!checkoutHasItems()) {
                updateSearchParams({ step: 1 }, true);
                return;
            }
            setCheckoutStep('summary');
        } else {
            setCheckoutStep('selection');
        }
    }, [currentStep, checkoutHasItems, setCheckoutStep, updateSearchParams, transactionId]);

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

    const feeQuery = useQuery({
        queryKey: ['fee', 'active'],
        queryFn: async (): Promise<Fee | null> => {
            const response = await axiosInstance.get<FeeResponse>('/v2/fees/active');
            return response.data.data.fee;
        },
        staleTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (feeQuery.isSuccess) {
            setFee(feeQuery.data);
        }
    }, [feeQuery.data, feeQuery.isSuccess, setFee]);

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

    // Create transaction mutation
    const createTransactionMutation = useMutation({
        mutationFn: async (data: {
            eventId: string;
            items: Array<{
                itemType: 'TICKET' | 'GUESTLIST' | 'RESERVATION' | 'PRODUCT' | 'PROMOTION';
                itemId: string;
                priceId?: string;
                quantity: number;
            }>;
            couponCode?: string;
        }) => {
            const response = await axiosInstance.post<{
                status: 'success' | 'error';
                data: {
                    transaction: {
                        id: string;
                        totalPrice: number;
                        currency: string;
                    };
                };
                message: string;
            }>('/v2/transactions', data);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success') {
                const { id, totalPrice, currency } = response.data.transaction;
                setTransaction(id, totalPrice, currency);
                goToPayment();
                updateSearchParams({ step: 3 }, true);
            } else {
                toast.error(response.message || t('checkout.transaction_error', 'Error al crear la transacción'));
            }
        },
        onError: (error: any) => {
            if (error.backendError) {
                toast.error(error.backendError.message);
            } else {
                toast.error(t('common.error_connection', 'Error de conexión'));
            }
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
        if (step === 1) {
            if (checkoutStep === 'summary' || checkoutStep === 'payment') {
                goBackCheckout();
            }
            updateSearchParams({ step: 1 }, true);
        } else if (step === 2) {
            if (checkoutStep === 'payment') {
                goBackCheckout();
                updateSearchParams({ step: 2 }, true);
            } else if (checkoutHasItems()) {
                goToSummary();
                updateSearchParams({ step: 2 }, true);
            } else {
                toast.error(t('event.select_items', 'Selecciona al menos un item'));
            }
        } else if (step === 3) {
            if (transactionId) {
                goToPayment();
                updateSearchParams({ step: 3 }, true);
            }
        }
    }, [updateSearchParams, checkoutStep, goBackCheckout, goToSummary, goToPayment, checkoutHasItems, transactionId, t]);

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

        if (!price) return;

        const ticketOrGuestlist = item as Ticket | Guestlist;

        const isLowStock = price.maxQuantity
            ? (price.maxQuantity - price.soldQuantity) <= 5
            : false;

        const isFree = type === 'guestlist' && price.finalPrice === 0;

        const hasPrecompra = type === 'guestlist' && (ticketOrGuestlist as Guestlist).prices?.length > 1;

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

    const infoModalQuantity = useMemo(() => {
        if (!infoModalPriceId) return 0;
        return selectedQuantities[activeTab]?.[infoModalPriceId] || 0;
    }, [infoModalPriceId, selectedQuantities, activeTab]);

    const { remainingTime } = useCheckoutTimer();

    const handleTimerExpired = useCallback(() => {
        expireTimer();
    }, [expireTimer]);

    const handleRetryAfterExpired = useCallback(() => {
        resetTimer();
        clearTransaction();
        updateSearchParams({ step: 1 }, true);
    }, [resetTimer, clearTransaction, updateSearchParams]);

    const handleBackFromSummary = useCallback(() => {
        goBackCheckout();
        updateSearchParams({ step: 1 }, true);
    }, [goBackCheckout, updateSearchParams]);

    const handleContinueToPayment = useCallback((data: {
        coupon?: { id: string; code: string; type: 'PERCENTAGE' | 'FIXED_AMOUNT'; value: number };
        nominativeAssignments?: Array<{
            itemIndex: number;
            assignmentType: 'me' | 'send' | 'fill';
            phone?: string;
            phoneCountry?: string;
            firstName?: string;
            lastName?: string;
        }>;
    }) => {
        if (data.coupon) {
            setCoupon(data.coupon);
        }
        if (data.nominativeAssignments) {
            setNominativeAssignments(data.nominativeAssignments);
        }

        if (!checkoutEventId) {
            toast.error(t('checkout.no_event', 'No hay evento seleccionado'));
            return;
        }

        // Map checkout items to transaction items
        const transactionItems = checkoutItems.map(item => {
            let itemType: 'TICKET' | 'GUESTLIST' | 'RESERVATION' | 'PRODUCT' | 'PROMOTION';
            switch (item.type) {
                case 'ticket':
                    itemType = 'TICKET';
                    break;
                case 'guestlist':
                    itemType = 'GUESTLIST';
                    break;
                case 'reservation':
                    itemType = 'RESERVATION';
                    break;
                case 'product':
                    itemType = 'PRODUCT';
                    break;
                case 'promotion':
                    itemType = 'PROMOTION';
                    break;
                default:
                    itemType = 'TICKET';
            }

            return {
                itemType,
                itemId: item.id,
                priceId: item.priceId !== item.id ? item.priceId : undefined,
                quantity: item.quantity,
            };
        });

        createTransactionMutation.mutate({
            eventId: checkoutEventId,
            items: transactionItems,
            couponCode: data.coupon?.code,
        });
    }, [checkoutEventId, checkoutItems, setCoupon, setNominativeAssignments, createTransactionMutation, t]);

    const handlePaymentSuccess = useCallback(() => {
        console.log('=== handlePaymentSuccess CALLED ===');
        console.log('transactionId from store:', transactionId);

        // Guardar transactionId ANTES de limpiar el carrito
        const savedTransactionId = transactionId;
        console.log('savedTransactionId:', savedTransactionId);

        clearCart();
        console.log('Cart cleared');

        console.log('Navigating to /checkout/success with transactionId:', savedTransactionId);

        navigate({
            to: '/checkout/success',
            search: {
                transactionId: savedTransactionId || undefined,
            },
        });
    }, [clearCart, navigate, transactionId]);

    const handlePaymentCancel = useCallback(() => {
        clearTransaction();
        goBackCheckout();
        updateSearchParams({ step: 2 }, true);
    }, [clearTransaction, goBackCheckout, updateSearchParams]);

    const handleInfoModalConfirm = useCallback(() => {
        if (!infoModalData || !infoModalPriceId || !eventQuery.data) return;

        const event = eventQuery.data;
        const quantity = infoModalQuantity;

        if (quantity <= 0) {
            toast.error(t('event.select_quantity', 'Selecciona una cantidad'));
            return;
        }

        setEvent(
            event.id,
            event.name,
            event.slug,
            {
                coverImage: event.flyer,
                date: dayjs(event.startDate).locale('es').format('ddd, D MMMM'),
            }
        );

        let isNominative = false;
        if (infoModalVariant === 'ticket') {
            const ticket = event.tickets?.find(t =>
                t.prices?.some(p => p.id === infoModalPriceId)
            );
            isNominative = ticket?.isNominative ?? false;
        }

        addItem({
            id: infoModalData.id,
            priceId: infoModalPriceId,
            type: infoModalVariant === 'promotion' ? 'promotion' : infoModalVariant,
            name: infoModalData.name,
            priceName: infoModalData.priceName,
            unitPrice: infoModalData.finalPrice,
            quantity,
            isNominative,
        });

        handleCloseInfoModal();

        goToSummary();

        updateSearchParams({ step: 2 }, true);
    }, [
        infoModalData,
        infoModalPriceId,
        infoModalQuantity,
        infoModalVariant,
        eventQuery.data,
        setEvent,
        addItem,
        goToSummary,
        handleCloseInfoModal,
        updateSearchParams,
        t
    ]);

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

        eventQuery.data.products?.forEach(product => {
            const quantity = selectedQuantities.products[product.id] || 0;
            total += (product.price ?? 0) * quantity;
        });

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

    const handleCheckout = useCallback(() => {
        const event = eventQuery.data;
        if (!event) return;

        const hasSelectedItems = Object.values(selectedQuantities).some(
            tab => Object.values(tab as Record<string, number>).some((qty: number) => qty > 0)
        );

        if (!hasSelectedItems) {
            toast.error(t('event.select_items', 'Selecciona al menos un item'));
            return;
        }

        clearCart();

        setEvent(
            event.id,
            event.name,
            event.slug,
            {
                coverImage: event.flyer,
                date: dayjs(event.startDate).locale('es').format('ddd, D MMMM'),
            }
        );

        event.tickets?.forEach(ticket => {
            ticket.prices?.forEach(price => {
                const quantity = selectedQuantities.tickets[price.id];
                if (quantity > 0) {
                    addItem({
                        id: ticket.id,
                        priceId: price.id,
                        type: 'ticket',
                        name: ticket.name,
                        priceName: price.name,
                        unitPrice: price.finalPrice,
                        quantity,
                        isNominative: ticket.isNominative,
                    });
                }
            });
        });

        event.guestlists?.forEach(guestlist => {
            guestlist.prices?.forEach(price => {
                const quantity = selectedQuantities.guestlists[price.id];
                if (quantity > 0) {
                    addItem({
                        id: guestlist.id,
                        priceId: price.id,
                        type: 'guestlist',
                        name: guestlist.name,
                        priceName: price.name,
                        unitPrice: price.finalPrice,
                        quantity,
                        maxPersons: guestlist.maxPersonsPerGuestlist,
                    });
                }
            });
        });

        event.promotions?.forEach(promotion => {
            const quantity = selectedQuantities.promotions[promotion.id];
            if (quantity > 0) {
                const unitPrice = promotion.type === 'FIXED_PRICE' ? promotion.value : 0;
                addItem({
                    id: promotion.id,
                    priceId: promotion.id,
                    type: 'promotion',
                    name: promotion.name,
                    unitPrice,
                    quantity,
                });
            }
        });

        event.products?.forEach(product => {
            const quantity = selectedQuantities.products[product.id];
            if (quantity > 0) {
                addItem({
                    id: product.id,
                    priceId: product.id,
                    type: 'product',
                    name: product.name,
                    unitPrice: product.price,
                    quantity,
                });
            }
        });

        goToSummary();
        updateSearchParams({ step: 2 }, true);
    }, [
        eventQuery.data,
        selectedQuantities,
        clearCart,
        setEvent,
        addItem,
        goToSummary,
        updateSearchParams,
        t,
    ]);

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

    const availableTabs = useMemo(() => {
        if (isLoading) {
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

    const renderRightColumn = () => {
        // Step 3: Payment
        if (checkoutStep === 'payment' && transactionId) {
            return (
                <StripePayment
                    transactionId={transactionId}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                    timerSeconds={remainingTime}
                    onTimerExpired={handleTimerExpired}
                />
            );
        }

        // Step 2: Summary
        if (checkoutStep === 'summary' && checkoutEventId) {
            return (
                <CheckoutSummary
                    event={{
                        id: checkoutEventId,
                        name: checkoutEventName || '',
                        slug: checkoutEventSlug || '',
                        coverImage: checkoutEventDisplayInfo?.coverImage,
                        date: checkoutEventDisplayInfo?.date || '',
                    }}
                    items={checkoutItems}
                    serviceFee={getServiceFee()}
                    timerSeconds={remainingTime}
                    onTimerExpired={handleTimerExpired}
                    onBack={handleBackFromSummary}
                    onContinueToPayment={handleContinueToPayment}
                    isLoading={createTransactionMutation.isPending}
                />
            );
        }

        // Step 1: Selection
        return (
            <>
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

                {renderTabContent()}

                {activeTab !== 'reservations' && (
                    <CheckoutFooter
                        total={total}
                        totalQuantity={totalQuantity}
                        onCheckout={handleCheckout}
                        isLoading={isLoading}
                    />
                )}
            </>
        );
    };

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
                    {renderRightColumn()}
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

            {/* Time Expired Modal */}
            <TimeExpiredModal
                isOpen={isTimerExpired}
                onRetry={handleRetryAfterExpired}
            />
        </div>
    );
};

export default Event;
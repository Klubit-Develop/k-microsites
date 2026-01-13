import { toast } from 'sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearch, useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';

import ClubProfile from '@/components/ClubProfile';
import PhotoCarousel from '@/components/PhotoCarousel';
import ContactButtons from '@/components/ContactButtons';
import LocationCard from '@/components/LocationCard';
import PageError from '@/components/common/PageError';
import EventSection from '@/components/EventSection';
import EventCardHz from '@/components/EventCardHz';
import UpcomingEventsPanel from '@/components/UpcomingEventsPanel';

interface Club {
    id: string;
    logo: string;
    name: string;
    venueType: string;
    openingDays: string[];
    openingTime: string;
    closingTime: string;
    images: string[];
    contactNumber: string;
    email: string;
}

interface Event {
    id: string;
    name: string;
    slug: string;
    flyer: string;
    startDate: string;
    startTime: string;
    endTime: string;
    club: {
        id: string;
        name: string;
    };
}

interface ClubResponse {
    status: 'success' | 'error';
    code: string;
    data: { club: Club };
    message: string;
    details: string;
}

interface EventsResponse {
    status: 'success' | 'error';
    code: string;
    data: {
        data: Event[];
        meta: { total: number };
    };
    message: string;
    details: string;
}

interface FavoritesCountResponse {
    status: 'success' | 'error';
    code: string;
    data: { clubId: string; count: number };
    message: string;
    details: string;
}

interface UserFavoritesResponse {
    status: 'success' | 'error';
    code: string;
    message: string;
    data: {
        favorites: {
            data: { id: string; clubId: string }[];
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

const DAY_MAP: Record<string, { es: string; en: string; order: number }> = {
    MONDAY: { es: 'Lunes', en: 'Monday', order: 1 },
    TUESDAY: { es: 'Martes', en: 'Tuesday', order: 2 },
    WEDNESDAY: { es: 'Miércoles', en: 'Wednesday', order: 3 },
    THURSDAY: { es: 'Jueves', en: 'Thursday', order: 4 },
    FRIDAY: { es: 'Viernes', en: 'Friday', order: 5 },
    SATURDAY: { es: 'Sábado', en: 'Saturday', order: 6 },
    SUNDAY: { es: 'Domingo', en: 'Sunday', order: 7 },
};

// Mínimo de eventos para mostrar el arrow clickeable
const MIN_EVENTS_FOR_ARROW = 5;

/**
 * Obtiene el slug del club desde la URL
 * - En desarrollo (localhost): usa variable de entorno o slug por defecto
 * - En producción: extrae el subdominio de xxx.klubit.io
 */
const getClubSlug = (): string => {
    const hostname = window.location.hostname;

    // Desarrollo local: usar variable de entorno o slug por defecto
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return import.meta.env.VITE_DEV_CLUB_SLUG || 'localhost';
    }

    // Producción: extraer subdominio de xxx.klubit.io
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        return parts[0];
    }

    // Fallback
    return 'localhost';
};

const Home = () => {
    const { i18n, t } = useTranslation();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { view } = useSearch({ from: '/' });

    const token = useAuthStore((state) => state.token);

    const isAuthenticated = !!token;
    const locale = i18n.language === 'en' ? 'en' : 'es';
    const showUpcomingEvents = view === 'events';

    // Obtener el slug del club dinámicamente
    const clubSlug = getClubSlug();

    const clubQuery = useQuery({
        queryKey: ['club', clubSlug],
        queryFn: async (): Promise<Club> => {
            const fields = 'id,logo,name,venueType,openingDays,openingTime,closingTime,images,contactNumber,email,termsAndConditions';
            const response = await axiosInstance.get<ClubResponse>(
                `/v2/clubs/slug/${clubSlug}?includeInactive=true&fields=${fields}`
            );
            return response.data.data.club;
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: false,
    });

    const clubId = clubQuery.data?.id;

    const favoritesCountQuery = useQuery({
        queryKey: ['favorites', 'count', clubId],
        queryFn: async (): Promise<number> => {
            const response = await axiosInstance.get<FavoritesCountResponse>(
                `/v2/favorites/count?clubId=${clubId}`
            );
            return response.data.data.count;
        },
        enabled: !!clubId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });

    const userFavoriteQuery = useQuery({
        queryKey: ['favorites', 'user', clubId],
        queryFn: async (): Promise<boolean> => {
            const response = await axiosInstance.get<UserFavoritesResponse>(
                `/v2/favorites?clubs=true&clubId=${clubId}`
            );
            return response.data.data.favorites.data.length > 0;
        },
        enabled: !!clubId && isAuthenticated,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });

    const todayEventsQuery = useQuery({
        queryKey: ['events', 'today', clubId],
        queryFn: async (): Promise<Event[]> => {
            const startOfDay = dayjs().startOf('day').toISOString();
            const endOfDay = dayjs().endOf('day').toISOString();

            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,club';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/club/${clubId}?startDateFrom=${startOfDay}&startDateTo=${endOfDay}&fields=${fields}`
            );
            return response.data.data.data;
        },
        enabled: !!clubId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });

    const upcomingEventsQuery = useQuery({
        queryKey: ['events', 'upcoming', clubId],
        queryFn: async (): Promise<Event[]> => {
            const startOfTomorrow = dayjs().add(1, 'day').startOf('day').toISOString();

            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,club';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/club/${clubId}?startDateFrom=${startOfTomorrow}&fields=${fields}`
            );
            return response.data.data.data;
        },
        enabled: !!clubId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.post('/v2/favorites/toggle', { clubId: id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites', 'count', clubId] });
            queryClient.invalidateQueries({ queryKey: ['favorites', 'user', clubId] });
        },
        onError: () => {
            toast.error(t('club.favorite_error'));
        },
    });

    const formatOpeningDays = (days: string[]): string => {
        if (!days || days.length === 0) return '';

        const lang = i18n.language === 'en' ? 'en' : 'es';
        const sortedDays = [...days].sort((a, b) => DAY_MAP[a]?.order - DAY_MAP[b]?.order);

        if (sortedDays.length === 1) {
            return DAY_MAP[sortedDays[0]]?.[lang] || sortedDays[0];
        }

        const isConsecutive = sortedDays.every((day, index) => {
            if (index === 0) return true;
            const prevOrder = DAY_MAP[sortedDays[index - 1]]?.order;
            const currentOrder = DAY_MAP[day]?.order;
            return currentOrder - prevOrder === 1;
        });

        if (isConsecutive && sortedDays.length > 2) {
            const firstDay = DAY_MAP[sortedDays[0]]?.[lang];
            const lastDay = DAY_MAP[sortedDays[sortedDays.length - 1]]?.[lang];
            return lang === 'es'
                ? `De ${firstDay} a ${lastDay}`
                : `${firstDay} to ${lastDay}`;
        }

        return sortedDays.map(day => DAY_MAP[day]?.[lang] || day).join(', ');
    };

    const formatOperatingHours = (openingTime: string, closingTime: string): string => {
        if (!openingTime || !closingTime) return '';
        return `${openingTime} - ${closingTime}`;
    };

    const formatEventDate = (dateString: string): string => {
        return dayjs(dateString).locale(locale).format('ddd, D MMMM');
    };

    const formatEventTime = (startTime: string, endTime: string): string => {
        if (!startTime || !endTime) return '';
        return `${startTime} - ${endTime}`;
    };

    const handleLike = () => {
        if (!clubId) return;
        toggleFavoriteMutation.mutate(clubId);
    };

    const handlePhoneClick = () => {
        if (clubQuery.data?.contactNumber) {
            window.open(`tel:${clubQuery.data.contactNumber}`, '_self');
        }
    };

    const handleEmailClick = () => {
        if (clubQuery.data?.email) {
            window.open(`mailto:${clubQuery.data.email}`, '_self');
        }
    };

    const handleEventClick = (slug: string) => {
        navigate({ to: '/event/$slug', params: { slug } });
    };

    const handleUpcomingEventsClick = () => {
        navigate({ to: '/', search: { view: 'events' } });
    };

    const handleTodayEventsClick = () => {
        navigate({ to: '/', search: { view: 'events' } });
    };

    if (clubQuery.isError) {
        return <PageError />;
    }

    const club = clubQuery.data;
    const isLikesLoading = favoritesCountQuery.isLoading || (isAuthenticated && userFavoriteQuery.isLoading);
    const likesCount = favoritesCountQuery.data ?? 0;
    const isLiked = userFavoriteQuery.data ?? false;
    const todayEvents = todayEventsQuery.data ?? [];
    const upcomingEvents = upcomingEventsQuery.data ?? [];

    // Determinar si mostrar el arrow clickeable basado en cantidad de eventos
    const showTodayArrow = todayEvents.length > MIN_EVENTS_FOR_ARROW;
    const showUpcomingArrow = upcomingEvents.length > MIN_EVENTS_FOR_ARROW;

    return (
        <>
            {/* Mobile Layout */}
            <div className="flex flex-col gap-8 px-4 pt-[120px] pb-[360px] md:hidden bg-[#050505] min-h-screen">
                {/* Club Profile Section */}
                <div className="flex flex-col gap-6 items-center">
                    <ClubProfile
                        name={club?.name || ''}
                        type={VENUE_TYPE_MAP[club?.venueType || ''] || club?.venueType || ''}
                        operatingDays={formatOpeningDays(club?.openingDays || [])}
                        operatingHours={formatOperatingHours(club?.openingTime || '', club?.closingTime || '')}
                        logoUrl={club?.logo}
                        likesCount={likesCount}
                        isLiked={isLiked}
                        onLikeClick={handleLike}
                        isLoading={clubQuery.isLoading}
                        isLikesLoading={isLikesLoading}
                        canLike={isAuthenticated}
                        isLikeDisabled={toggleFavoriteMutation.isPending}
                    />

                    {club?.images && club.images.length > 0 && (
                        <PhotoCarousel
                            photos={club.images.map((url, index) => ({
                                id: `photo-${index}`,
                                src: url,
                                alt: `${club.name} photo ${index + 1}`
                            }))}
                            isLoading={clubQuery.isLoading}
                        />
                    )}

                    <ContactButtons
                        onPhoneClick={handlePhoneClick}
                        onEmailClick={handleEmailClick}
                        isLoading={clubQuery.isLoading}
                    />
                </div>

                {/* Events Sections */}
                {showUpcomingEvents ? (
                    <UpcomingEventsPanel
                        clubId={clubId || ''}
                        onEventClick={handleEventClick}
                    />
                ) : (
                    <>
                        {todayEvents.length > 0 && (
                            <EventSection
                                title={t('events.today')}
                                onHeaderClick={showTodayArrow ? handleTodayEventsClick : undefined}
                            >
                                {todayEvents.map((event) => (
                                    <EventCardHz
                                        key={event.id}
                                        title={event.name}
                                        date={formatEventDate(event.startDate)}
                                        time={formatEventTime(event.startTime, event.endTime)}
                                        location={event.club?.name || ''}
                                        imageUrl={event.flyer}
                                        onClick={() => handleEventClick(event.slug)}
                                    />
                                ))}
                            </EventSection>
                        )}

                        {upcomingEvents.length > 0 && (
                            <EventSection
                                title={t('events.upcoming')}
                                onHeaderClick={showUpcomingArrow ? handleUpcomingEventsClick : undefined}
                            >
                                {upcomingEvents.map((event) => (
                                    <EventCardHz
                                        key={event.id}
                                        title={event.name}
                                        date={formatEventDate(event.startDate)}
                                        time={formatEventTime(event.startTime, event.endTime)}
                                        location={event.club?.name || ''}
                                        imageUrl={event.flyer}
                                        onClick={() => handleEventClick(event.slug)}
                                    />
                                ))}
                            </EventSection>
                        )}
                    </>
                )}

                {/* Location Section */}
                <LocationCard
                    title={t('club.location', 'Ubicación')}
                    address="Calle de Fortuny, 34, 28010. Madrid, España"
                    coordinates={{
                        lat: 40.425935536837265,
                        lng: -3.6897071108489854,
                    }}
                    legalText={t('club.legal_terms', 'Leer los términos legales del klub')}
                />
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex gap-8 px-34 my-10">
                <div className="flex-1 flex flex-col gap-9 px-4 py-6">
                    <div className="flex flex-col gap-6 items-center">
                        <ClubProfile
                            name={club?.name || ''}
                            type={VENUE_TYPE_MAP[club?.venueType || ''] || club?.venueType || ''}
                            operatingDays={formatOpeningDays(club?.openingDays || [])}
                            operatingHours={formatOperatingHours(club?.openingTime || '', club?.closingTime || '')}
                            logoUrl={club?.logo}
                            likesCount={likesCount}
                            isLiked={isLiked}
                            onLikeClick={handleLike}
                            isLoading={clubQuery.isLoading}
                            isLikesLoading={isLikesLoading}
                            canLike={isAuthenticated}
                            isLikeDisabled={toggleFavoriteMutation.isPending}
                        />

                        {club?.images && club.images.length > 0 && (
                            <PhotoCarousel
                                photos={club.images.map((url, index) => ({
                                    id: `photo-${index}`,
                                    src: url,
                                    alt: `${club.name} photo ${index + 1}`
                                }))}
                                isLoading={clubQuery.isLoading}
                            />
                        )}

                        <ContactButtons
                            onPhoneClick={handlePhoneClick}
                            onEmailClick={handleEmailClick}
                            isLoading={clubQuery.isLoading}
                        />
                    </div>

                    <LocationCard
                        address="Calle de Fortuny, 34, 28010. Madrid, España"
                        coordinates={{
                            lat: 40.425935536837265,
                            lng: -3.6897071108489854,
                        }}
                    />
                </div>

                <div className="flex-1 flex flex-col gap-9 px-4 py-6">
                    {showUpcomingEvents ? (
                        <UpcomingEventsPanel
                            clubId={clubId || ''}
                            onEventClick={handleEventClick}
                        />
                    ) : (
                        <>
                            {todayEvents.length > 0 && (
                                <EventSection
                                    title={t('events.today')}
                                    onHeaderClick={showTodayArrow ? handleTodayEventsClick : undefined}
                                >
                                    {todayEvents.map((event) => (
                                        <EventCardHz
                                            key={event.id}
                                            title={event.name}
                                            date={formatEventDate(event.startDate)}
                                            time={formatEventTime(event.startTime, event.endTime)}
                                            location={event.club?.name || ''}
                                            imageUrl={event.flyer}
                                            onClick={() => handleEventClick(event.slug)}
                                        />
                                    ))}
                                </EventSection>
                            )}

                            {upcomingEvents.length > 0 && (
                                <EventSection
                                    title={t('events.upcoming')}
                                    onHeaderClick={showUpcomingArrow ? handleUpcomingEventsClick : undefined}
                                >
                                    {upcomingEvents.map((event) => (
                                        <EventCardHz
                                            key={event.id}
                                            title={event.name}
                                            date={formatEventDate(event.startDate)}
                                            time={formatEventTime(event.startTime, event.endTime)}
                                            location={event.club?.name || ''}
                                            imageUrl={event.flyer}
                                            onClick={() => handleEventClick(event.slug)}
                                        />
                                    ))}
                                </EventSection>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default Home;
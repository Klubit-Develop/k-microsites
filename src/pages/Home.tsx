import { useMemo } from 'react';
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
import EmptyEventsState from '@/components/EmptyEventsState';

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
    termsAndConditions: string | null;
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
    PROMOTER: 'Promotora',
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

const MAX_EVENTS_TO_SHOW = 5;
const MIN_EVENTS_FOR_ARROW = 6;

const getClubSlug = (): string => {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return import.meta.env.VITE_DEV_CLUB_SLUG || 'localhost';
    }

    const parts = hostname.split('.');
    if (parts.length >= 3) {
        return parts[0];
    }

    return 'localhost';
};

const EventsSkeleton = () => (
    <div className="flex flex-col gap-8 w-full">
        {[1, 2].map((section) => (
            <div key={section} className="flex flex-col gap-4 items-start w-full animate-pulse">
                <div className="flex gap-0.5 items-center px-1.5 w-full">
                    <div className="h-7 w-40 bg-[#232323] rounded" />
                </div>
                <div className="flex flex-col gap-2 w-full">
                    {[1, 2].map((card) => (
                        <div
                            key={card}
                            className="flex items-center gap-3 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl"
                        >
                            <div className="w-[54px] h-[68px] shrink-0 bg-[#232323] rounded-sm" />
                            <div className="flex-1 flex flex-col gap-2 min-w-0">
                                <div className="h-4 w-3/4 bg-[#232323] rounded" />
                                <div className="h-3.5 w-1/2 bg-[#232323] rounded" />
                                <div className="h-3.5 w-1/3 bg-[#232323] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

const Home = () => {
    const { i18n, t } = useTranslation();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { view } = useSearch({ from: '/' });

    const token = useAuthStore((state) => state.token);

    const isAuthenticated = !!token;
    const locale = i18n.language === 'en' ? 'en' : 'es';
    const showUpcomingEventsPanel = view === 'events';

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
            const tomorrow = dayjs().add(1, 'day').startOf('day').toISOString();

            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,club';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/club/${clubId}?startDateFrom=${tomorrow}&fields=${fields}&limit=10`
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
            toast.error(t('club.favorite_error', 'Error al actualizar favorito'));
        },
    });

    const formatOpeningDays = (days: string[]): string => {
        if (!days || days.length === 0) return '';

        const lang = i18n.language === 'en' ? 'en' : 'es';
        const sortedDays = [...days].sort((a, b) => {
            return (DAY_MAP[a]?.order || 0) - (DAY_MAP[b]?.order || 0);
        });

        if (sortedDays.length === 7) {
            return lang === 'es' ? 'Todos los días' : 'Every day';
        }

        if (sortedDays.length >= 3) {
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

    const handleLegalClick = () => {
        navigate({ to: '/terms-and-conditions-club' });
    };

    if (clubQuery.isError) {
        return <PageError />;
    }

    const club = clubQuery.data;
    const isLikesLoading = favoritesCountQuery.isLoading || (isAuthenticated && userFavoriteQuery.isLoading);
    const likesCount = favoritesCountQuery.data ?? 0;
    const isLiked = userFavoriteQuery.data ?? false;
    const todayEvents = todayEventsQuery.data ?? [];
    const isEventsLoading = clubQuery.isLoading || todayEventsQuery.isLoading || upcomingEventsQuery.isLoading;

    const sortedUpcomingEvents = useMemo(() => {
        const events = upcomingEventsQuery.data ?? [];
        return [...events].sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));
    }, [upcomingEventsQuery.data]);

    const showUpcomingArrow = sortedUpcomingEvents.length >= MIN_EVENTS_FOR_ARROW;
    const displayedUpcomingEvents = showUpcomingArrow
        ? sortedUpcomingEvents.slice(0, MAX_EVENTS_TO_SHOW)
        : sortedUpcomingEvents;

    const renderEventsContent = () => {
        if (showUpcomingEventsPanel) {
            return (
                <UpcomingEventsPanel
                    clubId={clubId || ''}
                    onEventClick={handleEventClick}
                />
            );
        }

        if (isEventsLoading) {
            return <EventsSkeleton />;
        }

        const hasNoEvents = todayEvents.length === 0 && sortedUpcomingEvents.length === 0;

        if (hasNoEvents) {
            return <EmptyEventsState />;
        }

        return (
            <>
                {todayEvents.length > 0 && (
                    <EventSection title={t('events.today')}>
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

                {sortedUpcomingEvents.length > 0 && (
                    <EventSection
                        title={t('events.upcoming')}
                        onHeaderClick={showUpcomingArrow ? handleUpcomingEventsClick : undefined}
                    >
                        {displayedUpcomingEvents.map((event) => (
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
        );
    };

    return (
        <>
            {/* Mobile Layout */}
            <div className="flex flex-col gap-8 px-4 pt-[120px] pb-[360px] md:hidden bg-[#050505] min-h-screen">
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

                {renderEventsContent()}

                <LocationCard
                    title={t('club.location')}
                    address="Calle de Fortuny, 34, 28010. Madrid, España"
                    coordinates={{
                        lat: 40.425935536837265,
                        lng: -3.6897071108489854,
                    }}
                    legalText={club?.termsAndConditions ? t('club.legal_terms') : undefined}
                    onLegalClick={club?.termsAndConditions ? handleLegalClick : undefined}
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
                        legalText={club?.termsAndConditions ? t('club.legal_terms') : undefined}
                        onLegalClick={club?.termsAndConditions ? handleLegalClick : undefined}
                    />
                </div>

                <div className="flex-1 flex flex-col gap-9 px-4 py-6">
                    {renderEventsContent()}
                </div>
            </div>
        </>
    );
};

export default Home;
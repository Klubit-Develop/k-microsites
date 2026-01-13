import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';

import PageError from '@/components/common/PageError';
import ArtistProfile from '@/components/ArtistProfile';
import EventCardHz from '@/components/EventCardHz';
import { ChevronRightIcon } from '@/components/icons';

interface Event {
    id: string;
    name: string;
    slug: string;
    flyer: string;
    startDate: string;
    startTime: string;
    endTime: string;
    address: string;
    club?: {
        id: string;
        name: string;
        slug: string;
    };
}

interface Artist {
    id: string;
    firstName: string;
    lastName: string;
    artisticName: string;
    slug: string;
    avatar: string;
    gender: string;
    isActive: boolean;
}

interface ArtistResponse {
    status: 'success' | 'error';
    code: string;
    data: { artist: Artist };
    message: string;
}

interface EventsResponse {
    status: 'success' | 'error';
    code: string;
    data: { data: Event[]; meta: { total: number } };
    message: string;
}

interface FavoritesCountResponse {
    status: 'success' | 'error';
    code: string;
    data: { artistId: string; count: number };
    message: string;
}

interface UserFavoritesResponse {
    status: 'success' | 'error';
    code: string;
    message: string;
    data: {
        favorites: {
            data: { id: string; artistId: string }[];
            meta: { total: number };
        };
    };
}

const MAX_EVENTS_TO_SHOW = 5;
const MIN_EVENTS_FOR_ARROW = 6;

const Artist = () => {
    const { slug } = useParams({ strict: false });
    const { i18n, t } = useTranslation();
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [showAllUpcoming, setShowAllUpcoming] = useState(false);

    const isAuthenticated = !!token;
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const artistQuery = useQuery({
        queryKey: ['artist', slug],
        queryFn: async (): Promise<Artist> => {
            const response = await axiosInstance.get<ArtistResponse>(`/v2/artists/slug/${slug}`);
            return response.data.data.artist;
        },
        enabled: !!slug,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const artistId = artistQuery.data?.id;

    const todayEventsQuery = useQuery({
        queryKey: ['artist-events-today', artistId],
        queryFn: async (): Promise<Event[]> => {
            const startDateFrom = dayjs().startOf('day').toISOString();
            const startDateTo = dayjs().endOf('day').toISOString();
            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,club';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/artist/${artistId}?startDateFrom=${startDateFrom}&startDateTo=${startDateTo}&fields=${fields}`
            );
            return response.data.data.data;
        },
        enabled: !!artistId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const upcomingEventsQuery = useQuery({
        queryKey: ['artist-events-upcoming', artistId],
        queryFn: async (): Promise<Event[]> => {
            const startDateFrom = dayjs().add(1, 'day').startOf('day').toISOString();
            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,club';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/artist/${artistId}?startDateFrom=${startDateFrom}&fields=${fields}`
            );
            return response.data.data.data;
        },
        enabled: !!artistId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const favoritesCountQuery = useQuery({
        queryKey: ['favorites', 'count', 'artist', artistId],
        queryFn: async (): Promise<number> => {
            const response = await axiosInstance.get<FavoritesCountResponse>(
                `/v2/favorites/count?artistId=${artistId}`
            );
            return response.data.data.count;
        },
        enabled: !!artistId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const userFavoriteQuery = useQuery({
        queryKey: ['favorites', 'user', 'artist', artistId],
        queryFn: async (): Promise<boolean> => {
            const response = await axiosInstance.get<UserFavoritesResponse>(
                `/v2/favorites?artists=true&artistId=${artistId}`
            );
            return response.data.data.favorites.data.length > 0;
        },
        enabled: !!artistId && isAuthenticated,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.post('/v2/favorites/toggle', { artistId: id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites', 'count', 'artist', artistId] });
            queryClient.invalidateQueries({ queryKey: ['favorites', 'user', 'artist', artistId] });
        },
        onError: () => {
            toast.error(t('artist.favorite_error', 'Error al actualizar favorito'));
        },
    });

    const sortedUpcomingEvents = useMemo(() => {
        const events = upcomingEventsQuery.data || [];
        return [...events].sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));
    }, [upcomingEventsQuery.data]);

    const formatEventDate = (dateString: string): string => {
        const formatted = dayjs(dateString).locale(locale).format('ddd, D MMMM');
        return formatted.charAt(0).toLowerCase() + formatted.slice(1);
    };

    const formatEventTime = (startTime: string, endTime: string): string => {
        return `${startTime} - ${endTime}`;
    };

    const handleLike = () => {
        if (!artistId) return;
        toggleFavoriteMutation.mutate(artistId);
    };

    const handleEventClick = (eventSlug: string) => {
        navigate({ to: `/event/${eventSlug}` });
    };

    const handleShowAllUpcoming = () => {
        setShowAllUpcoming(true);
    };

    if (artistQuery.isError) {
        return <PageError />;
    }

    const isLoading = artistQuery.isLoading;
    const isTodayLoading = todayEventsQuery.isLoading;
    const isUpcomingLoading = upcomingEventsQuery.isLoading;
    const artist = artistQuery.data;

    const isLikesLoading = favoritesCountQuery.isLoading || (isAuthenticated && userFavoriteQuery.isLoading);
    const likesCount = favoritesCountQuery.data ?? 0;
    const isLiked = userFavoriteQuery.data ?? false;

    const todayEvents = todayEventsQuery.data || [];
    const upcomingEvents = sortedUpcomingEvents;

    const showUpcomingArrow = upcomingEvents.length >= MIN_EVENTS_FOR_ARROW && !showAllUpcoming;
    const displayedUpcomingEvents = showAllUpcoming
        ? upcomingEvents
        : upcomingEvents.length >= MIN_EVENTS_FOR_ARROW
            ? upcomingEvents.slice(0, MAX_EVENTS_TO_SHOW)
            : upcomingEvents;

    const renderEventCard = (event: Event) => (
        <EventCardHz
            key={event.id}
            title={event.name}
            date={formatEventDate(event.startDate)}
            time={formatEventTime(event.startTime, event.endTime)}
            location={event.club?.name || event.address}
            imageUrl={event.flyer}
            onClick={() => handleEventClick(event.slug)}
        />
    );

    const renderSkeletonCards = (count: number) => (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="flex gap-3 items-center p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] w-full animate-pulse"
                >
                    <div className="w-[54px] h-[68px] bg-[#232323] rounded shrink-0" />
                    <div className="flex flex-col flex-1 gap-2">
                        <div className="h-4 w-32 bg-[#232323] rounded" />
                        <div className="h-3 w-40 bg-[#232323] rounded" />
                        <div className="h-3 w-24 bg-[#232323] rounded" />
                    </div>
                </div>
            ))}
        </>
    );

    return (
        <div className="bg-[#050505] min-h-screen flex justify-center pt-[120px] pb-[360px] md:pt-24 md:pb-24">
            <div className="flex flex-col gap-9 w-full max-w-[500px] px-4 md:px-6">
                {/* Artist Profile */}
                <ArtistProfile
                    artisticName={artist?.artisticName || ''}
                    firstName={artist?.firstName || ''}
                    lastName={artist?.lastName || ''}
                    avatar={artist?.avatar || ''}
                    role="DJ"
                    likesCount={likesCount}
                    isLiked={isLiked}
                    onLikeClick={handleLike}
                    isLoading={isLoading}
                    isLikesLoading={isLikesLoading}
                    canLike={isAuthenticated}
                    isLikeDisabled={toggleFavoriteMutation.isPending}
                />

                {/* Today's Events - Never shows arrow */}
                {(isTodayLoading || todayEvents.length > 0) && (
                    <div className="flex flex-col gap-4 w-full">
                        <div className="flex gap-0.5 items-center px-1.5 w-full">
                            {isLoading ? (
                                <div className="h-6 w-16 bg-[#232323] rounded animate-pulse" />
                            ) : (
                                <h2 className="text-[#ff336d] text-2xl font-semibold font-borna">
                                    {t('artist.today', 'Hoy')}
                                </h2>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            {isTodayLoading ? renderSkeletonCards(1) : todayEvents.map(renderEventCard)}
                        </div>
                    </div>
                )}

                {/* Upcoming Events - Shows arrow only if 6+ events and not expanded */}
                {(isUpcomingLoading || upcomingEvents.length > 0) && (
                    <div className="flex flex-col gap-4 w-full">
                        <div className="flex gap-2 items-center px-1.5 w-full">
                            {isLoading ? (
                                <div className="h-6 w-40 bg-[#232323] rounded animate-pulse" />
                            ) : (
                                <button
                                    type="button"
                                    onClick={showUpcomingArrow ? handleShowAllUpcoming : undefined}
                                    className={`flex gap-2 items-center ${showUpcomingArrow ? 'cursor-pointer' : 'cursor-default'}`}
                                    disabled={!showUpcomingArrow}
                                >
                                    <h2 className="text-[#ff336d] text-2xl font-semibold font-borna">
                                        {t('artist.upcoming_events', 'Próximos eventos')}
                                    </h2>
                                    {showUpcomingArrow && (
                                        <div className="flex items-center pt-1">
                                            <ChevronRightIcon />
                                        </div>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            {isUpcomingLoading 
                                ? renderSkeletonCards(3) 
                                : displayedUpcomingEvents.map(renderEventCard)
                            }
                        </div>
                    </div>
                )}

                {/* No events message */}
                {!isTodayLoading && !isUpcomingLoading && todayEvents.length === 0 && upcomingEvents.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-[#939393] text-sm font-helvetica">
                            {t('artist.no_events', 'No hay eventos próximos')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Artist;
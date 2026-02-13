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
    termsAndConditions: string | null;
    address: string | null;
    addressLocation: {
        lat: number;
        lng: number;
    } | null;
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

const DAY_ORDER: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
};

const MAX_EVENTS_TO_SHOW = 3;
const MIN_EVENTS_FOR_ARROW = 4;

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

const DISCO_ICON_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/icon-disco.png';

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
            const fields = 'id,logo,name,venueType,openingDays,openingTime,closingTime,images,contactNumber,email,termsAndConditions,address,addressLocation';
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

    const getVenueTypeLabel = (venueType: string): string => {
        const key = `club.venue_type_${venueType}`;
        const translated = t(key);
        return translated !== key ? translated : venueType;
    };

    const formatOpeningDays = (days: string[]): string => {
        if (!days || days.length === 0) return '';

        const sortedDays = [...days].sort((a, b) => (DAY_ORDER[a] ?? 0) - (DAY_ORDER[b] ?? 0));

        const translateDay = (day: string): string => {
            const key = `club.days_${day}`;
            const translated = t(key);
            return translated !== key ? translated : day;
        };

        if (sortedDays.length === 1) {
            return translateDay(sortedDays[0]);
        }

        const isConsecutive = sortedDays.every((day, index) => {
            if (index === 0) return true;
            const prevOrder = DAY_ORDER[sortedDays[index - 1]] ?? 0;
            const currentOrder = DAY_ORDER[day] ?? 0;
            return currentOrder - prevOrder === 1;
        });

        if (isConsecutive && sortedDays.length > 2) {
            const firstDay = translateDay(sortedDays[0]);
            const lastDay = translateDay(sortedDays[sortedDays.length - 1]);
            return t('club.days_range', { first: firstDay, last: lastDay });
        }

        return sortedDays.map(day => translateDay(day)).join(', ');
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

    const handleMapClick = () => {
        if (club?.addressLocation) {
            const { lat, lng } = club.addressLocation;
            window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
        }
    };

    const club = clubQuery.data;
    const isLikesLoading = favoritesCountQuery.isLoading || (isAuthenticated && userFavoriteQuery.isLoading);
    const likesCount = favoritesCountQuery.data ?? 0;
    const isLiked = userFavoriteQuery.data ?? false;
    const todayEvents = todayEventsQuery.data ?? [];
    const upcomingEventsRaw = upcomingEventsQuery.data ?? [];
    const upcomingEvents = [...upcomingEventsRaw].sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));
    const isEventsLoading = clubQuery.isLoading || todayEventsQuery.isLoading || upcomingEventsQuery.isLoading;

    const showUpcomingArrow = upcomingEvents.length >= MIN_EVENTS_FOR_ARROW;
    const displayedUpcomingEvents = showUpcomingArrow
        ? upcomingEvents.slice(0, MAX_EVENTS_TO_SHOW)
        : upcomingEvents;

    const renderEventsContent = () => {
        if (showUpcomingEventsPanel) {
            return (
                <div className="flex flex-col gap-4 w-full">
                    <button
                        onClick={() => navigate({ to: '/' })}
                        className="flex items-center gap-2 text-[#939393] hover:text-[#F6F6F6] transition-colors self-start cursor-pointer"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[14px] font-helvetica font-medium">
                            {t('common.back')}
                        </span>
                    </button>
                    <UpcomingEventsPanel
                        clubId={clubId || ''}
                        onEventClick={handleEventClick}
                    />
                </div>
            );
        }

        if (isEventsLoading) {
            return <EventsSkeleton />;
        }

        const hasNoEvents = todayEvents.length === 0 && upcomingEvents.length === 0;

        if (hasNoEvents) {
            return (
                <div className={`flex flex-col gap-4 items-start w-full`}>
                    <div className="flex gap-2 items-center px-1.5 w-full">
                        <h2 className="text-[#ff336d] text-[24px] font-semibold leading-normal whitespace-nowrap overflow-hidden text-ellipsis font-borna">
                            {t('events.upcoming', 'Próximos eventos')}
                        </h2>
                    </div>

                    <div className="flex flex-1 flex-col gap-8 items-center justify-center py-8 w-full min-h-[300px]">
                        <div className="flex flex-col gap-6 items-center w-full">
                            <div className="flex items-center justify-center size-[90px]">
                                <img
                                    src={DISCO_ICON_URL}
                                    alt="Disco"
                                    className="size-[82px] object-contain"
                                    style={{ filter: 'drop-shadow(0px 0px 30px rgba(255, 255, 255, 0.25))' }}
                                />
                            </div>

                            <div className="flex flex-col gap-2 items-center px-4 text-center w-full">
                                <h3 className="text-[#f6f6f6] text-[24px] font-semibold leading-normal font-borna">
                                    {t('events.no_events_title', 'No hay eventos próximos')}
                                </h3>
                                <p className="text-[#939393] text-[16px] font-medium leading-normal font-helvetica">
                                    {t('events.no_events_description', 'Este klub no tiene eventos programados para este mes.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
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

                {upcomingEvents.length > 0 && (
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

    if (clubQuery.isError) {
        return <PageError />;
    }

    return (
        <>
            {/* Mobile Layout */}
            <div className="flex flex-col gap-8 px-4 pt-[80px] pb-[80px] md:hidden bg-[#050505] min-h-screen">
                <div className="flex flex-col gap-6 items-center">
                    <ClubProfile
                        name={club?.name || ''}
                        type={getVenueTypeLabel(club?.venueType || '')}
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

                {club?.address && club?.addressLocation && (
                    <LocationCard
                        title={t('club.location')}
                        address={club.address}
                        coordinates={{
                            lat: club.addressLocation.lat,
                            lng: club.addressLocation.lng,
                        }}
                        legalText={club?.termsAndConditions ? t('club.legal_terms') : undefined}
                        onLegalClick={club?.termsAndConditions ? handleLegalClick : undefined}
                        onMapClick={handleMapClick}
                    />
                )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-start justify-center w-full px-8 lg:px-16 xl:px-24 2xl:px-96 gap-10 py-20">
                <div className="flex flex-col gap-9 w-full max-w-[450px]">
                    <div className="flex flex-col gap-6 items-center">
                        <ClubProfile
                            name={club?.name || ''}
                            type={getVenueTypeLabel(club?.venueType || '')}
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

                    {club?.address && club?.addressLocation && (
                        <LocationCard
                            title={t('club.location')}
                            address={club.address}
                            coordinates={{
                                lat: club.addressLocation.lat,
                                lng: club.addressLocation.lng,
                            }}
                            legalText={club?.termsAndConditions ? t('club.legal_terms') : undefined}
                            onLegalClick={club?.termsAndConditions ? handleLegalClick : undefined}
                            onMapClick={handleMapClick}
                        />
                    )}
                </div>

                <div className="flex flex-col gap-9 w-full max-w-[450px]">
                    {renderEventsContent()}
                </div>
            </div>
        </>
    );
};

export default Home;
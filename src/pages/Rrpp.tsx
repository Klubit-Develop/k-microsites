import { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';

import PageError from '@/components/common/PageError';
import RRPPProfile from '@/components/RrppProfile';
import ClubSelector from '@/components/ClubSelector';
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

interface Club {
    id: string;
    name: string;
    slug: string;
    logo: string;
    venueType: string;
}

interface ClubRole {
    id: string;
    isActive: boolean;
    role: {
        id: string;
        code: string;
        name: string;
    };
    club: Club;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar: string | null;
    rrppProfilePrivate: boolean;
    clubRoles: ClubRole[];
}

interface UserResponse {
    status: 'success' | 'error';
    code: string;
    data: { user: User };
    message: string;
}

interface EventsResponse {
    status: 'success' | 'error';
    code: string;
    data: { data: Event[]; meta: { total: number } };
    message: string;
}

const Rrpp = () => {
    const { slug } = useParams({ from: '/rrrpp/$slug' });
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();

    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [isClubSelectorOpen, setIsClubSelectorOpen] = useState(false);

    const locale = i18n.language === 'en' ? 'en' : 'es';

    // User/RRPP Query - fetch user by username (slug is the username)
    const userQuery = useQuery({
        queryKey: ['rrpp', slug],
        queryFn: async (): Promise<User> => {
            const response = await axiosInstance.get<UserResponse>(
                `/v2/users/username/${slug}`
            );
            return response.data.data.user;
        },
        enabled: !!slug,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const user = userQuery.data;
    const userId = user?.id;

    // Extract clubs from clubRoles (backend already filters by RRPP role)
    const rrppClubs = useMemo(() => {
        if (!user?.clubRoles) return [];
        return user.clubRoles.map(cr => cr.club);
    }, [user?.clubRoles]);

    // Set first club as selected when data loads
    useEffect(() => {
        if (rrppClubs.length > 0 && !selectedClub) {
            setSelectedClub(rrppClubs[0]);
        }
    }, [rrppClubs, selectedClub]);

    // Today's Events Query
    // GET /v2/events/rrpp/:rrppId?startDateFrom={startOfToday}&startDateTo={endOfToday}
    const todayEventsQuery = useQuery({
        queryKey: ['rrpp-events-today', userId],
        queryFn: async (): Promise<Event[]> => {
            const startDateFrom = dayjs().startOf('day').toISOString();
            const startDateTo = dayjs().endOf('day').toISOString();

            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/rrpp/${userId}?startDateFrom=${startDateFrom}&startDateTo=${startDateTo}`
            );
            return response.data.data.data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    // Upcoming Events Query (from tomorrow onwards)
    // GET /v2/events/rrpp/:rrppId?startDateFrom={startOfTomorrow}
    const upcomingEventsQuery = useQuery({
        queryKey: ['rrpp-events-upcoming', userId],
        queryFn: async (): Promise<Event[]> => {
            const startDateFrom = dayjs().add(1, 'day').startOf('day').toISOString();

            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/rrpp/${userId}?startDateFrom=${startDateFrom}`
            );
            return response.data.data.data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    // Filter events by selected club
    const todayEvents = useMemo(() => {
        const events = todayEventsQuery.data || [];
        if (!selectedClub) return events;
        return events.filter(event => event.club?.id === selectedClub.id);
    }, [todayEventsQuery.data, selectedClub]);

    const upcomingEvents = useMemo(() => {
        const events = upcomingEventsQuery.data || [];
        if (!selectedClub) return events;
        const filtered = events.filter(event => event.club?.id === selectedClub.id);
        // Sort by date
        return filtered.sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));
    }, [upcomingEventsQuery.data, selectedClub]);

    const formatEventDate = (dateString: string): string => {
        const formatted = dayjs(dateString).locale(locale).format('ddd, D MMMM');
        return formatted.charAt(0).toLowerCase() + formatted.slice(1);
    };

    const formatEventTime = (startTime: string, endTime: string): string => {
        return `${startTime} - ${endTime}`;
    };

    const handleEventClick = (eventSlug: string) => {
        navigate({ to: `/event/${eventSlug}` });
    };

    const handleClubSelect = (club: Club) => {
        setSelectedClub(club);
    };

    if (userQuery.isError) {
        return <PageError />;
    }

    const isLoading = userQuery.isLoading;
    const isTodayLoading = todayEventsQuery.isLoading;
    const isUpcomingLoading = upcomingEventsQuery.isLoading;

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
                    className="flex gap-[12px] items-center p-[12px] bg-[#141414] border-2 border-[#232323] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] w-full animate-pulse"
                >
                    <div className="w-[54px] h-[68px] bg-[#232323] rounded-[4px] shrink-0" />
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
        <div className="bg-[#050505] min-h-screen flex justify-center py-24">
            <div className="flex flex-col gap-[36px] w-full max-w-[500px] px-6">
                {/* RRPP Profile */}
                <RRPPProfile
                    name={user ? `${user.firstName} ${user.lastName}` : ''}
                    username={user?.username ? `@${user.username}` : ''}
                    avatar={user?.avatar || ''}
                    isLoading={isLoading}
                />

                {/* Club Selector */}
                <ClubSelector
                    clubs={rrppClubs}
                    selectedClub={selectedClub}
                    onSelectClub={handleClubSelect}
                    isLoading={isLoading}
                    isOpen={isClubSelectorOpen}
                    onToggle={() => setIsClubSelectorOpen(!isClubSelectorOpen)}
                />

                {/* Today's Events */}
                {(isTodayLoading || todayEvents.length > 0) && (
                    <div className="flex flex-col gap-[16px] w-full">
                        {/* Header */}
                        <div className="flex gap-[2px] items-center px-[6px] w-full">
                            {isLoading ? (
                                <div className="h-6 w-16 bg-[#232323] rounded animate-pulse" />
                            ) : (
                                <h2
                                    className="text-[#ff336d] text-[24px] font-semibold"
                                    style={{ fontFamily: "'Borna', sans-serif" }}
                                >
                                    {t('rrpp.today', 'Hoy')}
                                </h2>
                            )}
                        </div>
                        {/* Events */}
                        <div className="flex flex-col gap-[8px] w-full">
                            {isTodayLoading ? renderSkeletonCards(1) : todayEvents.map(renderEventCard)}
                        </div>
                    </div>
                )}

                {/* Upcoming Events */}
                {(isUpcomingLoading || upcomingEvents.length > 0) && (
                    <div className="flex flex-col gap-[16px] w-full">
                        {/* Header with arrow */}
                        <div className="flex gap-[8px] items-center px-[6px] w-full">
                            {isLoading ? (
                                <div className="h-6 w-40 bg-[#232323] rounded animate-pulse" />
                            ) : (
                                <div className="flex gap-[8px] items-center">
                                    <h2
                                        className="text-[#ff336d] text-[24px] font-semibold"
                                        style={{ fontFamily: "'Borna', sans-serif" }}
                                    >
                                        {t('rrpp.upcoming_events', 'Próximos eventos')}
                                    </h2>
                                    <div className="flex items-center pt-[4px]">
                                        <ChevronRightIcon />
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Events */}
                        <div className="flex flex-col gap-[8px] w-full">
                            {isUpcomingLoading ? renderSkeletonCards(5) : upcomingEvents.map(renderEventCard)}
                        </div>
                    </div>
                )}

                {/* No events message */}
                {!isTodayLoading && !isUpcomingLoading && todayEvents.length === 0 && upcomingEvents.length === 0 && selectedClub && (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-[#939393] text-[14px] font-helvetica">
                            {t('rrpp.no_events', 'No hay eventos próximos para este club')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Rrpp;
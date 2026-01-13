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

const MAX_EVENTS_TO_SHOW = 5;
const MIN_EVENTS_FOR_ARROW = 6;

const Rrpp = () => {
    const { slug } = useParams({ from: '/rrpp/$slug' });
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();

    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [isClubSelectorOpen, setIsClubSelectorOpen] = useState(false);
    const [showAllUpcoming, setShowAllUpcoming] = useState(false);

    const locale = i18n.language === 'en' ? 'en' : 'es';

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

    const rrppClubs = useMemo(() => {
        if (!user?.clubRoles) return [];
        return user.clubRoles.map(cr => cr.club);
    }, [user?.clubRoles]);

    useEffect(() => {
        if (rrppClubs.length > 0 && !selectedClub) {
            setSelectedClub(rrppClubs[0]);
        }
    }, [rrppClubs, selectedClub]);

    useEffect(() => {
        setShowAllUpcoming(false);
    }, [selectedClub]);

    const todayEventsQuery = useQuery({
        queryKey: ['rrpp-events-today', userId],
        queryFn: async (): Promise<Event[]> => {
            const startDateFrom = dayjs().startOf('day').toISOString();
            const startDateTo = dayjs().endOf('day').toISOString();
            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,club';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/rrpp/${userId}?startDateFrom=${startDateFrom}&startDateTo=${startDateTo}&fields=${fields}`
            );
            return response.data.data.data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const upcomingEventsQuery = useQuery({
        queryKey: ['rrpp-events-upcoming', userId],
        queryFn: async (): Promise<Event[]> => {
            const startDateFrom = dayjs().add(1, 'day').startOf('day').toISOString();
            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,club';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/rrpp/${userId}?startDateFrom=${startDateFrom}&fields=${fields}`
            );
            return response.data.data.data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const todayEvents = useMemo(() => {
        const events = todayEventsQuery.data || [];
        if (!selectedClub) return events;
        return events.filter(event => event.club?.id === selectedClub.id);
    }, [todayEventsQuery.data, selectedClub]);

    const upcomingEvents = useMemo(() => {
        const events = upcomingEventsQuery.data || [];
        if (!selectedClub) return events;
        const filtered = events.filter(event => event.club?.id === selectedClub.id);
        return filtered.sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));
    }, [upcomingEventsQuery.data, selectedClub]);

    const showUpcomingArrow = upcomingEvents.length >= MIN_EVENTS_FOR_ARROW && !showAllUpcoming;
    const displayedUpcomingEvents = showAllUpcoming
        ? upcomingEvents
        : upcomingEvents.length >= MIN_EVENTS_FOR_ARROW
            ? upcomingEvents.slice(0, MAX_EVENTS_TO_SHOW)
            : upcomingEvents;

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

    const handleShowAllUpcoming = () => {
        setShowAllUpcoming(true);
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
                {/* RRPP Profile */}
                <RRPPProfile
                    firstName={user?.firstName || ''}
                    lastName={user?.lastName || ''}
                    username={user?.username ? `@${user.username}` : ''}
                    avatar={user?.avatar || null}
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

                {/* Today's Events - Never shows arrow */}
                {(isTodayLoading || todayEvents.length > 0) && (
                    <div className="flex flex-col gap-4 w-full">
                        <div className="flex gap-0.5 items-center px-1.5 w-full">
                            {isLoading ? (
                                <div className="h-6 w-16 bg-[#232323] rounded animate-pulse" />
                            ) : (
                                <h2 className="text-[#ff336d] text-2xl font-semibold font-borna">
                                    {t('rrpp.today', 'Hoy')}
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
                                        {t('rrpp.upcoming_events', 'Próximos eventos')}
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
                {!isTodayLoading && !isUpcomingLoading && todayEvents.length === 0 && upcomingEvents.length === 0 && selectedClub && (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-[#939393] text-sm font-helvetica">
                            {t('rrpp.no_events', 'No hay eventos próximos para este club')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Rrpp;
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import MonthSelector from '@/components/MonthSelector';
import EventCardHz, { EventCardHzSkeleton } from '@/components/EventCardHz';
import Button from '@/components/ui/Button';

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

interface EventsResponse {
    status: 'success' | 'error';
    code: string;
    data: {
        data: Event[];
        meta: {
            total: number;
            hasMore: boolean;
            currentPage: number;
            totalPages: number;
        };
    };
    message: string;
    details: string;
}

interface UpcomingEventsPanelProps {
    clubId: string;
    onEventClick?: (eventSlug: string) => void;
    className?: string;
}

const EVENTS_PER_PAGE = 6;

const UpcomingEventsPanel = ({
    clubId,
    onEventClick,
    className = '',
}: UpcomingEventsPanelProps) => {
    const { i18n, t } = useTranslation();
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [page, setPage] = useState(1);
    const [allEvents, setAllEvents] = useState<Event[]>([]);

    const isCurrentMonth = currentMonth.isSame(dayjs(), 'month');

    const eventsQuery = useQuery({
        queryKey: ['events', 'monthly', clubId, currentMonth.format('YYYY-MM'), page],
        queryFn: async (): Promise<{ events: Event[]; hasMore: boolean; total: number }> => {
            const startOfMonth = currentMonth.startOf('month').toISOString();
            const endOfMonth = currentMonth.endOf('month').toISOString();

            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,club';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/club/${clubId}?startDateFrom=${startOfMonth}&startDateTo=${endOfMonth}&fields=${fields}&limit=${EVENTS_PER_PAGE}&page=${page}`
            );
            return {
                events: response.data.data.data,
                hasMore: response.data.data.meta.hasMore,
                total: response.data.data.meta.total,
            };
        },
        enabled: !!clubId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (eventsQuery.data?.events) {
            const sortedEvents = [...eventsQuery.data.events].sort((a, b) => 
                dayjs(a.startDate).diff(dayjs(b.startDate))
            );
            
            if (page === 1) {
                setAllEvents(sortedEvents);
            } else {
                setAllEvents(prev => {
                    const combined = [...prev, ...sortedEvents];
                    return combined.sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));
                });
            }
        }
    }, [eventsQuery.data, page]);

    const handlePreviousMonth = () => {
        if (isCurrentMonth) return;
        setCurrentMonth(prev => prev.subtract(1, 'month'));
        setPage(1);
        setAllEvents([]);
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => prev.add(1, 'month'));
        setPage(1);
        setAllEvents([]);
    };

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
    };

    const formatMonthYear = (date: dayjs.Dayjs): string => {
        const formatted = date.locale(locale).format('MMMM YYYY');
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const formatEventDate = (dateString: string): string => {
        return dayjs(dateString).locale(locale).format('ddd, D MMMM');
    };

    const formatEventTime = (startTime: string, endTime: string): string => {
        if (!startTime || !endTime) return '';
        return `${startTime} - ${endTime}`;
    };

    const hasMore = eventsQuery.data?.hasMore ?? false;

    return (
        <div className={`flex flex-col gap-4 items-start w-full rounded-[10px] ${className}`}>
            <div className="flex gap-2 items-center px-1.5 w-full">
                <h2 className="text-[#ff336d] text-[24px] font-semibold leading-normal whitespace-nowrap overflow-hidden text-ellipsis font-borna">
                    {t('events.upcoming', 'Próximos eventos')}
                </h2>
            </div>

            <div className="flex flex-col gap-6 items-start w-full">
                <MonthSelector
                    date={formatMonthYear(currentMonth)}
                    onPrevious={handlePreviousMonth}
                    onNext={handleNextMonth}
                    isPreviousDisabled={isCurrentMonth}
                />

                <div className="flex flex-col gap-2 w-full">
                    {eventsQuery.isLoading && page === 1 ? (
                        [...Array(3)].map((_, index) => (
                            <EventCardHzSkeleton key={index} />
                        ))
                    ) : allEvents.length > 0 ? (
                        allEvents.map((event) => (
                            <EventCardHz
                                key={event.id}
                                title={event.name}
                                date={formatEventDate(event.startDate)}
                                time={formatEventTime(event.startTime, event.endTime)}
                                location={event.club?.name || ''}
                                imageUrl={event.flyer}
                                onClick={() => onEventClick?.(event.slug)}
                            />
                        ))
                    ) : (
                        <p className="text-[#939393] text-[14px] text-center py-8 font-helvetica">
                            {t('events.no_events', 'No hay eventos este mes')}
                        </p>
                    )}
                </div>

                {hasMore && (
                    <Button
                        variant="primary"
                        onClick={handleLoadMore}
                        className="w-full h-[48px]"
                        disabled={eventsQuery.isFetching}
                    >
                        {t('common.view_more', 'Ver más')}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default UpcomingEventsPanel;
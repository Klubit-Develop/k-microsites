import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import WalletEventCard, { WalletEventCardSkeleton } from '@/components/WalletEventCard';

interface ClubEvent {
    id: string;
    name: string;
    slug: string;
    flyer: string;
    startDate: string;
    startTime: string;
    endTime: string;
    address?: string;
    club: {
        id: string;
        name: string;
    };
}

interface EventsResponse {
    status: 'success' | 'error';
    code: string;
    data: {
        data: ClubEvent[];
        meta: {
            total: number;
            hasMore: boolean;
            currentPage: number;
            totalPages: number;
        };
    };
    message: string;
}

type EventsListVariant = 'upcoming' | 'past';

interface KardEventsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    variant: EventsListVariant;
    clubId: string;
}

const formatEventDate = (dateString: string, locale: string): string => {
    const date = dayjs(dateString).locale(locale);
    return date.format('ddd, D MMMM');
};

const formatEventTimeRange = (startTime?: string, endTime?: string): string => {
    if (startTime && endTime) {
        return `${startTime} - ${endTime}`;
    }
    return '';
};

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z"
            stroke="#939393"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M15.75 15.75L12.4875 12.4875"
            stroke="#939393"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const ListSkeleton = () => (
    <div className="flex flex-col gap-2 w-full animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
            <WalletEventCardSkeleton key={i} />
        ))}
    </div>
);

const KardEventsListModal = ({ isOpen, onClose, variant, clubId }: KardEventsListModalProps) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? 'en' : 'es';
    const navigate = useNavigate();

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: events, isLoading } = useQuery({
        queryKey: ['kard-events-list', clubId, variant],
        queryFn: async () => {
            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,address,club';
            const today = dayjs().startOf('day').toISOString();
            const dateParam = variant === 'upcoming'
                ? `startDateFrom=${today}`
                : `startDateTo=${today}`;
            const sort = variant === 'upcoming' ? 'asc' : 'desc';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/club/${clubId}?${dateParam}&fields=${fields}&limit=50&page=1&sort=${sort}`
            );
            return response.data.data.data;
        },
        enabled: isOpen && !!clubId,
    });

    const filteredEvents = useMemo(() => {
        if (!events) return [];
        if (!searchQuery.trim() || searchQuery.trim().length < 2) return events;

        const query = searchQuery.trim().toLowerCase();
        return events.filter((event) =>
            event.name.toLowerCase().includes(query)
        );
    }, [events, searchQuery]);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => {
            setIsAnimating(false);
            setSearchQuery('');
            document.body.style.overflow = '';
            onClose();
        }, 300);
    }, [onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) handleClose();
    };

    const handleEventClick = (slug: string) => {
        handleClose();
        navigate({ to: '/event/$slug', params: { slug } });
    };

    if (!isAnimating && !isOpen) return null;

    const title = variant === 'upcoming'
        ? t('wallet.upcoming_events', 'Próximos eventos')
        : t('wallet.past_events', 'Pasados');

    return createPortal(
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`relative w-full max-w-[500px] max-h-[90vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden flex flex-col transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[20px] font-borna font-semibold text-[#F6F6F6]">
                            {title}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="flex items-center justify-center size-8 rounded-full bg-[#232323]"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L13 13M13 1L1 13" stroke="#F6F6F6" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('wallet.search_events', 'Buscar eventos...')}
                            className="w-full h-10 pl-10 pr-4 bg-[#141414] border-2 border-[#232323] rounded-xl text-[14px] font-helvetica text-[#F6F6F6] placeholder:text-[#939393] outline-none focus:border-[#333]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-8">
                    {isLoading ? (
                        <ListSkeleton />
                    ) : filteredEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <span className="text-[32px]">
                                {variant === 'upcoming' ? '🎫' : '📜'}
                            </span>
                            <p className="text-[14px] font-helvetica text-[#939393] text-center">
                                {searchQuery.trim().length >= 2
                                    ? t('wallet.no_search_results', 'No se encontraron resultados')
                                    : variant === 'upcoming'
                                        ? t('wallet.empty_upcoming_title', 'Nada por aquí')
                                        : t('wallet.no_past', 'No tienes eventos pasados')
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filteredEvents.map((event) => (
                                <WalletEventCard
                                    key={event.id}
                                    title={event.name}
                                    date={formatEventDate(event.startDate, locale)}
                                    time={formatEventTimeRange(event.startTime, event.endTime)}
                                    location={event.club?.name || event.address || ''}
                                    imageUrl={event.flyer}
                                    variant={variant}
                                    onClick={() => handleEventClick(event.slug)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default KardEventsListModal;
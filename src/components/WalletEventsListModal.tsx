import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import WalletEventCard from '@/components/WalletEventCard';
import TransactionItemsModal from '@/components/TransactionItemsModal';

interface Transaction {
    id: string;
    type: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
    totalPrice: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
    event: {
        id: string;
        name: string;
        slug: string;
        flyer: string;
        startDate: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
    };
    club: {
        id: string;
        name: string;
        slug: string;
        logo: string;
        address?: string;
    };
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string;
    };
    _count: {
        items: number;
    };
}

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: {
        data: Transaction[];
        meta: {
            total: number;
            count: number;
            limit: number;
            hasMore: boolean;
        };
    };
    message: string;
}

type EventsListVariant = 'upcoming' | 'past';

interface WalletEventsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    variant: EventsListVariant;
}

const isEventUpcoming = (startDate: string): boolean => {
    const eventDate = dayjs(startDate);
    const now = dayjs();
    return eventDate.isSame(now, 'day') || eventDate.isAfter(now, 'day');
};

const isEventPast = (startDate: string): boolean => {
    const eventDate = dayjs(startDate);
    const today = dayjs();
    return eventDate.isBefore(today, 'day');
};

const formatEventDate = (dateString: string, locale: string): string => {
    const date = dayjs(dateString).locale(locale);
    return date.format('ddd, D MMMM');
};

const formatEventTimeRange = (startDate: string, startTime?: string, endTime?: string): string => {
    if (startTime && endTime) {
        return `${startTime} - ${endTime}`;
    }
    const start = dayjs(startDate);
    const startFormatted = start.format('HH:mm');
    const endFormatted = start.add(6, 'hour').format('HH:mm');
    return `${startFormatted} - ${endFormatted}`;
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
            <div key={i} className="h-[92px] w-full bg-[#232323] rounded-2xl" />
        ))}
    </div>
);

const WalletEventsListModal = ({ isOpen, onClose, variant }: WalletEventsListModalProps) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? 'en' : 'es';

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

    const apiQuery = searchQuery.trim().length >= 2 ? searchQuery.trim() : undefined;

    const { data: transactions, isLoading } = useQuery({
        queryKey: ['wallet-events-list', variant, apiQuery],
        queryFn: async () => {
            const params = new URLSearchParams({
                status: 'COMPLETED',
                limit: '100',
            });
            if (apiQuery) {
                params.set('q', apiQuery);
            }
            const response = await axiosInstance.get<BackendResponse>(
                `/v2/transactions/me?${params.toString()}`
            );
            return response.data.data.data;
        },
        enabled: isOpen,
    });

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];

        const filterFn = variant === 'upcoming' ? isEventUpcoming : isEventPast;
        const filtered = transactions.filter((tx) => filterFn(tx.event.startDate));

        if (variant === 'upcoming') {
            return filtered.sort((a, b) => dayjs(a.event.startDate).diff(dayjs(b.event.startDate)));
        }
        return filtered.sort((a, b) => dayjs(b.event.startDate).diff(dayjs(a.event.startDate)));
    }, [transactions, variant]);

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

    const handleTransactionClick = (transactionId: string) => {
        setSelectedTransactionId(transactionId);
        setIsTransactionModalOpen(true);
    };

    const handleTransactionModalClose = () => {
        setIsTransactionModalOpen(false);
        setSelectedTransactionId(null);
    };

    if (!isAnimating && !isOpen) return null;

    const title = variant === 'upcoming'
        ? t('wallet.upcoming', 'Próximos')
        : t('wallet.past', 'Pasados');

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
                onClick={handleBackdropClick}
            >
                <div
                    className={`relative w-full max-w-[500px] max-h-[80vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden flex flex-col transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                >
                    <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-[10px] pb-[6px]">
                        <div className="w-9 h-[5px] bg-[#F6F6F6] opacity-30 rounded-full" />
                    </div>

                    <div className="flex flex-col gap-5 px-5 pt-8 pb-3 shrink-0">
                        <h2 className="text-[24px] font-borna font-semibold text-[#FF336D]">
                            {title}
                        </h2>

                        <div className="relative w-full">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('wallet.search_placeholder', 'Buscar...')}
                                className="w-full h-[44px] pl-10 pr-4 bg-[#141414] border-2 border-[#232323] rounded-xl text-[15px] font-helvetica text-[#F6F6F6] placeholder:text-[#939393] outline-none focus:border-[#393939] transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {isLoading ? (
                            <ListSkeleton />
                        ) : filteredTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                                <span className="text-3xl">
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
                                {filteredTransactions.map((transaction) => (
                                    <WalletEventCard
                                        key={transaction.id}
                                        title={transaction.event.name}
                                        date={formatEventDate(transaction.event.startDate, locale)}
                                        time={formatEventTimeRange(
                                            transaction.event.startDate,
                                            transaction.event.startTime,
                                            transaction.event.endTime
                                        )}
                                        location={transaction.club.address || transaction.club.name}
                                        imageUrl={transaction.event.flyer}
                                        variant={variant}
                                        onClick={() => handleTransactionClick(transaction.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedTransactionId && (
                <TransactionItemsModal
                    transactionId={selectedTransactionId}
                    isOpen={isTransactionModalOpen}
                    onClose={handleTransactionModalClose}
                />
            )}
        </>,
        document.body
    );
};

export default WalletEventsListModal;
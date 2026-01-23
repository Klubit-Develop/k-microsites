import { useMemo, useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';
import { ChevronRightIcon } from '@/components/icons';
import Button from '@/components/ui/Button';
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

type KardLevel = 'MEMBER' | 'BRONZE' | 'SILVER' | 'GOLD';
type VenueType = 'CLUB' | 'PUB' | 'BAR' | 'LOUNGE' | 'RESTAURANT' | 'PROMOTER' | 'OTHER';
type BenefitType = 'ACCESS' | 'CONSUME' | 'CREDIT' | 'DISCOUNT' | 'ZONES';

interface BenefitItem {
    name: string;
    quantity: number;
}

interface KardBenefit {
    id: string;
    type: BenefitType;
    name: string;
    description?: string;
    items?: BenefitItem[];
    totalAmount?: number;
    availableAmount?: number;
    discountPercentage?: number;
    discountAppliesTo?: string[];
    maxDiscount?: number;
    zones?: string[];
    accessType?: string;
    usageFrequency: 'UNLIMITED' | 'PER_DAY' | 'PER_WEEK' | 'PER_MONTH' | 'SINGLE_USE';
    duration: 'PERMANENT' | 'SINGLE_USE' | 'EXPIRES_DAYS';
    expirationDays?: number;
    events: string[] | 'ALL';
    rates: string[] | 'ALL';
}

interface UserPassbook {
    id: string;
    serialNumber: string;
    authenticationToken: string;
    kardLevel: KardLevel;
    passbookUrl: string;
    googleWalletUrl: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    clubId: string;
    benefits?: KardBenefit[];
    club: {
        id: string;
        name: string;
        slug: string;
        logo: string;
        venueType: VenueType;
        passbookConfig: {
            backgroundColor: string;
            foregroundColor: string;
            labelColor: string;
        };
    };
}

interface PassbooksResponse {
    status: 'success' | 'error';
    code: string;
    data: {
        passbooks: UserPassbook[];
    };
    message: string;
}

const isEventToday = (startDate: string): boolean => {
    const eventDate = dayjs(startDate);
    const today = dayjs();
    return eventDate.isSame(today, 'day');
};

const isEventUpcoming = (startDate: string): boolean => {
    const eventDate = dayjs(startDate);
    const today = dayjs();
    return eventDate.isAfter(today, 'day');
};

const isEventLive = (startDate: string, endDate?: string, endTime?: string): boolean => {
    const now = dayjs();
    const start = dayjs(startDate);

    if (now.isBefore(start)) return false;

    let end: dayjs.Dayjs;
    if (endDate) {
        end = dayjs(endDate);
    } else if (endTime) {
        const [endHour, endMinute = 0] = endTime.split(':').map(Number);
        const startHour = start.hour();
        if (endHour < startHour) {
            end = start.add(1, 'day').startOf('day').hour(endHour).minute(endMinute);
        } else {
            end = start.hour(endHour).minute(endMinute);
        }
    } else {
        end = start.add(6, 'hour');
    }

    return now.isBefore(end);
};

const getHoursUntilEvent = (startDate: string): number => {
    const now = dayjs();
    const start = dayjs(startDate);
    const hours = start.diff(now, 'hour');
    return Math.max(0, hours);
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

const getVenueTypeLabel = (venueType: VenueType): string => {
    switch (venueType) {
        case 'CLUB': return 'Discoteca';
        case 'PUB': return 'Pub';
        case 'BAR': return 'Bar';
        case 'LOUNGE': return 'Lounge';
        case 'RESTAURANT': return 'Restaurante';
        case 'PROMOTER': return 'Promotora';
        case 'OTHER': return '';
        default: return '';
    }
};

const getBenefitTypeLabel = (type: BenefitType, t: (key: string, fallback: string) => string): string => {
    switch (type) {
        case 'ACCESS': return t('wallet.benefit_type_access', 'Beneficio de acceso');
        case 'CONSUME': return t('wallet.benefit_type_consume', 'Beneficio de consumo');
        case 'CREDIT': return t('wallet.benefit_type_credit', 'Beneficio de crédito');
        case 'DISCOUNT': return t('wallet.benefit_type_discount', 'Beneficio de descuento');
        case 'ZONES': return t('wallet.benefit_type_zones', 'Beneficio de zonas');
        default: return '';
    }
};

const getUsageFrequencyLabel = (frequency: KardBenefit['usageFrequency'], t: (key: string, fallback: string) => string): string => {
    switch (frequency) {
        case 'UNLIMITED': return t('wallet.frequency_unlimited', 'Ilimitado');
        case 'PER_DAY': return t('wallet.frequency_per_day', 'Por día');
        case 'PER_WEEK': return t('wallet.frequency_per_week', 'Por semana');
        case 'PER_MONTH': return t('wallet.frequency_per_month', 'Por mes');
        case 'SINGLE_USE': return t('wallet.frequency_single_use', 'Un solo uso');
        default: return '';
    }
};

const getDurationLabel = (duration: KardBenefit['duration'], expirationDays: number | undefined, t: (key: string, fallback: string) => string): string => {
    switch (duration) {
        case 'PERMANENT': return t('wallet.duration_permanent', 'Permanente');
        case 'SINGLE_USE': return t('wallet.duration_single_use', 'Un solo uso');
        case 'EXPIRES_DAYS': return t('wallet.duration_expires_days', `Expira cada ${expirationDays} días`).replace('${days}', String(expirationDays));
        default: return '';
    }
};

const HomeIcon = () => (
    <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M2.25 7.25L9 2L15.75 7.25V15.5C15.75 15.8978 15.592 16.2794 15.3107 16.5607C15.0294 16.842 14.6478 17 14.25 17H3.75C3.35218 17 2.97064 16.842 2.68934 16.5607C2.40804 16.2794 2.25 15.8978 2.25 15.5V7.25Z"
            stroke="#939393"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M6.75 17V9.5H11.25V17"
            stroke="#939393"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

interface TicketWalletProps {
    transaction: Transaction;
    isLive?: boolean;
    onClick: () => void;
}

const TicketWallet = ({ transaction, isLive = false, onClick }: TicketWalletProps) => {
    const { t } = useTranslation();

    const { event, club, _count } = transaction;
    const totalQuantity = _count.items;

    const eventToday = isEventToday(event.startDate);
    const hoursUntil = getHoursUntilEvent(event.startDate);
    const showCountdown = eventToday && !isLive && hoursUntil > 0;

    const timeRange = formatEventTimeRange(event.startDate, event.startTime, event.endTime);

    return (
        <button
            onClick={onClick}
            className="relative flex flex-col w-full rounded-2xl border-2 border-[#232323] overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer text-left"
        >
            <div className="absolute inset-0">
                <img
                    src={event.flyer}
                    alt={event.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] from-25% to-transparent" />
            </div>

            <div className="relative flex flex-col items-start justify-between h-[200px] p-4">
                <div className="flex items-center justify-between w-full">
                    {isLive ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                            <span className="text-[14px] font-helvetica text-[#F6F6F6]">
                                {t('wallet.event_live', 'Evento en curso')}
                            </span>
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#50DD77] opacity-75" />
                                <span className="relative inline-flex rounded-full size-2 bg-[#50DD77]" />
                            </span>
                        </div>
                    ) : showCountdown ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                            <span className="text-[14px] font-helvetica text-[#F6F6F6]">
                                {t('wallet.starts_in_hours', 'Empieza en {{hours}}h').replace('{{hours}}', String(hoursUntil))}
                            </span>
                        </div>
                    ) : null}

                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] ml-auto">
                        <span className="text-[14px] font-helvetica text-[#F6F6F6]">
                            {t('wallet.ticket_count', '{{count}} entradas').replace('{{count}}', String(totalQuantity))}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-1 w-full">
                    <h3 className="text-[20px] font-borna font-semibold text-[#F6F6F6] leading-tight truncate">
                        {event.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[14px] font-helvetica text-[#939393]">
                            {timeRange}
                        </span>
                        <span className="text-[14px] font-helvetica text-[#939393]">·</span>
                        <span className="text-[14px] font-helvetica text-[#939393] truncate">
                            {club.name}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
};

interface WalletEventCardProps {
    title: string;
    date: string;
    time: string;
    location: string;
    imageUrl: string;
    onClick: () => void;
}

const WalletEventCard = ({ title, date, time, location, imageUrl, onClick }: WalletEventCardProps) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl cursor-pointer text-left"
        >
            <div className="relative size-16 rounded-xl overflow-hidden shrink-0">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <h4 className="text-[16px] font-helvetica font-medium text-[#F6F6F6] truncate">
                    {title}
                </h4>
                <span className="text-[14px] font-helvetica text-[#939393] truncate">
                    {date} · {time}
                </span>
                <span className="text-[14px] font-helvetica text-[#939393] truncate">
                    {location}
                </span>
            </div>

            <div className="shrink-0">
                <ChevronRightIcon />
            </div>
        </button>
    );
};

interface SectionHeaderProps {
    title: string;
    to?: string;
    showArrow?: boolean;
}

const SectionHeader = ({ title, to, showArrow = false }: SectionHeaderProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate({ to });
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`flex gap-2 items-center px-1.5 ${to && showArrow ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!to || !showArrow}
        >
            <span className="text-[#FF336D] text-[24px] font-semibold leading-none whitespace-nowrap overflow-hidden text-ellipsis font-borna">
                {title}
            </span>
            {showArrow && to && (
                <div className="flex items-center pt-1">
                    <ChevronRightIcon />
                </div>
            )}
        </button>
    );
};

const WalletSkeleton = () => {
    return (
        <div className="flex flex-col gap-9 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-8 animate-pulse">
            <div className="w-full h-[200px] bg-[#232323] rounded-2xl" />
            <div className="flex flex-col gap-3">
                <div className="w-32 h-7 bg-[#232323] rounded-lg" />
                <div className="flex flex-col gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[88px] bg-[#232323] rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    );
};

const WalletEmpty = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    const avatar = user?.avatar || null;

    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    const hasAvatar = avatar && avatar.trim() !== '';

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-16">
            <div className="flex flex-col gap-8 items-center justify-center py-8 w-full">
                <div className="flex flex-col gap-6 items-center w-full">
                    <div className="flex items-center justify-center size-[90px] bg-[#232323] rounded-full overflow-hidden">
                        {hasAvatar ? (
                            <img
                                src={avatar}
                                alt={`${firstName} ${lastName}`}
                                className="size-full object-cover"
                            />
                        ) : (
                            <span className="text-[#939393] text-[24px] font-semibold font-borna">
                                {initials || '?'}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 items-center px-4 text-center w-full">
                        <span className="text-[#F6F6F6] text-[24px] font-semibold font-borna">
                            {t('wallet.empty_title', 'Tu wallet está vacía')}
                        </span>
                        <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                            {t('wallet.empty_description', 'Compra y empieza a disfrutar de ventajas exclusivas en tus klubs favoritos.')}
                        </span>
                    </div>
                </div>

                <Button
                    onClick={() => navigate({ to: '/' })}
                    className="w-full"
                >
                    {t('wallet.explore_events', 'Descubrir eventos')}
                </Button>
            </div>
        </div>
    );
};

interface KlubKardProps {
    clubName: string;
    clubLogo: string;
    venueType?: VenueType;
    backgroundColor?: string;
    onClick?: () => void;
}

const KlubKard = ({
    clubName,
    clubLogo,
    venueType,
    backgroundColor = '#232323',
    onClick
}: KlubKardProps) => {
    const venueLabel = venueType ? getVenueTypeLabel(venueType) : '';

    return (
        <button
            onClick={onClick}
            className="relative flex flex-col justify-between shrink-0 w-[340px] h-[210px] p-6 rounded-[20px] border-[3px] border-[#232323] cursor-pointer overflow-hidden snap-center"
            style={{
                background: `linear-gradient(to right, ${backgroundColor} 0%, ${backgroundColor} 50%, #141414 100%)`,
            }}
        >
            <div
                className="relative size-[54px] rounded-full border-[1.5px] border-[#232323] overflow-hidden"
                style={{
                    backgroundColor: clubLogo ? backgroundColor : 'rgba(35, 35, 35, 0.5)',
                    boxShadow: '0px 0px 12px 0px rgba(0, 0, 0, 0.5)'
                }}
            >
                {clubLogo ? (
                    <img
                        src={clubLogo}
                        alt={clubName}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <HomeIcon />
                    </div>
                )}
            </div>

            <div className="flex flex-col items-start w-full text-left">
                <h3 className="text-[24px] font-borna font-semibold text-[#F6F6F6] leading-none truncate w-full">
                    {clubName}
                </h3>
                {venueLabel && (
                    <span className="text-[14px] font-helvetica text-[#939393]">
                        {venueLabel}
                    </span>
                )}
            </div>
        </button>
    );
};

interface PageDotsProps {
    total: number;
    current: number;
}

const PageDots = ({ total, current }: PageDotsProps) => {
    if (total <= 1) return null;

    const maxDots = 5;
    const dotsToShow = Math.min(total, maxDots);

    return (
        <div className="flex items-center justify-center gap-2 px-3 py-2">
            {Array.from({ length: dotsToShow }).map((_, index) => {
                const isEdge = index === 0 || index === dotsToShow - 1;
                const isActive = index === current % dotsToShow;

                return (
                    <div
                        key={index}
                        className={`rounded-full transition-all ${isActive
                                ? 'bg-[#F6F6F6] size-2'
                                : isEdge && dotsToShow === maxDots
                                    ? 'bg-[#F6F6F6] opacity-30 size-1.5'
                                    : 'bg-[#F6F6F6] opacity-30 size-2'
                            }`}
                    />
                );
            })}
        </div>
    );
};

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="#F6F6F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface InfoRowProps {
    label: string;
    value: string;
    valueColor?: string;
    isLast?: boolean;
}

const InfoRow = ({ label, value, valueColor = '#F6F6F6', isLast = false }: InfoRowProps) => (
    <div className={`flex items-center justify-between gap-6 px-4 py-3 h-14 ${!isLast ? 'border-b-[1.5px] border-[#232323]' : ''}`}>
        <span className="text-[16px] font-helvetica font-medium text-[#939393] whitespace-nowrap">
            {label}
        </span>
        <span className="text-[16px] font-helvetica font-medium text-right" style={{ color: valueColor }}>
            {value}
        </span>
    </div>
);

interface InfoBlockRowProps {
    label: string;
    value: string;
    isLast?: boolean;
}

const InfoBlockRow = ({ label, value, isLast = false }: InfoBlockRowProps) => (
    <div className={`flex flex-col gap-1 px-4 py-4 ${!isLast ? 'border-b-[1.5px] border-[#232323]' : ''}`}>
        <span className="text-[16px] font-helvetica font-medium text-[#939393]">
            {label}
        </span>
        <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
            {value}
        </span>
    </div>
);

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
}

const InfoCard = ({ title, children }: InfoCardProps) => (
    <div className="flex flex-col gap-1 w-full">
        <div className="px-1.5">
            <span className="text-[16px] font-helvetica font-medium text-[#939393]">
                {title}
            </span>
        </div>
        <div className="bg-[#141414] border-2 border-[#232323] rounded-2xl overflow-hidden">
            {children}
        </div>
    </div>
);

interface BenefitDetailModalProps {
    benefit: KardBenefit | null;
    backgroundColor: string;
    passbook: UserPassbook | null;
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
}

const BenefitDetailModal = ({ benefit, backgroundColor, passbook, isOpen, onClose, onBack }: BenefitDetailModalProps) => {
    const { t, i18n } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showQRView, setShowQRView] = useState(false);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSpanish = i18n.language === 'es' || i18n.language.startsWith('es-');

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            setShowQRView(false);
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setIsAnimating(false);
            setShowQRView(false);
            document.body.style.overflow = '';
            onClose();
        }, 300);
    };

    const handleBack = () => {
        if (showQRView) {
            setShowQRView(false);
        } else {
            setIsVisible(false);
            setTimeout(() => {
                setIsAnimating(false);
                onBack();
            }, 300);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleUseBenefit = () => {
        setShowQRView(true);
    };

    const handleAddToWallet = () => {
        if (!passbook) return;
        const url = isIOS ? passbook.passbookUrl : passbook.googleWalletUrl;
        if (url) {
            window.open(url, '_blank');
        }
    };

    if (!isAnimating && !isOpen) return null;
    if (!benefit) return null;

    const benefitTitle = getBenefitTypeLabel(benefit.type, t);
    const frequencyLabel = getUsageFrequencyLabel(benefit.usageFrequency, t);
    const durationLabel = getDurationLabel(benefit.duration, benefit.expirationDays, t);
    const eventsValue = benefit.events === 'ALL' ? t('wallet.all_events', 'Todos') : (benefit.events as string[]).join(', ');
    const ratesValue = benefit.rates === 'ALL' ? t('wallet.all_rates', 'Todas') : (benefit.rates as string[]).join(', ');

    const renderDetailsSection = () => {
        switch (benefit.type) {
            case 'ACCESS':
                return (
                    <InfoCard title={t('wallet.details', 'Detalles')}>
                        <InfoRow
                            label={t('wallet.access', 'Acceso')}
                            value={benefit.accessType || t('wallet.free', 'Gratuito')}
                            isLast
                        />
                    </InfoCard>
                );

            case 'CONSUME':
                return (
                    <InfoCard title={t('wallet.details', 'Detalles')}>
                        {benefit.items?.map((item, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-1.5 px-4 py-3 ${index !== (benefit.items?.length || 0) - 1 ? 'border-b-[1.5px] border-[#232323]' : ''}`}
                            >
                                <div className="size-1.5 rounded-full bg-[#939393]" />
                                <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6]">
                                    {item.name}
                                </span>
                                <span className="text-[16px] font-helvetica font-bold text-[#F6F6F6] ml-auto">
                                    x{item.quantity}
                                </span>
                            </div>
                        ))}
                    </InfoCard>
                );

            case 'CREDIT':
                return (
                    <InfoCard title={t('wallet.details', 'Detalles')}>
                        <InfoRow
                            label={t('wallet.total_amount', 'Cantidad total')}
                            value={`${benefit.totalAmount?.toFixed(2)} €`}
                        />
                        <InfoRow
                            label={t('wallet.available_amount', 'Cantidad disponible')}
                            value={`${benefit.availableAmount?.toFixed(2)} €`}
                            valueColor="#50DD77"
                            isLast
                        />
                    </InfoCard>
                );

            case 'DISCOUNT':
                return (
                    <InfoCard title={t('wallet.details', 'Detalles')}>
                        <InfoRow
                            label={t('wallet.discount', 'Descuento')}
                            value={`${benefit.discountPercentage}%`}
                        />
                        <InfoRow
                            label={t('wallet.applies_to', 'Aplica a')}
                            value={benefit.discountAppliesTo?.join(', ') || ''}
                        />
                        <InfoRow
                            label={t('wallet.max_discount', 'Descuento máximo')}
                            value={`${benefit.maxDiscount?.toFixed(2)} €`}
                            isLast
                        />
                    </InfoCard>
                );

            case 'ZONES':
                return (
                    <InfoCard title={t('wallet.details', 'Detalles')}>
                        <InfoBlockRow
                            label={t('wallet.zones', 'Zonas')}
                            value={benefit.zones?.join(', ') || ''}
                            isLast
                        />
                    </InfoCard>
                );

            default:
                return null;
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`relative w-full max-w-[500px] max-h-[90vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="absolute inset-x-0 top-0 h-[489px] pointer-events-none overflow-hidden">
                    <div
                        className="absolute inset-0"
                        style={{ backgroundColor }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/70 to-[#0a0a0a]" />
                    <div className="absolute inset-0 backdrop-blur-[1.5px] bg-gradient-to-b from-transparent to-[rgba(10,10,10,0.5)]" />
                </div>

                <div className="absolute top-0 left-1/2 -translate-x-1/2 pt-[5px] opacity-50 z-10">
                    <div className="w-9 h-[5px] bg-[#F6F6F6]/50 rounded-full" />
                </div>

                {!showQRView && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
                        <div className="bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent pt-4 pb-[42px] px-4">
                            <button
                                onClick={handleUseBenefit}
                                className="flex items-center justify-center w-full h-12 bg-[#FF336D] rounded-xl cursor-pointer pointer-events-auto"
                            >
                                <span className="text-[16px] font-helvetica font-bold text-[#F6F6F6]">
                                    {t('wallet.use_benefit', 'Usar beneficio')}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {showQRView ? (
                    <div className="relative flex flex-col gap-8 px-6 pt-6 pb-8 overflow-y-auto max-h-[90vh] scrollbar-hide">
                        <div className="flex items-center justify-between h-9">
                            <button
                                onClick={handleBack}
                                className="flex items-center justify-center size-9 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                            >
                                <BackIcon />
                            </button>
                            <button
                                onClick={handleClose}
                                className="flex items-center justify-center size-9 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="flex flex-col gap-1 w-full">
                            <span className="text-[16px] font-helvetica font-medium text-[#939393] px-1.5">
                                {t('wallet.passbook', 'Passbook')}
                            </span>
                            <div className="flex flex-col items-center gap-4 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                                <div className="flex items-center justify-center p-4 bg-white rounded-[5px]">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=157x157&data=${encodeURIComponent(passbook?.serialNumber || '')}`}
                                        alt="QR Code"
                                        className="size-[157px]"
                                    />
                                </div>

                                <button
                                    onClick={handleAddToWallet}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    {isIOS ? (
                                        <img
                                            src={isSpanish ? '/assets/images/apple_es.svg' : '/assets/images/apple_en.svg'}
                                            alt={t('wallet.add_to_apple_wallet', 'Añadir a Apple Wallet')}
                                            className="h-[48px] w-auto"
                                        />
                                    ) : (
                                        <img
                                            src={isSpanish ? '/assets/images/google_es.svg' : '/assets/images/google_en.svg'}
                                            alt={t('wallet.add_to_google_wallet', 'Añadir a Google Wallet')}
                                            className="h-[55px] w-auto"
                                        />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative flex flex-col gap-8 px-6 pt-6 pb-[110px] overflow-y-auto max-h-[90vh] scrollbar-hide">
                        <div className="flex items-center justify-between h-9">
                            <button
                                onClick={handleBack}
                                className="flex items-center justify-center size-9 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                            >
                                <BackIcon />
                            </button>
                            <button
                                onClick={handleClose}
                                className="flex items-center justify-center size-9 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center justify-center size-[90px] bg-[#232323] rounded-full">
                                <span className="text-[24px] font-borna font-semibold text-[#939393]">TBD</span>
                            </div>
                            <h2 className="text-[24px] font-borna font-semibold text-[#F6F6F6] text-center">
                                {benefitTitle}
                            </h2>
                        </div>

                        {renderDetailsSection()}

                        <InfoCard title={t('wallet.temporality', 'Temporalidad')}>
                            <InfoRow
                                label={t('wallet.usage_frequency', 'Frecuencia de uso')}
                                value={frequencyLabel}
                            />
                            <InfoRow
                                label={t('wallet.duration', 'Duración')}
                                value={durationLabel}
                                isLast
                            />
                        </InfoCard>

                        <InfoCard title={t('wallet.scope', 'Alcance')}>
                            {benefit.type === 'ACCESS' && (benefit.events !== 'ALL' || benefit.rates !== 'ALL') ? (
                                <>
                                    <InfoBlockRow
                                        label={t('wallet.events', 'Eventos')}
                                        value={eventsValue}
                                    />
                                    <InfoBlockRow
                                        label={t('wallet.rates', 'Tarifas')}
                                        value={ratesValue}
                                        isLast
                                    />
                                </>
                            ) : (
                                <>
                                    <InfoRow
                                        label={t('wallet.events', 'Eventos')}
                                        value={eventsValue}
                                    />
                                    <InfoRow
                                        label={t('wallet.rates', 'Tarifas')}
                                        value={ratesValue}
                                        isLast
                                    />
                                </>
                            )}
                        </InfoCard>
                    </div>
                )}
            </div>
        </div>
    );
};

interface BenefitCardProps {
    benefit: KardBenefit;
    onClick: () => void;
}

const BenefitCard = ({ benefit, onClick }: BenefitCardProps) => {
    const { t } = useTranslation();

    const getBenefitDescription = (): string => {
        switch (benefit.type) {
            case 'ACCESS':
                return benefit.accessType || t('wallet.free_access', 'Acceso gratuito');
            case 'CONSUME':
                return benefit.items?.map(i => `${i.name} x${i.quantity}`).join(', ') || '';
            case 'CREDIT':
                return `${benefit.availableAmount?.toFixed(2)} € ${t('wallet.available', 'disponible')}`;
            case 'DISCOUNT':
                return `${benefit.discountPercentage}% ${t('wallet.off', 'descuento')}`;
            case 'ZONES':
                return benefit.zones?.join(', ') || '';
            default:
                return '';
        }
    };

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer text-left w-full"
        >
            <div className="flex items-center justify-center size-12 bg-[rgba(35,35,35,0.5)] border-[1.5px] border-[#232323] rounded-[4px]">
                <div className="flex items-center justify-center size-9 bg-[#232323] rounded-full">
                    <span className="text-[8px] font-borna font-semibold text-[#939393]">TBD</span>
                </div>
            </div>
            <div className="flex flex-col py-1.5 flex-1 min-w-0">
                <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6] truncate">
                    {getBenefitTypeLabel(benefit.type, t)}
                </span>
                <span className="text-[14px] font-helvetica text-[#939393] truncate">
                    {getBenefitDescription()}
                </span>
            </div>
            <div className="shrink-0">
                <ChevronRightIcon />
            </div>
        </button>
    );
};

interface KardDetailModalProps {
    passbook: UserPassbook | null;
    isOpen: boolean;
    onClose: () => void;
}

const KardDetailModal = ({ passbook, isOpen, onClose }: KardDetailModalProps) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedBenefit, setSelectedBenefit] = useState<KardBenefit | null>(null);
    const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false);

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

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setIsAnimating(false);
            document.body.style.overflow = '';
            onClose();
        }, 300);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleBenefitClick = (benefit: KardBenefit) => {
        setSelectedBenefit(benefit);
        setIsVisible(false);
        setTimeout(() => {
            setIsBenefitModalOpen(true);
        }, 300);
    };

    const handleBenefitModalClose = () => {
        setIsBenefitModalOpen(false);
        setSelectedBenefit(null);
        document.body.style.overflow = '';
        onClose();
    };

    const handleBenefitModalBack = () => {
        setIsBenefitModalOpen(false);
        setSelectedBenefit(null);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        });
    };

    if (!isAnimating && !isOpen && !isBenefitModalOpen) return null;
    if (!passbook) return null;

    const backgroundColor = passbook.club.passbookConfig?.backgroundColor || '#141414';
    const venueLabel = passbook.club.venueType ? getVenueTypeLabel(passbook.club.venueType) : '';

    const mockBenefits: KardBenefit[] = passbook.benefits || [
        {
            id: '1',
            type: 'ACCESS',
            name: 'Acceso gratuito',
            accessType: 'Gratuito',
            usageFrequency: 'UNLIMITED',
            duration: 'SINGLE_USE',
            events: ['Morris Night Club', 'Morris sábado'],
            rates: 'ALL',
        },
    ];

    return (
        <>
            {(isAnimating || isOpen) && !isBenefitModalOpen && (
                <div
                    className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ease-out ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
                    onClick={handleBackdropClick}
                >
                    <div
                        className={`relative w-full max-w-[500px] max-h-[90vh] bg-[#0a0a0a] border-2 border-[#232323] rounded-t-[32px] overflow-hidden transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                    >
                        <div className="absolute inset-x-0 top-0 h-[489px] pointer-events-none overflow-hidden">
                            <div
                                className="absolute inset-0"
                                style={{ backgroundColor }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/70 to-[#0a0a0a]" />
                            <div className="absolute inset-0 backdrop-blur-[1.5px] bg-gradient-to-b from-transparent to-[rgba(10,10,10,0.5)]" />
                        </div>

                        <div className="absolute top-0 left-1/2 -translate-x-1/2 pt-[5px] opacity-50 z-10">
                            <div className="w-9 h-[5px] bg-[#F6F6F6]/50 rounded-full" />
                        </div>

                        <div className="relative flex flex-col gap-8 px-6 pt-6 pb-8 overflow-y-auto max-h-[90vh] scrollbar-hide">
                            <div className="flex items-start justify-end h-9">
                                <button
                                    onClick={handleClose}
                                    className="flex items-center justify-center size-9 bg-[#232323] rounded-full shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer"
                                >
                                    <CloseIcon />
                                </button>
                            </div>

                            <div className="flex justify-center">
                                <div
                                    className="relative flex flex-col justify-between w-[340px] h-[210px] p-6 rounded-[20px] border-[3px] border-[#232323]"
                                    style={{
                                        background: `linear-gradient(to right, ${backgroundColor} 0%, ${backgroundColor} 50%, #141414 100%)`,
                                    }}
                                >
                                    <div
                                        className="relative size-[54px] rounded-full border-[1.5px] border-[#232323] overflow-hidden"
                                        style={{
                                            backgroundColor: passbook.club.logo ? backgroundColor : 'rgba(35, 35, 35, 0.5)',
                                            boxShadow: '0px 0px 12px 0px rgba(0, 0, 0, 0.5)'
                                        }}
                                    >
                                        {passbook.club.logo ? (
                                            <img
                                                src={passbook.club.logo}
                                                alt={passbook.club.name}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <HomeIcon />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-start w-full text-left">
                                        <h3 className="text-[24px] font-borna font-semibold text-[#F6F6F6] leading-none truncate w-full">
                                            {passbook.club.name}
                                        </h3>
                                        {venueLabel && (
                                            <span className="text-[14px] font-helvetica text-[#939393]">
                                                {venueLabel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="px-1.5">
                                    <h3 className="text-[24px] font-borna font-semibold text-[#FF336D]">
                                        {t('wallet.your_benefits', 'Tus beneficios')}
                                    </h3>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {mockBenefits.map((benefit) => (
                                        <BenefitCard
                                            key={benefit.id}
                                            benefit={benefit}
                                            onClick={() => handleBenefitClick(benefit)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <BenefitDetailModal
                benefit={selectedBenefit}
                backgroundColor={backgroundColor}
                passbook={passbook}
                isOpen={isBenefitModalOpen}
                onClose={handleBenefitModalClose}
                onBack={handleBenefitModalBack}
            />
        </>
    );
};

interface KardsCarouselProps {
    kards: UserPassbook[];
    onKardClick: (passbook: UserPassbook) => void;
}

const KardsCarousel = ({ kards, onKardClick }: KardsCarouselProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            const scrollLeft = scrollContainer.scrollLeft;
            const cardWidth = 340 + 8;
            const newIndex = Math.round(scrollLeft / cardWidth);
            setCurrentIndex(Math.min(newIndex, kards.length - 1));
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [kards.length]);

    const handleHeaderClick = () => {
        if (kards.length > 3) {
            navigate({ to: '/wallet/kards' });
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <button
                onClick={handleHeaderClick}
                className={`flex gap-2 items-center px-1.5 ${kards.length > 3 ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={kards.length <= 3}
            >
                <span className="text-[#FF336D] text-[24px] font-semibold leading-none whitespace-nowrap overflow-hidden text-ellipsis font-borna">
                    {t('wallet.klub_kards', 'Klub Kards')}
                </span>
                {kards.length > 3 && (
                    <div className="flex items-center pt-1">
                        <ChevronRightIcon />
                    </div>
                )}
            </button>

            <div className="flex flex-col gap-2 items-center w-full">
                <div className="relative w-full -mx-4">
                    <div
                        ref={scrollRef}
                        className="flex gap-2 overflow-x-auto px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        {kards.map((passbook) => (
                            <KlubKard
                                key={passbook.id}
                                clubName={passbook.club.name}
                                clubLogo={passbook.club.logo}
                                venueType={passbook.club.venueType}
                                backgroundColor={passbook.club.passbookConfig?.backgroundColor || '#141414'}
                                onClick={() => onKardClick(passbook)}
                            />
                        ))}
                    </div>
                </div>

                <PageDots total={kards.length} current={currentIndex} />
            </div>
        </div>
    );
};

const Wallet = () => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? 'en' : 'es';
    const { user } = useAuthStore();

    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKard, setSelectedKard] = useState<UserPassbook | null>(null);
    const [isKardModalOpen, setIsKardModalOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['wallet-transactions'],
        queryFn: async () => {
            const response = await axiosInstance.get<BackendResponse>(
                '/v2/transactions/me?status=COMPLETED&limit=50'
            );
            return response.data.data.data;
        },
    });

    const { data: kardsData } = useQuery({
        queryKey: ['wallet-kards', user?.id],
        queryFn: async () => {
            const response = await axiosInstance.get<PassbooksResponse>(
                `/v2/wallet/user/${user?.id}`
            );
            return response.data.data.passbooks;
        },
        enabled: !!user?.id,
    });

    const handleKardClick = (passbook: UserPassbook) => {
        setSelectedKard(passbook);
        setIsKardModalOpen(true);
    };

    const handleKardModalClose = () => {
        setIsKardModalOpen(false);
        setSelectedKard(null);
    };

    const { featuredTransactions, upcomingTransactions, pastTransactions, isLive } = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                featuredTransactions: [],
                upcomingTransactions: [],
                pastTransactions: [],
                isLive: false,
            };
        }

        const featured: Transaction[] = [];
        const upcoming: Transaction[] = [];
        const past: Transaction[] = [];
        let live = false;

        for (const transaction of data) {
            const { event } = transaction;

            if (isEventLive(event.startDate, event.endDate, event.endTime)) {
                live = true;
                featured.push(transaction);
            } else if (isEventToday(event.startDate)) {
                featured.push(transaction);
            } else if (isEventUpcoming(event.startDate)) {
                upcoming.push(transaction);
            } else {
                past.push(transaction);
            }
        }

        featured.sort((a, b) => dayjs(a.event.startDate).diff(dayjs(b.event.startDate)));
        upcoming.sort((a, b) => dayjs(a.event.startDate).diff(dayjs(b.event.startDate)));
        past.sort((a, b) => dayjs(b.event.startDate).diff(dayjs(a.event.startDate)));

        return {
            featuredTransactions: featured,
            upcomingTransactions: upcoming,
            pastTransactions: past,
            isLive: live,
        };
    }, [data]);

    const formatTransactionForCard = (transaction: Transaction) => ({
        title: transaction.event.name,
        date: formatEventDate(transaction.event.startDate, locale),
        time: formatEventTimeRange(transaction.event.startDate, transaction.event.startTime, transaction.event.endTime),
        location: transaction.club.address || transaction.club.name,
        imageUrl: transaction.event.flyer,
    });

    const handleTransactionClick = (transactionId: string) => {
        setSelectedTransactionId(transactionId);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedTransactionId(null);
    };

    if (isLoading) {
        return <WalletSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-16">
                <span className="text-[14px] font-helvetica text-[#FF2323]">
                    {t('common.error_loading', 'Error al cargar')}
                </span>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return <WalletEmpty />;
    }

    return (
        <div className="flex flex-col gap-9 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-8">
            {featuredTransactions.length > 0 && (
                <div className="flex flex-col gap-4">
                    {featuredTransactions.map((transaction, index) => (
                        <TicketWallet
                            key={transaction.id}
                            transaction={transaction}
                            isLive={index === 0 && isLive}
                            onClick={() => handleTransactionClick(transaction.id)}
                        />
                    ))}
                </div>
            )}

            {kardsData && kardsData.length > 0 && (
                <KardsCarousel
                    kards={kardsData}
                    onKardClick={handleKardClick}
                />
            )}

            {upcomingTransactions.length > 0 && (
                <div className="flex flex-col gap-3">
                    <SectionHeader
                        title={t('wallet.upcoming', 'Próximos')}
                        to="/wallet/upcoming"
                        showArrow={upcomingTransactions.length > 5}
                    />
                    <div className="flex flex-col gap-2">
                        {upcomingTransactions.slice(0, 5).map((transaction) => {
                            const cardProps = formatTransactionForCard(transaction);
                            return (
                                <WalletEventCard
                                    key={transaction.id}
                                    title={cardProps.title}
                                    date={cardProps.date}
                                    time={cardProps.time}
                                    location={cardProps.location}
                                    imageUrl={cardProps.imageUrl}
                                    onClick={() => handleTransactionClick(transaction.id)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {pastTransactions.length > 0 && (
                <div className="flex flex-col gap-3">
                    <SectionHeader
                        title={t('wallet.past', 'Pasados')}
                        to="/wallet/past"
                        showArrow={pastTransactions.length > 5}
                    />
                    <div className="flex flex-col gap-2">
                        {pastTransactions.slice(0, 5).map((transaction) => {
                            const cardProps = formatTransactionForCard(transaction);
                            return (
                                <WalletEventCard
                                    key={transaction.id}
                                    title={cardProps.title}
                                    date={cardProps.date}
                                    time={cardProps.time}
                                    location={cardProps.location}
                                    imageUrl={cardProps.imageUrl}
                                    onClick={() => handleTransactionClick(transaction.id)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedTransactionId && (
                <TransactionItemsModal
                    transactionId={selectedTransactionId}
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                />
            )}

            <KardDetailModal
                passbook={selectedKard}
                isOpen={isKardModalOpen}
                onClose={handleKardModalClose}
            />
        </div>
    );
};

export default Wallet;
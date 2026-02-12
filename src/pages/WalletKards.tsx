import { useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';
import { ChevronRightIcon } from '@/components/icons';
import EventCardHz, { EventCardHzSkeleton } from '@/components/EventCardHz';

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

const getVenueTypeLabel = (venueType: VenueType, t: (key: string, fallback: string) => string): string => {
    switch (venueType) {
        case 'CLUB': return t('wallet.venue_club', 'Discoteca');
        case 'PUB': return t('wallet.venue_pub', 'Pub');
        case 'BAR': return t('wallet.venue_bar', 'Bar');
        case 'LOUNGE': return t('wallet.venue_lounge', 'Lounge');
        case 'RESTAURANT': return t('wallet.venue_restaurant', 'Restaurante');
        case 'PROMOTER': return t('wallet.venue_promoter', 'Promotora');
        case 'OTHER': return t('wallet.venue_other', 'Venue');
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

const formatEventDate = (dateString: string, locale: string): string => {
    return dayjs(dateString).locale(locale).format('ddd, D MMMM');
};

const formatEventTimeRange = (startTime?: string, endTime?: string): string => {
    if (!startTime || !endTime) return '';
    return `${startTime} - ${endTime}`;
};

const QrIcon = () => (
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="5.5" height="5.5" rx="1" stroke="white" strokeWidth="1.5" />
        <rect x="13.5" y="2" width="5.5" height="5.5" rx="1" stroke="white" strokeWidth="1.5" />
        <rect x="2" y="13.5" width="5.5" height="5.5" rx="1" stroke="white" strokeWidth="1.5" />
        <rect x="13.5" y="13.5" width="5.5" height="5.5" rx="1" stroke="white" strokeWidth="1.5" />
        <rect x="4.25" y="4.25" width="1" height="1" fill="white" />
        <rect x="15.75" y="4.25" width="1" height="1" fill="white" />
        <rect x="4.25" y="15.75" width="1" height="1" fill="white" />
        <rect x="9.5" y="2" width="2" height="2" rx="0.5" fill="white" />
        <rect x="9.5" y="9.5" width="2" height="2" rx="0.5" fill="white" />
        <rect x="2" y="9.5" width="2" height="2" rx="0.5" fill="white" />
        <rect x="9.5" y="17" width="2" height="2" rx="0.5" fill="white" />
        <rect x="17" y="9.5" width="2" height="2" rx="0.5" fill="white" />
    </svg>
);

const BenefitBadgeIcon = () => (
    <svg width="45" height="52" viewBox="0 0 45 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="benefitGold" x1="22.5" y1="0" x2="22.5" y2="52" gradientUnits="userSpaceOnUse">
                <stop offset="0.25" stopColor="#978061" />
                <stop offset="1" stopColor="#7f6649" />
            </linearGradient>
        </defs>
        <path
            d="M38.2 11.5L37.4 7.0L36.4 5.8L31.7 3.7L27.9 0.5L26.7 0L22.5 0.7L18.3 0L17.1 0.5L13.3 3.7L8.6 5.8L7.6 7.0L6.8 11.5L4.4 15.6V17.1L6.8 21.2L7.6 25.7L8.6 26.9L13.3 29.0L17.1 32.2L18.3 32.7L22.5 32.0L26.7 32.7L27.9 32.2L31.7 29.0L36.4 26.9L37.4 25.7L38.2 21.2L40.6 17.1V15.6L38.2 11.5Z"
            fill="url(#benefitGold)"
            fillOpacity="0.4"
        />
        <path
            d="M38.2 11.5L37.4 7.0L36.4 5.8L31.7 3.7L27.9 0.5L26.7 0L22.5 0.7L18.3 0L17.1 0.5L13.3 3.7L8.6 5.8L7.6 7.0L6.8 11.5L4.4 15.6V17.1L6.8 21.2L7.6 25.7L8.6 26.9L13.3 29.0L17.1 32.2L18.3 32.7L22.5 32.0L26.7 32.7L27.9 32.2L31.7 29.0L36.4 26.9L37.4 25.7L38.2 21.2L40.6 17.1V15.6L38.2 11.5ZM34.8 20.0L34.6 20.5L33.9 24.5L30.7 26.3L30.2 26.6L27.0 29.5L23.3 28.8H22.7L19.0 29.5L15.8 26.6L15.3 26.3L11.1 24.5L10.4 20.5L10.2 20.0L7.1 16.4L10.2 12.7L10.4 12.2L11.1 8.3L15.3 6.5L15.8 6.1L19.0 3.3L22.7 4.0H23.3L27.0 3.3L30.2 6.1L30.7 6.5L33.9 8.3L34.6 12.2L34.8 12.7L37.9 16.4L34.8 20.0Z"
            fill="url(#benefitGold)"
        />
        <path
            d="M25.5 12.5L23.6 7.0H21.1L19.2 12.5L13.3 12.5L12.8 14.0L17.6 17.7L15.8 23.8L17.1 24.7L22.5 21.1L27.9 24.7L29.2 23.8L27.4 17.7L32.2 14.0L31.7 12.5H25.5Z"
            fill="url(#benefitGold)"
        />
        <text x="22.5" y="46" textAnchor="middle" fill="url(#benefitGold)" fontSize="6" fontFamily="Borna, sans-serif" fontWeight="600">
            KLUBIT
        </text>
    </svg>
);

interface KlubKardDetailProps {
    passbook: UserPassbook;
}

const KlubKardDetail = ({ passbook }: KlubKardDetailProps) => {
    const { t } = useTranslation();
    const config = passbook.club.passbookConfig;
    const bgColor = config?.backgroundColor || '#033f3e';
    const venueLabel = getVenueTypeLabel(passbook.club.venueType, t);

    const handleQrClick = () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const url = isIOS ? passbook.passbookUrl : passbook.googleWalletUrl;
        if (url) {
            window.open(url, '_blank');
        }
    };

    return (
        <div
            className="relative flex flex-col items-start justify-between p-6 w-full max-w-[370px] h-[210px] rounded-2xl border-[3px] border-[#232323] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]"
            style={{
                background: `linear-gradient(to right, ${bgColor} 50%, #141414)`,
            }}
        >
            <div className="relative w-[50px] h-[50px] rounded-full border-2 border-[#232323] overflow-hidden shadow-[0px_0px_11px_0px_rgba(0,0,0,0.5)]">
                {passbook.club.logo ? (
                    <img
                        src={passbook.club.logo}
                        alt={passbook.club.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#232323]">
                        <span className="text-[20px]">🏠</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-start w-full">
                <h2 className="text-[24px] font-borna font-semibold text-[#F6F6F6] leading-none truncate w-full">
                    {passbook.club.name} Kard
                </h2>
                <span className="text-[14px] font-borna text-[#939393] leading-[20px]">
                    {venueLabel}
                </span>
            </div>

            <button
                onClick={handleQrClick}
                className="absolute top-[15px] right-[14px] flex items-center justify-center size-[42px] rounded-full backdrop-blur-[17.5px] bg-[rgba(0,0,0,0.3)] border border-white/10"
            >
                <QrIcon />
            </button>
        </div>
    );
};

interface BenefitCardRowProps {
    benefit: KardBenefit;
    onClick?: () => void;
}

const BenefitCardRow = ({ benefit, onClick }: BenefitCardRowProps) => {
    const { t } = useTranslation();

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] text-left w-full transition-colors duration-200 hover:bg-[#1a1a1a]"
        >
            <div className="flex items-center justify-center shrink-0 size-[90px] p-[2px]">
                <BenefitBadgeIcon />
            </div>

            <div className="flex flex-col flex-1 min-w-0 justify-center">
                <span
                    className="text-[16px] font-borna font-medium leading-[24px] truncate"
                    style={{
                        background: 'linear-gradient(to bottom, #978061 25%, #7f6649)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    {benefit.name}
                </span>
                <span className="text-[14px] font-borna text-[#939393] leading-[20px] truncate">
                    {getBenefitTypeLabel(benefit.type, t)}
                </span>
            </div>
        </button>
    );
};

const KardSkeleton = () => (
    <div className="w-full max-w-[370px] h-[210px] bg-[#232323] rounded-2xl animate-pulse" />
);

const BenefitsSkeleton = () => (
    <div className="flex flex-col gap-2 w-full animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="h-[114px] w-full bg-[#232323] rounded-2xl" />
        ))}
    </div>
);

const EventsSkeleton = () => (
    <div className="flex flex-col gap-2 w-full">
        {[1, 2].map((i) => (
            <EventCardHzSkeleton key={i} />
        ))}
    </div>
);

const WalletKards = () => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? 'en' : 'es';
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { idKard } = useParams({ from: '/_authenticated/wallet/kards/$idKard' });

    const { data: passbooks, isLoading: isLoadingPassbooks } = useQuery({
        queryKey: ['wallet-passbooks', user?.id],
        queryFn: async () => {
            const response = await axiosInstance.get<PassbooksResponse>(
                `/v2/wallet/user/${user?.id}`
            );
            return response.data.data.passbooks;
        },
        enabled: !!user?.id,
    });

    const passbook = useMemo(() => {
        if (!passbooks || !idKard) return null;
        return passbooks.find((p) => p.id === idKard) || null;
    }, [passbooks, idKard]);

    const clubId = passbook?.clubId;
    const backgroundColor = passbook?.club.passbookConfig?.backgroundColor || '#033f3e';

    const { data: upcomingEvents, isLoading: isLoadingUpcoming } = useQuery({
        queryKey: ['kard-events-upcoming', clubId],
        queryFn: async () => {
            const from = dayjs().startOf('day').toISOString();
            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,address,club';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/club/${clubId}?startDateFrom=${from}&fields=${fields}&limit=5&page=1`
            );
            return response.data.data.data;
        },
        enabled: !!clubId,
    });

    const { data: pastEvents, isLoading: isLoadingPast } = useQuery({
        queryKey: ['kard-events-past', clubId],
        queryFn: async () => {
            const to = dayjs().startOf('day').toISOString();
            const fields = 'id,name,slug,flyer,startDate,startTime,endTime,address,club';
            const response = await axiosInstance.get<EventsResponse>(
                `/v2/events/club/${clubId}?startDateTo=${to}&fields=${fields}&limit=5&page=1`
            );
            return response.data.data.data;
        },
        enabled: !!clubId,
    });

    const benefits = passbook?.benefits || [];
    const hasUpcoming = upcomingEvents && upcomingEvents.length > 0;
    const hasPast = pastEvents && pastEvents.length > 0;

    const handleEventClick = (slug: string) => {
        navigate({ to: '/event/$slug', params: { slug } });
    };

    return (
        <div className="relative min-h-screen bg-[#050505]">
            <div className="absolute top-0 left-0 right-0 h-[504px] z-0">
                <div
                    className="absolute inset-0"
                    style={{ backgroundColor }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(5,5,5,0) 0%, #050505 40%)',
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col gap-8 items-center w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[40px]">
                {isLoadingPassbooks ? (
                    <KardSkeleton />
                ) : passbook ? (
                    <KlubKardDetail passbook={passbook} />
                ) : (
                    <div className="flex items-center justify-center py-8">
                        <span className="text-[14px] font-helvetica text-[#939393]">
                            {t('wallet.kard_not_found', 'Kard no encontrada')}
                        </span>
                    </div>
                )}

                {isLoadingPassbooks && !passbook && (
                    <BenefitsSkeleton />
                )}

                {benefits.length > 0 && (
                    <div className="flex flex-col gap-4 items-start w-full">
                        <div className="flex items-center px-1.5 w-full">
                            <h3 className="text-[#FF336D] text-[20px] font-semibold leading-none font-borna">
                                {t('wallet.your_benefits', 'Tus beneficios')}
                            </h3>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            {benefits.map((benefit) => (
                                <BenefitCardRow key={benefit.id} benefit={benefit} />
                            ))}
                        </div>
                    </div>
                )}

                {(isLoadingUpcoming || hasUpcoming) && (
                    <div className="flex flex-col gap-4 items-start w-full">
                        <div className="flex items-center px-1.5 w-full">
                            <h3 className="text-[#FF336D] text-[20px] font-semibold leading-none font-borna">
                                {t('wallet.upcoming_events', 'Próximos eventos')}
                            </h3>
                        </div>
                        {isLoadingUpcoming ? (
                            <EventsSkeleton />
                        ) : (
                            <div className="flex flex-col gap-2 w-full">
                                {upcomingEvents?.map((event) => (
                                    <EventCardHz
                                        key={event.id}
                                        title={event.name}
                                        date={formatEventDate(event.startDate, locale)}
                                        time={formatEventTimeRange(event.startTime, event.endTime)}
                                        location={event.club?.name || event.address || ''}
                                        imageUrl={event.flyer}
                                        onClick={() => handleEventClick(event.slug)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {(isLoadingPast || hasPast) && (
                    <div className="flex flex-col gap-4 items-start w-full">
                        <div className="flex items-center gap-0 px-1.5 w-full">
                            <h3 className="text-[#FF336D] text-[20px] font-semibold leading-none font-borna">
                                {t('wallet.past_events', 'Pasados')}
                            </h3>
                            <div className="flex items-center pt-0.5">
                                <ChevronRightIcon />
                            </div>
                        </div>
                        {isLoadingPast ? (
                            <EventsSkeleton />
                        ) : (
                            <div className="flex flex-col gap-2 w-full">
                                {pastEvents?.map((event) => (
                                    <EventCardHz
                                        key={event.id}
                                        title={event.name}
                                        date={formatEventDate(event.startDate, locale)}
                                        time={formatEventTimeRange(event.startTime, event.endTime)}
                                        location={event.club?.name || event.address || ''}
                                        imageUrl={event.flyer}
                                        onClick={() => handleEventClick(event.slug)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletKards;
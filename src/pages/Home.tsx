import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';

import ClubProfile from '@/components/ClubProfile';
import PhotoCarousel from '@/components/PhotoCarousel';
import ContactButtons from '@/components/ContactButtons';
import LocationCard from '@/components/LocationCard';
import PageError from '@/components/common/PageError';
import EventCardHz from '@/components/EventCardHz';
import EventSection from '@/components/EventSection';

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
}

interface ClubResponse {
    status: 'success' | 'error';
    code: string;
    data: { club: Club };
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

const Home = () => {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    const isAuthenticated = !!token;

    const clubQuery = useQuery({
        queryKey: ['club', 'localhost'],
        queryFn: async (): Promise<Club> => {
            const fields = 'id,logo,name,venueType,openingDays,openingTime,closingTime,images,contactNumber,email';
            const response = await axiosInstance.get<ClubResponse>(
                `/v2/clubs/slug/localhost?includeInactive=true&fields=${fields}`
            );
            return response.data.data.club;
        },
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

    const formatOpeningDays = (days: string[]): string => {
        if (!days || days.length === 0) return '';

        const lang = i18n.language === 'en' ? 'en' : 'es';
        const sortedDays = [...days].sort((a, b) => DAY_MAP[a]?.order - DAY_MAP[b]?.order);

        if (sortedDays.length === 1) {
            return DAY_MAP[sortedDays[0]]?.[lang] || sortedDays[0];
        }

        const isConsecutive = sortedDays.every((day, index) => {
            if (index === 0) return true;
            const prevOrder = DAY_MAP[sortedDays[index - 1]]?.order;
            const currentOrder = DAY_MAP[day]?.order;
            return currentOrder - prevOrder === 1;
        });

        if (isConsecutive && sortedDays.length > 2) {
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

    if (clubQuery.isError) {
        return <PageError />;
    }

    const club = clubQuery.data;
    const isLikesLoading = favoritesCountQuery.isLoading || (isAuthenticated && userFavoriteQuery.isLoading);
    const likesCount = favoritesCountQuery.data ?? 0;
    const isLiked = userFavoriteQuery.data ?? false;

    return (
        <div className="flex gap-8 px-34 my-10">
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

                    {club && club.images && club.images.length > 0 && (
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
                />
            </div>

            <div className="flex-1 flex flex-col gap-6 px-4 py-6">

                <div className="flex-1 flex flex-col gap-6 px-4 py-6">
                    <EventSection title="Hoy">
                        <EventCardHz
                            title="Padana XXL"
                            date="jue, 25 noviembre"
                            time="00:00 - 06:00"
                            location="Sala Fortuny"
                            imageUrl="https://example.com/event-image.jpg"
                            onClick={() => console.log('Event clicked')}
                        />
                    </EventSection>

                    <EventSection
                        title="Próximos eventos"
                        onHeaderClick={() => navigate({ to: '/events' })}
                    >
                        <EventCardHz
                            title="Otro Evento"
                            date="sáb, 27 noviembre"
                            time="23:00 - 05:00"
                            location="Sala Principal"
                            imageUrl="https://example.com/event2.jpg"
                        />
                        <EventCardHz
                            title="Evento 3"
                            date="dom, 28 noviembre"
                            time="22:00 - 04:00"
                            location="Terraza"
                            imageUrl="https://example.com/event3.jpg"
                        />
                    </EventSection>
                </div>
            </div>
        </div>
    );
};

export default Home;
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import axiosInstance from '@/config/axiosConfig';
import PageError from '@/components/common/PageError';

interface Club {
    id: string;
    name: string;
    termsAndConditions: string | null;
}

interface ClubResponse {
    status: 'success' | 'error';
    code: string;
    data: { club: Club };
    message: string;
}

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

const TermsAndConditionsClub = () => {
    const { t } = useTranslation();
    const clubSlug = getClubSlug();

    const clubQuery = useQuery({
        queryKey: ['club', clubSlug, 'terms'],
        queryFn: async (): Promise<Club> => {
            const fields = 'id,name,termsAndConditions';
            const response = await axiosInstance.get<ClubResponse>(
                `/v2/clubs/slug/${clubSlug}?includeInactive=true&fields=${fields}`
            );
            return response.data.data.club;
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        retry: false,
    });

    if (clubQuery.isError) {
        return <PageError />;
    }

    if (clubQuery.isLoading) {
        return (
            <div className="bg-[#050505] min-h-screen flex justify-center py-24">
                <div className="flex flex-col gap-4 w-full max-w-[500px] px-6">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-[#232323] rounded mb-6" />
                        <div className="flex flex-col gap-9">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex flex-col gap-2">
                                    <div className="h-4 w-full bg-[#232323] rounded" />
                                    <div className="h-4 w-full bg-[#232323] rounded" />
                                    <div className="h-4 w-3/4 bg-[#232323] rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const club = clubQuery.data;
    const termsAndConditions = club?.termsAndConditions;

    return (
        <div className="bg-[#050505] min-h-screen flex justify-center py-24">
            <div className="flex flex-col gap-4 w-full max-w-[500px] px-6">
                <div className="flex gap-[2px] items-center px-[6px] w-full">
                    <h1
                        className="text-[#FF336D] text-[24px] font-semibold"
                        style={{ fontFamily: "'Borna', sans-serif" }}
                    >
                        {t('policies.club_terms', 'Términos y condiciones del club')}
                    </h1>
                </div>

                <div className="flex flex-col gap-9 w-full">
                    {termsAndConditions ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-[2px] items-center px-[6px] w-full">
                                <p className="text-[#ECF0F5] text-[14px] font-normal font-helvetica leading-relaxed whitespace-pre-wrap">
                                    {termsAndConditions}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[#939393] text-[14px] font-helvetica px-[6px]">
                            {t('policies.no_content', 'No hay contenido disponible.')}
                        </p>
                    )}
                </div>

                {club?.name && (
                    <div className="mt-8 px-[6px]">
                        <p className="text-[#939393] text-[12px] font-helvetica">
                            {club.name}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TermsAndConditionsClub;
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import PageError from '@/components/common/PageError';

type PolicyType = 'terms-and-conditions' | 'legal-notices' | 'privacy-policy' | 'cookie-policy' | 'purchase-terms';

interface SectionTranslation {
    id: string;
    language: string;
    title: string;
    description: string;
}

interface Section {
    id: string;
    order: number;
    translations: SectionTranslation[];
}

interface PolicyData {
    id: string;
    version: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    sections: Section[];
}

interface PolicyResponse {
    status: 'success' | 'error';
    code: string;
    data: { policy: PolicyData };
    message: string;
}

interface PolicyPageProps {
    type: PolicyType;
    title: string;
}

const PolicyPage = ({ type, title }: PolicyPageProps) => {
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();

    const policyQuery = useQuery({
        queryKey: ['policy', type, i18n.language],
        queryFn: async (): Promise<PolicyData | null> => {
            const response = await axiosInstance.get<PolicyResponse>(
                `/v2/policies/${type}?language=${i18n.language.toUpperCase()}`
            );
            return response.data.data.policy;
        },
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate({ to: '..' });
        } else {
            navigate({ to: '/' });
        }
    };

    if (policyQuery.isError) {
        return <PageError />;
    }

    if (policyQuery.isLoading) {
        return (
            <div className="bg-[#050505] min-h-screen flex justify-center py-24">
                <div className="flex flex-col gap-4 w-full max-w-[500px] px-6">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-[#232323] rounded mb-6" />
                        <div className="flex flex-col gap-9">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex flex-col gap-2">
                                    <div className="h-5 w-40 bg-[#232323] rounded" />
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

    const policy = policyQuery.data;
    const sections = policy?.sections || [];

    return (
        <div className="bg-[#050505] min-h-screen flex justify-center py-24">
            <div className="flex flex-col gap-8 w-full max-w-[500px] px-6">
                <button
                    onClick={handleGoBack}
                    className="flex items-center gap-2 text-[#939393] hover:text-[#F6F6F6] transition-colors self-start cursor-pointer"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[14px] font-helvetica font-medium">
                        {t('common.back')}
                    </span>
                </button>

                <div className="flex gap-[2px] items-center px-[6px] w-full">
                    <h1
                        className="text-[#FF336D] text-[24px] font-semibold"
                        style={{ fontFamily: "'Borna', sans-serif" }}
                    >
                        {title}
                    </h1>
                </div>

                <div className="flex flex-col gap-9 w-full">
                    {sections.length > 0 ? (
                        sections.map((section) => {
                            const translation = section.translations[0];
                            if (!translation) return null;

                            return (
                                <div key={section.id} className="flex flex-col gap-2">
                                    {translation.title && (
                                        <div className="flex gap-[2px] items-center px-[6px] w-full">
                                            <h2 className="text-[#F6F6F6] text-[16px] font-bold font-helvetica">
                                                {translation.title}
                                            </h2>
                                        </div>
                                    )}
                                    {translation.description && (
                                        <div className="flex gap-[2px] items-center px-[6px] w-full">
                                            <p className="text-[#ECF0F5] text-[14px] font-normal font-helvetica leading-relaxed whitespace-pre-wrap">
                                                {translation.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-[#939393] text-[14px] font-helvetica px-[6px]">
                            No hay contenido disponible.
                        </p>
                    )}
                </div>

                {policy?.updatedAt && (
                    <div className="mt-8 px-[6px]">
                        <p className="text-[#939393] text-[12px] font-helvetica">
                            Versión {policy.version} - Última actualización: {new Date(policy.updatedAt).toLocaleDateString(i18n.language)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PolicyPage;
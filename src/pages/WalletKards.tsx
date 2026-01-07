import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';

// =============================================================================
// INTERFACES
// =============================================================================

interface Kard {
    id: string;
    name: string;
    club: {
        id: string;
        name: string;
        logo: string;
        venueType: string;
    };
}

interface KardsResponse {
    status: 'success' | 'error';
    code: string;
    data: {
        data: Kard[];
        meta: {
            total: number;
            count: number;
            limit: number;
            hasMore: boolean;
        };
    };
    message: string;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface KardCardProps {
    name: string;
    clubName: string;
    clubLogo: string;
    venueType: string;
    onClick?: () => void;
}

const KardCard = ({ name, clubName, clubLogo, venueType, onClick }: KardCardProps) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 w-full p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer text-left"
        >
            {/* Club Logo */}
            <div className="relative shrink-0 w-[54px] h-[54px] rounded-lg border-2 border-[#232323] overflow-hidden shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                <img
                    src={clubLogo}
                    alt={clubName}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                <span className="text-[16px] font-helvetica font-medium text-[#F6F6F6] truncate">
                    {name}
                </span>
                <span className="text-[14px] font-helvetica text-[#939393] truncate">
                    {venueType}
                </span>
            </div>
        </button>
    );
};

const WalletListSkeleton = () => (
    <div className="flex flex-col gap-2 w-full animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[78px] w-full bg-[#232323] rounded-2xl" />
        ))}
    </div>
);

const WalletListEmpty = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center gap-4 w-full py-16">
            <div className="flex items-center justify-center size-16 bg-[#232323] rounded-full">
                <span className="text-3xl">💳</span>
            </div>
            <p className="text-[14px] font-helvetica text-[#939393] text-center">
                {t('wallet.no_kards', 'No tienes kards')}
            </p>
        </div>
    );
};

// =============================================================================
// VENUE TYPE MAP
// =============================================================================

const VENUE_TYPE_MAP: Record<string, string> = {
    CLUB: 'Club',
    DISCO: 'Discoteca',
    BAR: 'Bar',
    LOUNGE: 'Lounge',
    PUB: 'Pub',
    PROMOTER: 'Promotora',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const WalletKards = () => {
    const { t } = useTranslation();

    // TODO: Cambiar endpoint cuando esté disponible
    const { data, isLoading, error } = useQuery({
        queryKey: ['wallet-kards'],
        queryFn: async () => {
            // Endpoint placeholder - actualizar cuando exista
            const response = await axiosInstance.get<KardsResponse>(
                '/v2/kards/me?limit=50'
            );
            return response.data.data.data;
        },
        // Deshabilitado hasta que exista el endpoint
        enabled: false,
    });

    const handleKardClick = (kardId: string) => {
        // TODO: Navegar al detalle de la kard cuando exista la ruta
        console.log('Kard clicked:', kardId);
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Content */}
            <div className="flex flex-col gap-2 w-full max-w-[500px] mx-auto px-4 py-4 pb-8">
                {isLoading ? (
                    <WalletListSkeleton />
                ) : error ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="text-[14px] font-helvetica text-[#FF2323]">
                            {t('common.error_loading', 'Error al cargar')}
                        </span>
                    </div>
                ) : !data || data.length === 0 ? (
                    <WalletListEmpty />
                ) : (
                    data.map((kard) => (
                        <KardCard
                            key={kard.id}
                            name={kard.name}
                            clubName={kard.club.name}
                            clubLogo={kard.club.logo}
                            venueType={VENUE_TYPE_MAP[kard.club.venueType] || kard.club.venueType}
                            onClick={() => handleKardClick(kard.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default WalletKards;
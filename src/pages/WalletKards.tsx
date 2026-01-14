import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';

// =============================================================================
// INTERFACES
// =============================================================================

type KardLevel = 'MEMBER' | 'BRONZE' | 'SILVER' | 'GOLD';
type VenueType = 'CLUB' | 'PUB' | 'BAR' | 'LOUNGE' | 'RESTAURANT' | 'PROMOTER' | 'OTHER';

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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface KlubKardProps {
    clubName: string;
    clubLogo: string;
    kardLevel: KardLevel;
    venueType?: VenueType;
    backgroundColor?: string;
    onClick?: () => void;
}

const KlubKard = ({
    clubName,
    clubLogo,
    venueType,
    backgroundColor = '#141414',
    onClick
}: KlubKardProps) => {
    const venueLabel = venueType ? getVenueTypeLabel(venueType) : '';

    return (
        <button
            onClick={onClick}
            className="relative flex flex-col justify-between w-full h-[200px] p-6 rounded-[20px] border-[3px] border-[#232323] cursor-pointer overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${backgroundColor} 0%, #141414 100%)`,
            }}
        >
            {/* Club Logo */}
            <div
                className="relative size-[54px] rounded-full border-[1.5px] border-[#232323] overflow-hidden shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]"
                style={{ backgroundColor: `${backgroundColor}80` }}
            >
                {clubLogo ? (
                    <img
                        src={clubLogo}
                        alt={clubName}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[20px]">🏠</span>
                    </div>
                )}
            </div>

            {/* Bottom Content */}
            <div className="flex flex-col items-start gap-0 w-full">
                <h3 className="text-[24px] font-borna font-semibold text-[#F6F6F6] leading-none truncate w-full text-left">
                    {clubName}
                </h3>
                <div className="flex items-center gap-2">
                    {venueLabel && (
                        <span className="text-[14px] font-helvetica text-[#939393]">
                            {venueLabel}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

const WalletListSkeleton = () => (
    <div className="flex flex-col gap-4 w-full animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] w-full bg-[#232323] rounded-[20px]" />
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
// MAIN COMPONENT
// =============================================================================

const WalletKards = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const { data, isLoading, error } = useQuery({
        queryKey: ['wallet-passbooks', user?.id],
        queryFn: async () => {
            const response = await axiosInstance.get<PassbooksResponse>(
                `/v2/wallet/user/${user?.id}`
            );
            return response.data.data.passbooks;
        },
        enabled: !!user?.id,
    });

    const handleKardClick = (passbook: UserPassbook) => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const url = isIOS ? passbook.passbookUrl : passbook.googleWalletUrl;

        if (url) {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Content */}
            <div className="flex flex-col gap-4 w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:py-4 md:pb-8">
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
                    data.map((passbook) => (
                        <KlubKard
                            key={passbook.id}
                            clubName={passbook.club.name}
                            clubLogo={passbook.club.logo}
                            kardLevel={passbook.kardLevel}
                            venueType={passbook.club.venueType}
                            backgroundColor={passbook.club.passbookConfig.backgroundColor}
                            onClick={() => handleKardClick(passbook)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default WalletKards;
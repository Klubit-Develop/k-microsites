import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';

// =============================================================================
// INTERFACES
// =============================================================================

type CardType = 'MEMBER' | 'BRONZE' | 'SILVER' | 'GOLD';

interface UserPassbook {
    id: string;
    serialNumber: string;
    kardLevel: CardType;
    passbookUrl: string;
    googleWalletUrl: string | null;
    createdAt: string;
    updatedAt: string;
    club: {
        id: string;
        name: string;
        slug: string;
        logo: string;
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

const getKardLevelLabel = (kardLevel: CardType): string => {
    switch (kardLevel) {
        case 'MEMBER':
            return 'Member';
        case 'BRONZE':
            return 'Bronze';
        case 'SILVER':
            return 'Silver';
        case 'GOLD':
            return 'Gold';
        default:
            return kardLevel;
    }
};

const getKardLevelColor = (kardLevel: CardType): string => {
    switch (kardLevel) {
        case 'MEMBER':
            return '#939393';
        case 'BRONZE':
            return '#CD7F32';
        case 'SILVER':
            return '#C0C0C0';
        case 'GOLD':
            return '#FFD700';
        default:
            return '#939393';
    }
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface KardCardProps {
    clubName: string;
    clubLogo: string;
    kardLevel: CardType;
    onClick?: () => void;
}

const KardCard = ({ clubName, clubLogo, kardLevel, onClick }: KardCardProps) => {
    const kardLevelLabel = getKardLevelLabel(kardLevel);
    const kardLevelColor = getKardLevelColor(kardLevel);

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
                    {clubName}
                </span>
                <span
                    className="text-[14px] font-helvetica font-medium"
                    style={{ color: kardLevelColor }}
                >
                    {kardLevelLabel}
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
        // Detectar plataforma y abrir la URL correspondiente
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const url = isIOS ? passbook.passbookUrl : passbook.googleWalletUrl;

        if (url) {
            window.open(url, '_blank');
        }
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
                    data.map((passbook) => (
                        <KardCard
                            key={passbook.id}
                            clubName={passbook.club.name}
                            clubLogo={passbook.club.logo}
                            kardLevel={passbook.kardLevel}
                            onClick={() => handleKardClick(passbook)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default WalletKards;
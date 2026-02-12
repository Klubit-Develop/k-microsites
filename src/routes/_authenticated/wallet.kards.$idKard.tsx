import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import axiosInstance from '@/config/axiosConfig'
import KardEventsListModal from '@/pages/WalletKards'

interface UserPassbook {
    id: string;
    clubId: string;
    club: {
        id: string;
        name: string;
        slug: string;
        logo: string;
        venueType: string;
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

export const Route = createFileRoute('/_authenticated/wallet/kards/$idKard')({
    component: WalletKardPage,
})

function WalletKardPage() {
    const { idKard } = useParams({ from: '/_authenticated/wallet/kards/$idKard' })
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const { data: passbooks } = useQuery({
        queryKey: ['wallet-kards', user?.id],
        queryFn: async () => {
            const response = await axiosInstance.get<PassbooksResponse>(
                `/v2/wallet/user/${user?.id}`
            )
            return response.data.data.passbooks
        },
        enabled: !!user?.id,
    })

    const passbook = passbooks?.find((pb) => pb.id === idKard)

    const handleClose = () => {
        navigate({ to: '/wallet' })
    }

    if (!passbook) {
        return null
    }

    return (
        <KardEventsListModal
            isOpen={true}
            onClose={handleClose}
            variant="upcoming"
            clubId={passbook.clubId}
        />
    )
}
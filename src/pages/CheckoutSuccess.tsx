import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';

import axiosInstance from '@/config/axiosConfig';
import Button from '@/components/ui/Button';

interface TransactionItem {
    id: string;
    itemType: 'TICKET' | 'GUESTLIST' | 'RESERVATION' | 'PROMOTION' | 'PRODUCT';
    quantity: number;
    unitPrice: number;
    ticket?: { name: string };
    guestlist?: { name: string };
    reservation?: { name: string };
    promotion?: { name: string };
    product?: { name: string };
}

interface TransactionResponse {
    status: 'success' | 'error';
    data: {
        transaction: {
            id: string;
            status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
            totalPrice: number;
            currency: string;
            event: {
                id: string;
                name: string;
                slug: string;
                flyer: string;
                startDate: string;
                startTime: string;
                endTime?: string;
                address?: string;
            };
            club?: {
                name: string;
            };
            items: TransactionItem[];
        };
    };
    message: string;
}

interface CheckoutSuccessSearch {
    transactionId?: string;
    payment_intent?: string;
    redirect_status?: string;
}

const ITEM_TYPE_COLORS: Record<string, string> = {
    TICKET: '#D591FF',
    GUESTLIST: '#FFCE1F',
    RESERVATION: '#FF336D',
    PROMOTION: '#FF336D',
    PRODUCT: '#22C55E',
};

const CheckoutSuccess = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as CheckoutSuccessSearch;

    const transactionId = search.transactionId;

    const { data: transaction, isLoading, isError } = useQuery({
        queryKey: ['transaction', transactionId],
        queryFn: async () => {
            const response = await axiosInstance.get<TransactionResponse>(
                `/v2/transactions/${transactionId}`
            );
            return response.data.data.transaction;
        },
        enabled: !!transactionId,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data?.status === 'COMPLETED') return false;
            if (data?.status === 'CANCELLED' || data?.status === 'EXPIRED') return false;
            return 2000;
        },
        refetchIntervalInBackground: false,
    });

    useEffect(() => {
        if (transaction?.status === 'COMPLETED') {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 },
                    colors: ['#FF336D', '#FFCE1F', '#E5FF88', '#D591FF'],
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 },
                    colors: ['#FF336D', '#FFCE1F', '#E5FF88', '#D591FF'],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();
        }
    }, [transaction?.status]);

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
        return date.toLocaleDateString(locale, {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
        });
    };

    const formatTime = (startTime?: string, endTime?: string): string => {
        if (!startTime) return '';
        if (endTime) return `${startTime} - ${endTime}`;
        return startTime;
    };

    const getItemName = (item: TransactionItem): string => {
        if (item.ticket) return item.ticket.name;
        if (item.guestlist) return item.guestlist.name;
        if (item.reservation) return item.reservation.name;
        if (item.promotion) return item.promotion.name;
        if (item.product) return item.product.name;
        return 'Item';
    };

    const getItemColor = (itemType: string): string => {
        return ITEM_TYPE_COLORS[itemType] || '#D591FF';
    };

    const handleGoToWallet = () => {
        navigate({ to: '/wallet' });
    };

    const handleGoHome = () => {
        navigate({ to: '/' });
    };

    const groupedItems = transaction?.items.reduce((acc, item) => {
        const name = getItemName(item);
        const key = `${item.itemType}-${name}`;
        if (!acc[key]) {
            acc[key] = {
                itemType: item.itemType,
                name,
                quantity: 0,
            };
        }
        acc[key].quantity += 1;
        return acc;
    }, {} as Record<string, { itemType: string; name: string; quantity: number }>);

    if (isLoading || !transaction) {
        return (
            <div className="bg-[#050505] min-h-screen flex items-center justify-center px-4 pt-[120px] pb-[100px] md:pt-24 md:pb-24">
                <div className="flex flex-col gap-6 items-center w-full max-w-[500px]">
                    <div className="size-[100px] md:size-[120px] rounded-full bg-[#141414] animate-pulse" />
                    <div className="flex flex-col gap-4 items-center w-full">
                        <div className="h-8 w-64 bg-[#232323] rounded animate-pulse" />
                        <div className="h-5 w-48 bg-[#232323] rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !transactionId) {
        return (
            <div className="bg-[#050505] min-h-screen flex items-center justify-center px-4 pt-[120px] pb-[100px] md:pt-24 md:pb-24">
                <div className="flex flex-col gap-6 items-center w-full max-w-[500px]">
                    <div className="size-[100px] md:size-[120px] flex items-center justify-center">
                        <span className="text-[48px] md:text-[64px]">😕</span>
                    </div>
                    <div className="flex flex-col gap-4 items-center text-center">
                        <h1 className="text-xl md:text-2xl font-semibold font-n27 text-[#f6f6f6]">
                            {t('checkout_success.error_title', 'Algo salió mal')}
                        </h1>
                        <p className="text-sm font-normal font-helvetica text-[#f6f6f6]">
                            {t('checkout_success.error_description', 'No pudimos encontrar tu transacción')}
                        </p>
                    </div>
                    <Button variant="cta" onClick={handleGoHome} className="w-full">
                        {t('checkout_success.go_home', 'Ir al inicio')}
                    </Button>
                </div>
            </div>
        );
    }

    if (transaction.status === 'PENDING') {
        return (
            <div className="bg-[#050505] min-h-screen flex items-center justify-center px-4 pt-[120px] pb-[100px] md:pt-24 md:pb-24">
                <div className="flex flex-col gap-6 items-center w-full max-w-[500px]">
                    <div className="size-[100px] md:size-[120px] flex items-center justify-center">
                        <div className="size-14 md:size-16 border-4 border-[#FF336D] border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="flex flex-col gap-4 items-center text-center px-6">
                        <h1 className="text-xl md:text-2xl font-semibold font-n27 text-[#f6f6f6]">
                            {t('checkout_success.processing_title', 'Procesando pago...')}
                        </h1>
                        <p className="text-sm font-normal font-helvetica text-[#f6f6f6]">
                            {t('checkout_success.processing_description', 'Estamos confirmando tu pago, espera un momento')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (transaction.status === 'CANCELLED' || transaction.status === 'EXPIRED') {
        return (
            <div className="bg-[#050505] min-h-screen flex items-center justify-center px-4 pt-[120px] pb-[100px] md:pt-24 md:pb-24">
                <div className="flex flex-col gap-6 items-center w-full max-w-[500px]">
                    <div className="size-[100px] md:size-[120px] flex items-center justify-center">
                        <span className="text-[48px] md:text-[64px]">❌</span>
                    </div>
                    <div className="flex flex-col gap-4 items-center text-center px-6">
                        <h1 className="text-xl md:text-2xl font-semibold font-n27 text-[#f6f6f6]">
                            {t('checkout_success.failed_title', 'Pago no completado')}
                        </h1>
                        <p className="text-sm font-normal font-helvetica text-[#f6f6f6]">
                            {t('checkout_success.failed_description', 'Tu pago no pudo ser procesado')}
                        </p>
                    </div>
                    <Button variant="cta" onClick={handleGoHome} className="w-full">
                        {t('checkout_success.try_again', 'Intentar de nuevo')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#050505] min-h-screen flex items-center justify-center px-4 pt-[120px] pb-[100px] md:pt-24 md:pb-24">
            <div className="flex flex-col gap-8 md:gap-9 items-center w-full max-w-[500px]">
                <div className="size-[100px] md:size-[120px] flex items-center justify-center">
                    <img 
                        src="https://klubit.fra1.cdn.digitaloceanspaces.com/icon-confeti.png" 
                        alt="Confetti"
                        className="w-[80px] h-[80px] md:w-[96px] md:h-[96px] object-contain"
                    />
                </div>

                <div className="flex flex-col gap-4 items-center w-full px-1.5">
                    <h1 className="text-xl md:text-2xl font-semibold font-n27 text-[#f6f6f6] text-center">
                        {t('checkout_success.title', '¡Compra realizada correctamente!')}
                    </h1>
                    <p className="text-sm font-normal font-helvetica text-[#f6f6f6] text-center">
                        {t('checkout_success.description', 'Ve a la wallet para ver todas tus tarifas')}
                    </p>
                </div>

                {groupedItems && Object.values(groupedItems).map((item, index) => (
                    <div
                        key={index}
                        className="w-full rounded-2xl border-2 border-[#232323] overflow-hidden shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]"
                    >
                        <div className="relative h-[200px] md:h-[240px] w-full">
                            <img
                                src={transaction.event.flyer}
                                alt={transaction.event.name}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] from-50% to-transparent" />

                            <div className="absolute inset-0 flex flex-col justify-end p-4">
                                <div className="absolute top-3 right-3 bg-[#141414] rounded-[25px] px-2 py-1 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                                    <span className="text-sm font-bold font-helvetica text-[#f6f6f6] min-w-[24px] text-center">
                                        x{item.quantity}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2 w-full">
                                    <h2 className="text-xl md:text-2xl font-semibold font-n27 text-[#f6f6f6]">
                                        {transaction.event.name}
                                    </h2>

                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <span className="text-sm font-normal font-helvetica text-[#E5FF88]">
                                                {formatDate(transaction.event.startDate)}
                                            </span>
                                            <span className="size-[3px] rounded-full bg-[#E5FF88]" />
                                            <span className="text-sm font-normal font-helvetica text-[#E5FF88]">
                                                {formatTime(transaction.event.startTime, transaction.event.endTime)}
                                            </span>
                                        </div>

                                        {(transaction.club?.name || transaction.event.address) && (
                                            <div className="flex items-center gap-1.5 py-px">
                                                <span className="text-[13px]">📍</span>
                                                <span className="text-sm font-normal font-helvetica text-[#939393] truncate">
                                                    {transaction.club?.name || transaction.event.address}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 pt-2 border-t-[1.5px] border-[#232323]">
                                        <span
                                            className="size-1.5 rounded-full"
                                            style={{ backgroundColor: getItemColor(item.itemType) }}
                                        />
                                        <span className="text-base font-medium font-helvetica text-[#f6f6f6]">
                                            {item.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <Button variant="cta" onClick={handleGoToWallet} className="w-full">
                    {t('checkout_success.go_to_wallet', 'Ir a la wallet')}
                </Button>
            </div>
        </div>
    );
};

export default CheckoutSuccess;
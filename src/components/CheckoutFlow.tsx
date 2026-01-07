import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import { useCheckoutStore, useCheckoutTimer } from '@/stores/useCheckoutStore';
import { transactionService, type CartItemRequest } from '@/components/Transactionservice';

import CheckoutSummary from '@/components/CheckoutSummary';
import StripePayment from '@/components/StripePayment';
import TimeExpiredModal from '@/components/TimeExpiredModal';

interface CheckoutFlowProps {
    onBack: () => void;
    onComplete: () => void;
}

const CheckoutFlow = ({ onBack, onComplete }: CheckoutFlowProps) => {
    const { t } = useTranslation();

    const {
        eventId,
        eventName,
        eventSlug,
        eventDisplayInfo,
        items,
        coupon,
        nominativeAssignments,
        step,
        isTimerExpired,
        goToPayment,
        goBack: goBackStep,
        setCoupon,
        setNominativeAssignments,
        clearCart,
        resetTimer,
        expireTimer,
        getServiceFee,
        setTransaction,
        clearTransaction,
    } = useCheckoutStore();

    const { remainingTime } = useCheckoutTimer();

    const [transactionId, setTransactionId] = useState<string | null>(null);

    const createTransactionMutation = useMutation({
        mutationFn: async () => {
            if (!eventId) throw new Error('No event selected');

            const cartItems: CartItemRequest[] = items.map((item, index) => {
                const itemAttendees = nominativeAssignments
                    .filter(a => a.itemIndex === index)
                    .map(a => ({
                        isForMe: a.assignmentType === 'me',
                        firstName: a.firstName,
                        lastName: a.lastName,
                        phone: a.phone,
                    }));

                return {
                    itemType: item.type.toUpperCase() as CartItemRequest['itemType'],
                    itemId: item.id,
                    priceId: item.priceId,
                    quantity: item.quantity,
                    attendees: item.isNominative ? itemAttendees : undefined,
                };
            });

            return transactionService.createTransaction({
                eventId,
                items: cartItems,
                couponCode: coupon?.code,
            });
        },
        onSuccess: (transaction) => {
            // Si el total es 0, la transacción ya está COMPLETED en el backend
            // No necesitamos pasar por Stripe, ir directamente a success
            if (transaction.totalPrice === 0 || transaction.status === 'COMPLETED') {
                // Limpiar el carrito primero (esto resetea el step a 'selection')
                clearCart();
                // Redirigir a la página de éxito
                window.location.href = `/checkout/success?transactionId=${transaction.id}`;
                return;
            }
            
            // Flujo normal con pago
            setTransactionId(transaction.id);
            setTransaction(transaction.id, transaction.totalPrice, transaction.currency);
            goToPayment();
        },
        onError: (error: Error) => {
            console.error('Error creating transaction:', error);
            toast.error(t('checkout.transaction_error', 'Error al crear la transacción'));
        },
    });

    const handleTimerExpired = useCallback(() => {
        expireTimer();
    }, [expireTimer]);

    const handleBackFromSummary = useCallback(() => {
        goBackStep();
        onBack();
    }, [goBackStep, onBack]);

    const handleContinueToPayment = useCallback((data: {
        coupon?: { id: string; code: string; type: 'PERCENTAGE' | 'FIXED_AMOUNT'; value: number };
        nominativeAssignments?: Array<{
            itemIndex: number;
            assignmentType: 'me' | 'send' | 'fill';
            phone?: string;
            phoneCountry?: string;
            firstName?: string;
            lastName?: string;
        }>;
    }) => {
        if (data.coupon) {
            setCoupon(data.coupon);
        }
        if (data.nominativeAssignments) {
            setNominativeAssignments(data.nominativeAssignments);
        }

        createTransactionMutation.mutate();
    }, [setCoupon, setNominativeAssignments, createTransactionMutation]);

    const handleBackFromPayment = useCallback(() => {
        goBackStep();
    }, [goBackStep]);

    const handlePaymentSuccess = useCallback(() => {
        clearCart();
        if (transactionId) {
            window.location.href = `/checkout/success?transactionId=${transactionId}`;
        }
        onComplete();
    }, [clearCart, transactionId, onComplete]);

    const handlePaymentCancel = useCallback(() => {
        clearTransaction();
        goBackStep();
    }, [clearTransaction, goBackStep]);

    const handleRetryAfterExpired = useCallback(() => {
        resetTimer();
        clearTransaction();
        onBack();
    }, [resetTimer, clearTransaction, onBack]);

    if (!eventId) {
        return null;
    }

    if (step === 'payment' && transactionId) {
        return (
            <>
                <div className="flex flex-col gap-[24px] w-full">
                    <div className="flex items-center gap-[12px]">
                        <button
                            onClick={handleBackFromPayment}
                            className="w-[40px] h-[40px] rounded-full bg-[#232323] flex items-center justify-center hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M12.5 15L7.5 10L12.5 5" stroke="#f6f6f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <h2 className="text-[20px] font-bold font-helvetica text-[#f6f6f6]">
                            {t('checkout.payment', 'Pago')}
                        </h2>
                    </div>

                    <div className="bg-[#0a0a0a] rounded-[16px] p-[24px] border border-[#232323]">
                        <div className="flex items-center gap-[16px] mb-[24px]">
                            {eventDisplayInfo?.coverImage && (
                                <img
                                    src={eventDisplayInfo.coverImage}
                                    alt={eventName || ''}
                                    className="w-[64px] h-[64px] rounded-[12px] object-cover"
                                />
                            )}
                            <div className="flex flex-col gap-[4px]">
                                <h3 className="text-[16px] font-bold font-helvetica text-[#f6f6f6]">
                                    {eventName}
                                </h3>
                                {eventDisplayInfo?.date && (
                                    <span className="text-[14px] font-normal font-helvetica text-[#939393]">
                                        {eventDisplayInfo.date}
                                    </span>
                                )}
                            </div>
                        </div>

                        <StripePayment
                            transactionId={transactionId}
                            onSuccess={handlePaymentSuccess}
                            onCancel={handlePaymentCancel}
                            timerSeconds={remainingTime}
                            onTimerExpired={handleTimerExpired}
                        />
                    </div>
                </div>

                <TimeExpiredModal
                    isOpen={isTimerExpired}
                    onRetry={handleRetryAfterExpired}
                />
            </>
        );
    }

    return (
        <>
            <CheckoutSummary
                event={{
                    id: eventId,
                    name: eventName || '',
                    slug: eventSlug || '',
                    coverImage: eventDisplayInfo?.coverImage,
                    date: eventDisplayInfo?.date || '',
                }}
                items={items}
                serviceFee={getServiceFee()}
                timerSeconds={remainingTime}
                onTimerExpired={handleTimerExpired}
                onBack={handleBackFromSummary}
                onContinueToPayment={handleContinueToPayment}
                isLoading={createTransactionMutation.isPending}
            />

            <TimeExpiredModal
                isOpen={isTimerExpired}
                onRetry={handleRetryAfterExpired}
            />
        </>
    );
};

export default CheckoutFlow;
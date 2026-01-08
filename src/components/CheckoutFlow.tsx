import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import { useCheckoutStore, useCheckoutTimer } from '@/stores/useCheckoutStore';
import { transactionService, type CartItemRequest, type AttendeeRequest } from '@/components/Transactionservice';

import CheckoutSummary from '@/components/CheckoutSummary';
import StripePayment from '@/components/StripePayment';
import TimeExpiredModal from '@/components/TimeExpiredModal';

interface NominativeAssignment {
    itemIndex: number;
    assignmentType: 'me' | 'send' | 'found' | 'notfound';
    phone?: string;
    phoneCountry?: string;
    email?: string;
    toUserId?: string;
}

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
    
    const pendingDataRef = useRef<{
        coupon?: { id: string; code: string; type: 'PERCENTAGE' | 'FIXED_AMOUNT'; value: number };
        nominativeAssignments?: NominativeAssignment[];
    }>({});

    const createTransactionMutation = useMutation({
        mutationFn: async () => {
            if (!eventId) throw new Error('No event selected');

            const currentAssignments = pendingDataRef.current.nominativeAssignments || [];
            const currentCoupon = pendingDataRef.current.coupon || coupon;

            const cartItems: CartItemRequest[] = items.map((item) => {
                const itemAttendees: AttendeeRequest[] = currentAssignments
                    .filter(a => {
                        let startIndex = 0;
                        for (const prevItem of items) {
                            if (prevItem === item) break;
                            if (prevItem.isNominative) startIndex += prevItem.quantity;
                        }
                        const endIndex = startIndex + (item.isNominative ? item.quantity : 0);
                        return a.itemIndex >= startIndex && a.itemIndex < endIndex;
                    })
                    .map(a => {
                        if (a.assignmentType === 'me') {
                            return { isForMe: true };
                        }
                        if (a.assignmentType === 'found' && a.toUserId) {
                            return {
                                isForMe: false,
                                toUserId: a.toUserId,
                            };
                        }
                        if (a.assignmentType === 'notfound' && a.phone && a.phoneCountry) {
                            return {
                                isForMe: false,
                                phone: a.phone.replace(/\s/g, ''),
                                phoneCountry: a.phoneCountry,
                                email: a.email,
                            };
                        }
                        return { isForMe: true };
                    });

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
                couponCode: currentCoupon?.code,
            });
        },
        onSuccess: (transaction) => {
            pendingDataRef.current = {};
            
            if (transaction.totalPrice === 0 || transaction.status === 'COMPLETED') {
                clearCart();
                window.location.href = `/checkout/success?transactionId=${transaction.id}`;
                return;
            }

            setTransactionId(transaction.id);
            setTransaction(transaction.id, transaction.totalPrice, transaction.currency);
            goToPayment();
        },
        onError: (error: Error) => {
            pendingDataRef.current = {};
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
        nominativeAssignments?: NominativeAssignment[];
    }) => {
        pendingDataRef.current = {
            coupon: data.coupon,
            nominativeAssignments: data.nominativeAssignments,
        };

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
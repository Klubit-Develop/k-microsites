import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';

type CheckoutStep = 'selection' | 'summary' | 'payment';

interface CheckoutItem {
    id: string;
    priceId: string;
    type: 'ticket' | 'guestlist' | 'reservation' | 'product' | 'promotion';
    name: string;
    priceName?: string;
    unitPrice: number;
    quantity: number;
    isNominative?: boolean;
    maxPersons?: number;
}

interface NominativeAssignment {
    itemIndex: number;
    assignmentType: 'me' | 'send' | 'found' | 'notfound';
    phone?: string;
    phoneCountry?: string;
    email?: string;
    toUserId?: string;
}

interface Fee {
    id: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    percentage: number | null;
    fixedAmount: number | null;
    currency: string;
    isActive: boolean;
}

interface Coupon {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
}

interface EventDisplayInfo {
    coverImage?: string;
    date?: string;
}

interface CheckoutState {
    // Step management
    step: CheckoutStep;
    setStep: (step: CheckoutStep) => void;
    goToSummary: () => void;
    goToPayment: () => void;
    goBack: () => void;

    // Event info
    eventId: string | null;
    eventName: string | null;
    eventSlug: string | null;
    eventDisplayInfo: EventDisplayInfo | null;
    setEvent: (id: string, name: string, slug: string, displayInfo?: EventDisplayInfo) => void;

    // Cart items
    items: CheckoutItem[];
    addItem: (item: CheckoutItem) => void;
    removeItem: (priceId: string) => void;
    updateItemQuantity: (priceId: string, quantity: number) => void;
    clearCart: () => void;
    hasItems: () => boolean;

    // Transaction (for Stripe Elements)
    transactionId: string | null;
    transactionAmount: number | null;
    transactionCurrency: string | null;
    setTransaction: (id: string, amount: number, currency: string) => void;
    clearTransaction: () => void;

    // Coupon
    coupon: Coupon | null;
    setCoupon: (coupon: Coupon | null) => void;

    // Nominative assignments
    nominativeAssignments: NominativeAssignment[];
    setNominativeAssignments: (assignments: NominativeAssignment[]) => void;

    // Fee
    fee: Fee | null;
    setFee: (fee: Fee | null) => void;
    getServiceFee: () => number;

    // Timer
    timerStartedAt: number | null;
    timerDuration: number; // in seconds
    isTimerExpired: boolean;
    startTimer: () => void;
    resetTimer: () => void;
    expireTimer: () => void;

    // Totals
    getSubtotal: () => number;
    getDiscount: () => number;
    getTotal: () => number;

    // Reset checkout for new event
    resetForNewEvent: (newEventId: string) => void;
}

const TIMER_DURATION = 10 * 60; // 10 minutes in seconds

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set, get) => ({
            // Step management
            step: 'selection',
            setStep: (step) => set({ step }),
            goToSummary: () => {
                const state = get();
                if (!state.timerStartedAt) {
                    set({ step: 'summary', timerStartedAt: Date.now(), isTimerExpired: false });
                } else {
                    set({ step: 'summary' });
                }
            },
            goToPayment: () => set({ step: 'payment' }),
            goBack: () => {
                const currentStep = get().step;
                if (currentStep === 'payment') {
                    set({ step: 'summary' });
                } else if (currentStep === 'summary') {
                    set({ step: 'selection' });
                }
            },

            // Event info
            eventId: null,
            eventName: null,
            eventSlug: null,
            eventDisplayInfo: null,
            setEvent: (id, name, slug, displayInfo) => set({
                eventId: id,
                eventName: name,
                eventSlug: slug,
                eventDisplayInfo: displayInfo || null,
            }),

            // Cart items
            items: [],
            addItem: (item) => set((state) => {
                const existingIndex = state.items.findIndex(i => i.priceId === item.priceId);
                if (existingIndex >= 0) {
                    const newItems = [...state.items];
                    newItems[existingIndex] = {
                        ...newItems[existingIndex],
                        quantity: newItems[existingIndex].quantity + item.quantity,
                    };
                    return { items: newItems };
                }
                return { items: [...state.items, item] };
            }),
            removeItem: (priceId) => set((state) => ({
                items: state.items.filter(i => i.priceId !== priceId),
            })),
            updateItemQuantity: (priceId, quantity) => set((state) => {
                if (quantity <= 0) {
                    return { items: state.items.filter(i => i.priceId !== priceId) };
                }
                return {
                    items: state.items.map(i =>
                        i.priceId === priceId ? { ...i, quantity } : i
                    ),
                };
            }),
            clearCart: () => set({
                items: [],
                coupon: null,
                nominativeAssignments: [],
                step: 'selection',
                timerStartedAt: null,
                isTimerExpired: false,
                transactionId: null,
                transactionAmount: null,
                transactionCurrency: null,
            }),
            hasItems: () => get().items.length > 0,

            // Transaction
            transactionId: null,
            transactionAmount: null,
            transactionCurrency: null,
            setTransaction: (id, amount, currency) => set({
                transactionId: id,
                transactionAmount: amount,
                transactionCurrency: currency,
            }),
            clearTransaction: () => set({
                transactionId: null,
                transactionAmount: null,
                transactionCurrency: null,
            }),

            // Coupon
            coupon: null,
            setCoupon: (coupon) => set({ coupon }),

            // Nominative assignments
            nominativeAssignments: [],
            setNominativeAssignments: (assignments) => set({ nominativeAssignments: assignments }),

            // Fee
            fee: null,
            setFee: (fee) => set({ fee }),
            getServiceFee: () => {
                const state = get();
                const subtotal = state.getSubtotal();
                const discount = state.getDiscount();
                const baseAmount = subtotal - discount;

                if (!state.fee || !state.fee.isActive) return 0;

                if (state.fee.type === 'PERCENTAGE' && state.fee.percentage) {
                    return Math.round(baseAmount * (state.fee.percentage / 100) * 100) / 100;
                }
                if (state.fee.type === 'FIXED_AMOUNT' && state.fee.fixedAmount) {
                    return state.fee.fixedAmount;
                }
                return 0;
            },

            // Timer
            timerStartedAt: null,
            timerDuration: TIMER_DURATION,
            isTimerExpired: false,
            startTimer: () => set({ timerStartedAt: Date.now(), isTimerExpired: false }),
            resetTimer: () => set({ timerStartedAt: null, isTimerExpired: false }),
            expireTimer: () => set({ isTimerExpired: true }),

            // Totals
            getSubtotal: () => {
                const items = get().items;
                return items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            },
            getDiscount: () => {
                const state = get();
                const subtotal = state.getSubtotal();
                if (!state.coupon) return 0;

                if (state.coupon.type === 'PERCENTAGE') {
                    return Math.round(subtotal * (state.coupon.value / 100) * 100) / 100;
                }
                if (state.coupon.type === 'FIXED_AMOUNT') {
                    return Math.min(state.coupon.value, subtotal);
                }
                return 0;
            },
            getTotal: () => {
                const state = get();
                const subtotal = state.getSubtotal();
                const discount = state.getDiscount();
                const serviceFee = state.getServiceFee();
                return Math.max(0, subtotal - discount + serviceFee);
            },

            // Reset checkout for new event - clears expired state when visiting a different event
            resetForNewEvent: (newEventId: string) => {
                const state = get();

                // Si el eventId guardado es diferente al nuevo, o si el timer expiró,
                // limpiamos todo el checkout
                if (state.eventId !== newEventId || state.isTimerExpired) {
                    set({
                        eventId: null,
                        eventName: null,
                        eventSlug: null,
                        eventDisplayInfo: null,
                        items: [],
                        coupon: null,
                        nominativeAssignments: [],
                        step: 'selection',
                        timerStartedAt: null,
                        isTimerExpired: false,
                        transactionId: null,
                        transactionAmount: null,
                        transactionCurrency: null,
                    });
                }
            },
        }),
        {
            name: 'checkout-storage',
            partialize: (state) => ({
                eventId: state.eventId,
                eventName: state.eventName,
                eventSlug: state.eventSlug,
                eventDisplayInfo: state.eventDisplayInfo,
                items: state.items,
                coupon: state.coupon,
                nominativeAssignments: state.nominativeAssignments,
                timerStartedAt: state.timerStartedAt,
                step: state.step,
                fee: state.fee,
                transactionId: state.transactionId,
                transactionAmount: state.transactionAmount,
                transactionCurrency: state.transactionCurrency,
                isTimerExpired: state.isTimerExpired,
            }),
        }
    )
);

// Hook for timer countdown
export const useCheckoutTimer = () => {
    const { timerStartedAt, timerDuration, isTimerExpired, expireTimer } = useCheckoutStore();
    const [remainingTime, setRemainingTime] = useState<number>(timerDuration);

    useEffect(() => {
        if (!timerStartedAt || isTimerExpired) {
            setRemainingTime(timerDuration);
            return;
        }

        const calculateRemaining = () => {
            const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
            const remaining = Math.max(0, timerDuration - elapsed);
            return remaining;
        };

        setRemainingTime(calculateRemaining());

        const interval = setInterval(() => {
            const remaining = calculateRemaining();
            setRemainingTime(remaining);

            if (remaining <= 0) {
                expireTimer();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timerStartedAt, timerDuration, isTimerExpired, expireTimer]);

    return { remainingTime, isTimerExpired };
};

export default useCheckoutStore;
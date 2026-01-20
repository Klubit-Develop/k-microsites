import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState, useRef } from 'react';

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
    termsAndConditions?: string;
}

interface ReservationFormData {
    reservationName: string;
    partySize: number;
    observations: string;
}

interface CheckoutState {
    step: CheckoutStep;
    setStep: (step: CheckoutStep) => void;
    goToSummary: () => void;
    goToPayment: () => void;
    goBack: () => void;

    eventId: string | null;
    eventName: string | null;
    eventSlug: string | null;
    eventDisplayInfo: EventDisplayInfo | null;
    setEvent: (id: string, name: string, slug: string, displayInfo?: EventDisplayInfo) => void;

    items: CheckoutItem[];
    addItem: (item: CheckoutItem) => void;
    removeItem: (priceId: string) => void;
    updateItemQuantity: (priceId: string, quantity: number) => void;
    clearCart: () => void;
    clearItemsByType: (type: CheckoutItem['type']) => void;
    hasItems: () => boolean;

    transactionId: string | null;
    transactionAmount: number | null;
    transactionCurrency: string | null;
    setTransaction: (id: string, amount: number, currency: string) => void;
    clearTransaction: () => void;

    coupon: Coupon | null;
    setCoupon: (coupon: Coupon | null) => void;

    nominativeAssignments: NominativeAssignment[];
    setNominativeAssignments: (assignments: NominativeAssignment[]) => void;

    reservationFormData: ReservationFormData | null;
    setReservationFormData: (data: ReservationFormData | null) => void;

    fee: Fee | null;
    setFee: (fee: Fee | null) => void;
    getServiceFee: () => number;

    timerStartedAt: number | null;
    timerDuration: number;
    isTimerExpired: boolean;
    startTimer: () => void;
    resetTimer: () => void;
    expireTimer: () => void;

    getSubtotal: () => number;
    getDiscount: () => number;
    getTotal: () => number;

    resetForNewEvent: (newEventId: string) => void;

    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

const TIMER_DURATION = 10 * 60;

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set, get) => ({
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
            clearItemsByType: (type) => set((state) => ({
                items: state.items.filter(i => i.type !== type),
            })),
            hasItems: () => get().items.length > 0,

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

            coupon: null,
            setCoupon: (coupon) => set({ coupon }),

            nominativeAssignments: [],
            setNominativeAssignments: (assignments) => set({ nominativeAssignments: assignments }),

            reservationFormData: null,
            setReservationFormData: (data) => set({ reservationFormData: data }),

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

            timerStartedAt: null,
            timerDuration: TIMER_DURATION,
            isTimerExpired: false,
            startTimer: () => set({ timerStartedAt: Date.now(), isTimerExpired: false }),
            resetTimer: () => set({ timerStartedAt: null, isTimerExpired: false }),
            expireTimer: () => set({ isTimerExpired: true }),

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

            resetForNewEvent: (newEventId: string) => {
                const state = get();

                if (state.eventId !== newEventId || state.isTimerExpired) {
                    set({
                        eventId: null,
                        eventName: null,
                        eventSlug: null,
                        eventDisplayInfo: null,
                        items: [],
                        coupon: null,
                        nominativeAssignments: [],
                        reservationFormData: null,
                        step: 'selection',
                        timerStartedAt: null,
                        isTimerExpired: false,
                        transactionId: null,
                        transactionAmount: null,
                        transactionCurrency: null,
                    });
                }
            },

            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
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
                reservationFormData: state.reservationFormData,
                timerStartedAt: state.timerStartedAt,
                step: state.step,
                fee: state.fee,
                transactionId: state.transactionId,
                transactionAmount: state.transactionAmount,
                transactionCurrency: state.transactionCurrency,
                isTimerExpired: state.isTimerExpired,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

export const useCheckoutTimer = () => {
    const { timerStartedAt, timerDuration, isTimerExpired, expireTimer, _hasHydrated } = useCheckoutStore();
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const hasExpiredRef = useRef(false);

    useEffect(() => {
        if (!_hasHydrated) {
            return;
        }

        if (!timerStartedAt || isTimerExpired) {
            setRemainingTime(timerDuration);
            hasExpiredRef.current = isTimerExpired;
            return;
        }

        const calculateRemaining = () => {
            const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
            const remaining = Math.max(0, timerDuration - elapsed);
            return remaining;
        };

        const initialRemaining = calculateRemaining();
        setRemainingTime(initialRemaining);

        if (initialRemaining <= 0 && !hasExpiredRef.current) {
            hasExpiredRef.current = true;
            expireTimer();
            return;
        }

        const interval = setInterval(() => {
            const remaining = calculateRemaining();
            setRemainingTime(remaining);

            if (remaining <= 0 && !hasExpiredRef.current) {
                hasExpiredRef.current = true;
                expireTimer();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timerStartedAt, timerDuration, isTimerExpired, expireTimer, _hasHydrated]);

    useEffect(() => {
        if (isTimerExpired) {
            hasExpiredRef.current = true;
        }
    }, [isTimerExpired]);

    return { 
        remainingTime: remainingTime ?? timerDuration, 
        isTimerExpired,
        isHydrated: _hasHydrated
    };
};

export const waitForCheckoutHydration = (): Promise<void> => {
    return new Promise((resolve) => {
        if (useCheckoutStore.getState()._hasHydrated) {
            resolve();
            return;
        }
        const unsubscribe = useCheckoutStore.subscribe((state) => {
            if (state._hasHydrated) {
                unsubscribe();
                resolve();
            }
        });
    });
};

export default useCheckoutStore;
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

interface CartItem {
    id: string;
    priceId: string;
    type: 'ticket' | 'guestlist' | 'reservation' | 'promotion' | 'product';
    name: string;
    priceName?: string;
    unitPrice: number;
    quantity: number;
    maxPersons?: number;
}

interface ReservationData {
    zoneId: string;
    zoneName: string;
    persons: number;
    name: string;
    time: string;
    observations?: string;
    minPrice: number;
}

type CheckoutStep = 'selection' | 'summary' | 'payment' | 'confirmation';

interface CheckoutState {
    // Event context
    eventId: string | null;
    eventName: string | null;
    eventSlug: string | null;

    // Cart items
    items: CartItem[];

    // Reservation (special flow)
    reservation: ReservationData | null;

    // Checkout flow
    step: CheckoutStep;

    // Timer (10 minutes countdown)
    timerStartedAt: number | null;
    timerDuration: number; // in seconds (default 600 = 10 min)
    isTimerExpired: boolean;

    // Actions
    setEvent: (eventId: string, eventName: string, eventSlug: string) => void;
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeItem: (priceId: string) => void;
    updateQuantity: (priceId: string, quantity: number) => void;
    clearCart: () => void;

    setReservation: (data: ReservationData | null) => void;

    setStep: (step: CheckoutStep) => void;
    goToSummary: () => void;
    goToPayment: () => void;
    goBack: () => void;

    startTimer: () => void;
    resetTimer: () => void;
    expireTimer: () => void;

    // Computed
    getTotal: () => number;
    getItemCount: () => number;
    hasItems: () => boolean;
}

// ============================================
// STORE
// ============================================

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set, get) => ({
            // Initial state
            eventId: null,
            eventName: null,
            eventSlug: null,
            items: [],
            reservation: null,
            step: 'selection',
            timerStartedAt: null,
            timerDuration: 600, // 10 minutes
            isTimerExpired: false,

            // Event actions
            setEvent: (eventId, eventName, eventSlug) => {
                const currentEventId = get().eventId;
                // If switching events, clear cart
                if (currentEventId && currentEventId !== eventId) {
                    set({
                        eventId,
                        eventName,
                        eventSlug,
                        items: [],
                        reservation: null,
                        step: 'selection',
                        timerStartedAt: null,
                        isTimerExpired: false,
                    });
                } else {
                    set({ eventId, eventName, eventSlug });
                }
            },

            // Cart actions
            addItem: (item) => {
                const items = get().items;
                const existingIndex = items.findIndex(i => i.priceId === item.priceId);

                if (existingIndex >= 0) {
                    // Update quantity
                    const newItems = [...items];
                    newItems[existingIndex].quantity += item.quantity || 1;
                    set({ items: newItems });
                } else {
                    // Add new item
                    set({
                        items: [...items, { ...item, quantity: item.quantity || 1 }],
                    });
                }
            },

            removeItem: (priceId) => {
                set({
                    items: get().items.filter(item => item.priceId !== priceId),
                });
            },

            updateQuantity: (priceId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(priceId);
                    return;
                }

                set({
                    items: get().items.map(item =>
                        item.priceId === priceId ? { ...item, quantity } : item
                    ),
                });
            },

            clearCart: () => {
                set({
                    items: [],
                    reservation: null,
                    step: 'selection',
                    timerStartedAt: null,
                    isTimerExpired: false,
                });
            },

            // Reservation actions
            setReservation: (data) => {
                set({ reservation: data });
            },

            // Step actions
            setStep: (step) => {
                set({ step });
            },

            goToSummary: () => {
                const { items, reservation } = get();
                if (items.length > 0 || reservation) {
                    set({ step: 'summary' });
                    // Start timer when entering summary
                    if (!get().timerStartedAt) {
                        get().startTimer();
                    }
                }
            },

            goToPayment: () => {
                set({ step: 'payment' });
            },

            goBack: () => {
                const currentStep = get().step;
                if (currentStep === 'summary') {
                    set({ step: 'selection' });
                } else if (currentStep === 'payment') {
                    set({ step: 'summary' });
                }
            },

            // Timer actions
            startTimer: () => {
                set({
                    timerStartedAt: Date.now(),
                    isTimerExpired: false,
                });
            },

            resetTimer: () => {
                set({
                    timerStartedAt: Date.now(),
                    isTimerExpired: false,
                });
            },

            expireTimer: () => {
                set({
                    isTimerExpired: true,
                    items: [],
                    reservation: null,
                    step: 'selection',
                    timerStartedAt: null,
                });
            },

            // Computed values
            getTotal: () => {
                const { items, reservation } = get();
                const itemsTotal = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
                const reservationTotal = reservation?.minPrice || 0;
                return itemsTotal + reservationTotal;
            },

            getItemCount: () => {
                return get().items.reduce((acc, item) => acc + item.quantity, 0);
            },

            hasItems: () => {
                const { items, reservation } = get();
                return items.length > 0 || reservation !== null;
            },
        }),
        {
            name: 'klubit-checkout',
            partialize: (state) => ({
                eventId: state.eventId,
                eventName: state.eventName,
                eventSlug: state.eventSlug,
                items: state.items,
                reservation: state.reservation,
                step: state.step,
                timerStartedAt: state.timerStartedAt,
            }),
        }
    )
);

// ============================================
// HOOKS
// ============================================

export const useCheckoutTimer = () => {
    const { timerStartedAt, timerDuration, isTimerExpired, expireTimer } = useCheckoutStore();

    const getRemainingTime = (): number => {
        if (!timerStartedAt || isTimerExpired) return 0;
        const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
        return Math.max(0, timerDuration - elapsed);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        remainingTime: getRemainingTime(),
        formattedTime: formatTime(getRemainingTime()),
        isExpired: isTimerExpired || getRemainingTime() === 0,
        expireTimer,
    };
};

export default useCheckoutStore;
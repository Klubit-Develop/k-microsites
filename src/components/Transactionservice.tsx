import axiosInstance from '@/config/axiosConfig';

const API_URL = import.meta.env.VITE_API_URL;

export interface CartItemRequest {
    itemType: 'TICKET' | 'GUESTLIST' | 'RESERVATION' | 'PROMOTION' | 'PRODUCT';
    itemId: string;
    priceId?: string;
    quantity: number;
    attendees?: Array<{
        isForMe: boolean;
        firstName?: string;
        lastName?: string;
        birthdate?: string;
        country?: string;
        phone?: string;
    }>;
}

export interface CreateTransactionRequest {
    eventId: string;
    items: CartItemRequest[];
    couponCode?: string;
    currency?: string;
}

export interface TransactionResponse {
    id: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
    subtotal: number;
    discountAmount: number;
    feeAmount: number;
    totalPrice: number;
    currency: string;
    expiresAt: string;
    event: {
        id: string;
        name: string;
        slug: string;
    };
    items: Array<{
        id: string;
        itemType: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
    }>;
}

export interface PaymentIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
    transactionId: string;
    amount: number;
    currency: string;
    expiresAt: string | null;
}

export interface PaymentIntentStatusResponse {
    transactionId: string;
    transactionStatus: string;
    status: string;
    amount: number;
    currency: string;
    chargeId: string | null;
    receiptUrl: string | null;
    paymentMethod: {
        type: string | null;
        last4: string | null;
        brand: string | null;
    };
}

export const transactionService = {
    async createTransaction(data: CreateTransactionRequest): Promise<TransactionResponse> {
        const response = await axiosInstance.post(`${API_URL}/v2/transactions`, data);

        if (response.data.success) {
            return response.data.data.transaction;
        }

        throw new Error(response.data.message || 'Failed to create transaction');
    },

    async getTransaction(transactionId: string): Promise<TransactionResponse> {
        const response = await axiosInstance.get(`${API_URL}/v2/transactions/${transactionId}`);

        if (response.data.success) {
            return response.data.data.transaction;
        }

        throw new Error(response.data.message || 'Failed to get transaction');
    },

    async createPaymentIntent(transactionId: string): Promise<PaymentIntentResponse> {
        const response = await axiosInstance.post(
            `${API_URL}/v2/transactions/${transactionId}/payment-intent`
        );

        if (response.data.success) {
            return response.data.data;
        }

        throw new Error(response.data.message || 'Failed to create payment intent');
    },

    async getPaymentIntentStatus(transactionId: string): Promise<PaymentIntentStatusResponse> {
        const response = await axiosInstance.get(
            `${API_URL}/v2/transactions/${transactionId}/payment-intent/status`
        );

        if (response.data.success) {
            return response.data.data;
        }

        throw new Error(response.data.message || 'Failed to get payment intent status');
    },

    async cancelTransaction(transactionId: string): Promise<void> {
        const response = await axiosInstance.post(
            `${API_URL}/v2/transactions/${transactionId}/cancel`
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to cancel transaction');
        }
    },

    async getMyTransactions(params?: {
        status?: string;
        eventId?: string;
        limit?: number;
        page?: number;
    }): Promise<{ data: TransactionResponse[]; meta: { total: number; page: number } }> {
        const response = await axiosInstance.get(`${API_URL}/v2/transactions/me`, { params });

        if (response.data.success) {
            return response.data.data;
        }

        throw new Error(response.data.message || 'Failed to get transactions');
    },
};

export default transactionService;
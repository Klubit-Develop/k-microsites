import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Lock, Clock } from 'lucide-react';

import axiosInstance from '@/config/axiosConfig';
import Button from '@/components/ui/Button';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentIntentResponse {
    status: 'success' | 'error';
    data: {
        clientSecret: string;
        paymentIntentId: string;
        transactionId: string;
        amount: number;
        currency: string;
        expiresAt: string | null;
        stripeAccountId?: string;
    };
    message: string;
}

interface StripePaymentProps {
    transactionId: string;
    onSuccess: () => void;
    onCancel: () => void;
    timerSeconds?: number;
    onTimerExpired?: () => void;
}

interface CheckoutFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    timerSeconds?: number;
    onTimerExpired?: () => void;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const CheckoutForm = ({ onSuccess, onCancel, timerSeconds, onTimerExpired }: CheckoutFormProps) => {
    const { t } = useTranslation();
    const stripe = useStripe();
    const elements = useElements();

    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (timerSeconds !== undefined && timerSeconds <= 0 && onTimerExpired) {
            onTimerExpired();
        }
    }, [timerSeconds, onTimerExpired]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/checkout/success`,
                },
                redirect: 'if_required',
            });

            if (error) {
                if (error.type === 'card_error' || error.type === 'validation_error') {
                    setErrorMessage(error.message || t('payment.generic_error', 'Error en el pago'));
                } else {
                    setErrorMessage(t('payment.generic_error', 'Ha ocurrido un error inesperado'));
                }
                setIsProcessing(false);
            } else if (paymentIntent) {
                if (paymentIntent.status === 'succeeded') {
                    onSuccess();
                } else if (paymentIntent.status === 'processing') {
                    onSuccess();
                } else if (paymentIntent.status === 'requires_action') {
                    setIsProcessing(false);
                } else {
                    setErrorMessage(t('payment.generic_error', 'Estado de pago inesperado'));
                    setIsProcessing(false);
                }
            }
        } catch (err) {
            console.error('Payment error:', err);
            setErrorMessage(t('payment.generic_error', 'Ha ocurrido un error inesperado'));
            setIsProcessing(false);
        }
    };

    const isTimerCritical = timerSeconds !== undefined && timerSeconds <= 60;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Timer Display */}
            {timerSeconds !== undefined && (
                <div className={`
                    flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                    ${isTimerCritical 
                        ? 'bg-[rgba(255,35,35,0.15)] text-[#FF2323]' 
                        : 'bg-[#1A1A1A] text-[#F6F6F6]'
                    }
                `}>
                    <Clock size={18} className={isTimerCritical ? 'animate-pulse' : ''} />
                    <span className="font-helvetica font-medium text-[15px]">
                        {t('payment.time_remaining', 'Tiempo restante')}: {formatTime(timerSeconds)}
                    </span>
                </div>
            )}

            {/* Payment Element */}
            <div className="bg-[#0A0A0A] rounded-xl p-4">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
                        defaultValues: {
                            billingDetails: {
                                address: {
                                    country: 'ES',
                                },
                            },
                        },
                    }}
                />
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-[rgba(255,35,35,0.15)] text-[#FF2323] px-4 py-3 rounded-xl text-[14px] font-helvetica">
                    {errorMessage}
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <Button
                    type="submit"
                    variant="cta"
                    disabled={!stripe || isProcessing}
                    isLoading={isProcessing}
                >
                    {isProcessing 
                        ? t('payment.processing', 'Procesando...') 
                        : t('payment.pay', 'Pagar')
                    }
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isProcessing}
                >
                    {t('payment.cancel', 'Cancelar')}
                </Button>
            </div>

            {/* Secure Payment Notice */}
            <div className="flex items-center justify-center gap-2 text-[#666666]">
                <Lock size={14} />
                <span className="text-[12px] font-helvetica">
                    {t('payment.secure_payment', 'Pago seguro con Stripe')}
                </span>
            </div>
        </form>
    );
};

const StripePayment = ({ 
    transactionId, 
    onSuccess, 
    onCancel,
    timerSeconds,
    onTimerExpired,
}: StripePaymentProps) => {
    const { t } = useTranslation();

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Prevent double PaymentIntent creation (React StrictMode)
    const hasCreatedIntent = useRef(false);

    useEffect(() => {
        if (hasCreatedIntent.current) {
            return;
        }

        const createPaymentIntent = async () => {
            hasCreatedIntent.current = true;
            
            try {
                setIsLoading(true);
                setError(null);

                console.log('Creating PaymentIntent for transaction:', transactionId);

                const response = await axiosInstance.post<PaymentIntentResponse>(
                    `/v2/transactions/${transactionId}/payment-intent`
                );

                console.log('PaymentIntent response:', response.data);

                if (response.data.status === 'success') {
                    const secret = response.data.data.clientSecret;
                    
                    console.log('ClientSecret received:', secret ? 'Yes (length: ' + secret.length + ')' : 'No');
                    
                    if (secret) {
                        setClientSecret(secret);
                    } else {
                        setError(t('payment.no_client_secret', 'No se pudo iniciar el pago'));
                    }
                } else {
                    setError(response.data.message || t('payment.intent_error', 'Error al iniciar el pago'));
                }
            } catch (err: any) {
                console.error('PaymentIntent creation error:', err);
                if (err.backendError) {
                    setError(err.backendError.message);
                } else {
                    setError(t('common.error_connection', 'Error de conexión'));
                }
            } finally {
                setIsLoading(false);
            }
        };

        createPaymentIntent();
    }, [transactionId, t]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 bg-[#111111] rounded-2xl p-6">
                <div className="flex flex-col gap-4">
                    <div className="h-6 w-32 bg-[#232323] rounded animate-pulse" />
                    <div className="h-[200px] w-full bg-[#232323] rounded-xl animate-pulse" />
                    <div className="h-12 w-full bg-[#232323] rounded-xl animate-pulse" />
                </div>
                <p className="text-center text-[#666666] text-[14px] font-helvetica">
                    {t('payment.loading', 'Cargando método de pago...')}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-6 bg-[#111111] rounded-2xl p-6">
                <div className="bg-[rgba(255,35,35,0.15)] text-[#FF2323] px-4 py-3 rounded-xl text-[14px] font-helvetica text-center">
                    {error}
                </div>
                <Button variant="secondary" onClick={onCancel}>
                    {t('common.go_back', 'Volver')}
                </Button>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="flex flex-col gap-6 bg-[#111111] rounded-2xl p-6">
                <div className="bg-[rgba(255,35,35,0.15)] text-[#FF2323] px-4 py-3 rounded-xl text-[14px] font-helvetica text-center">
                    {t('payment.no_client_secret', 'No se pudo iniciar el pago')}
                </div>
                <Button variant="secondary" onClick={onCancel}>
                    {t('common.go_back', 'Volver')}
                </Button>
            </div>
        );
    }

    const appearance: import('@stripe/stripe-js').Appearance = {
        theme: 'night',
        variables: {
            colorPrimary: '#FF336D',
            colorBackground: '#0A0A0A',
            colorText: '#F6F6F6',
            colorDanger: '#FF2323',
            fontFamily: 'Helvetica Now Display, system-ui, sans-serif',
            borderRadius: '12px',
            spacingUnit: '4px',
        },
        rules: {
            '.Input': {
                backgroundColor: '#1A1A1A',
                border: '1px solid #333333',
                color: '#F6F6F6',
            },
            '.Input:focus': {
                border: '1px solid #FF336D',
                boxShadow: '0 0 0 1px #FF336D',
            },
            '.Input--invalid': {
                border: '1px solid #FF2323',
            },
            '.Label': {
                color: '#999999',
                fontSize: '14px',
            },
            '.Tab': {
                backgroundColor: '#1A1A1A',
                border: '1px solid #333333',
                color: '#999999',
            },
            '.Tab:hover': {
                backgroundColor: '#252525',
            },
            '.Tab--selected': {
                backgroundColor: '#FF336D',
                borderColor: '#FF336D',
                color: '#F6F6F6',
            },
            '.TabIcon--selected': {
                fill: '#F6F6F6',
            },
            '.Error': {
                color: '#FF2323',
                fontSize: '13px',
            },
        },
    };

    return (
        <div className="flex flex-col gap-6 bg-[#111111] rounded-2xl p-6">
            <h2 className="text-[20px] font-helvetica font-bold text-[#F6F6F6]">
                {t('payment.title', 'Método de pago')}
            </h2>

            <Elements
                stripe={stripePromise}
                options={{
                    clientSecret,
                    appearance,
                    locale: 'es',
                }}
            >
                <CheckoutForm
                    onSuccess={onSuccess}
                    onCancel={onCancel}
                    timerSeconds={timerSeconds}
                    onTimerExpired={onTimerExpired}
                />
            </Elements>
        </div>
    );
};

export default StripePayment;
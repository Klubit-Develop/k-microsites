import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Asterisk } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

import axiosInstance from '@/config/axiosConfig';
import OTPInput from '@/components/common/OTPInput';
import { LogoCutIcon } from '@/components/icons';

const Verify = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n, t } = useTranslation();

    const { setUser, setToken } = useAuthStore();

    const [otpValue, setOtpValue] = useState('');
    const [countdown, setCountdown] = useState(0);

    // Determinar método de verificación
    const verificationType = (location.state as { verification?: string })?.verification;

    // Determinar si es recuperación de contraseña
    const isForgot = (location.state as { forgot?: string })?.forgot || false;

    const loginMutation = useMutation({
        mutationFn: async (data: { country: string; phone: string }) => {
            const response = await axiosInstance.post('/v2/auth/login', data);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success' && response.data?.token && response.data?.user) {
                setToken(response.data.token);
                setUser(response.data.user);
                navigate({ to: '/manager/klaudia' });
            }
        },
        onError: (error: any) => {
            if (error.backendError) {
                toast.error(error.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const loginForgotMutation = useMutation({
        mutationFn: async (data: { country: string; phone: string }) => {
            const response = await axiosInstance.post('/v2/auth/login', data);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success' && response.data?.token && response.data?.user) {
                navigate({
                    to: '/forgot-change',
                    state: {
                        id: response.data.user.id,
                        token: response.data.token,
                        currentEmail: response.data.user.email
                    } as any
                });
            }
        },
        onError: (error: any) => {
            if (error.backendError) {
                toast.error(error.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const forgotChangeMutation = useMutation({
        mutationFn: async (data: { id: string; token: string, email: string }) => {
            const response = await axiosInstance.post('/v2/auth/forgot-change',
                {
                    email: data.email
                },
                {
                    headers: {
                        'Authorization': `Bearer ${data.token}`
                    }
                }
            );
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success' && (location.state as { token?: string })?.token && response.data?.user) {
                setToken((location.state as { token?: string })?.token!);
                setUser(response.data.user);
                navigate({ to: '/manager/klaudia' });
            }
        },
        onError: (error: any) => {
            if (error.backendError) {
                toast.error(error.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    // Verificar OTP
    const verifyMutation = useMutation({
        mutationFn: async (code: string) => {
            const lang = i18n.language === 'en' ? 'en' : 'es';

            if (verificationType === 'email') {
                return await axiosInstance.post(`/v2/email/validate?lang=${lang}`, {
                    email: isForgot ?
                        (location.state as { currentEmail?: string })?.currentEmail :
                        (location.state as { email?: string })?.email,
                    code
                });
            } else {
                return await axiosInstance.post(`/v2/sms/validate?lang=${lang}`, {
                    country: (location.state as { country?: string })?.country,
                    phone: (location.state as { phone?: string })?.phone?.replace(/\s/g, ''),
                    code
                });
            }
        },
        onSuccess: () => {
            if (verificationType === 'email') {

                if (isForgot) {
                    forgotChangeMutation.mutate({
                        id: (location.state as { id?: string })?.id!,
                        token: (location.state as { token?: string })?.token!,
                        email: (location.state as { email?: string })?.email!
                    });
                } else {
                    loginMutation.mutate({
                        country: (location.state as { country?: string })?.country!,
                        phone: (location.state as { phone?: string })?.phone?.replace(/\s/g, '')!,
                    });
                }

            } else {

                if (isForgot) {

                    loginForgotMutation.mutate({
                        country: (location.state as { country?: string })?.country!,
                        phone: (location.state as { phone?: string })?.phone?.replace(/\s/g, '')!,
                    });

                } else {
                    return navigate({
                        to: '/register',
                        state: { 
                            country: (location.state as { country?: string })?.country, 
                            phone: (location.state as { phone?: string })?.phone,
                            oauthEmail: (location.search as { oauthEmail?: string })?.oauthEmail || ''
                        } as any
                    });
                }
            }
        },
        onError: () => {
            toast.error(t('verify.error_connection'));
        }
    });

    // Reenviar código
    const resendMutation = useMutation({
        mutationFn: async () => {
            const lang = i18n.language === 'en' ? 'en' : 'es';

            if (verificationType === 'email') {
                return await axiosInstance.post(`/v2/email/resend?lang=${lang}`, {
                    email: (location.state as { email?: string })?.email
                });
            } else {
                return await axiosInstance.post(`/v2/sms/resend?lang=${lang}`, {
                    country: (location.state as { country?: string })?.country,
                    phone: (location.state as { phone?: string })?.phone?.replace(/\s/g, ''),
                });
            }
        },
        onSuccess: () => {
            // Limpiar el OTP al reenviar código exitosamente
            setOtpValue('');
            // Activar el contador
            setCountdown(30);
        },
        onError: () => {
            toast.error(t('verify.error_connection'));
        }
    });

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otpValue || otpValue.length !== 6) {
            toast.error(t('verify.enter_valid_code'));
            return;
        }

        verifyMutation.mutate(otpValue);
    };

    const handleResend = () => {
        if (countdown > 0) return;
        resendMutation.mutate();
    };

    const getContactDisplay = () => {
        if (verificationType === 'sms') {
            return `+${(location.state as { country?: string })?.country} ${(location.state as { phone?: string })?.phone}`;
        } else {
            return (location.state as { email?: string })?.email;
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-screen overflow-hidden">
            {/* Left side - Logo (hidden on mobile) */}
            <div className="hidden md:block md:col-span-8 bg-white">
                <div className="flex items-center h-screen relative">
                    <div className="h-full w-auto relative -translate-x-20 object-cover">
                        <LogoCutIcon />
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="col-span-1 md:col-span-4 min-h-screen md:min-h-0 flex flex-col justify-between md:justify-between overflow-auto py-4 md:py-0">
                <div className="p-4 md:p-8 pt-0 md:pt-20 flex justify-center md:justify-start flex-col flex-1 bg-[#F9F9FA]">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex flex-col items-center gap-2 w-full">
                            <div className="flex items-center gap-0 mb-1">
                                <Asterisk size={35} color="#252E39" />
                                <Asterisk size={35} color="#252E39" />
                                <Asterisk size={35} color="#252E39" />
                                <Asterisk size={35} color="#252E39" />
                            </div>

                            <h1 className="text-2xl md:text-[28px] font-bold font-helvetica text-[#252E39]">
                                {t('verify.account_verification')}
                            </h1>

                            <p className="text-base font-medium font-helvetica text-center leading-[1.8] text-[#252E39]">
                                {verificationType === 'sms'
                                    ? `${t('verify.code_sent_to_phone')} ${getContactDisplay()}`
                                    : `${t('verify.code_sent_to_email')} ${getContactDisplay()}`
                                }
                            </p>

                            <div>
                                <OTPInput
                                    length={6}
                                    value={otpValue}
                                    onChange={setOtpValue}
                                    disabled={verifyMutation.isPending}
                                    autoFocus={true}
                                />
                            </div>

                            <p className="text-sm md:text-base font-medium font-helvetica text-[#252E39] mt-2">
                                {t('verify.didnt_receive_code')}
                                <button
                                    onClick={handleResend}
                                    disabled={countdown > 0 || resendMutation.isPending}
                                    className={`ml-1 underline font-medium font-helvetica ${countdown > 0
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-[#252E39] cursor-pointer hover:text-[#1a2129]'
                                        }`}
                                >
                                    {countdown > 0
                                        ? `${t('verify.resend_code')} (${countdown}s)`
                                        : t('verify.resend_code')
                                    }
                                </button>
                            </p>

                            <div className="flex flex-col gap-3 w-full mt-4 px-4">
                                <button
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={verifyMutation.isPending || otpValue.length !== 6}
                                    className="w-full bg-[#252E39] text-[#ECF0F5] text-base font-helvetica font-medium py-4 rounded-[10px] hover:bg-[#1a2129] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {verifyMutation.isPending ? t('verify.verifying') : t('verify.continue')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Verify;
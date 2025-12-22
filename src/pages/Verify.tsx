import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';

import axiosInstance from '@/config/axiosConfig';
import OTPInput from '@/components/ui/OTPInput';
import Button from '@/components/ui/Button';
import { LogoIcon, LogoCutIcon } from '@/components/icons';

const Verify = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n, t } = useTranslation();

    const { setUser, setToken } = useAuthStore();

    const [otpValue, setOtpValue] = useState('');
    const [countdown, setCountdown] = useState(0);

    const verificationType = (location.state as { verification?: string })?.verification;
    const isForgot = (location.state as { forgot?: string })?.forgot || false;

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

    const verifyMutation = useMutation({
        mutationFn: async (code: string) => {
            const lang = i18n.language === 'en' ? 'en' : 'es';
            const state = location.state as {
                email?: string;
                currentEmail?: string;
                country?: string;
                phone?: string;
            };

            if (verificationType === 'email') {
                const email = isForgot ? state.currentEmail : state.email;
                return await axiosInstance.post(`/v2/email/validate?lang=${lang}`, {
                    email,
                    code
                });
            } else {
                return await axiosInstance.post(`/v2/sms/validate?lang=${lang}`, {
                    country: state.country,
                    phone: state.phone?.replace(/\s/g, ''),
                    code,
                    isForgot
                });
            }
        },
        onSuccess: (response) => {
            console.log('=== DEBUG VERIFY ===');
            console.log('Full response:', response);
            console.log('response.data:', response.data);
            console.log('verificationType:', verificationType);
            console.log('isForgot:', isForgot);
            console.log('====================');

            const state = location.state as {
                id?: string;
                token?: string;
                email?: string;
                country?: string;
                phone?: string;
            };

            const responseData = response.data;
            const { token, user } = responseData.data || {};

            console.log('Extracted token:', token);
            console.log('Extracted user:', user);

            if (verificationType === 'email') {
                if (isForgot) {
                    forgotChangeMutation.mutate({
                        id: state.id!,
                        token: state.token!,
                        email: state.email!
                    });
                } else {
                    if (token && user) {
                        console.log('Setting token and user, navigating...');
                        setToken(token);
                        setUser(user);
                        navigate({ to: '/manager/klaudia' });
                    } else {
                        console.log('Token or user missing!');
                    }
                }
            } else {
                if (isForgot) {
                    navigate({
                        to: '/forgot-change',
                        state: {
                            id: user.id,
                            token: token,
                            currentEmail: user.email
                        } as any
                    });
                } else {
                    navigate({
                        to: '/register',
                        state: {
                            country: state.country,
                            phone: state.phone,
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
            setOtpValue('');
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
        <div className="min-h-screen overflow-hidden lg:grid lg:grid-cols-12 lg:gap-2">
            <div className="hidden lg:flex lg:col-span-8 bg-white items-center h-screen relative">
                <div className="h-full w-auto relative -translate-x-20">
                    <LogoCutIcon style={{ height: '100%', width: 'auto', objectFit: 'cover' }} />
                </div>
                <div className="absolute bottom-[50px] left-20 z-10">
                    <LogoIcon />
                </div>
            </div>

            <div className="col-span-12 lg:col-span-4 min-h-screen flex items-center justify-center lg:bg-[#F9F9FA] px-4 sm:px-6 md:px-8 py-8">
                <div className="w-full max-w-[500px]">
                    <div className="flex flex-col gap-12 items-center">
                        <div className="lg:hidden">
                            <LogoIcon width={160} height={90} />
                        </div>

                        <div className="flex flex-col gap-10 w-full items-center">

                            <div className="flex flex-col gap-4 w-full">
                                <h1 className="text-[28px] md:text-[30px] text-center font-medium font-n27 text-[#ff336d]">
                                    {t('verify.account_verification')} {verificationType === 'sms' ? t('verify.sms') : t('verify.email')}
                                </h1>

                                <p className="text-[14px] md:text-[16px] text-center font-normal font-helvetica text-[#98AAC0]">
                                    {verificationType === 'sms'
                                        ? `${t('verify.code_sent_to_phone')} ${getContactDisplay()}`
                                        : `${t('verify.code_sent_to_email')} ${getContactDisplay()}`
                                    }
                                </p>
                            </div>

                            <div className="w-full max-w-[365px]">
                                <OTPInput
                                    length={6}
                                    value={otpValue}
                                    onChange={setOtpValue}
                                    disabled={verifyMutation.isPending}
                                    autoFocus={true}
                                />
                            </div>

                            <p className="text-[14px] md:text-[16px] font-medium font-helvetica text-[#98AAC0]">
                                {t('verify.didnt_receive_code')}
                                <button
                                    onClick={handleResend}
                                    disabled={countdown > 0 || resendMutation.isPending}
                                    className={`ml-1 no-underline hover:underline font-medium font-helvetica ${countdown > 0
                                        ? 'text-gray-400 cursor-not-allowed no-underline hover:underline'
                                        : 'text-[#ff336d] cursor-pointer no-underline hover:underline'
                                        }`}
                                >
                                    {countdown > 0
                                        ? `${t('verify.resend_code')} (${countdown}s)`
                                        : t('verify.resend_code')
                                    }
                                </button>
                            </p>

                            <div className="flex flex-col gap-3 w-full">
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleVerify}
                                    disabled={otpValue.length !== 6}
                                    isLoading={verifyMutation.isPending}
                                >
                                    {t('verify.continue')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Verify;
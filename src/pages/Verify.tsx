import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import { Route } from '@/routes/verify';

import axiosInstance from '@/config/axiosConfig';
import OTPInput from '@/components/ui/OTPInput';
import Button from '@/components/ui/Button';
import { LogoIcon, LogoCutIcon } from '@/components/icons';

const Verify = () => {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();
    const searchParams = Route.useSearch();

    const { setUser, setToken } = useAuthStore();

    const [otpValue, setOtpValue] = useState('');
    const [countdown, setCountdown] = useState(0);

    const verification = searchParams.verification || '';
    const email = searchParams.email || '';
    const country = searchParams.country || '';
    const phone = searchParams.phone || '';
    const oauthEmail = searchParams.oauthEmail || '';
    const oauthProvider = searchParams.oauthProvider || '';
    const oauthFirstName = searchParams.oauthFirstName || '';
    const oauthLastName = searchParams.oauthLastName || '';
    const currentEmail = searchParams.currentEmail || '';
    const userId = searchParams.userId || '';
    const stateToken = searchParams.token || '';

    const isForgot = searchParams.isForgot === 'true';
    const verificationType = verification;

    const forgotChangeMutation = useMutation({
        mutationFn: async (data: { id: string; token: string; email: string }) => {
            const response = await axiosInstance.post('/v2/auth/forgot-change',
                { email: data.email },
                { headers: { 'Authorization': `Bearer ${data.token}` } }
            );
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success' && response.data?.user) {
                setToken(stateToken);
                setUser(response.data.user);
                toast.success(t('verify.verification_success'));
                navigate({ to: '/' });
            }
        },
        onError: (error: { backendError?: { message: string } }) => {
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

            if (verificationType === 'email') {
                const emailToValidate = isForgot ? currentEmail : email;
                return await axiosInstance.post(`/v2/email/validate?lang=${lang}`, { 
                    email: emailToValidate, 
                    code 
                });
            } else {
                return await axiosInstance.post(`/v2/sms/validate?lang=${lang}`, {
                    country,
                    phone: phone?.replace(/\s/g, ''),
                    code,
                    isForgot
                });
            }
        },
        onSuccess: (response) => {
            const { token: responseToken, user } = response.data.data || {};

            if (verificationType === 'email') {
                if (isForgot) {
                    forgotChangeMutation.mutate({
                        id: userId,
                        token: stateToken,
                        email: email
                    });
                } else if (responseToken && user) {
                    setToken(responseToken);
                    setUser(user);
                    setTimeout(() => {
                        navigate({ to: '/' });
                    }, 100);
                }
            } else {
                if (isForgot && user) {
                    navigate({
                        to: '/forgot-change',
                        search: {
                            id: user.id,
                            token: responseToken,
                            currentEmail: user.email
                        }
                    });
                } else {
                    navigate({
                        to: '/register',
                        search: {
                            country: country,
                            phone: phone,
                            oauthEmail: oauthEmail,
                            oauthProvider: oauthProvider,
                            oauthFirstName: oauthFirstName,
                            oauthLastName: oauthLastName,
                        }
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
                    email
                });
            } else {
                return await axiosInstance.post(`/v2/sms/resend?lang=${lang}`, {
                    country,
                    phone: phone?.replace(/\s/g, ''),
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

    const handleVerify = (e: React.FormEvent) => {
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
            return `+${country} ${phone}`;
        }
        return email;
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
            <div className="hidden lg:flex lg:col-span-8 bg-black items-center h-screen relative">
                <div className="h-full w-auto relative -translate-x-20">
                    <LogoCutIcon style={{ height: '100%', width: 'auto', objectFit: 'cover' }} />
                </div>
                <div className="absolute bottom-[50px] left-20 z-10">
                    <LogoIcon />
                </div>
            </div>

            <div className="col-span-12 lg:col-span-4 min-h-screen flex items-center justify-center lg:bg-[#050505] px-4 sm:px-6 md:px-8 py-8">
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

                                <p className="text-[14px] md:text-[16px] text-center font-normal font-helvetica text-[#F6F6F6]">
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

                            {countdown > 0 ? (
                                <p className="text-[14px] md:text-[16px] font-medium font-helvetica text-[#F6F6F6]">
                                    {t('verify.can_request_new_code')} {countdown}s
                                </p>
                            ) : (
                                <p className="text-[14px] md:text-[16px] font-medium font-helvetica text-[#F6F6F6]">
                                    {t('verify.didnt_receive_code')}
                                    <button
                                        onClick={handleResend}
                                        disabled={resendMutation.isPending}
                                        className="ml-1 text-[#ff336d] cursor-pointer no-underline hover:underline font-medium font-helvetica"
                                    >
                                        {t('verify.resend_code')}
                                    </button>
                                </p>
                            )}

                            <div className="flex flex-col gap-3 w-full">
                                <Button
                                    type="button"
                                    variant="cta"
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
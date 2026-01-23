import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Route } from '@/routes/verify';
import { useAuthStore } from '@/stores/authStore';

import axiosInstance from '@/config/axiosConfig';
import OTPInput from '@/components/ui/OTPInput';
import Button from '@/components/ui/Button';
import { LogoIcon } from '@/components/icons';

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: Record<string, unknown>;
    message: string;
    details: string;
}

const cleanQuotes = (value: string | undefined): string => {
    if (!value) return '';
    return value.replace(/^["']|["']$/g, '');
};

const Verify = () => {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();
    const searchParams = Route.useSearch();
    const { setToken, setUser } = useAuthStore();

    const verificationType = cleanQuotes(searchParams?.verification) || '';
    const isForgot = searchParams?.isForgot === 'true';

    const email = cleanQuotes(searchParams?.email) || '';
    const country = cleanQuotes(searchParams?.country) || '';
    const phone = cleanQuotes(searchParams?.phone) || '';
    const oauthEmail = cleanQuotes(searchParams?.oauthEmail) || '';
    const oauthProvider = cleanQuotes(searchParams?.oauthProvider) || '';
    const oauthFirstName = cleanQuotes(searchParams?.oauthFirstName) || '';
    const oauthLastName = cleanQuotes(searchParams?.oauthLastName) || '';

    const [otpValue, setOtpValue] = useState('');
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (!verificationType) {
            navigate({ to: '/auth' });
            return;
        }

        if (verificationType === 'sms' && (!country || !phone)) {
            navigate({ to: '/auth' });
        }

        if (verificationType === 'email' && !email) {
            navigate({ to: '/auth' });
        }
    }, [verificationType, country, phone, email, navigate]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const verifyMutation = useMutation({
        mutationFn: async (code: string) => {
            const lang = i18n.language === 'en' ? 'en' : 'es';

            if (verificationType === 'email') {
                const response = await axiosInstance.post<BackendResponse>(`/v2/email/validate?lang=${lang}`, {
                    email,
                    code
                });
                return response.data;
            } else {
                const response = await axiosInstance.post<BackendResponse>(`/v2/sms/validate?lang=${lang}`, {
                    country,
                    phone: phone.replace(/\s/g, ''),
                    code,
                    isForgot
                });
                return response.data;
            }
        },
        onSuccess: (response) => {
            if (response.status !== 'success') {
                toast.error(response.message || response.details);
                return;
            }

            const { token, user } = response.data as { token?: string; user?: { id: string; email?: string } };

            if (verificationType === 'email') {
                if (token && user) {
                    setToken(token);
                    setUser(user);
                }
                navigate({ to: '/' });
            } else {
                if (isForgot && user && token) {
                    navigate({
                        to: '/forgot-change',
                        search: {
                            id: user.id,
                            token: token,
                            currentEmail: user.email || ''
                        }
                    });
                } else {
                    navigate({
                        to: '/register',
                        search: {
                            country,
                            phone,
                            oauthEmail,
                            oauthProvider,
                            oauthFirstName,
                            oauthLastName
                        }
                    });
                }
            }
        },
        onError: () => {
            toast.error(t('verify.error_generic'));
        }
    });

    const resendMutation = useMutation({
        mutationFn: async () => {
            const lang = i18n.language === 'en' ? 'en' : 'es';

            if (verificationType === 'email') {
                const response = await axiosInstance.post<BackendResponse>(`/v2/email/resend?lang=${lang}`, { email });
                return response.data;
            } else {
                const response = await axiosInstance.post<BackendResponse>(`/v2/sms/resend?lang=${lang}`, {
                    country,
                    phone: phone.replace(/\s/g, '')
                });
                return response.data;
            }
        },
        onSuccess: () => {
            setOtpValue('');
            setCountdown(30);
        },
        onError: () => {
            toast.error(t('verify.error_resend'));
        }
    });

    const handleVerify = useCallback((code: string) => {
        if (!code || code.length !== 6) {
            toast.error(t('verify.enter_valid_code'));
            return;
        }
        verifyMutation.mutate(code);
    }, [verifyMutation, t]);

    const handleOtpComplete = useCallback((code: string) => {
        if (verifyMutation.isPending) return;
        handleVerify(code);
    }, [verifyMutation.isPending, handleVerify]);

    const handleButtonClick = (e: React.FormEvent) => {
        e.preventDefault();
        handleVerify(otpValue);
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

    return (
        <div className="w-full flex-1 relative flex flex-col lg:flex-row items-center lg:items-stretch p-4 lg:p-[42px]">
            <div 
                className="absolute inset-0 bg-[#050505] -z-20"
                aria-hidden="true"
            />
            <div 
                className="absolute inset-0 -z-10 opacity-75"
                style={{
                    backgroundImage: 'url(https://klubit.fra1.cdn.digitaloceanspaces.com/background-auth.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
                aria-hidden="true"
            />
            <div 
                className="absolute inset-0 -z-[5] bg-gradient-to-t lg:bg-gradient-to-r from-[#050505] lg:from-[rgba(5,5,5,0.75)] from-[35%] lg:from-0% to-[rgba(5,5,5,0.5)] lg:to-[rgba(5,5,5,0.38)]"
                aria-hidden="true"
            />

            <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative">
                <div className="absolute top-0 left-0">
                    <LogoIcon width={149} height={42} />
                </div>

                <div className="flex flex-col gap-4 items-center text-center w-full max-w-[600px] px-8" style={{ textShadow: '0px 0px 12px rgba(0, 0, 0, 0.5)' }}>
                    <p className="text-[32px] font-medium font-helvetica text-[#939393] leading-none">
                        {t('login.welcome')}
                    </p>
                    <h1 className="text-[64px] font-semibold font-borna text-[#F6F6F6] leading-none">
                        {t('login.hero_title')}
                    </h1>
                </div>
            </div>

            <div className="lg:hidden w-full flex flex-col items-center flex-1 justify-center">
                <div className="flex flex-col items-center w-full max-w-[390px] gap-12">
                    <LogoIcon width={149} height={42} />
                    
                    <div className="flex flex-col gap-8 w-full items-center">
                        <div className="flex flex-col gap-2 items-center text-center w-full" style={{ textShadow: '0px 0px 30px black' }}>
                            <h2 className="text-[24px] font-semibold font-borna text-[#F6F6F6] leading-tight">
                                {t('verify.account_verification')}
                                {verificationType === 'sms' ? t('verify.sms') : t('verify.email')}
                            </h2>
                            <div className="flex flex-col items-center">
                                <p className="text-[16px] font-medium font-helvetica text-[#939393] leading-normal">
                                    {verificationType === 'sms'
                                        ? t('verify.code_sent_to_phone')
                                        : t('verify.code_sent_to_email')}
                                </p>
                                <p className="text-[16px] font-medium font-helvetica text-[#ff336d] leading-normal">
                                    {getContactDisplay()}
                                </p>
                            </div>
                        </div>

                        <div className="w-full">
                            <OTPInput
                                length={6}
                                value={otpValue}
                                onChange={setOtpValue}
                                onComplete={handleOtpComplete}
                                disabled={verifyMutation.isPending}
                                autoFocus={true}
                            />
                        </div>

                        {countdown > 0 ? (
                            <p className="text-[14px] font-medium font-helvetica text-[#939393]">
                                {t('verify.can_request_new_code')} {countdown}s
                            </p>
                        ) : (
                            <p className="text-[14px] font-medium font-helvetica text-[#939393]">
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

                        <div className="flex flex-col gap-2 w-full">
                            <Button
                                type="button"
                                variant="cta"
                                onClick={handleButtonClick}
                                disabled={otpValue.length !== 6}
                                isLoading={verifyMutation.isPending}
                            >
                                {t('verify.continue')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex w-[600px] shrink-0 flex-col items-center justify-center">
                <div className="w-full h-full bg-[#141414] border-[2.5px] border-[#232323] rounded-[24px] shadow-[0px_0px_30px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center px-[90px] py-[72px] gap-[42px]">
                    <div className="flex flex-col gap-4 items-center text-center w-full" style={{ textShadow: '0px 0px 30px black' }}>
                        <h2 className="text-[32px] font-semibold font-borna text-[#F6F6F6] leading-tight">
                            {t('verify.account_verification')}
                            {verificationType === 'sms' ? t('verify.sms') : t('verify.email')}
                        </h2>
                        <div className="flex flex-col items-center">
                            <p className="text-[16px] font-medium font-helvetica text-[#939393] leading-normal">
                                {verificationType === 'sms'
                                    ? t('verify.code_sent_to_phone')
                                    : t('verify.code_sent_to_email')}
                            </p>
                            <p className="text-[16px] font-medium font-helvetica text-[#ff336d] leading-normal">
                                {getContactDisplay()}
                            </p>
                        </div>
                    </div>

                    <div className="w-full">
                        <OTPInput
                            length={6}
                            value={otpValue}
                            onChange={setOtpValue}
                            onComplete={handleOtpComplete}
                            disabled={verifyMutation.isPending}
                            autoFocus={true}
                        />
                    </div>

                    {countdown > 0 ? (
                        <p className="text-[16px] font-medium font-helvetica text-[#939393]">
                            {t('verify.can_request_new_code')} {countdown}s
                        </p>
                    ) : (
                        <p className="text-[16px] font-medium font-helvetica text-[#939393]">
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
                            onClick={handleButtonClick}
                            disabled={otpValue.length !== 6}
                            isLoading={verifyMutation.isPending}
                        >
                            {t('verify.continue')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Verify;
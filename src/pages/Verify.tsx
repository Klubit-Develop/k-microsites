import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Route } from '@/routes/verify';

import { LogoIcon, LogoCutIcon } from '@/components/icons';
import OTPInput from '@/components/ui/OTPInput';
import Button from '@/components/ui/Button';
import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: Record<string, unknown>;
    message: string;
    details: string;
}

const VerifyPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const searchParams = Route.useSearch();
    const { setAuth } = useAuthStore();

    const {
        verification,
        country,
        phone,
        email,
        isForgot,
        oauthEmail,
        oauthProvider,
        oauthFirstName,
        oauthLastName
    } = searchParams;

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (!verification) {
            navigate({ to: '/auth' });
            return;
        }
        
        if (verification === 'sms' && (!country || !phone)) {
            navigate({ to: '/auth' });
        }
        
        if (verification === 'email' && !email) {
            navigate({ to: '/auth' });
        }
    }, [verification, country, phone, email, navigate]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const validateSMSMutation = useMutation({
        mutationFn: async (data: { country: string; phone: string; code: string; isForgot?: boolean }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/sms/validate', data);
            return response.data;
        },
        onSuccess: (response: BackendResponse) => {
            if (response.status === 'success') {
                toast.success(t('verify.verification_success'));
                
                if (isForgot === 'true') {
                    const responseData = response.data as { 
                        token?: string; 
                        id?: string; 
                        currentEmail?: string;
                    };
                    navigate({
                        to: '/forgot-change',
                        search: {
                            id: responseData?.id || '',
                            token: responseData?.token || '',
                            currentEmail: responseData?.currentEmail || ''
                        }
                    });
                } else if (oauthProvider) {
                    navigate({
                        to: '/register',
                        search: {
                            country: country || '',
                            phone: phone || '',
                            oauthEmail: oauthEmail || '',
                            oauthProvider: oauthProvider || '',
                            oauthFirstName: oauthFirstName || '',
                            oauthLastName: oauthLastName || ''
                        }
                    });
                } else {
                    navigate({
                        to: '/register',
                        search: {
                            country: country || '',
                            phone: phone || ''
                        }
                    });
                }
            } else {
                setError(response.message || response.details);
            }
        },
        onError: (error: { backendError?: { message: string } }) => {
            if (error.backendError) {
                setError(error.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const validateEmailMutation = useMutation({
        mutationFn: async (data: { email: string; code: string; isForgot?: boolean }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/email/validate', data);
            return response.data;
        },
        onSuccess: (response: BackendResponse) => {
            if (response.status === 'success') {
                toast.success(t('verify.verification_success'));
                
                const responseData = response.data as { token?: string; user?: any };
                
                if (responseData?.token && responseData?.user) {
                    setAuth(responseData.token, responseData.user);
                }
                
                navigate({ to: '/' });
            } else {
                setError(response.message || response.details);
            }
        },
        onError: (error: { backendError?: { message: string } }) => {
            if (error.backendError) {
                setError(error.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const resendSMSMutation = useMutation({
        mutationFn: async (data: { country: string; phone: string }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/sms/resend', data);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success') {
                toast.success(t('verify.code_resent'));
                setCountdown(60);
                setCanResend(false);
                setOtp('');
                setError('');
            } else {
                toast.error(response.message || response.details);
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

    const resendEmailMutation = useMutation({
        mutationFn: async (data: { email: string; currentEmail?: string }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/email/resend', data);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success') {
                toast.success(t('verify.code_resent'));
                setCountdown(60);
                setCanResend(false);
                setOtp('');
                setError('');
            } else {
                toast.error(response.message || response.details);
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

    const handleOTPComplete = (code: string) => {
        setOtp(code);
        setError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            setError(t('verify.code_required'));
            return;
        }

        if (verification === 'sms') {
            validateSMSMutation.mutate({
                country: country || '',
                phone: phone || '',
                code: otp,
                ...(isForgot === 'true' && { isForgot: true })
            });
        } else if (verification === 'email') {
            validateEmailMutation.mutate({
                email: email || '',
                code: otp,
                ...(isForgot === 'true' && { isForgot: true })
            });
        }
    };

    const handleResend = () => {
        if (!canResend) return;

        if (verification === 'sms') {
            resendSMSMutation.mutate({
                country: country || '',
                phone: phone || ''
            });
        } else if (verification === 'email') {
            resendEmailMutation.mutate({
                email: email || '',
                ...(isForgot === 'true' && { currentEmail: email })
            });
        }
    };

    const getVerificationTarget = () => {
        if (verification === 'sms') {
            return `+${country} ${phone}`;
        }
        return email || '';
    };

    const isLoading = validateSMSMutation.isPending || validateEmailMutation.isPending;
    const isResending = resendSMSMutation.isPending || resendEmailMutation.isPending;

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

            <div className="col-span-12 lg:col-span-4 min-h-screen flex items-center justify-center bg-[#050505] px-4 sm:px-6 md:px-8 py-8">
                <div className="w-full max-w-[500px]">
                    <div className="flex flex-col gap-8 items-center text-center">
                        <div className="lg:hidden">
                            <LogoIcon width={160} height={90} />
                        </div>

                        <div className="flex flex-col gap-4 w-full">
                            <h1 className="text-[28px] md:text-[30px] font-medium font-n27 text-center text-[#ff336d]">
                                {t('verify.title')}
                            </h1>

                            <p className="text-[14px] md:text-[16px] font-normal font-helvetica text-center text-[#F6F6F6]">
                                {verification === 'sms'
                                    ? t('verify.subtitle_sms', { phone: getVerificationTarget() })
                                    : t('verify.subtitle_email', { email: getVerificationTarget() })
                                }
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="flex flex-col gap-6">
                                    <OTPInput
                                        length={6}
                                        value={otp}
                                        onChange={handleOTPComplete}
                                        error={error}
                                        disabled={isLoading}
                                    />

                                    <Button
                                        type="submit"
                                        variant="cta"
                                        disabled={isLoading || otp.length !== 6}
                                        isLoading={isLoading}
                                    >
                                        {t('verify.verify')}
                                    </Button>
                                </div>
                            </form>

                            <div className="flex flex-col gap-4 items-center">
                                <p className="text-[14px] font-helvetica text-[#F6F6F6]">
                                    {t('verify.didnt_receive')}
                                </p>

                                {canResend ? (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={isResending}
                                        className="text-[#ff336d] font-medium hover:underline disabled:opacity-50"
                                    >
                                        {isResending ? t('verify.resending') : t('verify.resend')}
                                    </button>
                                ) : (
                                    <p className="text-[14px] font-helvetica text-[#888888]">
                                        {t('verify.resend_in', { seconds: countdown })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyPage;
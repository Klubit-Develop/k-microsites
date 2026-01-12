import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';

import { LogoIcon, LogoCutIcon, GoogleIcon, AppleIcon } from '@/components/icons';
import InputTextPhone from '@/components/ui/InputTextPhone';
import Button from '@/components/ui/Button';
import axiosInstance from '@/config/axiosConfig';
import { countries } from '@/utils/countries';

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: Record<string, unknown>;
    message: string;
    details: string;
}

interface PendingNavigation {
    type: 'email' | 'sms';
    email?: string;
    country: string;
    phone: string;
}

const Auth = () => {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();

    const [country, setCountry] = useState('34');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

    const sendEmailMutation = useMutation({
        mutationFn: async (data: { email: string }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/email/send', data);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success') {
                if (pendingNavigation?.type === 'email') {
                    navigate({
                        to: '/verify',
                        search: {
                            verification: 'email',
                            email: pendingNavigation.email || '',
                            country: pendingNavigation.country,
                            phone: pendingNavigation.phone
                        }
                    });
                }
            } else {
                toast.error(response.message || response.details);
            }
            setPendingNavigation(null);
        },
        onError: (error: { backendError?: { message: string } }) => {
            setPendingNavigation(null);
            if (error.backendError) {
                toast.error(error.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const sendSMSMutation = useMutation({
        mutationFn: async (data: { country: string; phone: string }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/sms/send', data);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success') {
                if (pendingNavigation?.type === 'sms') {
                    navigate({
                        to: '/verify',
                        search: {
                            verification: 'sms',
                            country: pendingNavigation.country,
                            phone: pendingNavigation.phone
                        }
                    });
                }
            } else {
                toast.error(response.message || response.details);
            }
            setPendingNavigation(null);
        },
        onError: (error: { backendError?: { message: string } }) => {
            setPendingNavigation(null);
            if (error.backendError) {
                toast.error(error.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const loginMutation = useMutation({
        mutationFn: async (data: { country: string; phone: string }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/auth/verify', data);
            return response.data;
        },
        onSuccess: (response: BackendResponse) => {
            if (response.status === 'success') {
                const responseData = response.data as { exists?: boolean; email?: string };
                
                if (responseData?.exists) {
                    setPendingNavigation({
                        type: 'email',
                        email: responseData.email || '',
                        country,
                        phone
                    });
                    sendEmailMutation.mutate({
                        email: responseData.email || '',
                    });
                } else {
                    setPendingNavigation({
                        type: 'sms',
                        country,
                        phone
                    });
                    sendSMSMutation.mutate({
                        country,
                        phone: phone.replace(/\s/g, '')
                    });
                }
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

    const formatPhone = (value: string, pattern: number[] = [3, 3, 3]) => {
        const digits = value.replace(/\D/g, '');
        let result = '';
        let index = 0;

        for (let i = 0; i < pattern.length && index < digits.length; i++) {
            const segment = digits.slice(index, index + pattern[i]);
            result += segment;
            index += pattern[i];
            if (index < digits.length) result += ' ';
        }

        return result;
    };

    const handlePhoneChange = (value: string) => {
        const selectedCountry = countries.find((c) => c.phone === country);
        const maxLength = selectedCountry?.phoneLength || 9;
        const pattern = selectedCountry?.phoneFormat || [3, 3, 3];

        const numericValue = value.replace(/\D/g, '');
        const limitedValue = numericValue.slice(0, maxLength);
        const formattedValue = formatPhone(limitedValue, pattern);

        setPhone(formattedValue);
        setError('');
    };

    const handleCountryChange = (newCountry: string) => {
        setCountry(newCountry);
        setPhone('');
        setError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedCountry = countries.find((c: { phone: string; }) => c.phone === country);
        const expectedLength = selectedCountry?.phoneLength || 9;
        const phoneDigits = phone.replace(/\D/g, '');

        if (!phoneDigits) {
            setError(t('login.phone_required'));
            return;
        }

        if (phoneDigits.length !== expectedLength) {
            setError(t('login.phone_invalid_length', { length: expectedLength }));
            return;
        }

        loginMutation.mutate({
            country,
            phone: phoneDigits
        });
    };

    const initiateGoogleLogin = () => {
        const currentOrigin = window.location.origin;
        window.location.href = `${import.meta.env.VITE_API_URL || 'https://api.klubit.io'}/v2/oauth/google/microsites?origin=${encodeURIComponent(currentOrigin)}`;
    };

    const initiateAppleLogin = () => {
        const currentOrigin = window.location.origin;
        window.location.href = `${import.meta.env.VITE_API_URL || 'https://api.klubit.io'}/v2/oauth/apple/microsites?origin=${encodeURIComponent(currentOrigin)}`;
    };

    const isLoading = loginMutation.isPending || sendEmailMutation.isPending || sendSMSMutation.isPending;

    return (
        <div className="min-h-screen overflow-hidden lg:grid lg:grid-cols-12 lg:gap-2">
            <div className="hidden lg:flex lg:col-span-8 bg-black items-center h-full relative">
                <div className="h-full w-auto relative -translate-x-20">
                    <LogoCutIcon style={{ height: '100%', width: 'auto', objectFit: 'cover' }} />
                </div>
                <div className="absolute bottom-[50px] left-7 z-10">
                    <LogoIcon />
                </div>
            </div>

            <div className="col-span-12 lg:col-span-4 min-h-screen flex items-center justify-center bg-[#050505] px-6 sm:px-8 py-8">
                <div className="w-full max-w-[400px] lg:max-w-[500px]">
                    <div className="flex flex-col gap-8 items-center">
                        <div className="lg:hidden">
                            <LogoIcon width={140} height={80} />
                        </div>

                        <div className="flex flex-col gap-3 w-full">
                            <h1 className="text-[24px] sm:text-[26px] md:text-[28px] font-medium font-n27 text-center text-[#ff336d]">
                                {t('login.title')}
                            </h1>
                        </div>

                        <div className="flex flex-col gap-5 w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="flex flex-col gap-5">
                                    <InputTextPhone
                                        label={`${t('login.phone')}*`}
                                        placeholder={t('login.phone')}
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        error={error}
                                        country={country}
                                        onCountryChange={handleCountryChange}
                                        countries={countries}
                                        language={i18n.language as 'es' | 'en'}
                                        disabled={isLoading}
                                    />

                                    <Button
                                        type="submit"
                                        variant="cta"
                                        disabled={isLoading}
                                        isLoading={isLoading}
                                    >
                                        {t('login.continue')}
                                    </Button>
                                </div>
                            </form>

                            <div className="flex items-center justify-center">
                                <div className="border-t border-[#232323] w-full max-w-[100px]" />
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={initiateGoogleLogin}
                                    icon={<GoogleIcon />}
                                    disabled={isLoading}
                                >
                                    {t('login.continueWithGoogle')}
                                </Button>

                                <Button
                                    onClick={initiateAppleLogin}
                                    icon={<AppleIcon />}
                                    disabled={isLoading}
                                >
                                    {t('login.continueWithApple')}
                                </Button>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-center text-center">
                                    <span className="text-[14px] font-helvetica font-normal text-[#F6F6F6]">
                                        {t('login.cantAccess')}
                                        <Link
                                            to="/forgot"
                                            className="pl-1.5 text-[#ff336d] no-underline font-medium hover:underline cursor-pointer"
                                        >
                                            {t('login.forgot_password')}
                                        </Link>
                                    </span>
                                </div>

                                <div className="flex items-center justify-center text-center mt-4">
                                    <p className="text-[12px] sm:text-[13px] font-helvetica font-normal text-[#F6F6F6]">
                                        {t('login.termsText')}{' '}
                                        <Link
                                            to="/terms-and-conditions"
                                            className="font-semibold text-[#F6F6F6] underline hover:text-[#98AAC0] transition-colors cursor-pointer"
                                        >
                                            {t('login.termsLink')}
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
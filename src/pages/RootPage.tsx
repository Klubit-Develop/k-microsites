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
    data: Record<string, any>;
    message: string;
    details: string;
}

const RootPage = () => {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();

    const [country, setCountry] = useState('34');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

    const sendEmailMutation = useMutation({
        mutationFn: async (data: { email: string }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/email/send', data);
            return response.data;
        },
        onError: (error: any) => {
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
        onError: (error: any) => {
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
                if (response.data?.exists) {
                    sendEmailMutation.mutate({
                        email: response.data.email,
                    });

                    navigate({
                        to: '/verify',
                        state: {
                            verification: 'email',
                            email: response.data.email,
                            country,
                            phone
                        } as any
                    });
                } else {
                    sendSMSMutation.mutate({
                        country,
                        phone: phone.replace(/\s/g, '')
                    });

                    navigate({
                        to: '/verify',
                        state: {
                            verification: 'sms',
                            country,
                            phone,
                        } as any
                    });
                }
            } else {
                toast.error(response.message || response.details);
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

    // Footer height: pt-6(24) + pb-8(32) + gap-6(24) + row1(~20) + border(2) + row2-pt(24) + row2-content(48) + border-top(2) = ~176px
    return (
        <div className="h-[calc(100vh-176px)] lg:grid lg:grid-cols-12 lg:gap-2">
            {/* Left Section - Logo */}
            <div className="hidden lg:flex lg:col-span-8 bg-black items-center h-full relative">
                <div className="h-full w-auto relative -translate-x-20">
                    <LogoCutIcon style={{ height: '100%', width: 'auto', objectFit: 'cover' }} />
                </div>
                <div className="absolute bottom-[50px] left-20 z-10">
                    <LogoIcon />
                </div>
            </div>

            {/* Right Section - Form */}
            <div className="col-span-12 lg:col-span-4 h-full flex items-center justify-center bg-[#050505] px-4 sm:px-6 md:px-8">
                <div className="w-full max-w-[500px]">
                    <div className="flex flex-col gap-8 items-center text-center lg:text-left">
                        <div className="lg:hidden">
                            <LogoIcon width={140} height={80} />
                        </div>

                        <div className="flex flex-col gap-3 w-full">
                            <h1 className="text-[26px] md:text-[28px] font-medium font-n27 text-center text-[#ff336d]">
                                {t('login.title')}
                            </h1>
                        </div>

                        <div className="flex flex-col gap-5 w-full">
                            <div className="flex flex-col gap-5">
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
                                            disabled={loginMutation.isPending}
                                        />

                                        <Button
                                            type="submit"
                                            variant="cta"
                                            disabled={loginMutation.isPending}
                                            isLoading={loginMutation.isPending}
                                        >
                                            {t('login.continue')}
                                        </Button>
                                    </div>
                                </form>

                                <div className="flex items-center justify-center">
                                    <div className="border-t border-[#00000029] w-full max-w-[100px]" />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={initiateGoogleLogin}
                                        icon={<GoogleIcon />}
                                    >
                                        {t('login.continueWithGoogle')}
                                    </Button>

                                    <Button
                                        onClick={initiateAppleLogin}
                                        icon={<AppleIcon />}
                                    >
                                        {t('login.continueWithApple')}
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-center">
                                        <span className="text-[14px] md:text-[15px] font-helvetica font-normal text-[#F6F6F6]">
                                            {t('login.cantAccess')}
                                            <Link
                                                to="/forgot"
                                                className="pl-1.5 text-[#ff336d] no-underline font-medium hover:underline cursor-pointer"
                                            >
                                                {t('login.forgot_password')}
                                            </Link>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-center flex-col sm:flex-row gap-1">
                                        <p className="text-[13px] font-helvetica font-normal text-[#F6F6F6]">
                                            {t('login.termsText')}
                                        </p>
                                        <Link
                                            to="/"
                                            className="text-[13px] font-helvetica font-semibold text-[#F6F6F6] underline hover:text-[#98AAC0] transition-colors cursor-pointer"
                                        >
                                            {t('login.termsLink')}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RootPage;
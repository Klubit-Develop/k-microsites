import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Route } from '@/routes/oauth';

import { LogoIcon, LogoCutIcon } from '@/components/icons';
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

const Oauth = () => {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();
    const searchParams = Route.useSearch();

    const { email: oauthEmail, provider, firstName, lastName } = searchParams;

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
                const responseData = response.data as { exists?: boolean; email?: string };
                
                if (responseData?.exists) {
                    sendEmailMutation.mutate({
                        email: responseData.email || '',
                    });

                    navigate({
                        to: '/verify',
                        search: {
                            verification: 'email',
                            email: responseData.email || '',
                            country,
                            phone
                        }
                    });
                } else {
                    sendSMSMutation.mutate({
                        country,
                        phone: phone.replace(/\s/g, '')
                    });

                    navigate({
                        to: '/verify',
                        search: {
                            verification: 'sms',
                            country,
                            phone,
                            oauthEmail,
                            oauthProvider: provider,
                            oauthFirstName: firstName,
                            oauthLastName: lastName,
                        }
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
            setError(t('oauth.phone_required'));
            return;
        }

        if (phoneDigits.length !== expectedLength) {
            setError(t('oauth.phone_invalid_length', { length: expectedLength }));
            return;
        }

        loginMutation.mutate({
            country,
            phone: phoneDigits
        });
    };

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
                    <div className="flex flex-col gap-12 items-center text-center lg:text-left">
                        <div className="lg:hidden">
                            <LogoIcon width={160} height={90} />
                        </div>

                        <div className="flex flex-col gap-4 w-full">
                            <h1 className="text-[28px] md:text-[30px] font-medium font-n27 text-center text-[#ff336d]">
                                {t('oauth.title')}
                            </h1>
                        </div>

                        <div className="flex flex-col gap-6 w-full">
                            <div className="flex flex-col gap-6">
                                <div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="flex flex-col gap-6">
                                            {/* Input Phone Component */}
                                            <InputTextPhone
                                                label={`${t('oauth.phone')}*`}
                                                placeholder={t('oauth.phone')}
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
                                                {t('oauth.continue')}
                                            </Button>
                                        </div>
                                    </form>
                                </div>

                                <div className="flex items-center justify-center">
                                    <div className="border-t border-[#00000029] w-full max-w-[100px]" />
                                </div>

                                <div className="flex flex-col gap-4 mt-2">
                                    <div className="flex items-center justify-center">
                                        <span className="text-[15px] md:text-[16px] font-helvetica font-normal text-[#F6F6F6]">
                                            {t('oauth.cantAccess')}
                                            <Link
                                                to="/forgot"
                                                className="pl-1.5 text-[#ff336d] no-underline font-medium hover:underline cursor-pointer"
                                            >
                                                {t('oauth.forgot_password')}
                                            </Link>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-center flex-col sm:flex-row gap-1">
                                        <p className="text-[14px] font-helvetica font-normal text-[#F6F6F6]">
                                            {t('oauth.termsText')}
                                        </p>
                                        <Link
                                            to="/"
                                            className="text-[14px] font-helvetica font-semibold text-[#F6F6F6] underline hover:text-[#252E39] transition-colors cursor-pointer"
                                        >
                                            {t('oauth.termsLink')}
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

export default Oauth;
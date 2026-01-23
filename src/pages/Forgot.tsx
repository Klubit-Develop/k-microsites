import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';

import { LogoIcon } from '@/components/icons';
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
    country: string;
    phone: string;
}

const ForgotPage = () => {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();

    const [country, setCountry] = useState('34');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

    const sendSMSMutation = useMutation({
        mutationFn: async (data: { country: string; phone: string }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/sms/send', data);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success') {
                if (pendingNavigation) {
                    navigate({
                        to: '/verify',
                        search: {
                            verification: 'sms',
                            isForgot: 'true',
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
                        country,
                        phone
                    });
                    
                    sendSMSMutation.mutate({
                        country,
                        phone: phone.replace(/\s/g, '')
                    });
                } else {
                    navigate({ to: '/incident' });
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
            setError(t('forgot.phone_required'));
            return;
        }

        if (phoneDigits.length !== expectedLength) {
            setError(t('forgot.phone_invalid_length', { length: expectedLength }));
            return;
        }

        loginMutation.mutate({
            country,
            phone: phoneDigits
        });
    };

    const isLoading = loginMutation.isPending || sendSMSMutation.isPending;

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
                <Link to="/" className="absolute top-0 left-0">
                    <LogoIcon width={149} height={42} />
                </Link>

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
                    
                    <div className="flex flex-col gap-8 w-full">
                        <div className="flex flex-col gap-2 items-center text-center w-full" style={{ textShadow: '0px 0px 30px black' }}>
                            <h2 className="text-[24px] font-semibold font-borna text-[#F6F6F6] leading-tight">
                                {t('forgot.title')}
                            </h2>
                            <p className="text-[16px] font-medium font-helvetica text-[#939393] leading-normal">
                                {t('forgot.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-8 w-full">
                            <div className="flex flex-col gap-2 w-full">
                                <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
                                    <InputTextPhone
                                        label={`${t('forgot.phone')}*`}
                                        placeholder={t('forgot.phone')}
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
                                        {t('forgot.continue')}
                                    </Button>
                                </form>
                            </div>

                            <div className="flex flex-col items-center justify-center text-center gap-1">
                                <span className="text-[14px] font-helvetica font-normal text-[#F6F6F6]">
                                    {t('forgot.incidents')}
                                </span>
                                <Link
                                    to="/incident"
                                    className="text-[#ff336d] no-underline font-medium hover:underline cursor-pointer text-[14px] font-helvetica"
                                >
                                    {t('forgot.incidentsLink')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex w-[600px] shrink-0 flex-col items-center justify-center">
                <div className="w-full h-full bg-[#141414] border-[2.5px] border-[#232323] rounded-[24px] shadow-[0px_0px_30px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center px-[90px] py-[72px] gap-[42px]">
                    <div className="flex flex-col gap-4 items-center text-center w-full" style={{ textShadow: '0px 0px 30px black' }}>
                        <h2 className="text-[32px] font-semibold font-borna text-[#F6F6F6] leading-tight">
                            {t('forgot.title')}
                        </h2>
                        <p className="text-[16px] font-medium font-helvetica text-[#939393] leading-normal">
                            {t('forgot.subtitle')}
                        </p>
                    </div>

                    <div className="flex flex-col gap-8 w-full">
                        <div className="flex flex-col gap-3 w-full">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
                                <InputTextPhone
                                    label={`${t('forgot.phone')}*`}
                                    placeholder={t('forgot.phone')}
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
                                    {t('forgot.continue')}
                                </Button>
                            </form>
                        </div>
                    </div>

                    <div className="flex items-center justify-center text-center">
                        <span className="text-[14px] font-helvetica font-normal text-[#F6F6F6]">
                            {t('forgot.incidents')}
                            <Link
                                to="/incident"
                                className="pl-1.5 text-[#ff336d] no-underline font-medium hover:underline cursor-pointer"
                            >
                                {t('forgot.incidentsLink')}
                            </Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPage;
import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';

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
                    <div className="flex flex-col gap-12 items-center text-center lg:text-left">
                        <div className="lg:hidden">
                            <LogoIcon width={160} height={90} />
                        </div>

                        <div className="flex flex-col gap-4 w-full">
                            <h1 className="text-[28px] md:text-[30px] font-medium font-borna text-center text-[#ff336d]">
                                {t('forgot.title')}
                            </h1>

                            <p className="text-[14px] md:text-[16px] font-normal font-helvetica text-center text-[#F6F6F6]">
                                {t('forgot.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 w-full">
                            <div className="flex flex-col gap-5">
                                <div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="flex flex-col gap-6">
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
                                        </div>
                                    </form>
                                </div>

                                <div className="flex flex-col gap-4 mt-3">
                                    <div className="flex items-center justify-center">
                                        <span className="text-[15px] md:text-[16px] font-helvetica font-normal text-[#F6F6F6]">
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPage;
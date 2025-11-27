import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';

import { LogoIcon, LogoCutIcon } from '@/components/icons';
import axiosInstance from '@/config/axiosConfig';
import { countries } from '@/utils/countries';

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: Record<string, any>;
    message: string;
    details: string;
}

const OauthPage = () => {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();

    const [country, setCountry] = useState('34');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isCountryOpen, setIsCountryOpen] = useState(false);

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
                    sendSMSMutation.mutate({
                        country,
                        phone: phone.replace(/\s/g, '')
                    });

                    navigate({
                        to: '/verify',
                        state: { verification: 'sms', forgot: true, country, phone } as any
                    });
                } else {
                    navigate({ to: '/incident' });
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

    const selectedCountry = countries.find((c: { phone: string; }) => c.phone === country);

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
                    <div className="flex flex-col gap-12 items-center text-center lg:text-left">
                        <div className="lg:hidden">
                            <LogoIcon width={160} height={90} />
                        </div>

                        <div className="flex flex-col gap-4 w-full">
                            <h1 className="text-[28px] md:text-[30px] font-medium font-n27 text-center text-[#ff336d]">
                                {t('forgot.title')}
                            </h1>

                            <p className="text-[14px] md:text-[16px] font-normal font-helvetica text-center text-[#98AAC0]">
                                {t('forgot.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 w-full">
                            <div className="flex flex-col gap-5">
                                <div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="flex flex-col gap-6">
                                            <div className="flex flex-col gap-0.5 px-2">
                                                <div className="grid grid-cols-12 gap-3">
                                                    <div className="col-span-2 sm:col-span-2">
                                                        <label className="text-[#98AAC0] text-[13px] font-helvetica font-medium pl-1 block text-left">
                                                            {t('forgot.country')}
                                                        </label>
                                                    </div>
                                                    <div className="col-span-10 sm:col-span-10">
                                                        <label className="text-[#98AAC0] text-[13px] font-helvetica font-medium pl-1 block text-left">
                                                            {t('forgot.phone')}
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 gap-3 items-end">
                                                    <div className="col-span-2 sm:col-span-2">
                                                        <div className="relative w-full">
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsCountryOpen(!isCountryOpen)}
                                                                className="w-full h-[42px] flex items-center justify-between px-1 bg-transparent border-b border-[#CCCCCC] hover:border-[#252E39] focus:border-[#252E39] focus:outline-none transition-colors"
                                                            >
                                                                {selectedCountry && (
                                                                    <img
                                                                        loading="lazy"
                                                                        width="20"
                                                                        srcSet={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png 2x`}
                                                                        src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                                                                        alt=""
                                                                        className="shrink-0"
                                                                    />
                                                                )}
                                                                <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                                                            </button>

                                                            {isCountryOpen && (
                                                                <>
                                                                    <div
                                                                        className="fixed inset-0 z-10"
                                                                        onClick={() => setIsCountryOpen(false)}
                                                                    />
                                                                    <div className="absolute z-20 w-[280px] mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto">
                                                                        {countries.map((c) => {
                                                                            const label = i18n.language === 'en' ? c.label_en : c.label_es;
                                                                            return (
                                                                                <button
                                                                                    key={c.code}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setCountry(c.phone);
                                                                                        setIsCountryOpen(false);
                                                                                        setPhone('');
                                                                                    }}
                                                                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-left font-helvetica"
                                                                                >
                                                                                    <img
                                                                                        loading="lazy"
                                                                                        width="20"
                                                                                        srcSet={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png 2x`}
                                                                                        src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                                                                                        alt=""
                                                                                    />
                                                                                    <span className="text-sm">(+{c.phone}) {label}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="col-span-10 sm:col-span-10">
                                                        <div className="w-full">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={phone}
                                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                                className={`w-full h-[42px] px-1 bg-transparent border-b ${error ? 'border-red-500' : 'border-[#CCCCCC]'
                                                                    } hover:border-[#252E39] focus:border-[#252E39] focus:outline-none text-[#252E39] text-lg font-helvetica transition-colors`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {error && (
                                                    <p className="text-red-500 text-xs mt-1 pl-3 font-helvetica">{error}</p>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loginMutation.isPending}
                                                className="w-full bg-[#252E39] text-[#ECF0F5] text-[16px] font-helvetica font-medium py-3.5 rounded-[10px] hover:bg-[#1a2129] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                            >
                                                {loginMutation.isPending ? t('forgot.loading') : t('forgot.continue')}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="flex flex-col gap-4 mt-3">
                                    <div className="flex items-center justify-center">
                                        <span className="text-[15px] md:text-[16px] font-helvetica font-normal text-[#98AAC0]">
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

export default OauthPage;
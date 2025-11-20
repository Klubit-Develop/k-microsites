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

const ForgotPage = () => {
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
                        state: { verification: 'sms', country, phone } as any
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
        <div className="min-h-screen overflow-hidden md:grid md:grid-cols-12 md:gap-2">
            {/* Left Panel - Logo */}
            <div className="hidden md:flex md:col-span-8 bg-white items-center h-screen relative">
                <div className="h-full w-auto relative -translate-x-20">
                    <LogoCutIcon style={{ height: '100%', width: 'auto', objectFit: 'cover' }} />
                </div>
                <div className="absolute bottom-[50px] left-20 z-10">
                    <LogoIcon />
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="col-span-12 md:col-span-4 min-h-screen md:min-h-auto flex flex-col justify-between overflow-auto md:bg-[#F9F9FA]">
                <div className="m-2 md:m-2 p-2 md:p-4 flex flex-col flex-1 rounded-[10px]">
                    <div className="flex flex-col gap-1 md:gap-3 items-center md:items-start text-center md:text-left">
                        {/* Mobile Logo */}
                        <div className="md:hidden">
                            <LogoIcon width={160} height={90} />
                        </div>

                        {/* Title */}
                        <h1 className="text-[28px] md:text-[30px] font-medium font-n27 text-[#ff336d]">
                            {t('forgot.title')}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-[14px] md:text-[16px] font-normal font-helvetica text-[#98AAC0]">
                            {t('forgot.subtitle')}
                        </p>

                        {/* Form Section */}
                        <div className="flex flex-col gap-4 w-full">
                            <div className="flex flex-col gap-2">
                                {/* Forgot Form */}
                                <div className="mt-2">
                                    <form onSubmit={handleSubmit}>
                                        <div className="flex flex-col gap-2">
                                            <div className="grid grid-cols-12 gap-2 items-end">
                                                {/* Country Selector */}
                                                <div className="col-span-3 md:col-span-2">
                                                    <div className="flex flex-col items-start gap-0">
                                                        <label className="text-[#98AAC0] text-[13px] font-helvetica font-medium mb-0 pl-[14.4px]">
                                                            {t('forgot.country')}
                                                        </label>
                                                        <div className="relative w-[85px] -mt-[22.4px]">
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsCountryOpen(!isCountryOpen)}
                                                                className="w-full flex items-center justify-between px-3 py-2.5 bg-transparent border-b border-[#CCCCCC] hover:border-[#252E39] focus:border-[#252E39] focus:outline-none transition-colors"
                                                            >
                                                                {selectedCountry && (
                                                                    <img
                                                                        loading="lazy"
                                                                        width="25"
                                                                        srcSet={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png 2x`}
                                                                        src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                                                                        alt=""
                                                                    />
                                                                )}
                                                                <ChevronDown className="w-4 h-4 text-gray-500" />
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
                                                </div>

                                                {/* Phone Input */}
                                                <div className="col-span-9 md:col-span-10">
                                                    <div className="flex flex-col items-start gap-0">
                                                        <label className="text-[#98AAC0] text-[13px] font-helvetica font-medium mb-0 pl-3">
                                                            {t('forgot.phone')}
                                                        </label>
                                                        <div className="w-full mt-5">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={phone}
                                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                                className={`w-full px-3 py-2.5 bg-transparent border-b ${error ? 'border-red-500' : 'border-[#CCCCCC]'
                                                                    } hover:border-[#252E39] focus:border-[#252E39] focus:outline-none text-[#252E39] text-lg font-helvetica transition-colors`}
                                                            />
                                                            {error && (
                                                                <p className="text-red-500 text-xs mt-1 pl-3 font-helvetica">{error}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Submit Button */}
                                            <button
                                                type="submit"
                                                disabled={loginMutation.isPending}
                                                className="w-full bg-[#252E39] text-[#ECF0F5] text-[16px] font-helvetica font-medium py-4 rounded-[10px] hover:bg-[#1a2129] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {loginMutation.isPending ? t('forgot.loading') : t('forgot.continue')}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Divider */}
                                <div className="my-1 flex items-center justify-center">
                                    <div className="border-t border-[#00000029] w-full max-w-[100px] mx-auto" />
                                </div>

                                {/* Incidents */}
                                <div className="flex flex-col gap-0">
                                    <div className="mt-1 flex items-center justify-center">
                                        <span className="text-[15px] md:text-[16px] font-helvetica font-normal text-[#98AAC0]">
                                            {t('forgot.incidents')}
                                            <Link
                                                to="/incident"
                                                className="pl-1.5 text-[#ff336d] no-underline font-medium hover:underline"
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
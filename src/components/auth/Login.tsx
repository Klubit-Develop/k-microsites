import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';

import axiosInstance from '@/config/axiosConfig';
import { countries } from '@/utils/countries';

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: Record<string, any>;
    message: string;
    details: string;
}

const Login = () => {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();


    const [country, setCountry] = useState('34');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isCountryOpen, setIsCountryOpen] = useState(false);

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
            console.log('response backend', response);

            if (response.status === 'success') {
                if (response.data?.exists) {

                    sendEmailMutation.mutate({
                        email: response.data.email,
                    });

                    navigate({
                        to: '/verify',
                        state: { verification: 'email', email: response.data.email }
                    });
                } else {

                    sendSMSMutation.mutate({
                        country,
                        phone: phone.replace(/\s/g, '')
                    });

                    navigate({
                        to: '/verify',
                        state: { verification: 'sms', country, phone }
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

    const selectedCountry = countries.find((c: { phone: string; }) => c.phone === country);

    return (
        <div className="mt-2">
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-12 gap-2 items-end">
                        {/* Country Selector */}
                        <div className="col-span-3 md:col-span-2">
                            <div className="flex flex-col items-start gap-0">
                                <label className="text-[#98AAC0] text-[13px] font-helvetica font-medium mb-0 pl-[14.4px]">
                                    {t('login.country')}
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
                                    {t('login.phone')}
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
                        {loginMutation.isPending ? t('login.loading') : t('login.continue')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ArrowLeft, X } from 'lucide-react';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';
import { countries } from '@/utils/countries';

import InputTextPhone from '@/components/ui/InputTextPhone';
import InputText from '@/components/ui/InputText';
import InputDate from '@/components/ui/InputDate';
import Select from '@/components/ui/Select';
import OTPInput from '@/components/ui/OTPInput';
import Button from '@/components/ui/Button';
import { LogoIcon, GoogleIcon, AppleIcon } from '@/components/icons';

type AuthModalStep =
    | 'phone'
    | 'otp-sms'
    | 'otp-email'
    | 'register'
    | 'forgot-phone'
    | 'forgot-change'
    | 'oauth-phone';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    eventSlug?: string;
    checkoutSearchParams?: Record<string, string>;
}

interface AuthModalState {
    phone: string;
    phoneCountry: string;
    email: string;
    oauthEmail?: string;
    oauthProvider?: 'google' | 'apple';
    oauthFirstName?: string;
    oauthLastName?: string;
    isForgot: boolean;
    forgotUserId?: string;
    forgotToken?: string;
    currentEmail?: string;
}

const CHECKOUT_RETURN_KEY = 'klubit_auth_modal_return';

interface CheckoutReturnState {
    eventSlug: string;
    searchParams: Record<string, string>;
    timestamp: number;
}

const getCheckoutReturnState = (): CheckoutReturnState | null => {
    try {
        const stored = localStorage.getItem(CHECKOUT_RETURN_KEY);
        if (!stored) return null;

        const data = JSON.parse(stored) as CheckoutReturnState;
        const maxAge = 30 * 60 * 1000;
        if (Date.now() - data.timestamp > maxAge) {
            localStorage.removeItem(CHECKOUT_RETURN_KEY);
            return null;
        }

        return data;
    } catch {
        return null;
    }
};

const clearCheckoutReturnState = () => {
    localStorage.removeItem(CHECKOUT_RETURN_KEY);
};

const saveCheckoutReturnState = (eventSlug: string, searchParams: Record<string, string>) => {
    localStorage.setItem(CHECKOUT_RETURN_KEY, JSON.stringify({
        eventSlug,
        searchParams,
        timestamp: Date.now()
    }));
};

const AuthModal = ({ isOpen, onClose, onSuccess, eventSlug, checkoutSearchParams }: AuthModalProps) => {
    const { t, i18n } = useTranslation();
    const { setUser, setToken } = useAuthStore();

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [step, setStep] = useState<AuthModalStep>('phone');
    const [otpValue, setOtpValue] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [phoneError, setPhoneError] = useState('');

    const [state, setState] = useState<AuthModalState>({
        phone: '',
        phoneCountry: '34',
        email: '',
        isForgot: false,
    });

    const [registerForm, setRegisterForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        repeatEmail: '',
        gender: '',
        birthdate: '',
    });
    const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotRepeatEmail, setForgotRepeatEmail] = useState('');
    const [forgotErrors, setForgotErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true);
                });
            });
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => {
                setIsVisible(false);
                resetModal();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const resetModal = () => {
        setStep('phone');
        setOtpValue('');
        setCountdown(0);
        setPhoneError('');
        setState({
            phone: '',
            phoneCountry: '34',
            email: '',
            isForgot: false,
        });
        setRegisterForm({
            firstName: '',
            lastName: '',
            email: '',
            repeatEmail: '',
            gender: '',
            birthdate: '',
        });
        setRegisterErrors({});
        setForgotEmail('');
        setForgotRepeatEmail('');
        setForgotErrors({});
    };

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
        const selectedCountry = countries.find((c) => c.phone === state.phoneCountry);
        const maxLength = selectedCountry?.phoneLength || 9;
        const pattern = selectedCountry?.phoneFormat || [3, 3, 3];
        const numericValue = value.replace(/\D/g, '');
        const limitedValue = numericValue.slice(0, maxLength);
        const formattedValue = formatPhone(limitedValue, pattern);
        setState(prev => ({ ...prev, phone: formattedValue }));
        setPhoneError('');
    };

    const handleCountryChange = (newCountry: string) => {
        setState(prev => ({ ...prev, phoneCountry: newCountry, phone: '' }));
        setPhoneError('');
    };

    const sendSMSMutation = useMutation({
        mutationFn: async (data: { country: string; phone: string }) => {
            const response = await axiosInstance.post('/v2/sms/send', data);
            return response.data;
        },
        onError: (error: { backendError?: { message: string } }) => {
            toast.error(error.backendError?.message || t('common.error_connection'));
        }
    });

    const sendEmailMutation = useMutation({
        mutationFn: async (data: { email: string; currentEmail?: string }) => {
            const response = await axiosInstance.post('/v2/email/send', data);
            return response.data;
        },
        onError: (error: { backendError?: { message: string } }) => {
            toast.error(error.backendError?.message || t('common.error_connection'));
        }
    });

    const verifyPhoneMutation = useMutation({
        mutationFn: async (data: { country: string; phone: string }) => {
            const response = await axiosInstance.post('/v2/auth/verify', data);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success') {
                const responseData = response.data as { exists?: boolean; email?: string };

                if (state.isForgot) {
                    if (responseData?.exists) {
                        sendSMSMutation.mutate({
                            country: state.phoneCountry,
                            phone: state.phone.replace(/\s/g, '')
                        });
                        setStep('otp-sms');
                    } else {
                        toast.error(t('forgot.account_not_found', 'No encontramos una cuenta con este teléfono'));
                    }
                } else if (state.oauthEmail) {
                    if (responseData?.exists) {
                        if (responseData.email === state.oauthEmail) {
                            toast.error(t('oauth.account_already_exists', 'Ya existe una cuenta con este email'));
                            return;
                        }
                        toast.error(t('oauth.phone_belongs_to_another_account', 'Este teléfono pertenece a otra cuenta'));
                        return;
                    }
                    sendSMSMutation.mutate({
                        country: state.phoneCountry,
                        phone: state.phone.replace(/\s/g, '')
                    });
                    setStep('otp-sms');
                } else {
                    if (responseData?.exists) {
                        setState(prev => ({ ...prev, email: responseData.email || '' }));
                        sendEmailMutation.mutate({ email: responseData.email || '' });
                        setStep('otp-email');
                    } else {
                        sendSMSMutation.mutate({
                            country: state.phoneCountry,
                            phone: state.phone.replace(/\s/g, '')
                        });
                        setStep('otp-sms');
                    }
                }
            } else {
                toast.error(response.message || response.details);
            }
        },
        onError: (error: { backendError?: { message: string } }) => {
            toast.error(error.backendError?.message || t('common.error_connection'));
        }
    });

    const verifyOtpMutation = useMutation({
        mutationFn: async (code: string) => {
            const lang = i18n.language === 'en' ? 'en' : 'es';
            if (step === 'otp-email') {
                const emailToValidate = state.isForgot ? state.currentEmail : state.email;
                return await axiosInstance.post(`/v2/email/validate?lang=${lang}`, {
                    email: emailToValidate,
                    code
                });
            } else {
                return await axiosInstance.post(`/v2/sms/validate?lang=${lang}`, {
                    country: state.phoneCountry,
                    phone: state.phone.replace(/\s/g, ''),
                    code,
                    isForgot: state.isForgot
                });
            }
        },
        onSuccess: (response) => {
            const { token: responseToken, user } = response.data.data || {};

            if (step === 'otp-email') {
                if (state.isForgot) {
                    forgotChangeMutation.mutate({
                        id: state.forgotUserId || '',
                        token: state.forgotToken || '',
                        email: forgotEmail
                    });
                } else if (responseToken && user) {
                    setToken(responseToken);
                    setUser(user);
                    toast.success(t('auth.login_success', '¡Bienvenido!'));
                    onSuccess();
                    onClose();
                }
            } else {
                if (state.isForgot && user) {
                    setState(prev => ({
                        ...prev,
                        forgotUserId: user.id,
                        forgotToken: responseToken,
                        currentEmail: user.email
                    }));
                    setStep('forgot-change');
                } else {
                    setRegisterForm(prev => ({
                        ...prev,
                        firstName: state.oauthFirstName || '',
                        lastName: state.oauthLastName || '',
                        email: state.oauthEmail || '',
                        repeatEmail: state.oauthEmail || '',
                    }));
                    setStep('register');
                }
            }
        },
        onError: () => {
            toast.error(t('verify.invalid_code', 'Código inválido'));
        }
    });

    const registerMutation = useMutation({
        mutationFn: async (userData: {
            firstName: string;
            lastName: string;
            email: string;
            username: string;
            birthdate: string | null;
            gender: string;
            country: string;
            phone: string;
            language: string;
            roleIds: string[];
        }) => {
            const response = await axiosInstance.post(`/v2/auth/register?lang=${i18n.language}`, userData);
            return response.data;
        },
        onSuccess: (response, variables) => {
            if (response.status === 'success') {
                setState(prev => ({ ...prev, email: variables.email }));
                sendEmailMutation.mutate({ email: variables.email });
                setStep('otp-email');
            } else {
                toast.error(response.message || response.details);
            }
        },
        onError: (error: { backendError?: { message: string } }) => {
            toast.error(error.backendError?.message || t('common.error_connection'));
        }
    });

    const forgotChangeMutation = useMutation({
        mutationFn: async (data: { id: string; token: string; email: string }) => {
            const response = await axiosInstance.post('/v2/auth/forgot-change',
                { email: data.email },
                { headers: { 'Authorization': `Bearer ${data.token}` } }
            );
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success' && response.data?.user) {
                setToken(state.forgotToken || '');
                setUser(response.data.user);
                toast.success(t('forgot.email_changed', 'Email actualizado correctamente'));
                onSuccess();
                onClose();
            }
        },
        onError: (error: { backendError?: { message: string } }) => {
            toast.error(error.backendError?.message || t('common.error_connection'));
        }
    });

    const resendMutation = useMutation({
        mutationFn: async () => {
            const lang = i18n.language === 'en' ? 'en' : 'es';
            if (step === 'otp-email') {
                return await axiosInstance.post(`/v2/email/resend?lang=${lang}`, {
                    email: state.email
                });
            } else {
                return await axiosInstance.post(`/v2/sms/resend?lang=${lang}`, {
                    country: state.phoneCountry,
                    phone: state.phone.replace(/\s/g, ''),
                });
            }
        },
        onSuccess: () => {
            setOtpValue('');
            setCountdown(30);
            toast.success(t('verify.code_resent', 'Código reenviado'));
        },
        onError: () => {
            toast.error(t('common.error_connection'));
        }
    });

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedCountry = countries.find((c) => c.phone === state.phoneCountry);
        const expectedLength = selectedCountry?.phoneLength || 9;
        const phoneDigits = state.phone.replace(/\D/g, '');

        if (!phoneDigits) {
            setPhoneError(t('login.phone_required', 'Introduce tu teléfono'));
            return;
        }

        if (phoneDigits.length !== expectedLength) {
            setPhoneError(t('login.phone_invalid_length', 'Número de teléfono inválido'));
            return;
        }

        verifyPhoneMutation.mutate({
            country: state.phoneCountry,
            phone: phoneDigits
        });
    };

    const handleOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpValue || otpValue.length !== 6) {
            toast.error(t('verify.enter_valid_code', 'Introduce el código de 6 dígitos'));
            return;
        }
        verifyOtpMutation.mutate(otpValue);
    };

    const handleResend = () => {
        if (countdown > 0) return;
        resendMutation.mutate();
    };

    const validateRegisterForm = () => {
        const errors: Record<string, string> = {};

        if (!registerForm.firstName || registerForm.firstName.length < 2) {
            errors.firstName = t('register.name_required', 'Nombre requerido');
        }
        if (!registerForm.lastName || registerForm.lastName.length < 2) {
            errors.lastName = t('register.lastname_required', 'Apellido requerido');
        }
        if (!registerForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
            errors.email = t('register.email_invalid', 'Email inválido');
        }
        if (registerForm.email !== registerForm.repeatEmail) {
            errors.repeatEmail = t('register.emails_not_match', 'Los emails no coinciden');
        }
        if (!registerForm.gender) {
            errors.gender = t('register.gender_required', 'Selecciona tu género');
        }
        if (!registerForm.birthdate) {
            errors.birthdate = t('register.birthdate_required', 'Fecha de nacimiento requerida');
        }

        setRegisterErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateRegisterForm()) return;

        const username = registerForm.email.split('@')[0];
        const birthdateISO = registerForm.birthdate ? dayjs(registerForm.birthdate).toISOString() : null;

        registerMutation.mutate({
            firstName: registerForm.firstName,
            lastName: registerForm.lastName,
            email: registerForm.email,
            username,
            birthdate: birthdateISO,
            gender: registerForm.gender.toUpperCase(),
            country: state.phoneCountry,
            phone: state.phone.replace(/\s/g, ''),
            language: i18n.language.toUpperCase() || 'ES',
            roleIds: [],
        });
    };

    const validateForgotForm = () => {
        const errors: Record<string, string> = {};

        if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
            errors.email = t('forgot_change.email_invalid', 'Email inválido');
        }
        if (forgotEmail !== forgotRepeatEmail) {
            errors.repeatEmail = t('forgot_change.emails_not_match', 'Los emails no coinciden');
        }

        setForgotErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleForgotChangeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForgotForm()) return;

        setState(prev => ({ ...prev, email: forgotEmail }));
        sendEmailMutation.mutate({
            currentEmail: state.currentEmail,
            email: forgotEmail
        });
        setStep('otp-email');
    };

    const saveReturnState = useCallback(() => {
        if (eventSlug) {
            saveCheckoutReturnState(eventSlug, checkoutSearchParams || {});
        }
    }, [eventSlug, checkoutSearchParams]);

    const initiateGoogleLogin = () => {
        saveReturnState();
        const currentOrigin = window.location.origin;
        window.location.href = `${import.meta.env.VITE_API_URL || 'https://api.klubit.io'}/v2/oauth/google/microsites?origin=${encodeURIComponent(currentOrigin)}`;
    };

    const initiateAppleLogin = () => {
        saveReturnState();
        const currentOrigin = window.location.origin;
        window.location.href = `${import.meta.env.VITE_API_URL || 'https://api.klubit.io'}/v2/oauth/apple/microsites?origin=${encodeURIComponent(currentOrigin)}`;
    };

    const handleForgotClick = () => {
        setState(prev => ({ ...prev, isForgot: true }));
        setStep('forgot-phone');
    };

    const handleBack = () => {
        setOtpValue('');
        if (step === 'otp-sms' || step === 'otp-email') {
            if (state.isForgot) {
                setStep('forgot-phone');
            } else if (state.oauthEmail) {
                setStep('oauth-phone');
            } else {
                setStep('phone');
            }
        } else if (step === 'register') {
            setStep('otp-sms');
        } else if (step === 'forgot-phone') {
            setState(prev => ({ ...prev, isForgot: false }));
            setStep('phone');
        } else if (step === 'forgot-change') {
            setStep('otp-sms');
        } else if (step === 'oauth-phone') {
            setState(prev => ({
                ...prev,
                oauthEmail: undefined,
                oauthProvider: undefined,
                oauthFirstName: undefined,
                oauthLastName: undefined
            }));
            setStep('phone');
        }
    };

    const getTitle = () => {
        switch (step) {
            case 'phone':
                return t('login.title', 'Inicia sesión');
            case 'forgot-phone':
                return t('forgot.title', '¿No puedes acceder?');
            case 'oauth-phone':
                return t('oauth.title', 'Completa tu registro');
            case 'otp-sms':
            case 'otp-email':
                return t('verify.title', 'Verificación');
            case 'register':
                return t('register.title', 'Crear cuenta');
            case 'forgot-change':
                return t('forgot_change.title', 'Nuevo email');
            default:
                return '';
        }
    };

    const getSubtitle = () => {
        switch (step) {
            case 'otp-sms':
                return t('verify.sms_sent', 'Hemos enviado un código a tu teléfono');
            case 'otp-email':
                return t('verify.email_sent', 'Hemos enviado un código a tu email');
            case 'forgot-phone':
                return t('forgot.subtitle', 'Introduce tu teléfono para recuperar tu cuenta');
            default:
                return '';
        }
    };

    const isLoading = verifyPhoneMutation.isPending || verifyOtpMutation.isPending ||
        registerMutation.isPending || forgotChangeMutation.isPending || sendSMSMutation.isPending;

    if (!isVisible) return null;

    const genderOptions = [
        { value: 'male', label: t('register.male', 'Hombre') },
        { value: 'female', label: t('register.female', 'Mujer') },
        { value: 'other', label: t('register.other', 'Otro') },
    ];

    return createPortal(
        <div
            className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-200 ease-out ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
            style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        >
            <div
                className={`absolute inset-0 bg-black/80 transition-opacity duration-200 ease-out ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                style={{ touchAction: 'none' }}
            />

            <div
                className={`relative bg-[#0A0A0A] w-full sm:max-w-[440px] max-h-[80vh] sm:max-h-[85vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] border-2 border-[#232323] transition-all duration-200 ease-out ${isAnimating ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-8 sm:scale-95'}`}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#0A0A0A] px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                        {step !== 'phone' ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="p-2 -ml-2 text-[#939393] hover:text-[#F6F6F6] transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <div className="w-9" />
                        )}

                        <div className="flex-1 flex justify-center">
                            <LogoIcon width={100} height={40} />
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 -mr-2 text-[#939393] hover:text-[#F6F6F6] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
             
                    <h2 className="text-[20px] font-semibold text-[#F6F6F6] text-center mt-4 font-borna">
                        {getTitle()}
                    </h2>
           
                    {getSubtitle() && (
                        <p className="text-[14px] text-[#939393] text-center mt-1 font-helvetica">
                            {getSubtitle()}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {/* Phone Step */}
                    {(step === 'phone' || step === 'forgot-phone' || step === 'oauth-phone') && (
                        <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-5">
                            <InputTextPhone
                                label={`${t('login.phone', 'Teléfono')}*`}
                                placeholder={t('login.phone', 'Teléfono')}
                                value={state.phone}
                                onChange={handlePhoneChange}
                                error={phoneError}
                                country={state.phoneCountry}
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
                                {t('login.continue', 'Continuar')}
                            </Button>

                            {step === 'phone' && (
                                <>
                                    <div className="flex items-center justify-center">
                                        <div className="border-t border-[#232323] w-full max-w-[100px]" />
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button type="button" onClick={initiateGoogleLogin} icon={<GoogleIcon />}>
                                            {t('login.continueWithGoogle', 'Continuar con Google')}
                                        </Button>
                                        <Button type="button" onClick={initiateAppleLogin} icon={<AppleIcon />}>
                                            {t('login.continueWithApple', 'Continuar con Apple')}
                                        </Button>
                                    </div>

                                    <div className="text-center">
                                        <span className="text-[14px] font-helvetica text-[#F6F6F6]">
                                            {t('login.cantAccess', '¿No puedes acceder?')}
                                            <button
                                                type="button"
                                                onClick={handleForgotClick}
                                                className="pl-1.5 text-[#ff336d] font-medium hover:underline"
                                            >
                                                {t('login.forgot_password', 'Recuperar cuenta')}
                                            </button>
                                        </span>
                                    </div>
                                </>
                            )}
                        </form>
                    )}

                    {/* OTP Step */}
                    {(step === 'otp-sms' || step === 'otp-email') && (
                        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
                            <div className="text-center mb-2">
                                <span className="text-[14px] font-helvetica text-[#F6F6F6]">
                                    {step === 'otp-sms'
                                        ? `+${state.phoneCountry} ${state.phone}`
                                        : state.email
                                    }
                                </span>
                            </div>

                            <OTPInput
                                length={6}
                                value={otpValue}
                                onChange={setOtpValue}
                                disabled={isLoading}
                                autoFocus
                            />

                            <Button
                                type="submit"
                                variant="cta"
                                disabled={isLoading || otpValue.length !== 6}
                                isLoading={isLoading}
                            >
                                {t('verify.verify', 'Verificar')}
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={countdown > 0 || resendMutation.isPending}
                                    className={`text-[14px] font-helvetica ${countdown > 0 ? 'text-[#939393]' : 'text-[#ff336d] hover:underline'}`}
                                >
                                    {countdown > 0
                                        ? t('verify.resend_in', 'Reenviar en {{seconds}}s', { seconds: countdown })
                                        : t('verify.resend', 'Reenviar código')
                                    }
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Register Step */}
                    {step === 'register' && (
                        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-3">
                                <InputText
                                    label={`${t('register.first_name', 'Nombre')}*`}
                                    placeholder={t('register.first_name', 'Nombre')}
                                    value={registerForm.firstName}
                                    onChange={(value) => setRegisterForm(prev => ({ ...prev, firstName: value }))}
                                    error={registerErrors.firstName}
                                    disabled={isLoading}
                                />
                                <InputText
                                    label={`${t('register.last_name', 'Apellido')}*`}
                                    placeholder={t('register.last_name', 'Apellido')}
                                    value={registerForm.lastName}
                                    onChange={(value) => setRegisterForm(prev => ({ ...prev, lastName: value }))}
                                    error={registerErrors.lastName}
                                    disabled={isLoading}
                                />
                            </div>

                            <InputText
                                label={`${t('register.email', 'Email')}*`}
                                placeholder={t('register.email', 'Email')}
                                type="email"
                                value={registerForm.email}
                                onChange={(value) => setRegisterForm(prev => ({ ...prev, email: value }))}
                                error={registerErrors.email}
                                disabled={isLoading || !!state.oauthEmail}
                            />

                            <InputText
                                label={`${t('register.repeat_email', 'Repetir email')}*`}
                                placeholder={t('register.repeat_email', 'Repetir email')}
                                type="email"
                                value={registerForm.repeatEmail}
                                onChange={(value) => setRegisterForm(prev => ({ ...prev, repeatEmail: value }))}
                                error={registerErrors.repeatEmail}
                                disabled={isLoading || !!state.oauthEmail}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Select
                                    label={`${t('register.gender', 'Género')}*`}
                                    placeholder={t('register.select_gender', 'Seleccionar')}
                                    value={registerForm.gender}
                                    onChange={(value) => setRegisterForm(prev => ({ ...prev, gender: value }))}
                                    options={genderOptions}
                                    error={registerErrors.gender}
                                    disabled={isLoading}
                                />
                                <InputDate
                                    label={`${t('register.birthdate', 'Nacimiento')}*`}
                                    placeholder="dd/mm/yyyy"
                                    value={registerForm.birthdate}
                                    onChange={(value) => setRegisterForm(prev => ({ ...prev, birthdate: value }))}
                                    error={registerErrors.birthdate}
                                    disabled={isLoading}
                                    max={dayjs().subtract(18, 'year').format('YYYY-MM-DD')}
                                    maxErrorMessage={t('register.must_be_18', 'Debes ser mayor de 18 años')}
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="cta"
                                disabled={isLoading}
                                isLoading={isLoading}
                            >
                                {t('register.create_account', 'Crear cuenta')}
                            </Button>
                        </form>
                    )}

                    {/* Forgot Change Step */}
                    {step === 'forgot-change' && (
                        <form onSubmit={handleForgotChangeSubmit} className="flex flex-col gap-4">
                            <p className="text-[14px] text-[#939393] font-helvetica text-center mb-2">
                                {t('forgot_change.subtitle', 'Introduce tu nuevo email para acceder a tu cuenta')}
                            </p>

                            <InputText
                                label={`${t('forgot_change.new_email', 'Nuevo email')}*`}
                                placeholder={t('forgot_change.new_email', 'Nuevo email')}
                                type="email"
                                value={forgotEmail}
                                onChange={setForgotEmail}
                                error={forgotErrors.email}
                                disabled={isLoading}
                            />

                            <InputText
                                label={`${t('forgot_change.repeat_email', 'Repetir email')}*`}
                                placeholder={t('forgot_change.repeat_email', 'Repetir email')}
                                type="email"
                                value={forgotRepeatEmail}
                                onChange={setForgotRepeatEmail}
                                error={forgotErrors.repeatEmail}
                                disabled={isLoading}
                            />

                            <Button
                                type="submit"
                                variant="cta"
                                disabled={isLoading}
                                isLoading={isLoading}
                            >
                                {t('forgot_change.continue', 'Continuar')}
                            </Button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-2">
                    <p className="text-[11px] font-helvetica text-[#939393] text-center">
                        {t('login.termsText', 'Al continuar, aceptas nuestros')}{' '}
                        <a
                            href="/terms-and-conditions"
                            target="_blank"
                            className="text-[#F6F6F6] underline"
                        >
                            {t('login.termsLink', 'Términos y Condiciones')}
                        </a>
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export { AuthModal, CHECKOUT_RETURN_KEY, getCheckoutReturnState, clearCheckoutReturnState, saveCheckoutReturnState };
export default AuthModal;
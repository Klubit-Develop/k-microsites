import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { LogoIcon, LogoCutIcon } from '@/components/icons';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { Route } from '@/routes/register';

import axiosInstance from '@/config/axiosConfig';
import InputText from '@/components/ui/InputText';
import InputDate from '@/components/ui/InputDate';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

import 'dayjs/locale/es';
import 'dayjs/locale/en';

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: Record<string, unknown>;
    message: string;
    details: string;
}

interface RegisterUserData {
    firstName: string;
    lastName: string;
    birthdate: string;
    username: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    country: string;
    phone: string;
    email: string;
    language: 'ES' | 'EN';
}

const generateUsername = (firstName: string, lastName: string): string => {
    const base = `${firstName}_${lastName}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w]+/g, '')
        .replace(/__+/g, '_')
        .replace(/^_+/, '')
        .replace(/_+$/, '');

    const randomNum = Math.floor(Math.random() * 1000);
    return `${base}${randomNum}`;
};

const onlyLetters = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]$/;
    if (!regex.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
        e.preventDefault();
    }
};

export function Register() {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();

    const searchParams = Route.useSearch();
    const { country, phone, oauthEmail, oauthFirstName, oauthLastName } = searchParams;

    const genderOptions = [
        { value: 'MALE', label: t('register.male') },
        { value: 'FEMALE', label: t('register.female') },
        { value: 'OTHER', label: t('register.other') }
    ];

    const sendEmailMutation = useMutation({
        mutationFn: async (data: { email: string; country: string; phone: string }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/email/send', { email: data.email });
            return response.data;
        },
        onSuccess: (_response, variables) => {
            navigate({
                to: '/verify',
                search: {
                    verification: 'email',
                    email: variables.email,
                    country: variables.country,
                    phone: variables.phone
                }
            });
        },
        onError: (err: { backendError?: { message: string } }) => {
            if (err.backendError) {
                toast.error(err.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const registerMutation = useMutation({
        mutationFn: async (userData: RegisterUserData) => {
            const response = await axiosInstance.post<BackendResponse>(
                `/v2/auth/register?lang=${i18n.language}`,
                userData
            );
            return response.data;
        },
        onSuccess: (response: BackendResponse, variables) => {
            if (response.status === 'success') {
                sendEmailMutation.mutate({
                    email: variables.email,
                    country: variables.country,
                    phone: variables.phone
                });
            } else {
                toast.error(response.message || response.details);
            }
        },
        onError: (err: { backendError?: { message: string } }) => {
            if (err.backendError) {
                toast.error(err.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const validators = {
        firstName: (value: string) => {
            if (!value) return t('register.name_required');
            if (value.length < 2) return t('register.name_min_length');
            if (value.length > 40) return t('register.name_max_length');
        },
        lastName: (value: string) => {
            if (!value) return t('register.lastname_required');
            if (value.length < 2) return t('register.lastname_min_length');
            if (value.length > 40) return t('register.lastname_max_length');
        },
        birthdate: (value: string | null) => !value && t('register.birthdate_required'),
        gender: (value: string) => !value && t('register.gender_required'),
        email: (value: string) => {
            if (!value) return t('register.email_required');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('register.email_invalid');
        },
        repeatEmail: (email: string, repeatEmail: string) => {
            if (!repeatEmail) return t('register.repeat_email_required');
            if (email !== repeatEmail) return t('register.emails_not_match');
        }
    };

    const form = useForm({
        defaultValues: {
            firstName: oauthFirstName || '',
            lastName: oauthLastName || '',
            email: oauthEmail || '',
            repeatEmail: oauthEmail || '',
            gender: '' as 'MALE' | 'FEMALE' | 'OTHER' | '',
            birthdate: '' as string | null
        },
        validators: {
            onSubmit: ({ value }) => {
                const validationErrors: Record<string, string> = {};

                const firstNameError = validators.firstName(value.firstName);
                if (firstNameError) validationErrors.firstName = firstNameError;

                const lastNameError = validators.lastName(value.lastName);
                if (lastNameError) validationErrors.lastName = lastNameError;

                const birthdateError = validators.birthdate(value.birthdate);
                if (birthdateError) validationErrors.birthdate = birthdateError;

                const genderError = validators.gender(value.gender);
                if (genderError) validationErrors.gender = genderError;

                const emailError = validators.email(value.email);
                if (emailError) validationErrors.email = emailError;

                const repeatEmailError = validators.repeatEmail(value.email, value.repeatEmail);
                if (repeatEmailError) validationErrors.repeatEmail = repeatEmailError;

                if (Object.keys(validationErrors).length > 0) {
                    return {
                        fields: validationErrors
                    };
                }

                return undefined;
            }
        },
        onSubmit: async ({ value }) => {
            const username = generateUsername(value.firstName.trim(), value.lastName.trim());

            registerMutation.mutate({
                firstName: value.firstName.trim(),
                lastName: value.lastName.trim(),
                birthdate: new Date(value.birthdate!).toISOString(),
                username,
                gender: value.gender as 'MALE' | 'FEMALE' | 'OTHER',
                country: country || '',
                phone: phone || '',
                email: value.email.trim().toLowerCase(),
                language: i18n.language.toUpperCase() as 'ES' | 'EN'
            });
        }
    });

    const isLoading = registerMutation.isPending || sendEmailMutation.isPending;

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
                                {t('register.title')}
                            </h1>
                        </div>

                        <div className="flex flex-col gap-6 w-full">
                            <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                                <div className="flex flex-col gap-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <form.Field name="firstName">
                                            {(field) => (
                                                <InputText
                                                    label={`${t('register.first_name')}*`}
                                                    value={field.state.value || ''}
                                                    onChange={field.handleChange}
                                                    error={field.state.meta.errors?.[0]}
                                                    maxLength={40}
                                                    onKeyPress={onlyLetters}
                                                    disabled={isLoading}
                                                />
                                            )}
                                        </form.Field>

                                        <form.Field name="lastName">
                                            {(field) => (
                                                <InputText
                                                    label={`${t('register.last_name')}*`}
                                                    value={field.state.value || ''}
                                                    onChange={field.handleChange}
                                                    error={field.state.meta.errors?.[0]}
                                                    maxLength={40}
                                                    onKeyPress={onlyLetters}
                                                    disabled={isLoading}
                                                />
                                            )}
                                        </form.Field>

                                        <form.Field name="birthdate">
                                            {(field) => (
                                                <InputDate
                                                    label={`${t('register.birthdate')}*`}
                                                    value={field.state.value || ''}
                                                    onChange={field.handleChange}
                                                    error={field.state.meta.errors?.[0]}
                                                    max={dayjs().subtract(14, 'years').format('YYYY-MM-DD')}
                                                    min={dayjs().subtract(120, 'years').format('YYYY-MM-DD')}
                                                    maxErrorMessage={t('register.birthdate_too_young')}
                                                    minErrorMessage={t('register.birthdate_too_old')}
                                                    disabled={isLoading}
                                                />
                                            )}
                                        </form.Field>

                                        <form.Field name="gender">
                                            {(field) => (
                                                <Select
                                                    label={`${t('register.gender')}*`}
                                                    value={field.state.value || ''}
                                                    onChange={(value) => field.handleChange(value as 'MALE' | 'FEMALE' | 'OTHER')}
                                                    options={genderOptions}
                                                    error={field.state.meta.errors?.[0]}
                                                    placeholder={t('register.select_gender')}
                                                    disabled={isLoading}
                                                />
                                            )}
                                        </form.Field>

                                        <div className="col-span-1 md:col-span-2 flex flex-col gap-8">
                                            <form.Field name="email">
                                                {(field) => (
                                                    <InputText
                                                        type="email"
                                                        label={`${t('register.email')}*`}
                                                        value={field.state.value || ''}
                                                        onChange={field.handleChange}
                                                        error={field.state.meta.errors?.[0]}
                                                        maxLength={80}
                                                        inputMode="email"
                                                        disabled={isLoading}
                                                    />
                                                )}
                                            </form.Field>

                                            <form.Field name="repeatEmail">
                                                {(field) => (
                                                    <InputText
                                                        type="email"
                                                        label={`${t('register.repeat_email')}*`}
                                                        value={field.state.value || ''}
                                                        onChange={field.handleChange}
                                                        error={field.state.meta.errors?.[0]}
                                                        maxLength={80}
                                                        inputMode="email"
                                                        disabled={isLoading}
                                                    />
                                                )}
                                            </form.Field>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 my-2">
                                            <div className="flex items-center justify-center">
                                                <span className="text-[15px] md:text-[16px] font-helvetica font-normal text-center text-[#888888]">
                                                    {t('register.already_account')}
                                                    <Link
                                                        to="/auth"
                                                        className="pl-1.5 text-[#ff336d] no-underline font-medium hover:underline cursor-pointer"
                                                    >
                                                        {t('register.log_in')}
                                                    </Link>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="cta"
                                        disabled={isLoading}
                                        isLoading={isLoading}
                                    >
                                        {t('register.continue')}
                                    </Button>

                                    <div className="flex items-center justify-center flex-col sm:flex-row gap-1">
                                        <p className="text-[14px] font-helvetica font-normal text-[#888888]">
                                            {t('register.termsText')}
                                        </p>
                                        <Link
                                            to="/terms-and-conditions"
                                            className="text-[14px] font-helvetica font-semibold text-[#888888] underline hover:text-[#F6F6F6] transition-colors cursor-pointer"
                                        >
                                            {t('register.termsLink')}
                                        </Link>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
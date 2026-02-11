import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { LogoIcon } from '@/components/icons';
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
            const response = await axiosInstance.post<BackendResponse>(`/v2/auth/register?lang=${i18n.language}`, userData);
            return response.data;
        },
        onSuccess: (response, variables) => {
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
        firstName: (value: string | any[]) => {
            if (!value) return t('register.name_required');
            if (value.length < 2) return t('register.name_min_length');
            if (value.length > 40) return t('register.name_max_length');
        },
        lastName: (value: string | any[]) => {
            if (!value) return t('register.lastname_required');
            if (value.length < 2) return t('register.lastname_min_length');
            if (value.length > 40) return t('register.lastname_max_length');
        },
        birthdate: (value: string | null) => {
            if (!value) return t('register.birthdate_required');
            const date = dayjs(value);
            const minAge = dayjs().subtract(14, 'years');
            const maxAge = dayjs().subtract(120, 'years');
            if (date.isAfter(minAge)) return t('register.birthdate_too_young');
            if (date.isBefore(maxAge)) return t('register.birthdate_too_old');
        },
        gender: (value: string) => {
            if (!value) return t('register.gender_required');
        },
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
        <div className="w-full flex-1 relative flex flex-col lg:flex-row items-center lg:items-stretch p-4 lg:p-[42px]">
            <div
                className="absolute inset-0 bg-[#050505] -z-20"
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 -z-10 opacity-50 lg:opacity-75"
                style={{
                    backgroundImage: 'url(https://klubit.fra1.cdn.digitaloceanspaces.com/background-auth.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 -z-[5] bg-gradient-to-t lg:bg-gradient-to-r from-[#050505] lg:from-[rgba(5,5,5,0.75)] from-[35%] lg:from-0% to-[rgba(5,5,5,0.75)] lg:to-[rgba(5,5,5,0.38)]"
                aria-hidden="true"
            />

            <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative">
                <Link to="/" className="absolute top-0 left-0">
                    <LogoIcon width={129} height={42} />
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

            <div className="lg:hidden w-full flex flex-col items-center flex-1 justify-center py-8">
                <div className="flex flex-col items-center w-full max-w-[390px] gap-8">
                    <LogoIcon width={129} height={42} />

                    <div className="flex flex-col gap-6 w-full">
                        <div className="flex flex-col gap-2 items-center text-center w-full" style={{ textShadow: '0px 0px 30px black' }}>
                            <h2 className="text-[24px] font-semibold font-borna text-[#F6F6F6] leading-tight">
                                {t('register.title')}
                            </h2>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-3">
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
                                </div>

                                <div className="grid grid-cols-2 gap-3">
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
                                </div>

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

                                <div className="flex items-center justify-center my-2">
                                    <span className="text-[14px] font-helvetica font-normal text-[#939393]">
                                        {t('register.already_account')}
                                        <Link
                                            to="/auth"
                                            className="pl-1.5 text-[#ff336d] no-underline font-medium hover:underline cursor-pointer"
                                        >
                                            {t('register.log_in')}
                                        </Link>
                                    </span>
                                </div>

                                <Button
                                    type="submit"
                                    variant="cta"
                                    disabled={isLoading}
                                    isLoading={isLoading}
                                >
                                    {t('register.continue')}
                                </Button>

                                <div className="flex flex-col items-center justify-center text-center gap-1">
                                    <p className="text-[12px] font-helvetica font-normal text-[#939393]">
                                        {t('register.termsText')}
                                    </p>
                                    <Link
                                        to="/terms-and-conditions"
                                        className="text-[12px] font-helvetica font-medium text-[#939393] underline hover:text-[#F6F6F6] transition-colors cursor-pointer"
                                    >
                                        {t('register.termsLink')}
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex w-[600px] shrink-0 flex-col items-center justify-center">
                <div className="w-full h-full bg-[#141414] border-[2.5px] border-[#232323] rounded-[24px] shadow-[0px_0px_30px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center px-[90px] py-[48px] gap-[32px]">
                    <div className="flex flex-col gap-4 items-center text-center w-full" style={{ textShadow: '0px 0px 30px black' }}>
                        <h2 className="text-[32px] font-semibold font-borna text-[#F6F6F6] leading-tight">
                            {t('register.title')}
                        </h2>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-3">
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
                            </div>

                            <div className="grid grid-cols-2 gap-3">
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
                            </div>

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

                            <div className="flex items-center justify-center my-2">
                                <span className="text-[14px] font-helvetica font-normal text-[#939393]">
                                    {t('register.already_account')}
                                    <Link
                                        to="/auth"
                                        className="pl-1.5 text-[#ff336d] no-underline font-medium hover:underline cursor-pointer"
                                    >
                                        {t('register.log_in')}
                                    </Link>
                                </span>
                            </div>

                            <Button
                                type="submit"
                                variant="cta"
                                disabled={isLoading}
                                isLoading={isLoading}
                            >
                                {t('register.continue')}
                            </Button>

                            <div className="flex items-center justify-center text-center">
                                <p className="text-[12px] font-helvetica font-normal text-[#939393]">
                                    {t('register.termsText')}{' '}
                                    <Link
                                        to="/terms-and-conditions"
                                        className="font-medium text-[#939393] underline hover:text-[#F6F6F6] transition-colors cursor-pointer"
                                    >
                                        {t('register.termsLink')}
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;
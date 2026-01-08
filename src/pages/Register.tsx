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

const Register = () => {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();
    const searchParams = Route.useSearch();

    const cleanString = (value: string | undefined): string => {
        if (!value) return '';
        return value.replace(/^"|"$/g, '');
    };

    const country = cleanString(searchParams.country) || '34';
    const phone = cleanString(searchParams.phone);
    const oauthEmail = cleanString(searchParams.oauthEmail);
    const oauthFirstName = cleanString(searchParams.oauthFirstName);
    const oauthLastName = cleanString(searchParams.oauthLastName);

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

    const registerMutation = useMutation({
        mutationFn: async (userData: {
            firstName: string;
            lastName: string;
            email: string;
            username: string;
            birthdate: null | string;
            gender: string;
            country: string;
            phone: string;
            language: string;
            roleIds: any[];
        }) => {
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
                });

                navigate({
                    to: '/verify',
                    state: {
                        verification: 'email',
                        email: variables.email,
                        country,
                        phone: phone?.replace(/\s/g, ''),
                    } as any
                });
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
        birthdate: (value: any) => !value && t('register.birthdate_required'),
        gender: (value: any) => !value && t('register.gender_required'),
        email: (value: string) => {
            if (!value) return t('register.email_required');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('register.email_invalid');
        },
        repeatEmail: (email: any, repeatEmail: any) => {
            if (!repeatEmail) return t('register.repeat_email_required');
            if (email !== repeatEmail) return t('register.emails_not_match');
        }
    };

    const form = useForm({
        defaultValues: {
            firstName: oauthFirstName,
            lastName: oauthLastName,
            email: oauthEmail,
            repeatEmail: oauthEmail,
            country: country || '34',
            phone: phone || '',
            gender: '',
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
                    return validationErrors;
                }
            }
        },
        onSubmit: async ({ value }) => {
            const username = value.email.split('@')[0];

            const birthdateISO = value.birthdate ? dayjs(value.birthdate).toISOString() : null;

            const userData = {
                firstName: value.firstName,
                lastName: value.lastName,
                email: value.email,
                username: username,
                birthdate: birthdateISO,
                gender: value.gender.toUpperCase(),
                country: value.country,
                phone: value.phone,
                language: i18n.language.toUpperCase() || 'ES',
                roleIds: []
            };

            registerMutation.mutate(userData);
        }
    });

    const genderOptions = [
        { value: 'male', label: t('register.male') },
        { value: 'female', label: t('register.female') },
        { value: 'other', label: t('register.other') }
    ];

    const onlyLetters = (e: { which: any; keyCode: any; preventDefault: () => void; }) => {
        if (!/[a-zA-Z\s]/.test(String.fromCharCode(e.which || e.keyCode))) {
            e.preventDefault();
        }
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

            <div className="col-span-12 lg:col-span-4 min-h-screen flex items-center justify-center lg:bg-[#050505] px-4 sm:px-6 md:px-8 py-8">
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
                                                    maxErrorMessage={t('register.birthdate_too_young', 'Debes tener al menos 14 aÃ±os')}
                                                    minErrorMessage={t('register.birthdate_too_old', 'La fecha es demasiado antigua')}
                                                />
                                            )}
                                        </form.Field>

                                        <form.Field name="gender">
                                            {(field) => (
                                                <Select
                                                    label={`${t('register.gender')}*`}
                                                    value={field.state.value || ''}
                                                    onChange={field.handleChange}
                                                    options={genderOptions}
                                                    error={field.state.meta.errors?.[0]}
                                                    placeholder={t('register.select_gender')}
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
                                                    />
                                                )}
                                            </form.Field>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 my-2">
                                            <div className="flex items-center justify-center">
                                                <span className="text-[15px] md:text-[16px] font-helvetica font-normal text-center text-[#F6F6F6]">
                                                    {t('register.already_account')}
                                                    <Link
                                                        to="/"
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
                                        disabled={registerMutation.isPending}
                                        isLoading={registerMutation.isPending}
                                    >
                                        {t('register.continue')}
                                    </Button>

                                    <div className="flex items-center justify-center flex-col sm:flex-row gap-1">
                                        <p className="text-[14px] font-helvetica font-normal text-[#F6F6F6]">
                                            {t('register.termsText')}
                                        </p>
                                        <Link
                                            to="/"
                                            className="text-[14px] font-helvetica font-semibold text-[#F6F6F6] underline hover:text-[#252E39] transition-colors cursor-pointer"
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
};

export default Register;
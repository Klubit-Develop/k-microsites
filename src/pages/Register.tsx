import dayjs from 'dayjs';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { LogoCutIcon } from '@/components/icons';
import { Link, useLocation } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import { Input, Select } from '@/components/common/ElementsForm';

import 'dayjs/locale/es';
import 'dayjs/locale/en';

const Register = () => {
    const { i18n, t } = useTranslation();
    const location = useLocation();

    // Recibir country y phone del estado de navegación
    const { country, phone } = (location.state as { country?: string; phone?: string }) || {};

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
            return await axiosInstance.post(`/v2/auth/register?lang=${i18n.language}`, userData);
        }
    });

    // Validations
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
            firstName: '',
            lastName: '',
            email: '',
            repeatEmail: '',
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
            // Generar username a partir del email (parte antes del @)
            const username = value.email.split('@')[0];
            
            // Formatear fecha al formato ISO esperado por el backend
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


            const response = await registerMutation.mutateAsync(userData);

            console.log('response', response)


        }
    });

    // Gender options
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
        <div className="min-h-screen overflow-hidden md:grid md:grid-cols-12 md:gap-2">
            {/* Left Panel - Logo */}
            <div className="hidden md:flex md:col-span-8 bg-white items-center h-screen relative">
                <div className="h-full w-auto relative -translate-x-20">
                    <LogoCutIcon style={{ height: '100%', width: 'auto', objectFit: 'cover' }} />
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="col-span-12 md:col-span-4 min-h-screen md:min-h-auto flex flex-col justify-between overflow-auto md:bg-[#F9F9FA]">
                <div className="m-2 md:m-2 p-2 md:p-4 flex flex-col flex-1 rounded-[10px]">
                    <div className="flex flex-col gap-1 md:gap-3 items-center md:items-start text-center md:text-left">
                        {/* Title */}
                        <h1 className="text-[28px] md:text-[30px] font-medium font-n27 text-[#ff336d]">
                            {t('register.title')}
                        </h1>

                        {/* Form */}
                        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                            <div className="flex flex-col gap-4 mt-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* First Name */}
                                    <form.Field name="firstName">
                                        {(field) => (
                                            <Input
                                                label={t('register.first_name')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={40}
                                                onKeyPress={onlyLetters}
                                            />
                                        )}
                                    </form.Field>

                                    {/* Last Name */}
                                    <form.Field name="lastName">
                                        {(field) => (
                                            <Input
                                                label={t('register.last_name')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={40}
                                                onKeyPress={onlyLetters}
                                            />
                                        )}
                                    </form.Field>

                                    {/* Birthdate */}
                                    <form.Field name="birthdate">
                                        {(field) => (
                                            <Input
                                                type="date"
                                                label={t('register.birthdate')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                max={dayjs().subtract(14, 'years').format('YYYY-MM-DD')}
                                                min={dayjs().subtract(120, 'years').format('YYYY-MM-DD')}
                                            />
                                        )}
                                    </form.Field>

                                    {/* Gender */}
                                    <form.Field name="gender">
                                        {(field) => (
                                            <Select
                                                label={t('register.gender')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                options={genderOptions}
                                                error={field.state.meta.errors?.[0]}
                                                placeholder={t('register.select_gender')}
                                            />
                                        )}
                                    </form.Field>

                                    {/* Email */}
                                    <form.Field name="email">
                                        {(field) => (
                                            <Input
                                                type="email"
                                                label={t('register.email')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={80}
                                                inputMode="email"
                                            />
                                        )}
                                    </form.Field>

                                    {/* Repeat Email */}
                                    <form.Field name="repeatEmail">
                                        {(field) => (
                                            <Input
                                                type="email"
                                                label={t('register.repeat_email')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={80}
                                                inputMode="email"
                                            />
                                        )}
                                    </form.Field>

                                    {/* Login Link */}
                                    <div className="col-span-1 md:col-span-2">
                                        <div className="mt-1 flex items-center justify-center md:justify-start">
                                            <span className="text-[15px] md:text-[16px] font-helvetica font-normal text-[#98AAC0]">
                                                {t('register.already_account')}
                                                <Link
                                                    to="/"
                                                    className="pl-1.5 text-[#ff336d] no-underline font-medium hover:underline"
                                                >
                                                    {t('register.log_in')}
                                                </Link>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={form.state.isSubmitting}
                                    className="w-full bg-[#252E39] text-[#ECF0F5] text-[16px] font-helvetica font-medium py-4 rounded-[10px] 
                                        hover:bg-[#1a2129] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {form.state.isSubmitting ? t('register.saving') : t('register.continue')}
                                </button>

                                {/* Terms */}
                                <div className="flex items-center justify-center flex-col md:flex-row mt-2 gap-0.5">
                                    <p className="text-[14px] font-helvetica font-normal text-[#98AAC0]">
                                        {t('register.termsText')}
                                    </p>
                                    <Link
                                        to="/"
                                        className="text-[14px] font-helvetica font-semibold text-[#98AAC0] underline hover:text-[#252E39] transition-colors"
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
    );
};

export default Register;
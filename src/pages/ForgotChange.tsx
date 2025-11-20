import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { LogoCutIcon } from '@/components/icons';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/common/ElementsForm';

const ForgotChange = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    // Validations
    const validators = {
        email: (value: string) => {
            if (!value) return t('forgot_change.email_required');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('forgot_change.email_invalid');
        },
        repeatEmail: (email: any, repeatEmail: any) => {
            if (!repeatEmail) return t('forgot_change.repeat_email_required');
            if (email !== repeatEmail) return t('forgot_change.emails_not_match');
        }
    };

    const form = useForm({
        defaultValues: {
            email: '',
            repeatEmail: ''
        },
        validators: {
            onSubmit: ({ value }) => {
                const validationErrors: Record<string, string> = {};

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
            navigate({
                to: '/verify',
                state: {
                    verification: 'email',
                    forgot: true,
                    id: (location.state as { id?: string })?.id,
                    token: (location.state as { token?: string })?.token,
                    email: value.email
                } as any
            });
        }
    });

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
                            {t('forgot_change.title')}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-[15px] md:text-[16px] font-helvetica font-normal text-[#98AAC0] mb-1">
                            {t('forgot_change.subtitle')}
                        </p>

                        {/* Form */}
                        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                            <div className="flex flex-col gap-4 mt-1">
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Email */}
                                    <form.Field name="email">
                                        {(field) => (
                                            <Input
                                                type="email"
                                                label={t('forgot_change.email')}
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
                                                label={t('forgot_change.repeat_email')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={80}
                                                inputMode="email"
                                            />
                                        )}
                                    </form.Field>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={form.state.isSubmitting}
                                    className="w-full bg-[#252E39] text-[#ECF0F5] text-[16px] font-helvetica font-medium py-4 rounded-[10px] 
                                        hover:bg-[#1a2129] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {form.state.isSubmitting ? t('forgot_change.submitting') : t('forgot_change.continue')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotChange;
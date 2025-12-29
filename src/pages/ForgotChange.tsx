import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { LogoIcon, LogoCutIcon } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';

import axiosInstance from '@/config/axiosConfig';
import InputText from '@/components/ui/InputText';
import Button from '@/components/ui/Button';

const ForgotChange = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

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

    const sendEmailMutation = useMutation({
        mutationFn: async (data: { currentEmail: string, email: string }) => {
            const response = await axiosInstance.post('/v2/email/send', data);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            navigate({
                to: '/verify',
                state: {
                    verification: 'email',
                    forgot: true,
                    id: (location.state as { id?: string })?.id,
                    token: (location.state as { token?: string })?.token,
                    currentEmail: (location.state as { currentEmail?: string })?.currentEmail,
                    email: variables.email
                } as any
            });
        },
        onError: (error: any) => {
            if (error.backendError) {
                toast.error(error.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

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
            sendEmailMutation.mutate({
                currentEmail: (location.state as { currentEmail?: string })?.currentEmail!,
                email: value.email,
            });
        }
    });

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
                            <h1 className="text-[28px] md:text-[30px] font-medium text-center font-n27 text-[#ff336d]">
                                {t('forgot_change.title')}
                            </h1>

                            <p className="text-[14px] md:text-[16px] font-normal text-center font-helvetica text-[#F6F6F6]">
                                {t('forgot_change.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-10 w-full">
                            <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-8">
                                        <form.Field name="email">
                                            {(field) => (
                                                <InputText
                                                    type="email"
                                                    label={`${t('forgot_change.email')}*`}
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
                                                    label={`${t('forgot_change.repeat_email')}*`}
                                                    value={field.state.value || ''}
                                                    onChange={field.handleChange}
                                                    error={field.state.meta.errors?.[0]}
                                                    maxLength={80}
                                                    inputMode="email"
                                                />
                                            )}
                                        </form.Field>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="cta"
                                        disabled={form.state.isSubmitting}
                                        isLoading={form.state.isSubmitting}
                                    >
                                        {t('forgot_change.continue')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotChange;
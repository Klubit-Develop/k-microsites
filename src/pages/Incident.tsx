import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { LogoIcon, LogoCutIcon } from '@/components/icons';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import InputText from '@/components/ui/InputText';
import InputTextArea from '@/components/ui/InputTextArea';
import Button from '@/components/ui/Button';

const Incident = () => {
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();

    const incidentMutation = useMutation({
        mutationFn: async (incidentData: {
            name: string;
            email: string;
            subject: string;
            message: string;
        }) => {
            return await axiosInstance.post(`/v2/incidents?lang=${i18n.language}`, incidentData);
        },
        onSuccess: () => {
            toast.success(t('incident.success'));
            setTimeout(() => {
                navigate({ to: '/' });
            }, 2000);
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
        name: (value: string | any[]) => {
            if (!value) return t('incident.name_required');
            if (value.length < 2) return t('incident.name_min_length');
            if (value.length > 100) return t('incident.name_max_length');
        },
        email: (value: string) => {
            if (!value) return t('incident.email_required');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('incident.email_invalid');
        },
        subject: (value: string | any[]) => {
            if (!value) return t('incident.subject_required');
            if (value.length < 5) return t('incident.subject_min_length');
            if (value.length > 150) return t('incident.subject_max_length');
        },
        message: (value: string | any[]) => {
            if (!value) return t('incident.message_required');
            if (value.length < 10) return t('incident.message_min_length');
            if (value.length > 1000) return t('incident.message_max_length');
        }
    };

    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            subject: '',
            message: ''
        },
        validators: {
            onSubmit: ({ value }) => {
                const validationErrors: Record<string, string> = {};

                const nameError = validators.name(value.name);
                if (nameError) validationErrors.name = nameError;

                const emailError = validators.email(value.email);
                if (emailError) validationErrors.email = emailError;

                const subjectError = validators.subject(value.subject);
                if (subjectError) validationErrors.subject = subjectError;

                const messageError = validators.message(value.message);
                if (messageError) validationErrors.message = messageError;

                if (Object.keys(validationErrors).length > 0) {
                    return validationErrors;
                }
            }
        },
        onSubmit: async ({ value }) => {
            await incidentMutation.mutateAsync({
                name: value.name,
                email: value.email,
                subject: value.subject,
                message: value.message
            });
        }
    });

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
                                {t('incident.title')}
                            </h1>

                            <p className="text-[14px] md:text-[16px] font-normal font-helvetica text-center text-[#98AAC0]">
                                {t('incident.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-10 w-full">
                            <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-4">
                                        <form.Field name="name">
                                            {(field) => (
                                                <InputText
                                                    label={`${t('incident.name')}*`}
                                                    value={field.state.value || ''}
                                                    onChange={field.handleChange}
                                                    error={field.state.meta.errors?.[0]}
                                                    maxLength={100}
                                                />
                                            )}
                                        </form.Field>

                                        <form.Field name="email">
                                            {(field) => (
                                                <InputText
                                                    type="email"
                                                    label={`${t('incident.email')}*`}
                                                    value={field.state.value || ''}
                                                    onChange={field.handleChange}
                                                    error={field.state.meta.errors?.[0]}
                                                    maxLength={80}
                                                    inputMode="email"
                                                />
                                            )}
                                        </form.Field>

                                        <form.Field name="subject">
                                            {(field) => (
                                                <InputText
                                                    label={`${t('incident.subject')}*`}
                                                    value={field.state.value || ''}
                                                    onChange={field.handleChange}
                                                    error={field.state.meta.errors?.[0]}
                                                    maxLength={150}
                                                />
                                            )}
                                        </form.Field>

                                        <form.Field name="message">
                                            {(field) => (
                                                <InputTextArea
                                                    label={`${t('incident.message')}* (${t('incident.message_max_length')})`}
                                                    value={field.state.value || ''}
                                                    onChange={field.handleChange}
                                                    error={field.state.meta.errors?.[0]}
                                                    maxLength={500}
                                                />
                                            )}
                                        </form.Field>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={form.state.isSubmitting}
                                        isLoading={form.state.isSubmitting}
                                    >
                                        {t('incident.submit')}
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

export default Incident;
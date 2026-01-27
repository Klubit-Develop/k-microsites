import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { LogoIcon } from '@/components/icons';
import { useNavigate, Link } from '@tanstack/react-router';
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
        <div className="w-full flex-1 relative flex flex-col lg:flex-row items-center lg:items-stretch p-4 lg:p-[42px]">
            <div 
                className="absolute inset-0 bg-[#050505] -z-20"
                aria-hidden="true"
            />
            <div 
                className="absolute inset-0 -z-10 opacity-75"
                style={{
                    backgroundImage: 'url(https://klubit.fra1.cdn.digitaloceanspaces.com/background-auth.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
                aria-hidden="true"
            />
            <div 
                className="absolute inset-0 -z-[5] bg-gradient-to-t lg:bg-gradient-to-r from-[#050505] lg:from-[rgba(5,5,5,0.75)] from-[35%] lg:from-0% to-[rgba(5,5,5,0.5)] lg:to-[rgba(5,5,5,0.38)]"
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
                                {t('incident.title')}
                            </h2>
                            <p className="text-[16px] font-medium font-helvetica text-[#939393] leading-normal">
                                {t('incident.subtitle')}
                            </p>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-3">
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
                                    variant="cta"
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

            <div className="hidden lg:flex w-[600px] shrink-0 flex-col items-center justify-center">
                <div className="w-full h-full bg-[#141414] border-[2.5px] border-[#232323] rounded-[24px] shadow-[0px_0px_30px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center px-[90px] py-[72px] gap-[42px]">
                    <div className="flex flex-col gap-4 items-center text-center w-full" style={{ textShadow: '0px 0px 30px black' }}>
                        <h2 className="text-[32px] font-semibold font-borna text-[#F6F6F6] leading-tight">
                            {t('incident.title')}
                        </h2>
                        <p className="text-[16px] font-medium font-helvetica text-[#939393] leading-normal">
                            {t('incident.subtitle')}
                        </p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-3">
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
                                variant="cta"
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
    );
};

export default Incident;
import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { LogoCutIcon } from '@/components/icons';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import { Input } from '@/components/common/ElementsForm';

interface TextareaProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    maxLength?: number;
    rows?: number;
}

const Textarea = ({
    label,
    value,
    onChange,
    error,
    maxLength,
    rows = 5
}: TextareaProps) => {
    const id = label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="flex flex-col items-start gap-0">
            <label className="text-[#98AAC0] text-[13px] font-helvetica font-medium mb-0 pl-3">
                {label}
            </label>
            <div className="w-full">
                <textarea
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={maxLength}
                    rows={rows}
                    className={`
                        w-full px-3 py-2.5 bg-transparent 
                        border ${error ? 'border-red-500' : 'border-[#CCCCCC]'}
                        hover:border-[#252E39] focus:border-[#252E39] focus:outline-none 
                        text-[#252E39] text-lg font-helvetica transition-colors
                        rounded-lg resize-none
                    `}
                />
                {error && <p className="text-red-500 text-xs mt-1 pl-3 font-helvetica">{error}</p>}
            </div>
        </div>
    );
};

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
            // Redirigir al login después de 2 segundos
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

    // Validations
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
                            {t('incident.title')}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-[15px] md:text-[16px] font-helvetica font-normal text-[#98AAC0] mb-1">
                            {t('incident.subtitle')}
                        </p>

                        {/* Form */}
                        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                            <div className="flex flex-col gap-4 mt-1">
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Name */}
                                    <form.Field name="name">
                                        {(field) => (
                                            <Input
                                                label={t('incident.name')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={100}
                                            />
                                        )}
                                    </form.Field>

                                    {/* Email */}
                                    <form.Field name="email">
                                        {(field) => (
                                            <Input
                                                type="email"
                                                label={t('incident.email')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={80}
                                                inputMode="email"
                                            />
                                        )}
                                    </form.Field>

                                    {/* Subject */}
                                    <form.Field name="subject">
                                        {(field) => (
                                            <Input
                                                label={t('incident.subject')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={150}
                                            />
                                        )}
                                    </form.Field>

                                    {/* Message */}
                                    <form.Field name="message">
                                        {(field) => (
                                            <Textarea
                                                label={t('incident.message')}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={1000}
                                                rows={5}
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
                                    {form.state.isSubmitting ? t('incident.submitting') : t('incident.submit')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Incident;
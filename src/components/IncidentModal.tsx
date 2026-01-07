import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';
import Modal from '@/components/ui/Modal';
import InputText from '@/components/ui/InputText';
import InputTextArea from '@/components/ui/InputTextArea';
import Button from '@/components/ui/Button';

// =============================================================================
// TYPES
// =============================================================================

interface IncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Contexto opcional para pre-rellenar el asunto (ej: "Problema con evento X") */
    context?: {
        eventName?: string;
        transactionId?: string;
    };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const IncidentModal = ({ isOpen, onClose, context }: IncidentModalProps) => {
    const { i18n, t } = useTranslation();
    const { user } = useAuthStore();

    // Detectar si el usuario está autenticado
    const isAuthenticated = !!user?.email;

    const handleClose = () => {
        if (!incidentMutation.isPending) {
            form.reset();
            onClose();
        }
    };

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
            toast.success(t('incident.success', 'Incidencia enviada correctamente'));
            form.reset();
            onClose();
        },
        onError: (error: any) => {
            if (error.backendError) {
                toast.error(error.backendError.message);
            } else {
                toast.error(t('common.error_connection', 'Error de conexión'));
            }
        }
    });

    const validators = {
        name: (value: string | any[]) => {
            if (!isAuthenticated) {
                if (!value) return t('incident.name_required', 'El nombre es obligatorio');
                if (value.length < 2) return t('incident.name_min_length', 'El nombre debe tener al menos 2 caracteres');
                if (value.length > 100) return t('incident.name_max_length', 'El nombre no puede superar los 100 caracteres');
            }
        },
        email: (value: string) => {
            if (!isAuthenticated) {
                if (!value) return t('incident.email_required', 'El email es obligatorio');
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('incident.email_invalid', 'El email no es válido');
            }
        },
        subject: (value: string | any[]) => {
            if (!value) return t('incident.subject_required', 'El asunto es obligatorio');
            if (value.length < 5) return t('incident.subject_min_length', 'El asunto debe tener al menos 5 caracteres');
            if (value.length > 150) return t('incident.subject_max_length', 'El asunto no puede superar los 150 caracteres');
        },
        message: (value: string | any[]) => {
            if (!value) return t('incident.message_required', 'El mensaje es obligatorio');
            if (value.length < 10) return t('incident.message_min_length', 'El mensaje debe tener al menos 10 caracteres');
            if (value.length > 1000) return t('incident.message_max_length', 'El mensaje no puede superar los 1000 caracteres');
        }
    };

    // Generar asunto por defecto si hay contexto
    const defaultSubject = context?.eventName
        ? `${t('incident.issue_with', 'Problema con')}: ${context.eventName}`
        : '';

    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            subject: defaultSubject,
            message: ''
        },
        validators: {
            onSubmit: ({ value }) => {
                const validationErrors: Record<string, string> = {};

                // Solo validar name y email si no está autenticado
                if (!isAuthenticated) {
                    const nameError = validators.name(value.name);
                    if (nameError) validationErrors.name = nameError;

                    const emailError = validators.email(value.email);
                    if (emailError) validationErrors.email = emailError;
                }

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
            // Añadir contexto al mensaje si existe
            let fullMessage = value.message;
            if (context?.transactionId) {
                fullMessage = `[Transaction ID: ${context.transactionId}]\n\n${value.message}`;
            }

            // Usar datos del usuario si está autenticado, sino usar los del formulario
            const name = isAuthenticated
                ? `${user.firstName} ${user.lastName}`.trim() || user.email
                : value.name;
            const email = isAuthenticated ? user.email : value.email;

            await incidentMutation.mutateAsync({
                name,
                email,
                subject: value.subject,
                message: fullMessage
            });
        }
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            isLoading={incidentMutation.isPending}
        >
            <div className="flex flex-col gap-6 w-full">
                {/* Header */}
                <div className="flex flex-col gap-2 items-center px-4 w-full">
                    <h2
                        className="text-[#F6F6F6] text-[24px] font-semibold text-center w-full"
                        style={{ fontFamily: "'Borna', sans-serif" }}
                    >
                        {t('incident.title', 'Reportar incidencia')}
                    </h2>
                    <p className="text-[#939393] text-[14px] font-medium text-center w-full font-helvetica">
                        {t('incident.subtitle', 'Describe tu problema y nuestro equipo lo revisará lo antes posible.')}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="w-full">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4">
                            {/* Campos de nombre y email solo si NO está autenticado */}
                            {!isAuthenticated && (
                                <>
                                    <form.Field name="name">
                                        {(field) => (
                                            <InputText
                                                label={`${t('incident.name', 'Nombre')}*`}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={100}
                                                placeholder={t('incident.name_placeholder', '')}
                                            />
                                        )}
                                    </form.Field>

                                    <form.Field name="email">
                                        {(field) => (
                                            <InputText
                                                type="email"
                                                label={`${t('incident.email', 'Email')}*`}
                                                value={field.state.value || ''}
                                                onChange={field.handleChange}
                                                error={field.state.meta.errors?.[0]}
                                                maxLength={80}
                                                inputMode="email"
                                                placeholder={t('incident.email_placeholder', '')}
                                            />
                                        )}
                                    </form.Field>
                                </>
                            )}

                            <form.Field name="subject">
                                {(field) => (
                                    <InputText
                                        label={`${t('incident.subject', 'Asunto')}*`}
                                        value={field.state.value || ''}
                                        onChange={field.handleChange}
                                        error={field.state.meta.errors?.[0]}
                                        maxLength={150}
                                        placeholder={t('incident.subject_placeholder', '')}
                                    />
                                )}
                            </form.Field>

                            <form.Field name="message">
                                {(field) => (
                                    <InputTextArea
                                        label={`${t('incident.message', 'Mensaje')}*`}
                                        value={field.state.value || ''}
                                        onChange={field.handleChange}
                                        error={field.state.meta.errors?.[0]}
                                        maxLength={1000}
                                        placeholder={t('incident.message_placeholder', '')}
                                    />
                                )}
                            </form.Field>
                        </div>

                        {/* User info preview - solo si está autenticado */}
                        {isAuthenticated && user && (
                            <div className="flex flex-col gap-2 p-4 bg-[#141414] rounded-xl border border-[#232323]">
                                <span className="text-xs font-helvetica text-[#939393]">
                                    {t('incident.sending_as', 'Enviando como')}:
                                </span>
                                <div className="flex items-center gap-3">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.firstName}
                                            className="w-8 h-8 rounded-full object-cover border border-[#232323]"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#232323] flex items-center justify-center">
                                            <span className="text-sm font-medium text-[#F6F6F6]">
                                                {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium font-helvetica text-[#F6F6F6]">
                                            {user.firstName} {user.lastName}
                                        </span>
                                        <span className="text-xs font-helvetica text-[#939393]">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-2 w-full">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={incidentMutation.isPending}
                                className="flex-1 h-12 px-6 bg-[#232323] text-[#F6F6F6] font-bold text-[16px] font-helvetica rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('common.cancel', 'Cancelar')}
                            </button>

                            <Button
                                type="submit"
                                variant="cta"
                                disabled={form.state.isSubmitting || incidentMutation.isPending}
                                isLoading={form.state.isSubmitting || incidentMutation.isPending}
                                className="flex-1"
                            >
                                {t('incident.submit', 'Enviar')}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default IncidentModal;
export type { IncidentModalProps };
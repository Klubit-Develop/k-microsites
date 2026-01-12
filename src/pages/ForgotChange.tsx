import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Route } from '@/routes/forgot-change';

import { LogoIcon, LogoCutIcon } from '@/components/icons';
import InputText from '@/components/ui/InputText';
import Button from '@/components/ui/Button';
import axiosInstance from '@/config/axiosConfig';

interface BackendResponse {
    status: 'success' | 'error';
    code: string;
    data: Record<string, unknown>;
    message: string;
    details: string;
}

const ForgotChangePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const searchParams = Route.useSearch();

    const { id, token, currentEmail } = searchParams;

    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);

    const [errors, setErrors] = useState<{
        email?: string;
        confirmEmail?: string;
    }>({});

    useEffect(() => {
        if (!id || !token) {
            navigate({ to: '/forgot' });
        }
    }, [id, token, navigate]);

    const sendEmailMutation = useMutation({
        mutationFn: async (data: { email: string; currentEmail?: string }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/email/send', data);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.status === 'success') {
                if (pendingEmail) {
                    navigate({
                        to: '/verify',
                        search: {
                            verification: 'email',
                            isForgot: 'true',
                            email: pendingEmail
                        }
                    });
                }
            } else {
                toast.error(response.message || response.details);
            }
            setPendingEmail(null);
        },
        onError: (error: { backendError?: { message: string } }) => {
            setPendingEmail(null);
            if (error.backendError) {
                toast.error(error.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const changeEmailMutation = useMutation({
        mutationFn: async (data: { userId: string; newEmail: string }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/auth/forgot-change', data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        },
        onSuccess: (response: BackendResponse) => {
            if (response.status === 'success') {
                const newEmail = email.trim().toLowerCase();
                
                setPendingEmail(newEmail);
                
                sendEmailMutation.mutate({
                    email: newEmail,
                    currentEmail: currentEmail || undefined
                });
            } else {
                toast.error(response.message || response.details);
            }
        },
        onError: (error: { backendError?: { message: string; code?: string } }) => {
            if (error.backendError) {
                if (error.backendError.code === 'EMAIL_ALREADY_EXISTS') {
                    setErrors(prev => ({ ...prev, email: t('forgot_change.email_already_exists') }));
                } else {
                    toast.error(error.backendError.message);
                }
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: typeof errors = {};

        if (!email.trim()) {
            newErrors.email = t('forgot_change.email_required');
        } else if (!validateEmail(email)) {
            newErrors.email = t('forgot_change.email_invalid');
        }

        if (!confirmEmail.trim()) {
            newErrors.confirmEmail = t('forgot_change.confirm_email_required');
        } else if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
            newErrors.confirmEmail = t('forgot_change.emails_do_not_match');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        changeEmailMutation.mutate({
            userId: id || '',
            newEmail: email.trim().toLowerCase()
        });
    };

    const isLoading = changeEmailMutation.isPending || sendEmailMutation.isPending;

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
                    <div className="flex flex-col gap-8 items-center text-center lg:text-left">
                        <div className="lg:hidden">
                            <LogoIcon width={160} height={90} />
                        </div>

                        <div className="flex flex-col gap-4 w-full">
                            <h1 className="text-[28px] md:text-[30px] font-medium font-n27 text-center text-[#ff336d]">
                                {t('forgot_change.title')}
                            </h1>

                            <p className="text-[14px] md:text-[16px] font-normal font-helvetica text-center text-[#F6F6F6]">
                                {t('forgot_change.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="flex flex-col gap-5">
                                    <InputText
                                        label={`${t('forgot_change.new_email')}*`}
                                        placeholder={t('forgot_change.new_email_placeholder')}
                                        value={email}
                                        onChange={(val) => {
                                            setEmail(val);
                                            if (errors.email) {
                                                setErrors(prev => ({ ...prev, email: undefined }));
                                            }
                                        }}
                                        error={errors.email}
                                        disabled={isLoading}
                                    />

                                    <InputText
                                        label={`${t('forgot_change.confirm_email')}*`}
                                        placeholder={t('forgot_change.confirm_email_placeholder')}
                                        value={confirmEmail}
                                        onChange={(val) => {
                                            setConfirmEmail(val);
                                            if (errors.confirmEmail) {
                                                setErrors(prev => ({ ...prev, confirmEmail: undefined }));
                                            }
                                        }}
                                        error={errors.confirmEmail}
                                        disabled={isLoading}
                                    />

                                    <Button
                                        type="submit"
                                        variant="cta"
                                        disabled={isLoading}
                                        isLoading={isLoading}
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

export default ForgotChangePage;
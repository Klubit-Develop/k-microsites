import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Route } from '@/routes/forgot-change';

import { LogoIcon } from '@/components/icons';
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

interface PendingNavigation {
    email: string;
}

const ForgotChangePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const searchParams = Route.useSearch();

    const { id, token, currentEmail } = searchParams;

    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

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
                if (pendingNavigation) {
                    navigate({
                        to: '/verify',
                        search: {
                            verification: 'email',
                            isForgot: 'true',
                            email: pendingNavigation.email
                        }
                    });
                }
            } else {
                toast.error(response.message || response.details);
            }
            setPendingNavigation(null);
        },
        onError: (error: { backendError?: { message: string } }) => {
            setPendingNavigation(null);
            if (error.backendError) {
                toast.error(error.backendError.message);
            } else {
                toast.error(t('common.error_connection'));
            }
        }
    });

    const changeEmailMutation = useMutation({
        mutationFn: async (data: { email: string }) => {
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
                
                setPendingNavigation({
                    email: newEmail
                });
                
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
                if (error.backendError.code === 'EMAIL_ALREADY_EXISTS' || error.backendError.code === 'EMAIL_ALREADY_IN_USE') {
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
            newErrors.confirmEmail = t('forgot_change.repeat_email_required');
        } else if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
            newErrors.confirmEmail = t('forgot_change.emails_not_match');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        changeEmailMutation.mutate({
            email: email.trim().toLowerCase()
        });
    };

    const isLoading = changeEmailMutation.isPending || sendEmailMutation.isPending;

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
                <div className="absolute top-0 left-0">
                    <LogoIcon width={149} height={42} />
                </div>

                <div className="flex flex-col gap-4 items-center text-center w-full max-w-[600px] px-8" style={{ textShadow: '0px 0px 12px rgba(0, 0, 0, 0.5)' }}>
                    <p className="text-[32px] font-medium font-helvetica text-[#939393] leading-none">
                        {t('login.welcome')}
                    </p>
                    <h1 className="text-[64px] font-semibold font-borna text-[#F6F6F6] leading-none">
                        {t('login.hero_title')}
                    </h1>
                </div>
            </div>

            <div className="lg:hidden w-full flex flex-col items-center flex-1 justify-center">
                <div className="flex flex-col items-center w-full max-w-[390px] gap-12">
                    <LogoIcon width={149} height={42} />
                    
                    <div className="flex flex-col gap-8 w-full">
                        <div className="flex flex-col gap-2 items-center text-center w-full" style={{ textShadow: '0px 0px 30px black' }}>
                            <h2 className="text-[24px] font-semibold font-borna text-[#F6F6F6] leading-tight">
                                {t('forgot_change.title')}
                            </h2>
                            <p className="text-[16px] font-medium font-helvetica text-[#939393] leading-normal">
                                {t('forgot_change.subtitle')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="w-full">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-3">
                                    <InputText
                                        type="email"
                                        label={`${t('forgot_change.email')}*`}
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
                                        type="email"
                                        label={`${t('forgot_change.repeat_email')}*`}
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
                                </div>

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

            <div className="hidden lg:flex w-[600px] shrink-0 flex-col items-center justify-center">
                <div className="w-full h-full bg-[#141414] border-[2.5px] border-[#232323] rounded-[24px] shadow-[0px_0px_30px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center px-[90px] py-[72px] gap-[42px]">
                    <div className="flex flex-col gap-4 items-center text-center w-full" style={{ textShadow: '0px 0px 30px black' }}>
                        <h2 className="text-[32px] font-semibold font-borna text-[#F6F6F6] leading-tight">
                            {t('forgot_change.title')}
                        </h2>
                        <p className="text-[16px] font-medium font-helvetica text-[#939393] leading-normal">
                            {t('forgot_change.subtitle')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full">
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-3">
                                <InputText
                                    type="email"
                                    label={`${t('forgot_change.email')}*`}
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
                                    type="email"
                                    label={`${t('forgot_change.repeat_email')}*`}
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
                            </div>

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
    );
};

export default ForgotChangePage;
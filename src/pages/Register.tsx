import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Route } from '@/routes/register';

import { LogoIcon, LogoCutIcon } from '@/components/icons';
import InputText from '@/components/ui/InputText';
import InputDate from '@/components/ui/InputDate';
import Select from '@/components/ui/Select';
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
    country: string;
    phone: string;
}

const generateUsername = (firstName: string, lastName: string): string => {
    const base = `${firstName}_${lastName}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w]+/g, '')
        .replace(/__+/g, '_')
        .replace(/^_+/, '')
        .replace(/_+$/, '');
    
    const randomNum = Math.floor(Math.random() * 1000);
    return `${base}${randomNum}`;
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const searchParams = Route.useSearch();

    const { country, phone, oauthEmail, oauthProvider, oauthFirstName, oauthLastName } = searchParams;

    const [firstName, setFirstName] = useState(oauthFirstName || '');
    const [lastName, setLastName] = useState(oauthLastName || '');
    const [email, setEmail] = useState(oauthEmail || '');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');
    const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

    const [errors, setErrors] = useState<{
        firstName?: string;
        lastName?: string;
        email?: string;
        birthDate?: string;
        gender?: string;
    }>({});

    useEffect(() => {
        if (!country || !phone) {
            navigate({ to: '/auth' });
        }
    }, [country, phone, navigate]);

    const sendEmailMutation = useMutation({
        mutationFn: async (data: { email: string }) => {
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
                            email: pendingNavigation.email,
                            country: pendingNavigation.country,
                            phone: pendingNavigation.phone
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

    const registerMutation = useMutation({
        mutationFn: async (data: {
            firstName: string;
            lastName: string;
            username: string;
            email: string;
            birthdate: string;
            gender: string;
            country: string;
            phone: string;
            oauthProvider?: string;
        }) => {
            const response = await axiosInstance.post<BackendResponse>('/v2/auth/register', data);
            return response.data;
        },
        onSuccess: (response: BackendResponse) => {
            if (response.status === 'success') {
                if (oauthProvider && oauthEmail) {
                    setPendingNavigation({
                        email: oauthEmail,
                        country: country || '',
                        phone: phone || ''
                    });
                    sendEmailMutation.mutate({ email: oauthEmail });
                } else {
                    setPendingNavigation({
                        email,
                        country: country || '',
                        phone: phone || ''
                    });
                    sendEmailMutation.mutate({ email });
                }
            } else {
                toast.error(response.message || response.details);
            }
        },
        onError: (error: { backendError?: { message: string; code?: string } }) => {
            if (error.backendError) {
                if (error.backendError.code === 'EMAIL_ALREADY_EXISTS') {
                    setErrors(prev => ({ ...prev, email: t('register.email_already_exists') }));
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

    const validateAge = (birthDate: string): boolean => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age >= 18;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: typeof errors = {};

        if (!firstName.trim()) {
            newErrors.firstName = t('register.first_name_required');
        }

        if (!lastName.trim()) {
            newErrors.lastName = t('register.last_name_required');
        }

        if (!email.trim()) {
            newErrors.email = t('register.email_required');
        } else if (!validateEmail(email)) {
            newErrors.email = t('register.email_invalid');
        }

        if (!birthDate) {
            newErrors.birthDate = t('register.birth_date_required');
        } else if (!validateAge(birthDate)) {
            newErrors.birthDate = t('register.must_be_18');
        }

        if (!gender) {
            newErrors.gender = t('register.gender_required');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        const username = generateUsername(firstName.trim(), lastName.trim());

        registerMutation.mutate({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username,
            email: email.trim().toLowerCase(),
            birthdate: new Date(birthDate).toISOString(),
            gender: gender.toUpperCase(),
            country: country || '',
            phone: phone || '',
            ...(oauthProvider && { oauthProvider })
        });
    };

    const genderOptions = [
        { value: 'male', label: t('register.male') },
        { value: 'female', label: t('register.female') },
        { value: 'other', label: t('register.other') }
    ];

    const isLoading = registerMutation.isPending || sendEmailMutation.isPending;

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
                                {t('register.title')}
                            </h1>

                            <p className="text-[14px] md:text-[16px] font-normal font-helvetica text-center text-[#F6F6F6]">
                                {t('register.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="flex flex-col gap-5">
                                    <InputText
                                        label={`${t('register.first_name')}*`}
                                        placeholder={t('register.first_name_placeholder')}
                                        value={firstName}
                                        onChange={setFirstName}
                                        error={errors.firstName}
                                        disabled={isLoading}
                                    />

                                    <InputText
                                        label={`${t('register.last_name')}*`}
                                        placeholder={t('register.last_name_placeholder')}
                                        value={lastName}
                                        onChange={setLastName}
                                        error={errors.lastName}
                                        disabled={isLoading}
                                    />

                                    <InputText
                                        label={`${t('register.email')}*`}
                                        placeholder={t('register.email_placeholder')}
                                        value={email}
                                        onChange={(val) => {
                                            setEmail(val);
                                            if (errors.email) {
                                                setErrors(prev => ({ ...prev, email: undefined }));
                                            }
                                        }}
                                        error={errors.email}
                                        disabled={isLoading || !!oauthEmail}
                                    />

                                    <InputDate
                                        label={`${t('register.birth_date')}*`}
                                        value={birthDate}
                                        onChange={setBirthDate}
                                        error={errors.birthDate}
                                        disabled={isLoading}
                                    />

                                    <Select
                                        label={`${t('register.gender')}*`}
                                        placeholder={t('register.gender_placeholder')}
                                        value={gender}
                                        onChange={setGender}
                                        options={genderOptions}
                                        error={errors.gender}
                                        disabled={isLoading}
                                    />

                                    <Button
                                        type="submit"
                                        variant="cta"
                                        disabled={isLoading}
                                        isLoading={isLoading}
                                    >
                                        {t('register.continue')}
                                    </Button>
                                </div>
                            </form>

                            <div className="flex flex-col gap-4 mt-2">
                                <div className="flex items-center justify-center text-center">
                                    <p className="text-[12px] sm:text-[13px] font-helvetica font-normal text-[#F6F6F6]">
                                        {t('register.termsText')}{' '}
                                        <Link
                                            to="/terms-and-conditions"
                                            className="font-semibold text-[#F6F6F6] underline hover:text-[#98AAC0] transition-colors cursor-pointer"
                                        >
                                            {t('register.termsLink')}
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
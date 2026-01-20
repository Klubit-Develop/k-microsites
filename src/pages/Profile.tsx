import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import dayjs from 'dayjs';

import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';
import { countries } from '@/utils/countries';

import PageError from '@/components/common/PageError';
import InputText from '@/components/ui/InputText';
import InputDate from '@/components/ui/InputDate';
import InputTextPhone from '@/components/ui/InputTextPhone';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import OTPInput from '@/components/ui/OTPInput';
import { PlusIcon } from '@/components/icons';

interface AvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
    hasAvatar: boolean;
    onUpload: () => void;
    onRemove: () => void;
    isLoading?: boolean;
}

const AvatarModal = ({ isOpen, onClose, hasAvatar, onUpload, onRemove, isLoading = false }: AvatarModalProps) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-6 w-full">
                <div className="flex flex-col gap-4 items-center px-4 w-full">
                    <div className="flex items-center justify-center size-[120px] p-1">
                        <img 
                            src="https://klubit.fra1.cdn.digitaloceanspaces.com/icon-camera.png" 
                            alt="" 
                            className="w-full h-full object-contain" 
                        />
                    </div>

                    <h2
                        className="text-[#F6F6F6] text-[24px] font-semibold text-center w-full"
                        style={{ fontFamily: "'Borna', sans-serif" }}
                    >
                        {t('profile.avatar_modal_title', 'Sube una imagen de perfil')}
                    </h2>

                    <p className="text-[#939393] text-[16px] font-medium text-center w-full font-helvetica">
                        {t('profile.avatar_modal_description', 'Sube una imagen en formato JPG o PNG (máx. 5 MB). Para mejor calidad, usa una foto cuadrada de al menos 400x400 px.')}
                    </p>
                </div>
            </div>

            <div className="flex gap-2 w-full">
                {hasAvatar && (
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={isLoading}
                        className="flex-1 h-12 px-6 bg-[rgba(255,35,35,0.25)] text-[#FF2323] font-bold text-[16px] font-helvetica rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('profile.avatar_remove', 'Quitar')}
                    </button>
                )}
                <button
                    type="button"
                    onClick={onUpload}
                    disabled={isLoading}
                    className={`${hasAvatar ? 'flex-1' : 'w-full'} h-12 px-6 bg-[#232323] text-[#F6F6F6] font-bold text-[16px] font-helvetica rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isLoading ? t('common.loading', 'Cargando...') : t('profile.avatar_upload', 'Subir')}
                </button>
            </div>
        </Modal>
    );
};

interface VerifyPhoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    country: string;
    phone: string;
    onSuccess: (user: any) => void;
}

const VerifyPhoneModal = ({ isOpen, onClose, country, phone, onSuccess }: VerifyPhoneModalProps) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const [otpValue, setOtpValue] = useState('');
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setOtpValue('');
            setCountdown(0);
        }
    }, [isOpen]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const verifyMutation = useMutation({
        mutationFn: async (code: string) => {
            const lang = i18n.language === 'en' ? 'en' : 'es';
            const response = await axiosInstance.post(`/v2/sms/validate?lang=${lang}`, {
                country,
                phone: phone.replace(/\s/g, ''),
                code,
                isUpdatePhone: true,
                userId: user.id
            });
            return response.data;
        },
        onSuccess: (response) => {
            if (response.data?.verified && response.data?.phoneUpdated) {
                onSuccess(response.data.user);
                onClose();
                toast.success(t('profile.phone_success', 'Teléfono actualizado correctamente'));
            }
        },
        onError: () => {
            toast.error(t('profile.verify_phone_error', 'Código inválido'));
        }
    });

    const resendMutation = useMutation({
        mutationFn: async () => {
            const lang = i18n.language === 'en' ? 'en' : 'es';
            return await axiosInstance.post(`/v2/sms/resend?lang=${lang}`, {
                country,
                phone: phone.replace(/\s/g, ''),
            });
        },
        onSuccess: () => {
            setOtpValue('');
            setCountdown(30);
            toast.success(t('profile.code_resent', 'Código reenviado'));
        },
        onError: () => {
            toast.error(t('verify.error_resend', 'Error al reenviar el código'));
        }
    });

    const handleVerify = () => {
        if (!otpValue || otpValue.length !== 6) {
            toast.error(t('verify.enter_valid_code', 'Ingresa un código válido de 6 dígitos'));
            return;
        }
        verifyMutation.mutate(otpValue);
    };

    const handleResend = () => {
        if (countdown > 0) return;
        resendMutation.mutate();
    };

    const isLoading = verifyMutation.isPending;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-6 w-full">
                <div className="flex flex-col gap-4 items-center px-4 w-full">
                    <div className="flex items-center justify-center size-[120px] p-1">
                        <img 
                            src="https://klubit.fra1.cdn.digitaloceanspaces.com/icon-phone.png" 
                            alt="" 
                            className="w-full h-full object-contain" 
                        />
                    </div>

                    <h2
                        className="text-[#F6F6F6] text-[24px] font-semibold text-center w-full"
                        style={{ fontFamily: "'Borna', sans-serif" }}
                    >
                        {t('profile.verify_phone_title', 'Verifica tu teléfono')}
                    </h2>

                    <p className="text-[#939393] text-[14px] font-normal text-center w-full font-helvetica">
                        {t('profile.verify_phone_description', 'Hemos enviado un código SMS al')} +{country} {phone}
                    </p>
                </div>

                <OTPInput
                    length={6}
                    value={otpValue}
                    onChange={setOtpValue}
                    disabled={isLoading}
                    label={t('profile.verification_code', 'Código de verificación*')}
                    autoFocus
                />

                {countdown > 0 ? (
                    <p className="text-[14px] font-medium font-helvetica text-[#939393] text-center">
                        {t('verify.can_request_new_code', 'Podrás solicitar un nuevo código en')} {countdown}s
                    </p>
                ) : (
                    <p className="text-[14px] font-medium font-helvetica text-[#939393] text-center">
                        {t('verify.didnt_receive_code', '¿No has recibido el código?')}
                        <button
                            onClick={handleResend}
                            disabled={resendMutation.isPending}
                            className="ml-1 text-[#ff336d] cursor-pointer no-underline hover:underline font-medium font-helvetica"
                        >
                            {t('verify.resend_code', 'Reenviar')}
                        </button>
                    </p>
                )}
            </div>

            <button
                type="button"
                onClick={handleVerify}
                disabled={otpValue.length !== 6 || isLoading}
                className="w-full h-12 px-6 bg-[#FF336D] text-[#F6F6F6] font-bold text-[16px] font-helvetica rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? t('verify.verifying', 'Verificando...') : t('profile.save', 'Guardar')}
            </button>
        </Modal>
    );
};

const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex gap-[2px] items-center px-[6px] w-full">
        <h2
            className="text-[#ff336d] text-[24px] font-semibold"
            style={{ fontFamily: "'Borna', sans-serif" }}
        >
            {title}
        </h2>
    </div>
);

interface AvatarEditorProps {
    avatar: string | null;
    firstName: string;
    lastName: string;
    onClick: () => void;
    isUploading?: boolean;
}

const AvatarEditor = ({ avatar, firstName, lastName, onClick, isUploading = false }: AvatarEditorProps) => {
    const hasAvatar = avatar && avatar.trim() !== '';
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isUploading}
            className="relative flex items-center gap-[10px] p-0 cursor-pointer disabled:cursor-not-allowed"
        >
            <div className="relative w-[140px] h-[140px] rounded-full border-[3px] border-[#232323] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] overflow-hidden">
                {hasAvatar ? (
                    <img
                        src={avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover opacity-90"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center">
                        <span
                            className="text-[#f6f6f6] text-[48px] font-semibold font-borna select-none"
                            style={{ fontFamily: "'Borna', sans-serif" }}
                        >
                            {initials || '?'}
                        </span>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-[#ff336d] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            <div className="absolute top-0 right-0 translate-x-[25%] translate-y-[-10%] w-[42px] h-[42px] bg-[#232323] border-[3px] border-[#050505] rounded-full flex items-center justify-center">
                <PlusIcon />
            </div>
        </button>
    );
};

const Profile = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { token, user, setUser, logout } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showVerifyPhoneModal, setShowVerifyPhoneModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [pendingPhone, setPendingPhone] = useState('');
    const [pendingCountry, setPendingCountry] = useState('34');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [gender, setGender] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('34');
    const [avatar, setAvatar] = useState<string | null>(null);

    const [originalData, setOriginalData] = useState({
        firstName: '',
        lastName: '',
        birthdate: '',
        gender: '',
        username: '',
        phone: '',
        country: '34'
    });

    const genderOptions = [
        { value: 'male', label: t('register.male', 'Masculino') },
        { value: 'female', label: t('register.female', 'Femenino') },
        { value: 'other', label: t('register.other', 'Otro') }
    ];

    const formatPhone = (value: string, pattern: number[] = [3, 3, 3]) => {
        const digits = value.replace(/\D/g, '');
        let result = '';
        let index = 0;

        for (let i = 0; i < pattern.length && index < digits.length; i++) {
            const segment = digits.slice(index, index + pattern[i]);
            result += segment;
            index += pattern[i];
            if (index < digits.length) result += ' ';
        }

        return result;
    };

    const handlePhoneChange = (value: string) => {
        const selectedCountry = countries.find((c) => c.phone === country);
        const maxLength = selectedCountry?.phoneLength || 9;
        const pattern = selectedCountry?.phoneFormat || [3, 3, 3];

        const numericValue = value.replace(/\D/g, '');
        const limitedValue = numericValue.slice(0, maxLength);
        const formattedValue = formatPhone(limitedValue, pattern);

        setPhone(formattedValue);
    };

    const handleCountryChange = (newCountry: string) => {
        setCountry(newCountry);
        setPhone('');
    };

    const hasChanges = 
        firstName !== originalData.firstName ||
        lastName !== originalData.lastName ||
        birthdate !== originalData.birthdate ||
        gender !== originalData.gender ||
        username !== originalData.username;

    const currentPhoneDigits = phone.replace(/\s/g, '');
    const isPhoneSame = currentPhoneDigits === originalData.phone && country === originalData.country;

    useEffect(() => {
        const fetchAndSyncUser = async () => {
            if (!token) {
                setIsLoading(false);
                setHasError(true);
                return;
            }

            try {
                const response = await axiosInstance.get('/v2/auth/me');
                const userData = response.data.data.user;
                setUser(userData);
                setIsLoading(false);
            } catch (error) {
                setHasError(true);
                setIsLoading(false);
            }
        };

        fetchAndSyncUser();
    }, [token, setUser]);

    useEffect(() => {
        if (user) {
            const userFirstName = user.firstName || '';
            const userLastName = user.lastName || '';
            const userBirthdate = user.birthdate ? user.birthdate.split('T')[0] : '';
            const userGender = user.gender?.toLowerCase() || '';
            const userUsername = user.username || '';
            const userCountry = user.country || '34';

            setFirstName(userFirstName);
            setLastName(userLastName);
            setBirthdate(userBirthdate);
            setGender(userGender);
            setEmail(user.email || '');
            setUsername(userUsername);
            setCountry(userCountry);
            setAvatar(user.avatar);

            setOriginalData({
                firstName: userFirstName,
                lastName: userLastName,
                birthdate: userBirthdate,
                gender: userGender,
                username: userUsername,
                phone: user.phone || '',
                country: userCountry
            });
            
            if (user.phone) {
                const countryData = countries.find((c) => c.phone === userCountry);
                const pattern = countryData?.phoneFormat || [3, 3, 3];
                setPhone(formatPhone(user.phone, pattern));
            } else {
                setPhone('');
            }
        }
    }, [user]);

    const updateUserMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await axiosInstance.put(`/v2/users/${user.id}`, data);
            return response.data.data.user;
        },
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            setOriginalData({
                firstName,
                lastName,
                birthdate,
                gender,
                username,
                phone: originalData.phone,
                country: originalData.country
            });
            toast.success(t('profile.save_success', 'Perfil actualizado correctamente'));
        },
        onError: () => {
            toast.error(t('profile.save_error', 'Error al actualizar el perfil'));
        },
    });

    const uploadAvatarMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await axiosInstance.post(`/v2/users/${user.id}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.data.user;
        },
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            setAvatar(updatedUser.avatar);
            setShowAvatarModal(false);
            toast.success(t('profile.avatar_success', 'Avatar actualizado correctamente'));
        },
        onError: () => {
            toast.error(t('profile.avatar_error', 'Error al subir el avatar'));
        },
    });

    const removeAvatarMutation = useMutation({
        mutationFn: async () => {
            const response = await axiosInstance.put(`/v2/users/${user.id}`, {
                avatar: null
            });
            return response.data.data.user;
        },
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            setAvatar(null);
            setShowAvatarModal(false);
            toast.success(t('profile.avatar_removed', 'Avatar eliminado correctamente'));
        },
        onError: () => {
            toast.error(t('profile.avatar_remove_error', 'Error al eliminar el avatar'));
        },
    });

    const handleAvatarUploadClick = () => {
        setShowAvatarModal(false);
        fileInputRef.current?.click();
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadAvatarMutation.mutate(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const changePhoneMutation = useMutation({
        mutationFn: async () => {
            const lang = i18n.language === 'en' ? 'en' : 'es';
            const response = await axiosInstance.post(`/v2/sms/send?lang=${lang}`, { 
                country, 
                phone: phone.replace(/\s/g, '') 
            });
            return response.data;
        },
        onSuccess: () => {
            setPendingPhone(phone);
            setPendingCountry(country);
            setShowVerifyPhoneModal(true);
        },
        onError: () => {
            toast.error(t('profile.phone_error', 'Error al enviar el código'));
        },
    });

    const handlePhoneVerified = (updatedUser: any) => {
        setUser(updatedUser);
        const newCountry = updatedUser.country || '34';
        setCountry(newCountry);
        
        if (updatedUser.phone) {
            const countryData = countries.find((c) => c.phone === newCountry);
            const pattern = countryData?.phoneFormat || [3, 3, 3];
            setPhone(formatPhone(updatedUser.phone, pattern));
        } else {
            setPhone('');
        }

        setOriginalData(prev => ({
            ...prev,
            phone: updatedUser.phone || '',
            country: newCountry
        }));
    };

    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            await axiosInstance.delete(`/v2/users/${user.id}`);
        },
        onSuccess: () => {
            setShowDeleteModal(false);
            logout();
            navigate({ to: '/' });
            toast.success(t('profile.delete_success', 'Cuenta eliminada correctamente'));
        },
        onError: () => {
            toast.error(t('profile.delete_error', 'Error al eliminar la cuenta'));
        },
    });

    const handleSave = () => {
        updateUserMutation.mutate({
            firstName,
            lastName,
            birthdate: birthdate ? new Date(birthdate) : undefined,
            gender: gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER',
            username,
        });
    };

    const handleLogout = () => {
        logout();
        navigate({ to: '/' });
        setShowLogoutModal(false);
    };

    const handleDeleteAccount = () => {
        deleteAccountMutation.mutate();
    };

    if (hasError) {
        return <PageError />;
    }

    const isSaving = updateUserMutation.isPending;

    if (isLoading) {
        return (
            <div className="bg-[#050505] min-h-screen flex justify-center py-24">
                <div className="flex flex-col gap-[36px] w-full max-w-[600px] px-6">
                    <div className="flex flex-col gap-[16px] w-full animate-pulse">
                        <div className="h-8 w-48 bg-[#232323] rounded" />
                        <div className="flex justify-center">
                            <div className="w-[140px] h-[140px] rounded-full bg-[#232323]" />
                        </div>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <div className="h-4 w-20 bg-[#232323] rounded" />
                                <div className="h-12 w-full bg-[#232323] rounded-[12px]" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#050505] min-h-screen flex justify-center py-24">
            <div className="flex flex-col gap-[36px] w-full max-w-[600px] px-6">

                <button
                    onClick={() => navigate({ to: '/' })}
                    className="flex items-center gap-2 text-[#939393] hover:text-[#F6F6F6] transition-colors self-start cursor-pointer"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[14px] font-helvetica font-medium">
                        {t('common.back', 'Volver')}
                    </span>
                </button>

                <div className="flex flex-col gap-[16px] w-full">
                    <SectionHeader title={t('profile.personal_info', 'Información personal')} />

                    <div className="flex flex-col gap-[24px] items-center w-full">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleAvatarFileChange}
                            className="hidden"
                        />

                        <AvatarEditor
                            avatar={avatar}
                            firstName={firstName}
                            lastName={lastName}
                            onClick={() => setShowAvatarModal(true)}
                            isUploading={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                        />

                        <InputText
                            label={t('profile.first_name', 'Nombre*')}
                            value={firstName}
                            onChange={setFirstName}
                            placeholder=""
                        />

                        <InputText
                            label={t('profile.last_name', 'Apellidos*')}
                            value={lastName}
                            onChange={setLastName}
                            placeholder=""
                        />

                        <InputDate
                            label={t('profile.birthdate', 'Fecha de nacimiento*')}
                            value={birthdate}
                            onChange={setBirthdate}
                            max={dayjs().subtract(14, 'years').format('YYYY-MM-DD')}
                            min={dayjs().subtract(120, 'years').format('YYYY-MM-DD')}
                        />

                        <Select
                            label={t('profile.gender', 'Género*')}
                            value={gender}
                            onChange={setGender}
                            options={genderOptions}
                            placeholder={t('profile.select', 'Selecciona...')}
                        />

                        <InputText
                            type="email"
                            label={t('profile.email', 'Email*')}
                            value={email}
                            onChange={setEmail}
                            placeholder="ejemplo@email.com"
                            disabled
                        />
                    </div>
                </div>

                <div className="flex flex-col w-full">
                    <InputText
                        label={t('profile.username', 'Username*')}
                        value={username}
                        onChange={setUsername}
                        placeholder=""
                    />
                </div>

                {hasChanges && (
                    <Button
                        variant="cta"
                        onClick={handleSave}
                        disabled={isSaving}
                        isLoading={isSaving}
                    >
                        {t('profile.save', 'Guardar')}
                    </Button>
                )}

                <div className="flex flex-col gap-[16px] w-full">
                    <SectionHeader title={t('profile.change_phone', 'Cambiar teléfono')} />

                    <InputTextPhone
                        label={t('profile.phone', 'Teléfono*')}
                        value={phone}
                        onChange={handlePhoneChange}
                        country={country}
                        onCountryChange={handleCountryChange}
                        countries={countries}
                        language={i18n.language as 'es' | 'en'}
                    />

                    <Button
                        variant="primary"
                        onClick={() => changePhoneMutation.mutate()}
                        disabled={changePhoneMutation.isPending || isPhoneSame || !currentPhoneDigits}
                        isLoading={changePhoneMutation.isPending}
                    >
                        {t('profile.change_phone_btn', 'Cambiar teléfono')}
                    </Button>
                </div>

                <div className="flex flex-col gap-[16px] w-full pt-[36px] border-t-2 border-[#232323]">
                    <SectionHeader title={t('profile.account', 'Cuenta')} />

                    <div className="grid grid-cols-2 gap-[8px] w-full">
                        <Button
                            variant="primary"
                            onClick={() => setShowLogoutModal(true)}
                            className="!px-4"
                        >
                            {t('profile.logout', 'Cerrar sesión')}
                        </Button>

                        <Button
                            variant="delete"
                            onClick={() => setShowDeleteModal(true)}
                            disabled={deleteAccountMutation.isPending}
                            className="!px-4"
                        >
                            {t('profile.delete_account', 'Eliminar cuenta')}
                        </Button>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title={t('profile.logout_title', 'Cerrar sesión')}
                description={t('profile.logout_description', 'Se cerrará tu sesión solo en este dispositivo.')}
                cancelText={t('common.cancel', 'Cancelar')}
                confirmText={t('profile.logout', 'Cerrar sesión')}
                onConfirm={handleLogout}
            />

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title={t('profile.delete_title', 'Eliminar cuenta')}
                description={t('profile.delete_description', 'Al eliminar tu cuenta, todos tus datos se borrarán de forma permanente y esta acción no se puede deshacer.')}
                icon={<img src="https://klubit.fra1.cdn.digitaloceanspaces.com/icon-trash.png" alt="" className="w-full h-full object-contain" />}
                cancelText={t('common.cancel', 'Cancelar')}
                confirmText={t('profile.delete', 'Eliminar')}
                onConfirm={handleDeleteAccount}
                variant="delete"
                isLoading={deleteAccountMutation.isPending}
            />

            <VerifyPhoneModal
                isOpen={showVerifyPhoneModal}
                onClose={() => setShowVerifyPhoneModal(false)}
                country={pendingCountry}
                phone={pendingPhone}
                onSuccess={handlePhoneVerified}
            />

            <AvatarModal
                isOpen={showAvatarModal}
                onClose={() => setShowAvatarModal(false)}
                hasAvatar={!!(avatar && avatar.trim() !== '')}
                onUpload={handleAvatarUploadClick}
                onRemove={() => removeAvatarMutation.mutate()}
                isLoading={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
            />
        </div>
    );
};

export default Profile;
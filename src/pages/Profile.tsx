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
import { PlusIcon, TrashIcon } from '@/components/icons';

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
    onUpload: (file: File) => void;
    isUploading?: boolean;
}

const AvatarEditor = ({ avatar, firstName, lastName, onUpload, isUploading = false }: AvatarEditorProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
        }
    };

    const hasAvatar = avatar && avatar.trim() !== '';
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="relative flex items-center gap-[10px] p-0 cursor-pointer disabled:cursor-not-allowed"
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

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
                            className="text-[#f6f6f6] text-[48px] font-semibold select-none"
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

    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [gender, setGender] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('34');
    const [avatar, setAvatar] = useState<string | null>(null);

    const genderOptions = [
        { value: 'male', label: t('register.male', 'Masculino') },
        { value: 'female', label: t('register.female', 'Femenino') },
        { value: 'other', label: t('register.other', 'Otro') }
    ];

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
                console.error('Error fetching user:', error);
                setHasError(true);
                setIsLoading(false);
            }
        };

        fetchAndSyncUser();
    }, [token, setUser]);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setBirthdate(user.birthdate ? user.birthdate.split('T')[0] : '');
            setGender(user.gender?.toLowerCase() || '');
            setEmail(user.email || '');
            setUsername(user.username || '');
            setPhone(user.phone || '');
            setCountry(user.country || '34');
            setAvatar(user.avatar);
        }
    }, [user]);

    const updateUserMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await axiosInstance.put(`/v2/users/${user.id}`, data);
            return response.data.data.user;
        },
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
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
            toast.success(t('profile.avatar_success', 'Avatar actualizado correctamente'));
        },
        onError: () => {
            toast.error(t('profile.avatar_error', 'Error al subir el avatar'));
        },
    });

    const changePhoneMutation = useMutation({
        mutationFn: async () => {
            const response = await axiosInstance.post('/v2/auth/change-phone', { country, phone });
            return response.data.data.user;
        },
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            toast.success(t('profile.phone_success', 'Teléfono actualizado correctamente'));
        },
        onError: () => {
            toast.error(t('profile.phone_error', 'Error al cambiar el teléfono'));
        },
    });

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
            birthdate,
            gender: gender.toUpperCase(),
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

                <div className="flex flex-col gap-[16px] w-full">
                    <SectionHeader title={t('profile.personal_info', 'Información personal')} />

                    <div className="flex flex-col gap-[24px] items-center w-full">
                        <AvatarEditor
                            avatar={avatar}
                            firstName={firstName}
                            lastName={lastName}
                            onUpload={(file) => uploadAvatarMutation.mutate(file)}
                            isUploading={uploadAvatarMutation.isPending}
                        />

                        <InputText
                            label={t('profile.first_name', 'Nombre*')}
                            value={firstName}
                            onChange={setFirstName}
                            placeholder="Ej: Juan"
                        />

                        <InputText
                            label={t('profile.last_name', 'Apellidos*')}
                            value={lastName}
                            onChange={setLastName}
                            placeholder="Ej: García"
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
                        placeholder="Ej: juan_garcia"
                    />
                </div>

                <div className="flex flex-col gap-[16px] w-full">
                    <SectionHeader title={t('profile.change_phone', 'Cambiar teléfono')} />

                    <InputTextPhone
                        label={t('profile.phone', 'Teléfono*')}
                        value={phone}
                        onChange={setPhone}
                        country={country}
                        onCountryChange={setCountry}
                        countries={countries}
                        language={i18n.language as 'es' | 'en'}
                    />

                    <Button
                        variant="secondary"
                        onClick={() => changePhoneMutation.mutate()}
                        disabled={changePhoneMutation.isPending}
                    >
                        {t('profile.change_phone_btn', 'Cambiar teléfono')}
                    </Button>
                </div>

                <Button
                    variant="cta"
                    onClick={handleSave}
                    disabled={isSaving}
                    isLoading={isSaving}
                >
                    {t('profile.save', 'Guardar')}
                </Button>

                <div className="flex flex-col gap-[16px] w-full pt-[36px] border-t-2 border-[#232323]">
                    <SectionHeader title={t('profile.account', 'Cuenta')} />

                    <div className="grid grid-cols-2 gap-[8px] w-full">
                        <Button
                            variant="secondary"
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
                icon={<TrashIcon />}
                cancelText={t('common.cancel', 'Cancelar')}
                confirmText={t('profile.delete', 'Eliminar')}
                onConfirm={handleDeleteAccount}
                variant="delete"
                isLoading={deleteAccountMutation.isPending}
            />
        </div>
    );
};

export default Profile;
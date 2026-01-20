import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';
import IncidentModal from '@/components/IncidentModal';
import InputTextPhone from '@/components/ui/InputTextPhone';
import CheckoutTimer from '@/components/CheckoutTimer';
import { countries } from '@/utils/countries';
import axiosInstance from '@/config/axiosConfig';
import { useAuthStore } from '@/stores/authStore';

interface EventInfo {
    id: string;
    name: string;
    slug: string;
    coverImage?: string;
    date: string;
}

interface CartItem {
    id: string;
    priceId: string;
    type: 'ticket' | 'guestlist' | 'reservation' | 'promotion' | 'product';
    name: string;
    priceName?: string;
    unitPrice: number;
    quantity: number;
    isNominative?: boolean;
}

interface NominativeAssignment {
    itemIndex: number;
    assignmentType: 'me' | 'send' | 'found' | 'notfound';
    phone?: string;
    phoneCountry?: string;
    email?: string;
    toUserId?: string;
    isSearching?: boolean;
}

interface CouponData {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    remainingUses?: number | null;
}

interface CheckoutSummaryProps {
    event: EventInfo;
    items: CartItem[];
    serviceFee?: number;
    timerSeconds: number;
    onTimerExpired: () => void;
    onBack: () => void;
    onContinueToPayment: (data: {
        coupon?: CouponData;
        nominativeAssignments?: NominativeAssignment[];
    }) => void;
    isLoading?: boolean;
}

const IndicatorDot = ({ color }: { color: string }) => (
    <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: color }} />
);

const EventInfoCard = ({ items }: { event: EventInfo; items: CartItem[] }) => {
    const { t } = useTranslation();

    const getIndicatorColor = (type: CartItem['type']) => {
        switch (type) {
            case 'ticket': return '#D591FF';
            case 'guestlist': return '#FFCE1F';
            case 'reservation': return '#3FE8E8';
            case 'promotion': return '#FF336D';
            case 'product': return '#00D1FF';
            default: return '#939393';
        }
    };

    return (
        <div className="flex flex-col gap-[4px] w-full">
            <span className="text-[#939393] text-[16px] font-medium font-helvetica px-[6px]">
                {t('checkout.your_order', 'Tu pedido')}
            </span>
            <div className="bg-[#141414] border-2 border-[#232323] rounded-[16px] w-full">
                {items.map((item, index) => (
                    <div
                        key={`${item.priceId}-${index}`}
                        className={`flex items-center justify-between px-[16px] h-[56px] ${index < items.length - 1 ? 'border-b-[1.5px] border-[#232323]' : ''
                            }`}
                    >
                        <div className="flex items-center gap-[6px]">
                            <IndicatorDot color={getIndicatorColor(item.type)} />
                            <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                                {item.name}
                            </span>
                            <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                                x{item.quantity}
                            </span>
                        </div>
                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                            {(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}€
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface CouponSectionProps {
    appliedCoupon: CouponData | null;
    onApplyCoupon: (code: string) => Promise<void>;
    onRemoveCoupon: () => void;
    isLoading: boolean;
    discountAmount: number;
}

const CouponSection = ({
    appliedCoupon,
    onApplyCoupon,
    onRemoveCoupon,
    isLoading,
    discountAmount
}: CouponSectionProps) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [couponCode, setCouponCode] = useState('');

    const handleApply = async () => {
        if (!couponCode.trim()) return;
        await onApplyCoupon(couponCode.trim().toUpperCase());
        setCouponCode('');
        setIsModalOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && couponCode.trim()) {
            handleApply();
        }
    };

    if (appliedCoupon) {
        return (
            <div className="bg-[#141414] border-2 border-[#232323] rounded-[12px] px-[16px] py-[12px] flex items-center justify-between w-full">
                <div className="flex items-center gap-[4px]">
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                        {appliedCoupon.code}
                    </span>
                    <div className="w-[3px] h-[3px] rounded-full bg-[#939393]" />
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {discountAmount.toFixed(2).replace('.', ',')}€
                    </span>
                </div>
                <button
                    onClick={onRemoveCoupon}
                    className="text-[#ff2323] text-[14px] font-medium font-helvetica hover:opacity-80 transition-opacity"
                >
                    {t('checkout.remove_coupon', 'Eliminar')}
                </button>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#141414] border-2 border-[#232323] rounded-[12px] px-[16px] py-[12px] flex items-center justify-between w-full cursor-pointer hover:border-[#3a3a3a] transition-colors"
            >
                <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                    {t('checkout.add_coupon', 'Añadir cupón')}
                </span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4V16M4 10H16" stroke="#939393" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-[#141414] border-2 border-[#232323] rounded-[16px] p-[24px] w-full max-w-[400px] flex flex-col gap-[24px]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <span className="text-[#f6f6f6] text-[20px] font-semibold font-borna">
                                {t('checkout.add_coupon', 'Añadir cupón')}
                            </span>
                            <button onClick={() => setIsModalOpen(false)} className="text-[#939393] hover:text-[#f6f6f6] transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-[4px]">
                            <span className="text-[#939393] text-[14px] font-normal font-helvetica px-[6px]">
                                {t('checkout.coupon_code_label', 'Código de cupón')}
                            </span>
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                onKeyDown={handleKeyDown}
                                placeholder={t('checkout.coupon_placeholder', '')}
                                className="w-full h-[48px] bg-transparent border-[1.5px] border-[#232323] rounded-[12px] px-[16px] text-[#f6f6f6] text-[16px] font-medium font-helvetica placeholder:text-[#939393] outline-none focus:border-[#ff336d] transition-colors"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleApply}
                            disabled={isLoading || !couponCode.trim()}
                            className="w-full h-[48px] bg-[#ff336d] rounded-[12px] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                                {isLoading ? '...' : t('checkout.apply', 'Aplicar')}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

interface PaymentDetailsProps {
    subtotal: number;
    serviceFee: number;
    discount: number;
    total: number;
}

const PaymentDetailsCard = ({ subtotal, serviceFee, discount, total }: PaymentDetailsProps) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-[4px] w-full">
            <span className="text-[#939393] text-[16px] font-medium font-helvetica px-[6px]">
                {t('checkout.payment_details', 'Detalles pago')}
            </span>
            <div className="bg-[#141414] border-2 border-[#232323] rounded-[16px] w-full">
                <div className="flex items-center justify-between px-[16px] h-[56px] border-b-[1.5px] border-[#232323]">
                    <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                        {t('checkout.subtotal', 'Subtotal')}:
                    </span>
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                        {subtotal.toFixed(2).replace('.', ',')}€
                    </span>
                </div>

                {serviceFee > 0 && (
                    <div className="flex items-center justify-between px-[16px] h-[56px] border-b-[1.5px] border-[#232323]">
                        <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                            {t('checkout.service_fee', 'Gastos de servicio')}:
                        </span>
                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                            {serviceFee.toFixed(2).replace('.', ',')}€
                        </span>
                    </div>
                )}

                {discount > 0 && (
                    <div className="flex items-center justify-between px-[16px] h-[56px] border-b-[1.5px] border-[#232323]">
                        <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                            {t('checkout.discount', 'Descuento')}:
                        </span>
                        <span className="text-[#e5ff88] text-[16px] font-medium font-helvetica">
                            -{discount.toFixed(2).replace('.', ',')}€
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between px-[16px] h-[56px]">
                    <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                        {t('checkout.total', 'Total')}:
                    </span>
                    <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                        {total.toFixed(2).replace('.', ',')}€
                    </span>
                </div>
            </div>
        </div>
    );
};

interface NominativeAssignmentSectionProps {
    items: CartItem[];
    assignments: NominativeAssignment[];
    onAssignmentChange: (assignments: NominativeAssignment[]) => void;
}

const CheckboxIcon = ({ checked }: { checked: boolean }) => (
    <div className={`w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center transition-colors ${checked ? 'bg-[#e5ff88] border-[#e5ff88]' : 'border-[#939393]'
        }`}>
        {checked && (
            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                <path d="M1 4L4.5 7.5L11 1" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )}
    </div>
);

const NominativeAssignmentSection = ({
    items,
    assignments,
    onAssignmentChange
}: NominativeAssignmentSectionProps) => {
    const { i18n, t } = useTranslation();
    const { user } = useAuthStore();

    const nominativeEntries = useMemo(() => {
        const entries: Array<{ item: CartItem; index: number; entryIndex: number }> = [];
        let globalIndex = 0;

        items.forEach((item) => {
            if (item.isNominative) {
                for (let i = 0; i < item.quantity; i++) {
                    entries.push({ item, index: globalIndex, entryIndex: i });
                    globalIndex++;
                }
            }
        });

        return entries;
    }, [items]);

    const allForMe = useMemo(() => {
        if (nominativeEntries.length === 0) return false;
        return nominativeEntries.every(entry => {
            const assignment = assignments.find(a => a.itemIndex === entry.index);
            return assignment?.assignmentType === 'me';
        });
    }, [nominativeEntries, assignments]);

    const handleToggleAllForMe = useCallback(() => {
        if (allForMe) {
            const newAssignments = nominativeEntries.map(entry => ({
                itemIndex: entry.index,
                assignmentType: 'send' as const,
                phoneCountry: '34',
            }));
            onAssignmentChange(newAssignments);
        } else {
            const newAssignments = nominativeEntries.map(entry => ({
                itemIndex: entry.index,
                assignmentType: 'me' as const,
            }));
            onAssignmentChange(newAssignments);
        }
    }, [allForMe, nominativeEntries, onAssignmentChange]);

    if (nominativeEntries.length === 0) return null;

    const handleToggleMe = (itemIndex: number) => {
        const existing = assignments.find(a => a.itemIndex === itemIndex);

        if (!existing || existing.assignmentType !== 'me') {
            const newAssignments = assignments
                .filter(a => a.itemIndex !== itemIndex)
                .map(a => a.assignmentType === 'me'
                    ? { ...a, assignmentType: 'send' as const, phoneCountry: '34' }
                    : a
                );
            newAssignments.push({ itemIndex, assignmentType: 'me' });
            onAssignmentChange(newAssignments);
        } else {
            const newAssignments = assignments.filter(a => a.itemIndex !== itemIndex);
            newAssignments.push({ itemIndex, assignmentType: 'send', phoneCountry: '34' });
            onAssignmentChange(newAssignments);
        }
    };

    const meAssignedIndex = useMemo(() => {
        const meAssignment = assignments.find(a => a.assignmentType === 'me');
        return meAssignment?.itemIndex ?? null;
    }, [assignments]);

    const handleConfirmPhone = async (itemIndex: number) => {
        const assignment = assignments.find(a => a.itemIndex === itemIndex);

        if (!assignment?.phone) {
            toast.error(t('checkout.phone_required', 'Introduce un número de teléfono'));
            return;
        }

        const selectedCountry = countries.find(c => c.phone === assignment.phoneCountry);
        const expectedLength = selectedCountry?.phoneLength || 9;
        const phoneDigits = assignment.phone.replace(/\D/g, '');

        if (phoneDigits.length !== expectedLength) {
            toast.error(t('checkout.phone_invalid_length', 'Número de teléfono inválido'));
            return;
        }

        if (user?.phone && user?.country) {
            const userPhoneDigits = user.phone.replace(/\D/g, '');
            const userCountry = user.country;

            if (phoneDigits === userPhoneDigits && assignment.phoneCountry === userCountry) {
                toast.error(t('checkout.cannot_send_to_self', 'No puedes enviar una entrada a ti mismo'));
                return;
            }
        }

        const searchingAssignments = assignments.map(a =>
            a.itemIndex === itemIndex
                ? { ...a, isSearching: true }
                : a
        );
        onAssignmentChange(searchingAssignments);

        try {
            const response = await axiosInstance.post<{
                status: 'success' | 'error';
                data: {
                    users: {
                        data: Array<{
                            id: string;
                            firstName: string;
                            lastName: string;
                            username?: string;
                            avatar?: string;
                            phone: string;
                            country: string;
                        }>;
                    };
                };
            }>('/v2/users', {
                phones: [
                    { country: assignment.phoneCountry || '34', phone: phoneDigits }
                ]
            });

            const users = response.data?.data?.users?.data || [];

            if (users.length > 0) {
                const foundUser = users[0];
                const newAssignments = assignments.map(a =>
                    a.itemIndex === itemIndex
                        ? {
                            ...a,
                            assignmentType: 'found' as const,
                            isSearching: false,
                            toUserId: foundUser.id,
                        }
                        : a
                );
                onAssignmentChange(newAssignments);
            } else {
                const newAssignments = assignments.map(a =>
                    a.itemIndex === itemIndex
                        ? { ...a, assignmentType: 'notfound' as const, isSearching: false, email: '' }
                        : a
                );
                onAssignmentChange(newAssignments);
            }
        } catch {
            const newAssignments = assignments.map(a =>
                a.itemIndex === itemIndex
                    ? { ...a, assignmentType: 'notfound' as const, isSearching: false, email: '' }
                    : a
            );
            onAssignmentChange(newAssignments);
        }
    };

    const handleUpdateAssignment = (itemIndex: number, data: Partial<NominativeAssignment>) => {
        const newAssignments = assignments.map(a =>
            a.itemIndex === itemIndex ? { ...a, ...data } : a
        );
        onAssignmentChange(newAssignments);
    };

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

    const handlePhoneChange = (itemIndex: number, value: string) => {
        const assignment = assignments.find(a => a.itemIndex === itemIndex);
        const countryCode = assignment?.phoneCountry || '34';
        const selectedCountry = countries.find(c => c.phone === countryCode);
        const maxLength = selectedCountry?.phoneLength || 9;
        const pattern = selectedCountry?.phoneFormat || [3, 3, 3];

        const numericValue = value.replace(/\D/g, '');
        const limitedValue = numericValue.slice(0, maxLength);
        const formattedValue = formatPhone(limitedValue, pattern);

        const currentType = assignment?.assignmentType;
        if (currentType === 'found' || currentType === 'notfound') {
            handleUpdateAssignment(itemIndex, {
                phone: formattedValue,
                assignmentType: 'send',
                toUserId: undefined,
                email: undefined
            });
        } else {
            handleUpdateAssignment(itemIndex, { phone: formattedValue });
        }
    };

    const handleCountryChange = (itemIndex: number, newCountry: string) => {
        const assignment = assignments.find(a => a.itemIndex === itemIndex);
        const currentType = assignment?.assignmentType;

        if (currentType === 'found' || currentType === 'notfound') {
            handleUpdateAssignment(itemIndex, {
                phoneCountry: newCountry,
                phone: '',
                assignmentType: 'send',
                toUserId: undefined,
                email: undefined
            });
        } else {
            handleUpdateAssignment(itemIndex, { phoneCountry: newCountry, phone: '' });
        }
    };

    return (
        <div className="flex flex-col gap-[16px] w-full">
            <div className="flex items-center justify-between px-[6px]">
                <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                    {t('checkout.nominative_assignment', 'Asignación nominativa')}
                </span>
                {nominativeEntries.length > 1 && (
                    <button
                        onClick={handleToggleAllForMe}
                        className="flex items-center gap-[8px] text-[#939393] hover:text-[#f6f6f6] transition-colors"
                    >
                        <span className="text-[14px] font-medium font-helvetica">
                            {t('checkout.all_for_me', 'Todas para mí')}
                        </span>
                        <CheckboxIcon checked={allForMe} />
                    </button>
                )}
            </div>

            {nominativeEntries.map(({ item, index, entryIndex }) => {
                const assignment = assignments.find(a => a.itemIndex === index);
                const isMe = assignment?.assignmentType === 'me';
                const isSend = assignment?.assignmentType === 'send';
                const isFound = assignment?.assignmentType === 'found';
                const isNotFound = assignment?.assignmentType === 'notfound';
                const isSearching = assignment?.isSearching;
                const canSelectMe = meAssignedIndex === null || meAssignedIndex === index;

                return (
                    <div key={`${item.priceId}-${entryIndex}`} className="bg-[#141414] border-2 border-[#232323] rounded-[16px] p-[16px] flex flex-col gap-[16px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                                {item.name} {item.quantity > 1 && `#${entryIndex + 1}`}
                            </span>
                            {canSelectMe && (
                                <button
                                    onClick={() => handleToggleMe(index)}
                                    className="flex items-center gap-[8px]"
                                >
                                    <span className="text-[#939393] text-[14px] font-medium font-helvetica">
                                        {t('checkout.for_me', 'Para mí')}
                                    </span>
                                    <CheckboxIcon checked={isMe} />
                                </button>
                            )}
                        </div>

                        {!isMe && (
                            <div className="flex flex-col gap-[12px]">
                                <div className="relative">
                                    <InputTextPhone
                                        label={`${t('checkout.recipient_phone', 'Teléfono del destinatario')}*`}
                                        placeholder=""
                                        value={assignment?.phone || ''}
                                        onChange={(value) => handlePhoneChange(index, value)}
                                        country={assignment?.phoneCountry || '34'}
                                        onCountryChange={(newCountry: string) => handleCountryChange(index, newCountry)}
                                        countries={countries}
                                        language={i18n.language as 'es' | 'en'}
                                        disabled={isFound || isNotFound}
                                    />
                                    {isFound && (
                                        <div className="absolute right-[16px] top-[38px] w-[24px] h-[24px] rounded-full bg-[#e5ff88] flex items-center justify-center z-10">
                                            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                                                <path d="M1 4L4.5 7.5L11 1" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {isSend && (
                                    <button
                                        type="button"
                                        onClick={() => handleConfirmPhone(index)}
                                        disabled={isSearching || !assignment?.phone}
                                        className={`w-full h-[36px] bg-[#232323] rounded-[8px] flex items-center justify-center gap-2 font-medium text-[14px] font-helvetica text-[#f6f6f6] transition-colors ${!assignment?.phone || isSearching
                                                ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#2a2a2a]'
                                            }`}
                                    >
                                        {isSearching && (
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        )}
                                        {t('checkout.confirm_phone', 'Confirmar teléfono')}
                                    </button>
                                )}

                                {(isFound || isNotFound) && (
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateAssignment(index, {
                                            assignmentType: 'send',
                                            phone: '',
                                            toUserId: undefined,
                                            email: undefined
                                        })}
                                        className="w-full h-[36px] bg-transparent border border-[#232323] rounded-[8px] flex items-center justify-center font-medium text-[14px] font-helvetica text-[#939393] cursor-pointer hover:border-[#3a3a3a] transition-colors"
                                    >
                                        {t('checkout.change_number', 'Cambiar número')}
                                    </button>
                                )}

                                <p className="text-[#939393] text-[12px] font-medium font-helvetica px-[6px]">
                                    {isNotFound
                                        ? t('checkout.assign_auto_number', '**La entrada se asignará automáticamente al número indicado. Siempre podrás cancelar el envío desde la app.')
                                        : t('checkout.assign_auto_user', '**La entrada se asignará automáticamente al siguiente usuario. Siempre podrás cancelar el envío desde la app.')
                                    }
                                </p>

                                {isNotFound && (
                                    <div className="flex flex-col gap-[4px]">
                                        <span className="text-[#939393] text-[14px] font-normal font-helvetica px-[6px]">
                                            {t('checkout.email_notification', 'Email para notificación')}*
                                        </span>
                                        <input
                                            type="email"
                                            value={assignment?.email || ''}
                                            onChange={(e) => handleUpdateAssignment(index, { email: e.target.value })}
                                            placeholder=""
                                            className="w-full h-[48px] border-[1.5px] border-[#232323] rounded-[12px] px-[16px] bg-transparent text-[#f6f6f6] text-[16px] font-medium font-helvetica placeholder:text-[#939393] outline-none focus:border-[#3fe8e8] transition-colors"
                                        />
                                        <span className="text-[#939393] text-[11px] font-normal font-helvetica px-[6px]">
                                            {t('checkout.email_hint', 'Le enviaremos un email para que pueda reclamar su entrada al registrarse')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const CheckoutSummary = ({
    event,
    items,
    serviceFee = 2.00,
    timerSeconds,
    onTimerExpired,
    onContinueToPayment,
    isLoading = false,
}: CheckoutSummaryProps) => {
    const { t } = useTranslation();

    const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [nominativeAssignments, setNominativeAssignments] = useState<NominativeAssignment[]>([]);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [hasCalledExpired, setHasCalledExpired] = useState(false);

    useEffect(() => {
        const nominativeItems = items.filter(item => item.isNominative);
        if (nominativeItems.length === 0) return;

        let totalEntries = 0;
        nominativeItems.forEach(item => {
            totalEntries += item.quantity;
        });

        if (nominativeAssignments.length === 0 && totalEntries > 0) {
            const initialAssignments: NominativeAssignment[] = [];
            let globalIndex = 0;

            items.forEach(item => {
                if (item.isNominative) {
                    for (let i = 0; i < item.quantity; i++) {
                        initialAssignments.push({
                            itemIndex: globalIndex,
                            assignmentType: globalIndex === 0 ? 'me' : 'send',
                            phoneCountry: '34'
                        });
                        globalIndex++;
                    }
                }
            });

            setNominativeAssignments(initialAssignments);
        }
    }, [items, nominativeAssignments.length]);

    useEffect(() => {
        if (timerSeconds <= 0 && !hasCalledExpired) {
            setHasCalledExpired(true);
            onTimerExpired();
        }
    }, [timerSeconds, hasCalledExpired, onTimerExpired]);

    const subtotal = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    }, [items]);

    const discountAmount = useMemo(() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === 'PERCENTAGE') {
            return (subtotal * appliedCoupon.value) / 100;
        }
        return Math.min(appliedCoupon.value, subtotal);
    }, [appliedCoupon, subtotal]);

    const total = useMemo(() => {
        return Math.max(0, subtotal + serviceFee - discountAmount);
    }, [subtotal, serviceFee, discountAmount]);

    const hasNominativeItems = useMemo(() => {
        return items.some(item => item.isNominative);
    }, [items]);

    const nominativeComplete = useMemo(() => {
        if (!hasNominativeItems) return true;

        const totalNominativeCount = items
            .filter(item => item.isNominative)
            .reduce((acc, item) => acc + item.quantity, 0);

        if (nominativeAssignments.length !== totalNominativeCount) return false;

        return nominativeAssignments.every(assignment => {
            if (assignment.assignmentType === 'me') return true;
            if (assignment.assignmentType === 'found') return !!assignment.toUserId;
            if (assignment.assignmentType === 'notfound') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return !!assignment.phone && !!assignment.email && emailRegex.test(assignment.email);
            }
            if (assignment.assignmentType === 'send') return false;
            return false;
        });
    }, [hasNominativeItems, items, nominativeAssignments]);

    const handleApplyCoupon = useCallback(async (code: string) => {
        setCouponLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/v2/coupons/validate/${code}`);
            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Coupon validation failed');
            }

            if (!data.data.valid) {
                toast.error(t('checkout.invalid_coupon', 'Cupón no válido'));
                return;
            }

            setAppliedCoupon(data.data.coupon);
            toast.success(t('checkout.coupon_applied', 'Cupón aplicado correctamente'));
        } catch {
            toast.error(t('checkout.coupon_error', 'Error al validar el cupón'));
        } finally {
            setCouponLoading(false);
        }
    }, [t]);

    const handleRemoveCoupon = useCallback(() => {
        setAppliedCoupon(null);
    }, []);

    const handleContinue = useCallback(() => {
        if (hasNominativeItems && !nominativeComplete) {
            toast.error(t('checkout.complete_assignments', 'Por favor completa la asignación de todas las entradas'));
            return;
        }

        onContinueToPayment({
            coupon: appliedCoupon || undefined,
            nominativeAssignments: hasNominativeItems ? nominativeAssignments : undefined,
        });
    }, [appliedCoupon, hasNominativeItems, nominativeAssignments, nominativeComplete, onContinueToPayment, t]);

    const canContinue = !hasNominativeItems || nominativeComplete;

    const renderButton = () => (
        <button
            onClick={handleContinue}
            disabled={!canContinue || isLoading}
            className={`w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${canContinue && !isLoading
                    ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90'
                    : 'bg-[#ff336d] text-[#f6f6f6] opacity-50 cursor-not-allowed'
                }`}
        >
            {isLoading ? (
                <span>{t('checkout.creating_order', 'Creando pedido...')}</span>
            ) : total === 0 ? (
                <span>{t('checkout.confirm_free', 'Confirmar')} - {t('checkout.free', 'Gratis')}</span>
            ) : (
                <span>{t('checkout.continue_to_payment', 'Continuar al pago')} - {total.toFixed(2).replace('.', ',')}€</span>
            )}
        </button>
    );

    return (
        <>
            <div className="flex flex-col gap-[36px] w-full max-w-[480px] mx-auto px-[24px] py-[24px] pb-[120px] md:pb-[24px]">
                <CheckoutTimer seconds={timerSeconds} />

                <EventInfoCard event={event} items={items} />

                {subtotal > 0 && (
                    <CouponSection
                        appliedCoupon={appliedCoupon}
                        onApplyCoupon={handleApplyCoupon}
                        onRemoveCoupon={handleRemoveCoupon}
                        isLoading={couponLoading}
                        discountAmount={discountAmount}
                    />
                )}

                <PaymentDetailsCard
                    subtotal={subtotal}
                    serviceFee={serviceFee}
                    discount={discountAmount}
                    total={total}
                />

                {hasNominativeItems && (
                    <NominativeAssignmentSection
                        items={items}
                        assignments={nominativeAssignments}
                        onAssignmentChange={setNominativeAssignments}
                    />
                )}

                <p className="text-[#f6f6f6] text-[14px] font-normal font-helvetica px-[6px] leading-[1.4]">
                    {t('checkout.incident_info_prefix', 'En caso de incidencia, por favor notifíquela mediante el ')}
                    <button
                        onClick={() => setIsIncidentModalOpen(true)}
                        className="text-[#ff336d] underline hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0 font-normal text-[14px] font-helvetica"
                    >
                        {t('checkout.incident_info_link', 'siguiente formulario')}
                    </button>
                    {t('checkout.incident_info_suffix', '. Nuestro equipo analizará la información y trabajará en la solución a la mayor brevedad posible.')}
                </p>

                <div className="hidden md:block">
                    {renderButton()}
                </div>

                <p className="text-[rgba(246,246,246,0.5)] text-[12px] font-medium font-helvetica px-[6px] leading-[1.4]">
                    {t('checkout.legal_text_prefix', 'Comprando esta entrada, abrirás una cuenta y aceptarás nuestras Condiciones de Uso generales, la Política de Privacidad y las ')}
                    <Link
                        to="/purchase-terms"
                        className="text-[#ff336d] underline hover:opacity-80 transition-opacity"
                    >
                        {t('checkout.purchase_conditions_link', 'Condiciones de Compra')}
                    </Link>
                    {t('checkout.legal_text_suffix', ' de entradas. Procesamos tus datos personales de acuerdo con nuestra Política de Privacidad.')}
                </p>

                <IncidentModal
                    isOpen={isIncidentModalOpen}
                    onClose={() => setIsIncidentModalOpen(false)}
                    context={{
                        eventName: event.name,
                    }}
                />
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pt-8 md:hidden z-50">
                {renderButton()}
            </div>
        </>
    );
};

export default CheckoutSummary;
export type {
    CheckoutSummaryProps,
    CartItem,
    EventInfo,
    CouponData,
    NominativeAssignment
};
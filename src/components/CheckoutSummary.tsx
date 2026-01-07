import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import IncidentModal from '@/components/IncidentModal';
import InputTextPhone from '@/components/ui/InputTextPhone';
import { countries } from '@/utils/countries';

// ============================================
// TYPES
// ============================================

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
    assignmentType: 'me' | 'send' | 'fill';
    phone?: string;
    phoneCountry?: string;
    firstName?: string;
    lastName?: string;
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

// ============================================
// ICONS
// ============================================

const IndicatorDot = ({ color }: { color: string }) => (
    <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: color }} />
);

// ============================================
// SUB COMPONENTS
// ============================================

// Timer Component
const CheckoutTimer = ({ seconds, isLow }: { seconds: number; isLow: boolean }) => {
    const { t } = useTranslation();

    const formatTime = (secs: number): string => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        if (mins > 0) {
            return `${mins} ${t('checkout.minutes', 'minutos')} y ${remainingSecs} ${t('checkout.seconds', 'segundos')}`;
        }
        return `${remainingSecs} ${t('checkout.seconds', 'segundos')}`;
    };

    return (
        <div className={`w-full h-[36px] flex items-center justify-center rounded-[12px] border-[1.5px] ${isLow
            ? 'bg-[rgba(255,35,35,0.05)] border-[rgba(255,35,35,0.25)]'
            : 'bg-[rgba(229,255,136,0.05)] border-[rgba(229,255,136,0.25)]'
            }`}>
            <span className={`text-[14px] font-normal font-helvetica ${isLow ? 'text-[#ff2323]' : 'text-[#e5ff88]'}`}>
                {formatTime(seconds)}
            </span>
        </div>
    );
};

// Event Info Card
const EventInfoCard = ({ event, items }: { event: EventInfo; items: CartItem[] }) => {
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
                {t('checkout.event', 'Evento')}
            </span>
            <div className="bg-[#141414] border-2 border-[#232323] rounded-[16px] w-full">
                {/* Event Header */}
                <div className="flex items-center gap-[12px] px-[16px] py-[12px] border-b-[1.5px] border-[#232323]">
                    {event.coverImage && (
                        <div className="w-[30px] h-[37.5px] rounded-[2px] overflow-hidden shrink-0 border border-[#232323]">
                            <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex items-center gap-[4px]">
                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                            {event.name}
                        </span>
                        <div className="w-[3px] h-[3px] rounded-full bg-[#939393]" />
                        <span className="text-[#e5ff88] text-[14px] font-normal font-helvetica">
                            {event.date}
                        </span>
                    </div>
                </div>

                {/* Items */}
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

// Coupon Section
interface CouponSectionProps {
    appliedCoupon: CouponData | null;
    onApplyCoupon: (code: string) => Promise<void>;
    onRemoveCoupon: () => void;
    isLoading: boolean;
    discountAmount: number;
}

// Gift icon SVG
const GiftIcon = () => (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="32" width="64" height="40" rx="4" fill="white" stroke="#E8E8E8" strokeWidth="2" />
        <rect x="4" y="24" width="72" height="16" rx="4" fill="white" stroke="#E8E8E8" strokeWidth="2" />
        <rect x="36" y="24" width="8" height="48" fill="#FF336D" />
        <path d="M40 24C40 24 28 24 28 16C28 8 36 8 40 16" stroke="#FF336D" strokeWidth="4" fill="none" />
        <path d="M40 24C40 24 52 24 52 16C52 8 44 8 40 16" stroke="#FF336D" strokeWidth="4" fill="none" />
        <circle cx="40" cy="16" r="4" fill="#FF336D" />
    </svg>
);

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

    // Applied coupon display
    if (appliedCoupon) {
        return (
            <div className="bg-[#141414] border-2 border-[#232323] rounded-[12px] px-[16px] py-[12px] flex items-center justify-between w-full">
                <div className="flex items-center gap-[4px]">
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                        {appliedCoupon.code}
                    </span>
                    <div className="w-[3px] h-[3px] rounded-full bg-[#939393]" />
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {discountAmount.toFixed(2).replace('.', ',')}€ {t('checkout.discount', 'descuento')}
                    </span>
                </div>
                <button
                    onClick={onRemoveCoupon}
                    disabled={isLoading}
                    className="h-[36px] px-[16px] bg-[rgba(255,35,35,0.25)] rounded-[8px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                    <span className="text-[#ff2323] text-[14px] font-bold font-helvetica">
                        {t('checkout.remove', 'Quitar')}
                    </span>
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full h-[48px] bg-[#232323] rounded-[12px] flex items-center justify-center cursor-pointer hover:bg-[#2a2a2a] transition-colors"
            >
                <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                    {t('checkout.apply_coupon', 'Aplicar código de cupón')}
                </span>
            </button>

            {/* Coupon Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-[24px]"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsModalOpen(false);
                            setCouponCode('');
                        }
                    }}
                >
                    <div
                        className="bg-[#0a0a0a] border-2 border-[#232323] rounded-[42px] w-full max-w-[400px] px-[24px] py-[42px] flex flex-col items-center gap-[36px] relative animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Grabber */}
                        <div className="absolute top-[14px] left-1/2 -translate-x-1/2">
                            <div className="w-[36px] h-[5px] bg-[#f6f6f6] opacity-25 rounded-full" />
                        </div>

                        {/* Icon + Title */}
                        <div className="flex flex-col items-center gap-[16px] px-[16px] w-full">
                            <div className="w-[120px] h-[120px] flex items-center justify-center">
                                <GiftIcon />
                            </div>
                            <h2 className="text-[#f6f6f6] text-[24px] font-semibold font-borna text-center">
                                {t('checkout.apply_coupon_title', 'Aplicar cupón')}
                            </h2>
                        </div>

                        {/* Input */}
                        <div className="flex flex-col gap-[4px] w-full">
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

                        {/* Apply Button */}
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

// Payment Details Card
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
                {/* Subtotal */}
                <div className="flex items-center justify-between px-[16px] h-[56px] border-b-[1.5px] border-[#232323]">
                    <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                        {t('checkout.subtotal', 'Subtotal')}:
                    </span>
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                        {subtotal.toFixed(2).replace('.', ',')}€
                    </span>
                </div>

                {/* Service Fee */}
                <div className={`flex items-center justify-between px-[16px] h-[56px] ${discount > 0 ? 'border-b-[1.5px] border-[#232323]' : ''}`}>
                    <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                        {t('checkout.service_fee', 'Gastos de gestión')}:
                    </span>
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                        {serviceFee.toFixed(2).replace('.', ',')}€
                    </span>
                </div>

                {/* Discount (only if applied) */}
                {discount > 0 && (
                    <div className="flex items-center justify-between px-[16px] h-[56px] border-b-[1.5px] border-[#232323]">
                        <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                            {t('checkout.discount_label', 'Descuento')}:
                        </span>
                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                            -{discount.toFixed(2).replace('.', ',')}€
                        </span>
                    </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between px-[16px] h-[56px]">
                    <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                        {t('checkout.total_price', 'Precio total')}:
                    </span>
                    <span className="text-[#f6f6f6] text-[24px] font-bold font-helvetica">
                        {total.toFixed(2).replace('.', ',')}€
                    </span>
                </div>
            </div>
        </div>
    );
};

// Nominative Assignment Section
interface NominativeAssignmentSectionProps {
    items: CartItem[];
    assignments: NominativeAssignment[];
    onAssignmentChange: (assignments: NominativeAssignment[]) => void;
}

// Checkbox icon component
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

    // Get all nominative items expanded by quantity
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

    if (nominativeEntries.length === 0) return null;

    const handleToggleMe = (itemIndex: number) => {
        const existing = assignments.find(a => a.itemIndex === itemIndex);
        const newAssignments = assignments.filter(a => a.itemIndex !== itemIndex);

        if (!existing || existing.assignmentType !== 'me') {
            // Activate "Para mi"
            newAssignments.push({ itemIndex, assignmentType: 'me' });
        } else {
            // Deactivate "Para mi" -> return to default state with phone input
            newAssignments.push({ itemIndex, assignmentType: 'send', phoneCountry: '34' });
        }

        onAssignmentChange(newAssignments);
    };

    const handleConfirmPhone = (itemIndex: number) => {
        const assignment = assignments.find(a => a.itemIndex === itemIndex);
        if (!assignment?.phone) {
            toast.error(t('checkout.phone_required', 'Introduce un número de teléfono'));
            return;
        }

        // Validate phone length
        const selectedCountry = countries.find(c => c.phone === assignment.phoneCountry);
        const expectedLength = selectedCountry?.phoneLength || 9;
        const phoneDigits = assignment.phone.replace(/\D/g, '');

        if (phoneDigits.length !== expectedLength) {
            toast.error(t('checkout.phone_invalid_length', 'Número de teléfono inválido'));
            return;
        }

        // TODO: Llamar API para buscar usuario por teléfono
        // Por ahora simulamos que no se encuentra y pasamos a 'fill'
        const newAssignments = assignments.map(a =>
            a.itemIndex === itemIndex
                ? { ...a, assignmentType: 'fill' as const }
                : a
        );
        onAssignmentChange(newAssignments);
    };

    const handleUpdateAssignment = (itemIndex: number, data: Partial<NominativeAssignment>) => {
        const newAssignments = assignments.map(a =>
            a.itemIndex === itemIndex ? { ...a, ...data } : a
        );
        onAssignmentChange(newAssignments);
    };

    // Format phone number based on country pattern
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

        handleUpdateAssignment(itemIndex, { phone: formattedValue });
    };

    const handleCountryChange = (itemIndex: number, newCountry: string) => {
        handleUpdateAssignment(itemIndex, { phoneCountry: newCountry, phone: '' });
    };

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
                {t('checkout.client_assignment', 'Asignación clientes')}*
            </span>

            <div className="flex flex-col gap-[8px]">
                {nominativeEntries.map(({ item, index }) => {
                    const assignment = assignments.find(a => a.itemIndex === index);
                    const isMe = assignment?.assignmentType === 'me';
                    const isSend = assignment?.assignmentType === 'send';
                    const isFill = assignment?.assignmentType === 'fill';
                    const indicatorColor = getIndicatorColor(item.type);

                    return (
                        <div
                            key={index}
                            className="bg-[#141414] border-2 border-[#232323] rounded-[16px] w-full"
                        >
                            {/* Variante 1: "Para mi" seleccionado - Solo header */}
                            {isMe && (
                                <div className="flex items-center justify-between px-[16px] h-[56px]">
                                    <div className="flex items-center gap-[6px]">
                                        <div
                                            className="w-[6px] h-[6px] rounded-full shrink-0"
                                            style={{ backgroundColor: indicatorColor }}
                                        />
                                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                                            {item.name}
                                        </span>
                                        <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                                            x1
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleToggleMe(index)}
                                        className="flex items-center gap-[8px] cursor-pointer"
                                    >
                                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                                            {t('checkout.for_me', 'Para mi')}
                                        </span>
                                        <CheckboxIcon checked={true} />
                                    </button>
                                </div>
                            )}

                            {/* Variante 2 y 3: No es "Para mi" - Mostrar formulario */}
                            {!isMe && (
                                <div className="flex flex-col gap-[16px] px-[16px] pb-[16px]">
                                    {/* Header con border bottom */}
                                    <div className="flex items-center justify-between h-[56px] border-b-[1.5px] border-[#232323]">
                                        <div className="flex items-center gap-[6px]">
                                            <div
                                                className="w-[6px] h-[6px] rounded-full shrink-0"
                                                style={{ backgroundColor: indicatorColor }}
                                            />
                                            <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                                                {item.name}
                                            </span>
                                            <span className="text-[#f6f6f6] text-[16px] font-bold font-helvetica">
                                                x1
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleToggleMe(index)}
                                            className="flex items-center gap-[8px] cursor-pointer"
                                        >
                                            <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                                                {t('checkout.for_me', 'Para mi')}
                                            </span>
                                            <CheckboxIcon checked={false} />
                                        </button>
                                    </div>

                                    {/* Phone input usando InputTextPhone */}
                                    <InputTextPhone
                                        label={`${t('checkout.phone', 'Teléfono')}*`}
                                        placeholder="000 00 00 00"
                                        value={assignment?.phone || ''}
                                        onChange={(value) => handlePhoneChange(index, value)}
                                        country={assignment?.phoneCountry || '34'}
                                        onCountryChange={(country) => handleCountryChange(index, country)}
                                        countries={countries}
                                        language={i18n.language as 'es' | 'en'}
                                    />

                                    {/* Confirm phone button - Solo si aún no está confirmado */}
                                    {isSend && (
                                        <button
                                            onClick={() => handleConfirmPhone(index)}
                                            className="w-full h-[36px] bg-[#232323] rounded-[8px] flex items-center justify-center font-bold text-[14px] font-helvetica text-[#f6f6f6] cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                                        >
                                            {t('checkout.confirm_phone', 'Confirmar teléfono')}
                                        </button>
                                    )}

                                    {/* Info text */}
                                    <p className="text-[#939393] text-[12px] font-medium font-helvetica px-[6px]">
                                        {isFill
                                            ? t('checkout.assign_auto_number', '**La entrada se asignará automáticamente al número indicado. Siempre podrás cancelar el envío desde la app.')
                                            : t('checkout.assign_auto_user', '**La entrada se asignará automáticamente al siguiente usuario. Siempre podrás cancelar el envío desde la app.')
                                        }
                                    </p>

                                    {/* Variante 3: Usuario no encontrado - Mostrar campos nombre/apellidos */}
                                    {isFill && (
                                        <>
                                            {/* Nombre */}
                                            <div className="flex flex-col gap-[4px]">
                                                <span className="text-[#939393] text-[14px] font-normal font-helvetica px-[6px]">
                                                    {t('checkout.first_name', 'Nombre')}*
                                                </span>
                                                <input
                                                    type="text"
                                                    value={assignment?.firstName || ''}
                                                    onChange={(e) => handleUpdateAssignment(index, { firstName: e.target.value })}
                                                    placeholder={t('checkout.first_name_placeholder', 'Borja')}
                                                    className="w-full h-[48px] border-[1.5px] border-[#232323] rounded-[12px] px-[16px] bg-transparent text-[#f6f6f6] text-[16px] font-medium font-helvetica placeholder:text-[#939393] outline-none focus:border-[#3fe8e8] transition-colors"
                                                />
                                            </div>

                                            {/* Apellidos */}
                                            <div className="flex flex-col gap-[4px]">
                                                <span className="text-[#939393] text-[14px] font-normal font-helvetica px-[6px]">
                                                    {t('checkout.last_name', 'Apellidos')}*
                                                </span>
                                                <input
                                                    type="text"
                                                    value={assignment?.lastName || ''}
                                                    onChange={(e) => handleUpdateAssignment(index, { lastName: e.target.value })}
                                                    placeholder={t('checkout.last_name_placeholder', 'Gomendio')}
                                                    className="w-full h-[48px] border-[1.5px] border-[#232323] rounded-[12px] px-[16px] bg-transparent text-[#f6f6f6] text-[16px] font-medium font-helvetica placeholder:text-[#939393] outline-none focus:border-[#3fe8e8] transition-colors"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

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

    // State
    const [timeLeft, setTimeLeft] = useState(timerSeconds);
    const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [nominativeAssignments, setNominativeAssignments] = useState<NominativeAssignment[]>([]);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

    // Initialize nominative assignments with 'send' as default
    useEffect(() => {
        const nominativeItems = items.filter(item => item.isNominative);
        if (nominativeItems.length === 0) return;

        // Count total nominative entries
        let totalEntries = 0;
        nominativeItems.forEach(item => {
            totalEntries += item.quantity;
        });

        // Only initialize if we don't have assignments yet
        if (nominativeAssignments.length === 0 && totalEntries > 0) {
            const initialAssignments: NominativeAssignment[] = [];
            let globalIndex = 0;

            items.forEach(item => {
                if (item.isNominative) {
                    for (let i = 0; i < item.quantity; i++) {
                        initialAssignments.push({
                            itemIndex: globalIndex,
                            assignmentType: 'send',
                            phoneCountry: '34'
                        });
                        globalIndex++;
                    }
                }
            });

            setNominativeAssignments(initialAssignments);
        }
    }, [items, nominativeAssignments.length]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) {
            onTimerExpired();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onTimerExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, onTimerExpired]);

    // Calculations
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

    // Check if has nominative items
    const hasNominativeItems = useMemo(() => {
        return items.some(item => item.isNominative);
    }, [items]);

    // Check if all nominative assignments are complete
    const nominativeComplete = useMemo(() => {
        if (!hasNominativeItems) return true;

        const totalNominativeCount = items
            .filter(item => item.isNominative)
            .reduce((acc, item) => acc + item.quantity, 0);

        if (nominativeAssignments.length !== totalNominativeCount) return false;

        return nominativeAssignments.every(assignment => {
            if (assignment.assignmentType === 'me') return true;
            if (assignment.assignmentType === 'send') return !!assignment.phone;
            if (assignment.assignmentType === 'fill') {
                return !!assignment.firstName && !!assignment.lastName && !!assignment.phone;
            }
            return false;
        });
    }, [hasNominativeItems, items, nominativeAssignments]);

    // Apply coupon
    const handleApplyCoupon = useCallback(async (code: string) => {
        setCouponLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/v2/coupons/validate/${code}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Coupon validation failed');
            }

            if (!data.data.valid) {
                toast.error(t('checkout.invalid_coupon', 'Cupón no válido'));
                return;
            }

            setAppliedCoupon(data.data.coupon);
            toast.success(t('checkout.coupon_applied', 'Cupón aplicado correctamente'));
        } catch (error) {
            console.error('Coupon validation error:', error);
            toast.error(t('checkout.coupon_error', 'Error al validar el cupón'));
        } finally {
            setCouponLoading(false);
        }
    }, [t]);

    // Remove coupon
    const handleRemoveCoupon = useCallback(() => {
        setAppliedCoupon(null);
    }, []);

    // Continue to payment
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

    const isLowTime = timeLeft < 60;
    const canContinue = !hasNominativeItems || nominativeComplete;

    return (
        <div className="flex flex-col gap-[36px] w-full max-w-[480px] mx-auto px-[24px] py-[24px]">
            {/* Timer */}
            <CheckoutTimer seconds={timeLeft} isLow={isLowTime} />

            {/* Event Info */}
            <EventInfoCard event={event} items={items} />

            {/* Coupon Section */}
            {subtotal > 0 && (
                <CouponSection
                    appliedCoupon={appliedCoupon}
                    onApplyCoupon={handleApplyCoupon}
                    onRemoveCoupon={handleRemoveCoupon}
                    isLoading={couponLoading}
                    discountAmount={discountAmount}
                />
            )}

            {/* Payment Details */}
            <PaymentDetailsCard
                subtotal={subtotal}
                serviceFee={serviceFee}
                discount={discountAmount}
                total={total}
            />

            {/* Nominative Assignment (only for tickets with isNominative) */}
            {hasNominativeItems && (
                <NominativeAssignmentSection
                    items={items}
                    assignments={nominativeAssignments}
                    onAssignmentChange={setNominativeAssignments}
                />
            )}

            {/* Info Text */}
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

            {/* Continue Button */}
            <button
                onClick={handleContinue}
                disabled={!canContinue || isLoading}
                className={`w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${canContinue && !isLoading
                    ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90'
                    : 'bg-[#ff336d] text-[#f6f6f6] opacity-50 cursor-not-allowed'
                    }`}
            >
                {isLoading ? (
                    <div className="flex items-center gap-[8px]">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{t('checkout.creating_order', 'Creando pedido...')}</span>
                    </div>
                ) : total === 0 ? (
                    <span>{t('checkout.confirm_free', 'Confirmar')} - {t('checkout.free', 'Gratis')}</span>
                ) : (
                    <span>{t('checkout.continue_to_payment', 'Continuar al pago')} - {total.toFixed(2).replace('.', ',')}€</span>
                )}
            </button>

            {/* Legal Text */}
            <p className="text-[rgba(246,246,246,0.5)] text-[12px] font-medium font-helvetica px-[6px] leading-[1.4]">
                {t('checkout.legal_text', 'Comprando esta entrada, abrirás una cuenta y aceptarás nuestras Condiciones de Uso generales, la Política de Privacidad y las Condiciones de Compra de entradas. Procesamos tus datos personales de acuerdo con nuestra Política de Privacidad.')}
            </p>

            {/* Incident Modal */}
            <IncidentModal
                isOpen={isIncidentModalOpen}
                onClose={() => setIsIncidentModalOpen(false)}
                context={{
                    eventName: event.name,
                }}
            />
        </div>
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
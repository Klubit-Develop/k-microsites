import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/ui/Modal';

// ============================================
// TYPES
// ============================================

type ModalVariant = 'ticket' | 'guestlist' | 'promotion';

interface ProductIncluded {
    name: string;
    quantity: number;
}

interface PrecompraData {
    products?: ProductIncluded[];
    startTime?: string;
    endTime?: string;
    price: number;
}

interface ItemInfoData {
    id: string;
    name: string;
    priceName?: string;
    indicatorColor: string;
    maxPersons: number;
    products?: ProductIncluded[];
    zones?: string[];
    startTime?: string;
    endTime?: string;
    benefits?: string[];
    finalPrice: number;
    currency?: string;
    isLowStock?: boolean;
    lowStockLabel?: string;
    description?: string;
    promoImage?: string;
    isFree?: boolean;
    hasPrecompra?: boolean;
    precompraData?: PrecompraData;
}

interface ItemInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ItemInfoData | null;
    variant: ModalVariant;
    quantity: number;
    onQuantityChange: (delta: number) => void;
    onConfirm: () => void;
}

// ============================================
// ICONS
// ============================================

const MinusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 12H19" stroke="#F6F6F6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 12H19" stroke="#F6F6F6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 5V19" stroke="#F6F6F6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

const PersonIcon = () => (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
        <path d="M6 6.5C7.38071 6.5 8.5 5.38071 8.5 4C8.5 2.61929 7.38071 1.5 6 1.5C4.61929 1.5 3.5 2.61929 3.5 4C3.5 5.38071 4.61929 6.5 6 6.5Z" fill="#939393" />
        <path d="M6 8C3.79086 8 2 9.79086 2 12H10C10 9.79086 8.20914 8 6 8Z" fill="#939393" />
    </svg>
);

const PromoTagIcon = () => (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" style={{ transform: 'rotate(12deg)', filter: 'drop-shadow(0px 0px 30px rgba(0,0,0,1))' }}>
        <path d="M70 15H30C26.134 15 23 18.134 23 22V78C23 81.866 26.134 85 30 85H70C73.866 85 77 81.866 77 78V22C77 18.134 73.866 15 70 15Z" fill="#FF336D" />
        <circle cx="50" cy="10" r="5" fill="#FF336D" />
        <text x="50" y="58" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">%</text>
    </svg>
);

// ============================================
// INFO ROW COMPONENTS
// ============================================

const InfoRow = ({ label, value, hasBorder = true }: { label: string; value: React.ReactNode; hasBorder?: boolean }) => (
    <div className={`flex items-center justify-between px-[16px] py-[12px] min-h-[56px] ${hasBorder ? 'border-b-[1.5px] border-[#232323]' : ''}`}>
        <span className="text-[#939393] text-[16px] font-medium font-helvetica shrink-0">{label}</span>
        <div className="flex-1 ml-6 text-right">{value}</div>
    </div>
);

const InfoRowPrecompra = ({ label, oldValue, newValue, hasBorder = true }: { label: string; oldValue: string; newValue: React.ReactNode; hasBorder?: boolean }) => (
    <div className={`flex items-start justify-between px-[16px] py-[12px] min-h-[56px] ${hasBorder ? 'border-b-[1.5px] border-[#232323]' : ''}`}>
        <span className="text-[#939393] text-[16px] font-medium font-helvetica shrink-0 pt-[2px]">{label}</span>
        <div className="flex flex-col items-end gap-[2px] flex-1 ml-6">
            <span className="text-[#939393] text-[16px] font-medium font-helvetica line-through">{oldValue}</span>
            <div className="flex items-center gap-[6px] text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                <span>✨</span>
                {newValue}
            </div>
        </div>
    </div>
);

const InfoRowMultiline = ({ label, value, hasBorder = true }: { label: string; value: string; hasBorder?: boolean }) => (
    <div className={`flex flex-col gap-[4px] px-[16px] py-[16px] ${hasBorder ? 'border-b-[1.5px] border-[#232323]' : ''}`}>
        <span className="text-[#939393] text-[16px] font-medium font-helvetica">{label}</span>
        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">{value}</span>
    </div>
);

const PROMOTION_ICON_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/icon-promotion.png';

// ============================================
// MAIN COMPONENT
// ============================================

const ItemInfoModal = ({
    isOpen,
    onClose,
    data,
    variant,
    quantity,
    onQuantityChange,
    onConfirm,
}: ItemInfoModalProps) => {
    const { t } = useTranslation();
    const [showPrecompra, setShowPrecompra] = useState(false);

    useEffect(() => {
        if (!isOpen) setShowPrecompra(false);
    }, [isOpen]);

    const formatPrice = useCallback((price: number): string => {
        return price.toFixed(2).replace('.', ',') + '€';
    }, []);

    const total = useMemo(() => {
        if (!data) return 0;
        if (showPrecompra && data.precompraData) return data.precompraData.price * quantity;
        return data.finalPrice * quantity;
    }, [data, quantity, showPrecompra]);

    const handleTogglePrecompra = useCallback(() => {
        setShowPrecompra(prev => !prev);
    }, []);

    if (!data) return null;

    const isPrecompraActive = showPrecompra && data.hasPrecompra && data.precompraData;

    const getButtonText = () => {
        if (variant === 'promotion') return `${t('item_info.pay', 'Pagar')} - ${formatPrice(total)}`;
        if (variant === 'guestlist') {
            if (data.isFree && !isPrecompraActive) return t('item_info.sign_up', 'Apuntarse');
            if (isPrecompraActive) return `${t('event.continue', 'Continuar')} - ${formatPrice(total)}`;
        }
        return `${t('item_info.pay', 'Pagar')} - ${formatPrice(total)}`;
    };

    const renderDetailContent = () => (
        <div className="flex flex-col w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-[16px] py-[12px] min-h-[56px] border-b-[1.5px] border-[#232323]">
                <div className="flex flex-col gap-[2px] flex-1">
                    <div className="flex items-center gap-[6px]">
                        <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: data.indicatorColor }} />
                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">{data.name}</span>
                    </div>
                    {data.priceName && (
                        <div className="pl-[12px]">
                            <span className="text-[#939393] text-[14px] font-normal font-helvetica">{data.priceName}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-[4px] px-[10px] py-[4px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] shrink-0">
                    <span className="text-[#939393] text-[16px] font-medium font-helvetica">{data.maxPersons}</span>
                    <PersonIcon />
                </div>
            </div>

            {/* Products - Tickets */}
            {variant === 'ticket' && data.products && data.products.length > 0 && (
                <InfoRow
                    label={t('item_info.product', 'Producto:')}
                    value={
                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica flex items-center gap-[6px] justify-end">
                            <span>{data.products.map(p => p.name).join(', ')}</span>
                            <span className="font-bold">x{data.products.reduce((acc, p) => acc + p.quantity, 0)}</span>
                        </span>
                    }
                />
            )}

            {/* Products - Guestlist with precompra */}
            {variant === 'guestlist' && isPrecompraActive && data.precompraData?.products && (
                <InfoRowPrecompra
                    label={t('item_info.product', 'Producto:')}
                    oldValue={t('item_info.no_consumption', 'Sin consumición')}
                    newValue={
                        <span className="flex items-center gap-[6px]">
                            <span>{data.precompraData.products.map(p => p.name).join(', ')}</span>
                            <span className="font-bold">x{data.precompraData.products.reduce((acc, p) => acc + p.quantity, 0)}</span>
                        </span>
                    }
                />
            )}

            {/* Zones */}
            {data.zones && data.zones.length > 0 && (
                <InfoRow
                    label={t('item_info.zones', 'Zonas:')}
                    value={<span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">{data.zones.join(', ')}</span>}
                />
            )}

            {/* Schedule */}
            {(data.startTime || data.endTime) && (
                isPrecompraActive && data.precompraData?.startTime ? (
                    <InfoRowPrecompra
                        label={t('item_info.schedule', 'Horario:')}
                        oldValue={`${data.startTime || '00:00'}h - ${data.endTime || '00:00'}h`}
                        newValue={<span>{data.precompraData.startTime}h - {data.precompraData.endTime}h</span>}
                    />
                ) : (
                    <InfoRow
                        label={t('item_info.schedule', 'Horario:')}
                        value={<span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">{data.startTime || '00:00'}h - {data.endTime || '00:00'}h</span>}
                    />
                )
            )}

            {/* Benefits - Tickets only */}
            {variant === 'ticket' && data.benefits && data.benefits.length > 0 && (
                <InfoRowMultiline label={t('item_info.benefits', 'Otros beneficios:')} value={data.benefits.join(', ')} />
            )}

            {/* Total Price */}
            <div className="flex items-center justify-between px-[16px] py-[12px] min-h-[56px]">
                <span className="text-[#939393] text-[16px] font-medium font-helvetica">{t('item_info.total_price', 'Precio total:')}</span>
                <div className="flex items-center gap-[8px]">
                    {isPrecompraActive && (
                        <div className="flex items-center px-[8px] py-[2px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                            <span className="text-[#ffce1f] text-[12px] font-medium font-helvetica">{t('item_info.precompra', 'Precompra')} ✨</span>
                        </div>
                    )}
                    {!isPrecompraActive && data.isLowStock && data.lowStockLabel && (
                        <div className="flex items-center px-[8px] py-[2px] bg-[#232323] rounded-[25px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                            <span className="text-[#f6f6f6] text-[12px] font-medium font-helvetica">{data.lowStockLabel}</span>
                        </div>
                    )}
                    <span className="text-[#f6f6f6] text-[24px] font-bold font-helvetica">
                        {data.isFree && !isPrecompraActive
                            ? t('event.free', 'Gratis')
                            : formatPrice(isPrecompraActive && data.precompraData ? data.precompraData.price : data.finalPrice)
                        }
                    </span>
                </div>
            </div>
        </div>
    );

    const renderPromotionContent = () => (
        <div className="flex flex-col gap-[16px] items-center px-[16px] w-full">
            <div className="w-[120px] h-[120px] flex items-center justify-center p-[4px]">
                <img
                    src={PROMOTION_ICON_URL}
                    alt={data.name}
                    className="max-w-full max-h-full object-contain"
                />
            </div>
            <h2 className="text-[#f6f6f6] text-[24px] font-semibold font-borna text-center w-full">{data.name}</h2>
            {data.description && (
                <p className="text-[#939393] text-[16px] font-medium font-helvetica text-center leading-[1.4]">{data.description}</p>
            )}
        </div>
    );

    const renderButtons = () => (
        <div className="flex flex-col gap-[8px] w-full">
            {/* Quantity selector */}
            <div className="flex items-center gap-[24px] justify-center">
                <button
                    onClick={() => onQuantityChange(-1)}
                    disabled={quantity === 0}
                    className={`flex-1 flex items-center justify-center h-[48px] bg-[#232323] rounded-[8px] transition-opacity ${quantity === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                >
                    <MinusIcon />
                </button>
                <span className={`w-[56px] text-center text-[32px] font-semibold font-borna ${quantity > 0 ? 'text-[#e5ff88]' : 'text-[#f6f6f6]'}`}>
                    {quantity}
                </span>
                <button
                    onClick={() => onQuantityChange(1)}
                    className="flex-1 flex items-center justify-center h-[48px] bg-[#232323] rounded-[8px] cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <PlusIcon />
                </button>
            </div>

            {/* Primary button */}
            <button
                onClick={onConfirm}
                disabled={quantity === 0 && !(data.isFree && variant === 'guestlist' && !isPrecompraActive)}
                className={`w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${(quantity > 0 || (data.isFree && variant === 'guestlist' && !isPrecompraActive))
                        ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90'
                        : 'bg-[#ff336d] text-[#f6f6f6] opacity-50 cursor-not-allowed'
                    }`}
            >
                {getButtonText()}
            </button>

            {/* View precompra button */}
            {variant === 'guestlist' && data.hasPrecompra && !showPrecompra && (
                <button
                    onClick={handleTogglePrecompra}
                    className="w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica bg-[#232323] text-[#f6f6f6] cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                >
                    {t('item_info.view_precompra', 'Ver precompra')}
                </button>
            )}

            {/* Back to free button */}
            {variant === 'guestlist' && showPrecompra && (
                <button
                    onClick={handleTogglePrecompra}
                    className="w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica bg-[#232323] text-[#f6f6f6] cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                >
                    {t('item_info.back_to_free', 'Volver a guestlist gratis')}
                </button>
            )}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-[36px] w-full">
                {variant === 'promotion' ? renderPromotionContent() : renderDetailContent()}
                {renderButtons()}
            </div>
        </Modal>
    );
};

export default ItemInfoModal;
export type { ItemInfoData, ItemInfoModalProps, ModalVariant, ProductIncluded, PrecompraData };
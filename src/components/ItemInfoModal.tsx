import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/ui/Modal';

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
    maxQuantity?: number;
    onQuantityChange: (delta: number) => void;
    onConfirm: () => void;
}

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

const PROMOTION_ICON_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/icon-promotion.png';

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

const ItemInfoModal = ({
    isOpen,
    onClose,
    data,
    variant,
    quantity,
    maxQuantity,
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
            <div className="flex items-center justify-between px-[16px] py-[12px] min-h-[56px] border-b-[1.5px] border-[#232323]">
                <div className="flex flex-col gap-[2px] flex-1">
                    <div className="flex items-center gap-[6px]">
                        <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: data.indicatorColor }} />
                        <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">{data.name}</span>
                    </div>
                    {data.priceName && data.priceName !== 'Precio único' && (
                        <div className="pl-[12px]">
                            <span className="text-[#939393] text-[14px] font-normal font-helvetica">{data.priceName}</span>
                        </div>
                    )}
                </div>
            </div>

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

            {variant === 'guestlist' && isPrecompraActive && data.precompraData?.products && (
                <InfoRowPrecompra
                    label={t('item_info.product', 'Producto:')}
                    oldValue={t('item_info.no_consumption', 'Sin consumición')}
                    newValue={
                        <span>{data.precompraData.products.map(p => p.name).join(', ')}</span>
                    }
                />
            )}

            {data.zones && data.zones.length > 0 && (
                <InfoRow
                    label={t('item_info.zones', 'Zonas:')}
                    value={<span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">{data.zones.join(', ')}</span>}
                />
            )}

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

            {variant === 'ticket' && data.benefits && data.benefits.length > 0 && (
                <InfoRowMultiline label={t('item_info.benefits', 'Otros beneficios:')} value={data.benefits.join(', ')} />
            )}

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

    const isAtMax = maxQuantity !== undefined && quantity >= maxQuantity;

    const renderButtons = () => (
        <div className="flex flex-col gap-[8px] w-full">
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
                    disabled={isAtMax}
                    className={`flex-1 flex items-center justify-center h-[48px] bg-[#232323] rounded-[8px] transition-opacity ${isAtMax ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                >
                    <PlusIcon />
                </button>
            </div>

            <button
                onClick={onConfirm}
                disabled={quantity === 0 && !(data.isFree && variant === 'guestlist' && !isPrecompraActive)}
                className={`w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica transition-opacity ${
                    (quantity > 0 || (data.isFree && variant === 'guestlist' && !isPrecompraActive))
                        ? 'bg-[#ff336d] text-[#f6f6f6] cursor-pointer hover:opacity-90' 
                        : 'bg-[#ff336d] text-[#f6f6f6] opacity-50 cursor-not-allowed'
                }`}
            >
                {getButtonText()}
            </button>

            {variant === 'guestlist' && data.hasPrecompra && !showPrecompra && (
                <button
                    onClick={handleTogglePrecompra}
                    className="w-full h-[48px] rounded-[12px] flex items-center justify-center font-bold text-[16px] font-helvetica bg-[#232323] text-[#f6f6f6] cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                >
                    {t('item_info.view_precompra', 'Ver precompra')}
                </button>
            )}

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
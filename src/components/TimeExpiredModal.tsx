import { useTranslation } from 'react-i18next';
import Modal from '@/components/ui/Modal';

// ============================================
// CLOCK ICON
// ============================================

const ClockIcon = () => (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" style={{ filter: 'drop-shadow(0px 0px 30px rgba(0,0,0,1))' }}>
        {/* Outer ring */}
        <circle cx="38" cy="38" r="36" fill="#F6F6F6" stroke="#E0E0E0" strokeWidth="2" />
        {/* Inner circle */}
        <circle cx="38" cy="38" r="32" fill="#FAFAFA" />
        {/* Hour markers */}
        <circle cx="38" cy="10" r="2" fill="#333" />
        <circle cx="38" cy="66" r="2" fill="#333" />
        <circle cx="10" cy="38" r="2" fill="#333" />
        <circle cx="66" cy="38" r="2" fill="#333" />
        {/* Hour hand */}
        <line x1="38" y1="38" x2="38" y2="22" stroke="#333" strokeWidth="3" strokeLinecap="round" />
        {/* Minute hand */}
        <line x1="38" y1="38" x2="52" y2="38" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx="38" cy="38" r="3" fill="#333" />
    </svg>
);

// ============================================
// COMPONENT
// ============================================

interface TimeExpiredModalProps {
    isOpen: boolean;
    onRetry: () => void;
}

const TimeExpiredModal = ({ isOpen, onRetry }: TimeExpiredModalProps) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onRetry}>
            <div className="flex flex-col gap-[36px] items-center w-full">
                {/* Content */}
                <div className="flex flex-col gap-[16px] items-center px-[16px] w-full">
                    {/* Clock icon */}
                    <div className="flex items-center justify-center p-[6px] size-[120px]">
                        <ClockIcon />
                    </div>

                    {/* Title */}
                    <h2 className="text-[#f6f6f6] text-[24px] font-semibold font-borna text-center w-full">
                        {t('checkout.time_expired', 'Tiempo agotado')}
                    </h2>

                    {/* Description */}
                    <p className="text-[#939393] text-[16px] font-medium font-helvetica text-center leading-[1.4]">
                        {t('checkout.time_expired_description', 'Se ha agotado el tiempo de compra. Por favor vuelve a seleccionar tus entradas nuevamente. Recuerda que tienes 10 minutos para completar el proceso')}
                    </p>
                </div>

                {/* Button */}
                <button
                    onClick={onRetry}
                    className="w-full h-[48px] bg-[#ff336d] text-[#f6f6f6] font-bold text-[16px] font-helvetica rounded-[12px] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                >
                    {t('checkout.retry', 'Reintentar')}
                </button>
            </div>
        </Modal>
    );
};

export default TimeExpiredModal;
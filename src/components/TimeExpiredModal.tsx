import { useTranslation } from 'react-i18next';
import Modal from '@/components/ui/Modal';

interface TimeExpiredModalProps {
    isOpen: boolean;
    onRetry: () => void;
}

const TimeExpiredModal = ({ isOpen, onRetry }: TimeExpiredModalProps) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onRetry}>
            <div className="flex flex-col gap-[36px] items-center w-full">
                <div className="flex flex-col gap-[16px] items-center px-[16px] w-full">
                    <div className="flex items-center justify-center size-[120px]">
                        <img 
                            src="https://klubit.fra1.cdn.digitaloceanspaces.com/icon-clock.png" 
                            alt="Clock"
                            className="w-[76px] h-[76px] object-contain"
                        />
                    </div>

                    <h2 className="text-[#f6f6f6] text-[24px] font-semibold font-borna text-center w-full">
                        {t('checkout.time_expired', 'Tiempo agotado')}
                    </h2>

                    <p className="text-[#939393] text-[16px] font-medium font-helvetica text-center leading-[1.4]">
                        {t('checkout.time_expired_description', 'Se ha agotado el tiempo de compra. Por favor vuelve a seleccionar tus entradas nuevamente. Recuerda que tienes 10 minutos para completar el proceso')}
                    </p>
                </div>

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
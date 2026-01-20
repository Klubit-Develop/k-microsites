import { useTranslation } from 'react-i18next';

interface CheckoutTimerProps {
    seconds: number;
}

const CheckoutTimer = ({ seconds }: CheckoutTimerProps) => {
    const { t } = useTranslation();

    const isLow = seconds < 60;

    const formatTime = (secs: number): string => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        if (mins > 0) {
            return `${mins} ${t('checkout.minutes', 'minutos')} y ${remainingSecs} ${t('checkout.seconds', 'segundos')}`;
        }
        return `${remainingSecs} ${t('checkout.seconds', 'segundos')}`;
    };

    return (
        <div className={`w-full h-[36px] flex items-center justify-center rounded-[12px] border-[1.5px] ${
            isLow
                ? 'bg-[rgba(255,35,35,0.05)] border-[rgba(255,35,35,0.25)]'
                : 'bg-transparent border-[#232323]'
        }`}>
            <span className={`text-[14px] font-normal font-helvetica ${
                isLow ? 'text-[#ff2323]' : 'text-[#f6f6f6]'
            }`}>
                {formatTime(seconds)}
            </span>
        </div>
    );
};

export default CheckoutTimer;
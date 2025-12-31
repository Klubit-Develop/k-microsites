import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';

interface CheckoutFooterProps {
    total: number;
    totalQuantity: number;
    onCheckout?: () => void;
    isLoading?: boolean;
    isProcessing?: boolean;
    className?: string;
}

const CheckoutFooter = ({
    total,
    totalQuantity,
    onCheckout,
    isLoading = false,
    isProcessing = false,
    className = '',
}: CheckoutFooterProps) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[16px] w-full animate-pulse ${className}`}>
                <div className="h-[48px] w-full bg-[#232323] rounded-[8px]" />
                <div className="px-[6px]">
                    <div className="h-4 w-full bg-[#232323] rounded" />
                    <div className="h-4 w-3/4 bg-[#232323] rounded mt-2" />
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-[16px] w-full ${className}`}>
            {/* CTA Button */}
            <Button
                variant="cta"
                disabled={totalQuantity === 0 || isProcessing}
                onClick={onCheckout}
                className="w-full h-[48px]"
            >
                {t('event.continue', 'Continuar')} - {(total ?? 0).toFixed(2).replace('.', ',')}€
            </Button>

            {/* Legal text */}
            <div className="px-[6px]">
                <p className="text-[rgba(246,246,246,0.5)] text-[12px] font-medium font-helvetica leading-normal">
                    {t('event.legal_text', 'Comprando esta entrada, abrirás una cuenta y aceptarás nuestras Condiciones de Uso generales, la Política de Privacidad y las Condiciones de Compra de entradas. Procesamos tus datos personales de acuerdo con nuestra Política de Privacidad.')}
                </p>
            </div>
        </div>
    );
};

export default CheckoutFooter;
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
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

    const getButtonText = () => {
        if (totalQuantity === 0) {
            return t('event.continue', 'Continuar');
        }
        if (total === 0) {
            return t('checkout.free', 'Gratis');
        }
        return `${t('event.continue', 'Continuar')} - ${total.toFixed(2).replace('.', ',')}€`;
    };

    const buttonContent = (
        <Button
            variant="cta"
            disabled={totalQuantity === 0 || isProcessing}
            onClick={onCheckout}
            className="w-full h-[48px]"
        >
            {getButtonText()}
        </Button>
    );

    return (
        <>
            {/* Desktop version */}
            <div className={`hidden md:flex flex-col gap-[16px] w-full ${className}`}>
                {buttonContent}
                <div className="px-[6px]">
                    <p className="text-[rgba(246,246,246,0.5)] text-[12px] font-medium font-helvetica leading-normal">
                        {t('checkout.legal_text_prefix', 'Comprando esta entrada, abrirás una cuenta y aceptarás nuestras Condiciones de Uso generales, la Política de Privacidad y las ')}
                        <Link
                            to="/purchase-terms"
                            className="text-[#ff336d] underline hover:opacity-80 transition-opacity"
                        >
                            {t('checkout.purchase_conditions_link', 'Condiciones de Compra')}
                        </Link>
                        {t('checkout.legal_text_suffix', ' de entradas. Procesamos tus datos personales de acuerdo con nuestra Política de Privacidad.')}
                    </p>
                </div>
            </div>

            {/* Mobile version - Legal text in flow */}
            <div className={`md:hidden flex flex-col gap-[16px] w-full ${className}`}>
                <div className="px-[6px]">
                    <p className="text-[rgba(246,246,246,0.5)] text-[12px] font-medium font-helvetica leading-normal">
                        {t('checkout.legal_text_prefix', 'Comprando esta entrada, abrirás una cuenta y aceptarás nuestras Condiciones de Uso generales, la Política de Privacidad y las ')}
                        <Link
                            to="/purchase-terms"
                            className="text-[#ff336d] underline hover:opacity-80 transition-opacity"
                        >
                            {t('checkout.purchase_conditions_link', 'Condiciones de Compra')}
                        </Link>
                        {t('checkout.legal_text_suffix', ' de entradas. Procesamos tus datos personales de acuerdo con nuestra Política de Privacidad.')}
                    </p>
                </div>
                {/* Spacer for fixed button */}
            </div>

            {/* Mobile fixed button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pt-8 md:hidden z-50">
                {buttonContent}
            </div>
        </>
    );
};

export default CheckoutFooter;
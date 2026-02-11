import { useTranslation } from 'react-i18next';
import { useRouter } from '@tanstack/react-router';
import { useCheckoutStore } from '@/stores/useCheckoutStore';

const PurchaseTerms = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { eventDisplayInfo } = useCheckoutStore();

    const handleBack = () => {
        if (window.history.length > 1) {
            router.history.back();
        } else {
            router.navigate({ to: '/' });
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <div className="flex flex-col gap-[45px] w-full max-w-[500px] mx-auto px-4 pt-[120px] pb-[100px] md:pt-8 md:pb-8">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-[#939393] hover:text-[#F6F6F6] transition-colors self-start cursor-pointer"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[14px] font-helvetica font-medium">
                        {t('common.back', 'Volver')}
                    </span>
                </button>

                <div className="flex flex-col gap-[45px]">
                    <h1 className="text-[24px] font-borna font-semibold text-[#FF336D]">
                        {t('purchase_terms.title', 'Términos de compra')}
                    </h1>

                    <div className="flex flex-col gap-[36px]">
                        <div className="flex flex-col gap-[6px]">
                            <h2 className="text-[16px] font-helvetica font-bold text-[#F6F6F6]">
                                {t('purchase_terms.important_info_title', 'Información importante')}
                            </h2>
                            <p className="text-[14px] font-helvetica text-[#939393] leading-[1.5]">
                                {t('purchase_terms.important_info_content', 'Lleva tu móvil con la app instalada para acceder al evento.\nPresenta el código QR de tus entradas en la puerta.\nLas entradas son nominativas e intransferibles salvo que el local indique lo contrario.')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-[8px]">
                            <p className="text-[14px] font-helvetica text-[#939393] leading-[1.5] whitespace-pre-wrap">
                                {eventDisplayInfo?.termsAndConditions || t('purchase_terms.no_terms', 'No hay términos y condiciones disponibles para este evento.')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseTerms;
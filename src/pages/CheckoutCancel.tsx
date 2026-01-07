import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

const CheckoutCancel = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 pt-[120px] pb-[100px] md:pt-24 md:pb-24">
            <div className="flex flex-col items-center gap-8 w-full max-w-[400px] text-center">
                <div className="w-20 h-20 md:w-[100px] md:h-[100px] rounded-full bg-[rgba(255,193,7,0.1)] flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="md:w-[50px] md:h-[50px]">
                        <path
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            stroke="#ffc107"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <div className="flex flex-col gap-3">
                    <h1 className="text-2xl md:text-[28px] font-bold font-helvetica text-[#f6f6f6]">
                        {t('checkout_cancel.title', 'Pago cancelado')}
                    </h1>
                    <p className="text-sm md:text-base font-normal font-helvetica text-[#939393]">
                        {t('checkout_cancel.description', 'Has cancelado el proceso de pago. No se ha realizado ningún cargo.')}
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={() => window.history.back()}
                        className="h-12 md:h-[52px] px-8 bg-[#ff336d] rounded-xl flex items-center justify-center font-bold text-base font-helvetica text-[#f6f6f6] hover:bg-[#e62e61] transition-colors w-full cursor-pointer"
                    >
                        {t('checkout_cancel.try_again', 'Intentar de nuevo')}
                    </button>
                    <Link
                        to="/"
                        className="h-12 px-8 bg-transparent border border-[#232323] rounded-xl flex items-center justify-center font-medium text-base font-helvetica text-[#939393] hover:bg-[#141414] transition-colors w-full"
                    >
                        {t('checkout_cancel.go_home', 'Ir al inicio')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckoutCancel;
import React from 'react';
import { useTranslation } from 'react-i18next';

const PageError: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-4 py-8">
            <h1 className="font-helvetica text-2xl md:text-[32px] font-normal text-[#ECF0F5]">
                {t('error.page_not_found', 'Página no encontrada')}
            </h1>
            <div className="flex flex-col items-center">
                <p className="font-helvetica text-sm md:text-base font-normal leading-6 tracking-[0.64px] text-[#939393]">
                    {t('error.page_not_found_description', 'Esta página no existe o fue eliminada.')}
                </p>
                <p className="font-helvetica text-sm md:text-base font-normal leading-6 tracking-[0.64px] text-[#939393]">
                    {t('error.page_not_found_suggestion', 'Te sugerimos volver a la página de inicio.')}
                </p>
            </div>
        </div>
    );
};

export default PageError;
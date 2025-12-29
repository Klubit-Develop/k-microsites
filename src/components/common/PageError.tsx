import React from 'react';

const PageError: React.FC = () => {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <h1 className="font-helvetica text-[32px] font-normal text-[#ECF0F5]">
                Página no encontrada
            </h1>
            <div className="flex flex-col items-center">
                <p className="font-helvetica text-base font-normal leading-6 tracking-[0.64px] text-[#939393]">
                    Esta página no existe o fue eliminada.
                </p>
                <p className="font-helvetica text-base font-normal leading-6 tracking-[0.64px] text-[#939393]">
                    Te sugerimos volver a la página de inicio.
                </p>
            </div>
        </div>
    );
};

export default PageError;
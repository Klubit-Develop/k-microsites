import { useTranslation } from 'react-i18next';

const DISCO_BALL_IMAGE = 'https://klubit.fra1.cdn.digitaloceanspaces.com/icon-disco.png';

interface EmptyEventsStateProps {
    title?: string;
    description?: string;
    showHeader?: boolean;
    className?: string;
}

const EmptyEventsState = ({
    title,
    description,
    showHeader = true,
    className = '',
}: EmptyEventsStateProps) => {
    const { t } = useTranslation();

    const displayTitle = title || t('events.empty_title', 'No hay eventos próximos');
    const displayDescription = description || t('events.empty_description', 'Este klub no tiene eventos programados por ahora.');

    return (
        <div className={`flex flex-col gap-4 items-start w-full ${className}`}>
            {showHeader && (
                <div className="flex gap-2 items-center px-1.5 w-full">
                    <h2 className="text-[#ff336d] text-[24px] font-semibold leading-none whitespace-nowrap overflow-hidden text-ellipsis font-borna">
                        {t('events.upcoming', 'Próximos eventos')}
                    </h2>
                </div>
            )}

            <div className="flex flex-1 flex-col gap-8 items-center justify-center py-8 w-full min-h-[300px]">
                <div className="flex flex-col gap-6 items-center w-full">
                    <div className="flex items-center justify-center p-1 size-[90px]">
                        <img
                            src={DISCO_BALL_IMAGE}
                            alt="Disco ball"
                            className="w-[72px] h-[82px] object-contain"
                        />
                    </div>

                    <div className="flex flex-col gap-2 items-center px-4 w-full text-center">
                        <h3 className="text-[#f6f6f6] text-[24px] font-semibold leading-none font-borna">
                            {displayTitle}
                        </h3>
                        <p className="text-[#939393] text-[16px] font-medium leading-none font-helvetica">
                            {displayDescription}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmptyEventsState;
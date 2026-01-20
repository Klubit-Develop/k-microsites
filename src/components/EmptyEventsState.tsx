import { useTranslation } from 'react-i18next';

const DISCO_BALL_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/icon-disco.png';

interface EmptyEventsStateProps {
    title?: string;
    description?: string;
    className?: string;
}

const EmptyEventsState = ({
    title,
    description,
    className = '',
}: EmptyEventsStateProps) => {
    const { t } = useTranslation();

    const displayTitle = title || t('artist.no_events_title', 'No hay eventos próximos');
    const displayDescription = description || t('artist.no_events_description', 'Este artista no tiene eventos programados por ahora.');

    return (
        <div className={`flex flex-col gap-[32px] items-center justify-center py-[32px] w-full ${className}`}>
            <div className="flex flex-col gap-[24px] items-center w-full">
                <div className="flex items-center justify-center p-[4px] w-[90px] h-[90px]">
                    <div className="relative w-[74px] h-[82px]">
                        <img
                            src={DISCO_BALL_URL}
                            alt="Disco ball"
                            className="w-full h-full object-contain"
                            style={{ filter: 'drop-shadow(0px 0px 30px rgba(255, 255, 255, 0.25))' }}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-[8px] items-center px-[16px] text-center w-full">
                    <p className="text-[#f6f6f6] text-[24px] font-semibold leading-normal w-full font-borna">
                        {displayTitle}
                    </p>
                    <p className="text-[#939393] text-[16px] font-medium leading-normal w-full font-helvetica">
                        {displayDescription}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmptyEventsState;
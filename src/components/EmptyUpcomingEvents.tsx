import { useTranslation } from 'react-i18next';
import { TicketMenuIcon } from '@/components/icons';

interface EmptyUpcomingEventsProps {
    title?: string;
    description?: string;
    className?: string;
}

const EmptyUpcomingEvents = ({
    title,
    description,
    className = '',
}: EmptyUpcomingEventsProps) => {
    const { t } = useTranslation();

    const displayTitle = title || t('events.empty_title', 'No tienes próximos eventos');
    const displayDescription = description || t('events.empty_description', 'Descubre planes cerca de ti y organiza tu próxima salida.');

    return (
        <div className={`flex flex-col gap-[32px] items-center justify-center py-[32px] w-full ${className}`}>
            <div className="flex flex-col gap-[24px] items-center w-full">
                <div className="flex items-center justify-center p-[2px] size-[90px]">
                    <div
                        className="rotate-[-20deg]"
                        style={{ filter: 'drop-shadow(0px 0px 30px rgba(0, 0, 0, 1))' }}
                    >
                        <TicketMenuIcon width={80} height={50} color="#B0A890" />
                    </div>
                </div>

                <div className="flex flex-col gap-[8px] items-center px-[16px] text-center w-full">
                    <p className="text-[#f6f6f6] text-[24px] font-semibold leading-normal w-full font-borna">
                        {displayTitle}
                    </p>
                    <p className="text-[#939393] text-[16px] font-medium leading-[24px] w-full font-borna">
                        {displayDescription}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmptyUpcomingEvents;
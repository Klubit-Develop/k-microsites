import { useTranslation } from 'react-i18next';

interface Organizer {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    venueType: string;
}

interface OrganizerCardProps {
    organizer: Organizer;
    venueTypeLabel: string;
    isLoading?: boolean;
    onClick?: () => void;
    className?: string;
}

const OrganizerCard = ({
    organizer,
    venueTypeLabel,
    isLoading = false,
    onClick,
    className = '',
}: OrganizerCardProps) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[16px] w-full ${className}`}>
                <div className="flex items-center gap-[2px] px-[6px]">
                    <div className="h-7 w-28 bg-[#232323] rounded animate-pulse" />
                </div>
                <div className="flex gap-[12px] items-center p-[12px] bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] w-full animate-pulse">
                    <div className="w-[54px] h-[54px] shrink-0 rounded-full bg-[#323232]" />
                    <div className="flex flex-col flex-1 gap-2">
                        <div className="h-5 w-32 bg-[#232323] rounded" />
                        <div className="h-4 w-20 bg-[#232323] rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-[16px] w-full ${className}`}>
            <div className="flex items-center gap-[2px] px-[6px]">
                <h2 className="text-[#ff336d] text-[24px] font-semibold font-borna">
                    {t('event.organizer', 'Organizador')}
                </h2>
            </div>
            <div
                className={`flex gap-[12px] items-center p-[12px] bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] w-full ${onClick ? 'cursor-pointer' : ''}`}
                onClick={onClick}
            >
                <div className="relative w-[54px] h-[54px] shrink-0 flex items-center justify-center bg-[#323232] rounded-full border-[1.5px] border-[#232323] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    {organizer.logo ? (
                        <img
                            src={organizer.logo}
                            alt={organizer.name}
                            className="w-8 h-6 object-cover"
                        />
                    ) : (
                        <span className="text-[#f6f6f6] text-[14px] font-bold">
                            {organizer.name.charAt(0)}
                        </span>
                    )}
                </div>
                <div className="flex flex-col flex-1">
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                        {organizer.name}
                    </span>
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {venueTypeLabel}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OrganizerCard;
export type { Organizer };
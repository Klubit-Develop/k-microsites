import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EventDescriptionProps {
    title?: string;
    description: string;
    maxLength?: number;
    isLoading?: boolean;
    className?: string;
}

const EventDescription = ({
    title,
    description,
    maxLength = 150,
    isLoading = false,
    className = '',
}: EventDescriptionProps) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[12px] w-full animate-pulse ${className}`}>
                <div className="px-[6px]">
                    <div className="h-5 w-32 bg-[#232323] rounded" />
                </div>
                <div className="px-[6px] flex flex-col gap-2">
                    <div className="h-4 w-full bg-[#232323] rounded" />
                    <div className="h-4 w-full bg-[#232323] rounded" />
                    <div className="h-4 w-3/4 bg-[#232323] rounded" />
                </div>
            </div>
        );
    }

    if (!description) {
        return null;
    }

    const shouldTruncate = description.length > maxLength;
    const displayText = isExpanded ? description : `${description.slice(0, maxLength)}...`;

    return (
        <div className={`flex flex-col gap-[12px] w-full ${className}`}>
            {title && (
                <div className="px-[6px]">
                    <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica">
                        {title}
                    </span>
                </div>
            )}
            <div className="px-[6px]">
                {shouldTruncate ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-left"
                    >
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {displayText}
                        </span>
                        <span className="text-[#f6f6f6] text-[14px] font-bold font-helvetica ml-1">
                            {isExpanded
                                ? t('event.read_less', 'Leer menos')
                                : t('event.read_more', 'Leer más')
                            }
                        </span>
                    </button>
                ) : (
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {description}
                    </span>
                )}
            </div>
        </div>
    );
};

export default EventDescription;
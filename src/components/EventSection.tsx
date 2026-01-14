import type { ReactNode } from 'react';
import { ChevronRightIcon } from '@/components/icons';

interface EventSectionProps {
    title: string;
    children: ReactNode;
    onHeaderClick?: () => void;
    className?: string;
}

const EventSection = ({
    title,
    children,
    onHeaderClick,
    className = '',
}: EventSectionProps) => {
    return (
        <div className={`flex flex-col gap-4 items-start w-full ${className}`}>
            <div className="flex gap-0.5 items-center px-1.5 w-full">
                {onHeaderClick ? (
                    <button
                        onClick={onHeaderClick}
                        className="flex gap-2 items-center cursor-pointer"
                    >
                        <h2
                            className="text-[#ff336d] text-[24px] font-bold leading-normal whitespace-nowrap overflow-hidden text-ellipsis"
                            style={{ fontFamily: "'Borna', sans-serif" }}
                        >
                            {title}
                        </h2>
                        <div className="flex items-center pt-1">
                            <ChevronRightIcon />
                        </div>
                    </button>
                ) : (
                    <h2
                        className="text-[#ff336d] text-[24px] font-bold leading-normal whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ fontFamily: "'Borna', sans-serif" }}
                    >
                        {title}
                    </h2>
                )}
            </div>

            <div className="flex flex-col gap-2 w-full">
                {children}
            </div>
        </div>
    );
};

export default EventSection;
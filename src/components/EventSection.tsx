import type { ReactNode } from 'react';
import { ChevronRightIcon } from '@/components/icons';

interface EventSectionProps {
    title: string;
    children: ReactNode;
    onHeaderClick?: () => void;
    className?: string;
    isLoading?: boolean;
}

const EventSectionSkeleton = () => (
    <div className="flex flex-col gap-4 items-start w-full animate-pulse">
        <div className="flex gap-0.5 items-center px-1.5 w-full">
            <div className="h-6 w-32 bg-[#232323] rounded" />
        </div>
        <div className="flex flex-col gap-2 w-full">
            {[1, 2].map((i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl"
                >
                    <div className="w-[54px] h-[68px] shrink-0 bg-[#232323] rounded-sm" />
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="h-4 w-3/4 bg-[#232323] rounded" />
                        <div className="h-3.5 w-1/2 bg-[#232323] rounded" />
                        <div className="h-3.5 w-1/3 bg-[#232323] rounded" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const EventSection = ({
    title,
    children,
    onHeaderClick,
    className = '',
    isLoading = false,
}: EventSectionProps) => {
    if (isLoading) {
        return <EventSectionSkeleton />;
    }

    return (
        <div className={`flex flex-col gap-4 items-start w-full ${className}`}>
            <div className="flex gap-0.5 items-center px-1.5 w-full">
                {onHeaderClick ? (
                    <button
                        onClick={onHeaderClick}
                        className="flex gap-2 items-center cursor-pointer"
                    >
                        <h2 className="text-[#ff336d] text-[20px] font-semibold leading-normal whitespace-nowrap overflow-hidden text-ellipsis font-borna">
                            {title}
                        </h2>
                        <div className="flex items-center pt-0.5">
                            <ChevronRightIcon />
                        </div>
                    </button>
                ) : (
                    <h2 className="text-[#ff336d] text-[20px] font-semibold leading-normal whitespace-nowrap overflow-hidden text-ellipsis font-borna">
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

export { EventSectionSkeleton };
export default EventSection;
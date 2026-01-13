interface EventTagsProps {
    tags: string[];
    isLoading?: boolean;
    className?: string;
}

const EventTags = ({
    tags,
    isLoading = false,
    className = '',
}: EventTagsProps) => {
    if (isLoading) {
        return (
            <div className={`w-full overflow-hidden ${className}`}>
                <div className="flex gap-[8px] items-center justify-center w-full animate-pulse">
                    {[1, 2, 3, 4, 5].map((index) => (
                        <div
                            key={index}
                            className="h-9 w-20 bg-[#232323] rounded-[20px] shrink-0"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (tags.length === 0) {
        return null;
    }

    return (
        <div className={`w-full overflow-hidden ${className}`}>
            <div className="w-0 min-w-full flex gap-[8px] items-center justify-center md:justify-center overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {tags.map((tag, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-center h-[36px] px-[14px] border-[1.5px] border-[#232323] rounded-[20px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] shrink-0"
                    >
                        <span className="text-[#f6f6f6] text-[14px] font-normal font-helvetica whitespace-nowrap">
                            {tag}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventTags;
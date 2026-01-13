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
            <div className={`w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${className}`}>
                <div className="flex gap-[8px] animate-pulse">
                    {[1, 2, 3, 4, 5].map((index) => (
                        <div
                            key={index}
                            className="shrink-0 h-[36px] w-20 bg-[#232323] rounded-[20px]"
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
        <div className={`w-full mt-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${className}`}>
            <div className="flex gap-[8px] w-max">
                {tags.map((tag, index) => (
                    <div
                        key={index}
                        className="shrink-0 flex items-center justify-center h-[36px] px-3.5 border-[1.5px] border-[#232323] rounded-[20px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]"
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
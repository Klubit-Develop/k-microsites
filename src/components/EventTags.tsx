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
            <div className={`flex flex-wrap gap-[8px] items-center justify-center w-full mt-8 animate-pulse ${className}`}>
                {[1, 2, 3, 4, 5].map((index) => (
                    <div
                        key={index}
                        className="h-9 w-20 bg-[#232323] rounded-[20px]"
                    />
                ))}
            </div>
        );
    }

    if (tags.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-wrap gap-[8px] items-center justify-center w-full mt-2 ${className}`}>
            {tags.map((tag, index) => (
                <div
                    key={index}
                    className="flex items-center justify-center h-9 px-3.5 border-[1.5px] border-[#232323] rounded-[20px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]"
                >
                    <span className="text-[#f6f6f6] text-[14px] font-normal font-helvetica">
                        {tag}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default EventTags;
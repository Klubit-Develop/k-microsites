interface EventCardHzProps {
    title: string;
    date: string;
    time: string;
    location: string;
    imageUrl?: string;
    onClick?: () => void;
    className?: string;
}

const EventCardHz = ({
    title,
    date,
    time,
    location,
    imageUrl,
    onClick,
    className = '',
}: EventCardHzProps) => {
    return (
        <div
            onClick={onClick}
            className={`
                flex items-center gap-3 p-3
                bg-[#141414]
                border-2 border-[#232323]
                rounded-2xl
                shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]
                cursor-pointer
                transition-all duration-200
                hover:bg-[#1a1a1a]
                ${className}
            `}
        >
            {/* Event Image */}
            <div className="relative w-[54px] h-[68px] shrink-0 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 border-2 border-[#232323] rounded-sm overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-[#232323]" />
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Title */}
                <p className="text-[#f6f6f6] text-[16px] font-medium leading-normal truncate font-helvetica">
                    {title}
                </p>

                {/* Date & Time */}
                <div className="flex items-center gap-1">
                    <span className="text-[#e5ff88] text-[14px] font-normal leading-normal truncate font-helvetica">
                        {date}
                    </span>
                    <div className="w-[3px] h-[3px] rounded-full bg-[#e5ff88] shrink-0" />
                    <span className="text-[#e5ff88] text-[14px] font-normal leading-normal truncate font-helvetica">
                        {time}
                    </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 py-px">
                    <span className="text-[13px] leading-normal pt-0.5">📍</span>
                    <span className="flex-1 text-[#939393] text-[14px] font-normal leading-normal truncate font-helvetica">
                        {location}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EventCardHz;
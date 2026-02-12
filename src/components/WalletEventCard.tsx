interface WalletEventCardProps {
    title: string;
    date: string;
    time: string;
    location: string;
    imageUrl?: string;
    onClick?: () => void;
    variant?: 'upcoming' | 'past';
    className?: string;
}

const WalletEventCardSkeleton = () => (
    <div className="flex items-center gap-[12px] p-[12px] bg-[#141414] border-2 border-[#232323] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] animate-pulse">
        <div className="w-[50px] h-[62.5px] shrink-0 bg-[#232323] rounded-[4px]" />
        <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="h-4 w-3/4 bg-[#232323] rounded" />
            <div className="h-3.5 w-1/2 bg-[#232323] rounded" />
            <div className="h-3.5 w-1/3 bg-[#232323] rounded" />
        </div>
    </div>
);

const WalletEventCard = ({
    title,
    date,
    time,
    location,
    imageUrl,
    onClick,
    variant = 'upcoming',
    className = '',
}: WalletEventCardProps) => {
    const isPast = variant === 'past';
    const dateTimeColor = isPast ? 'text-[#939393]' : 'text-[#e5ff88]';
    const dotColor = isPast ? 'bg-[#939393]' : 'bg-[#e5ff88]';

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-[12px] p-[12px] bg-[#141414] border-2 border-[#232323] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] cursor-pointer transition-colors duration-200 hover:bg-[#1a1a1a] text-left w-full ${className}`}
        >
            <div className="relative w-[54px] h-[68px] shrink-0 shadow-[0px_0px_11px_0px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 border-2 border-[#232323] rounded-[4px] overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className={`w-full h-full object-cover ${isPast ? 'grayscale opacity-60' : ''}`}
                        />
                    ) : (
                        <div className="w-full h-full bg-[#232323]" />
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center min-w-0">
                <p className="text-[#f6f6f6] text-[16px] font-medium leading-[24px] truncate font-borna mb-0.3">
                    {title}
                </p>

                <div className="flex items-center gap-[4px]">
                    <span className={`${dateTimeColor} text-[14px] font-normal leading-[20px] truncate font-borna`}>
                        {date}
                    </span>
                    <div className={`w-[3px] h-[3px] rounded-full ${dotColor} shrink-0`} />
                    <span className={`${dateTimeColor} text-[14px] font-normal leading-[20px] truncate font-borna`}>
                        {time}
                    </span>
                </div>

                <div className="flex items-center gap-[6px] py-px">
                    <span className="text-[13px] leading-normal pt-[2px] shrink-0">📍</span>
                    <span className="text-[#939393] text-[14px] font-normal leading-[20px] truncate max-w-[210px] font-borna">
                        {location}
                    </span>
                </div>
            </div>
        </button>
    );
};

export { WalletEventCardSkeleton };
export default WalletEventCard;
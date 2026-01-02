import LikesPill from '@/components/LikesPill';

interface EventHeaderProps {
    name: string;
    flyer: string;
    date: string;
    time: string;
    address: string;
    likesCount: number;
    isLiked?: boolean;
    onLikeClick?: () => void;
    isLoading?: boolean;
    isLikesLoading?: boolean;
    canLike?: boolean;
    isLikeDisabled?: boolean;
    className?: string;
}

const EventHeader = ({
    name,
    flyer,
    date,
    time,
    address,
    likesCount,
    isLiked = false,
    onLikeClick,
    isLoading = false,
    isLikesLoading = false,
    canLike = false,
    isLikeDisabled = false,
    className = '',
}: EventHeaderProps) => {
    if (isLoading) {
        return (
            <div className={`flex flex-col items-center h-[555px] relative animate-pulse ${className}`}>
                <div className="relative w-full h-[504px]">
                    {/* Flyer skeleton */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-[402px] h-[504px] rounded-2xl bg-[#232323]" />

                    {/* Event Profile skeleton */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-[400px] w-[370px] flex flex-col gap-[16px] items-center justify-center rounded-[10px]">
                        {/* Likes pill skeleton */}
                        <div className="h-[42px] w-28 bg-[#232323] rounded-[25px]" />

                        {/* Content skeleton */}
                        <div className="flex flex-col gap-[8px] items-center justify-center w-full px-[24px] py-[4px]">
                            <div className="h-7 w-48 bg-[#232323] rounded" />
                            <div className="h-5 w-36 bg-[#232323] rounded" />
                            <div className="h-4 w-56 bg-[#232323] rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center h-[555px] relative ${className}`}>
            <div className="relative w-full h-[504px]">
                {/* Flyer */}
                <div className="absolute left-1/2 -translate-x-1/2 w-[402px] h-[504px] rounded-2xl overflow-hidden">
                    <img
                        src={flyer || '/placeholder-event.jpg'}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-linear-to-b from-transparent from-50% to-[#050505] rounded-2xl" />
                    {/* Blur overlay */}
                    <div className="absolute inset-0 bg-linear-to-b from-transparent to-[rgba(5,5,5,0.5)] backdrop-blur-[1.5px] rounded-2xl" />
                </div>

                {/* Event Profile */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[400px] w-[370px] flex flex-col gap-[16px] items-center justify-center rounded-[10px]">
                    <LikesPill
                        count={likesCount}
                        isLiked={isLiked}
                        onClick={onLikeClick}
                        isLoading={isLikesLoading}
                        disabled={!canLike || isLikeDisabled}
                    />

                    {/* Content */}
                    <div className="flex flex-col gap-[5px] items-center justify-center w-full px-[10px] py-[5px]">
                        <h1
                            className="text-[#f6f6f6] text-[24px] font-semibold text-center leading-normal"
                            style={{ fontFamily: "'Borna', sans-serif" }}
                        >
                            {name}
                        </h1>
                        {/* Date and time */}
                        <div className="flex gap-[6px] items-center justify-center w-full">
                            <span className="text-[#e5ff88] text-[16px] font-medium font-helvetica">
                                {date}
                            </span>
                            <div className="w-[3px] h-[3px] bg-[#e5ff88] rounded-full" />
                            <span className="text-[#e5ff88] text-[16px] font-medium font-helvetica">
                                {time}
                            </span>
                        </div>
                        {/* Location */}
                        <div className="flex gap-[8px] items-center py-px">
                            <div className="flex items-center justify-center w-[4px] pt-[2px]">
                                <span className="text-[#f6f6f6] text-[14px] font-medium font-helvetica">📍</span>
                            </div>
                            <span className="text-[#939393] text-[16px] font-medium font-helvetica">
                                {address}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventHeader;
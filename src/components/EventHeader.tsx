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
                    <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-[402px] h-full bg-[#232323] rounded-[16px]" />
                    <div className="absolute left-1/2 -translate-x-1/2 top-[400px] w-full max-w-[370px] flex flex-col gap-[16px] items-center justify-center rounded-[10px]">
                        <div className="h-[42px] w-28 bg-[#333] rounded-[25px]" />
                        <div className="flex flex-col gap-[2px] items-center justify-center w-full px-[24px] py-[4px]">
                            <div className="h-[24px] w-48 bg-[#333] rounded" />
                            <div className="h-[16px] w-36 bg-[#333] rounded mt-[6px]" />
                            <div className="h-[16px] w-56 bg-[#333] rounded mt-[2px]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center h-[555px] relative ${className}`}>
            <div className="relative w-full h-[504px]">
                <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-[402px] h-[504px] rounded-[16px] overflow-hidden">
                    <img
                        src={flyer || '/placeholder-event.jpg'}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-[#050505]" />
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 top-[400px] w-full max-w-[370px] flex flex-col gap-[16px] items-center justify-center rounded-[10px]">
                    <LikesPill
                        count={likesCount}
                        isLiked={isLiked}
                        onClick={onLikeClick}
                        isLoading={isLikesLoading}
                        disabled={!canLike || isLikeDisabled}
                    />

                    <div className="flex flex-col gap-[2px] items-center justify-center w-full px-[24px] py-[4px]">
                        <h1 className="text-[#f6f6f6] text-[24px] font-semibold text-center leading-normal font-borna w-full">
                            {name}
                        </h1>
                        <div className="flex gap-[6px] items-center justify-center w-full">
                            <span className="text-[#e5ff88] text-[16px] font-medium font-helvetica whitespace-nowrap overflow-hidden text-ellipsis">
                                {date}
                            </span>
                            <div className="w-[3px] h-[3px] bg-[#e5ff88] rounded-full shrink-0" />
                            <span className="text-[#e5ff88] text-[16px] font-medium font-helvetica whitespace-nowrap overflow-hidden text-ellipsis">
                                {time}
                            </span>
                        </div>
                        <div className="flex gap-[8px] items-center py-[1px]">
                            <div className="flex items-center justify-center w-[4px] pt-[2px]">
                                <span className="text-[#f6f6f6] text-[14px] font-medium font-helvetica">📍</span>
                            </div>
                            <span className="text-[#939393] text-[16px] font-medium font-helvetica whitespace-nowrap overflow-hidden text-ellipsis">
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
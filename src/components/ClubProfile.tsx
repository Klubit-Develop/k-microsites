import LikesPill from '@/components/LikesPill';

interface ClubProfileProps {
    name: string;
    type: string;
    operatingDays: string;
    operatingHours: string;
    logoUrl?: string;
    likesCount?: number;
    isLiked?: boolean;
    onLikeClick?: () => void;
    isLoading?: boolean;
    isLikesLoading?: boolean;
    canLike?: boolean;
    isLikeDisabled?: boolean;
    className?: string;
}

const ClubProfile = ({
    name,
    type,
    operatingDays,
    operatingHours,
    logoUrl,
    likesCount,
    isLiked = false,
    onLikeClick,
    isLoading = false,
    isLikesLoading = false,
    canLike = false,
    isLikeDisabled = false,
    className = '',
}: ClubProfileProps) => {
    if (isLoading) {
        return (
            <div className={`flex flex-col gap-4 items-center justify-center px-6 w-full max-w-[370px] animate-pulse ${className}`}>
                <div className="flex flex-col gap-2 items-center w-full">
                    <div className="w-[140px] h-[140px] rounded-full bg-[#232323]" />
                    <div className="flex flex-col items-center gap-2 py-1 w-full">
                        <div className="h-6 w-40 bg-[#232323] rounded" />
                        <div className="h-4 w-24 bg-[#232323] rounded" />
                        <div className="h-4 w-48 bg-[#232323] rounded" />
                    </div>
                </div>
                <div className="h-[42px] w-28 bg-[#232323] rounded-[25px]" />
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-4 items-center justify-center px-6 w-full max-w-[370px] ${className}`}>
            <div className="flex flex-col gap-2 items-center w-full">
                <div className="relative w-[140px] h-[140px] shrink-0 rounded-full shadow-[0px_0px_31px_0px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className={`absolute inset-0 rounded-full border-[3px] border-[#232323] ${!logoUrl ? 'bg-[#323232]' : ''}`} />
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt={`${name} logo`}
                            className="absolute inset-0 w-full h-full object-cover rounded-full border-[3px] border-[#232323]"
                        />
                    )}
                </div>

                <div className="flex flex-col items-center justify-center py-1 w-full">
                    <p className="font-bold text-2xl leading-normal text-center text-[#F6F6F6] font-helvetica">
                        {name}
                    </p>
                    <p className="text-sm leading-normal text-[#939393] truncate font-helvetica">
                        {type}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 w-full flex-wrap">
                        <span className="text-sm leading-normal text-[#E5FF88] truncate font-helvetica">
                            {operatingDays}
                        </span>
                        {operatingDays && operatingHours && (
                            <div className="w-[3px] h-[3px] rounded-full shrink-0 bg-[#E5FF88]" />
                        )}
                        <span className="text-sm leading-normal text-[#E5FF88] truncate font-helvetica">
                            {operatingHours}
                        </span>
                    </div>
                </div>
            </div>

            {likesCount !== undefined && (
                <LikesPill
                    count={likesCount}
                    isLiked={isLiked}
                    onClick={onLikeClick}
                    isLoading={isLikesLoading}
                    disabled={!canLike || isLikeDisabled}
                />
            )}
        </div>
    );
};

export default ClubProfile;
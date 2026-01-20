import LikesPill from '@/components/LikesPill';

interface ArtistProfileProps {
    artisticName: string;
    firstName: string;
    lastName: string;
    avatar: string;
    role?: string;
    likesCount?: number;
    isLiked?: boolean;
    onLikeClick?: () => void;
    isLoading?: boolean;
    isLikesLoading?: boolean;
    canLike?: boolean;
    isLikeDisabled?: boolean;
    className?: string;
}

const BADGE_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/badge-artist.png';

const ArtistProfile = ({
    artisticName,
    firstName,
    lastName,
    avatar,
    role = 'DJ',
    likesCount,
    isLiked = false,
    onLikeClick,
    isLoading = false,
    isLikesLoading = false,
    canLike = false,
    isLikeDisabled = false,
    className = '',
}: ArtistProfileProps) => {
    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[16px] items-center justify-center px-[24px] relative rounded-[10px] w-full animate-pulse ${className}`}>
                <div className="flex flex-col gap-[8px] items-center relative w-full">
                    <div className="relative shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] w-[140px] h-[140px]">
                        <div className="absolute inset-0 rounded-[80px] border-[3px] border-[#232323] bg-[#232323]" />
                    </div>
                    <div className="flex flex-col items-center justify-center py-[4px] w-full gap-2">
                        <div className="h-6 w-32 bg-[#232323] rounded" />
                        <div className="h-4 w-40 bg-[#232323] rounded" />
                    </div>
                </div>
                <div className="h-[42px] w-28 bg-[#232323] rounded-[25px]" />
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-[16px] items-center justify-center px-[24px] relative rounded-[10px] w-full ${className}`}>
            <div className="flex flex-col gap-[8px] items-center relative w-full">
                <div className="relative shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] w-[140px] h-[140px]">
                    <div className="absolute inset-0 rounded-[80px] border-[3px] border-[#232323] overflow-hidden">
                        <img
                            src={avatar || '/placeholder-avatar.jpg'}
                            alt={artisticName}
                            className="absolute inset-0 w-full h-full object-cover rounded-[80px]"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-[4px] w-full">
                    <p className="text-[#f6f6f6] text-[24px] font-semibold text-center leading-normal w-full font-borna">
                        {artisticName}
                    </p>
                    <div className="flex gap-[4px] items-center justify-center w-full">
                        <span className="text-[#939393] text-[14px] font-normal leading-normal font-helvetica truncate overflow-hidden">
                            {firstName} {lastName}
                        </span>
                        <div className="w-[3px] h-[3px] bg-[#939393] rounded-full shrink-0" />
                        <span className="text-[#939393] text-[14px] font-normal leading-normal font-helvetica whitespace-nowrap">
                            {role}
                        </span>
                    </div>
                </div>

                <div className="absolute flex gap-[10px] items-center justify-center left-1/2 -translate-x-1/2 top-0 w-[152px] px-[6px]">
                    <div className="flex-1 aspect-square rounded-[74.5px] border-[3px] border-[#5b6779]" />
                    <div className="absolute left-[107px] top-[8px] w-[30px] h-[28px]">
                        <img
                            src={BADGE_URL}
                            alt="Artist badge"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
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

export default ArtistProfile;
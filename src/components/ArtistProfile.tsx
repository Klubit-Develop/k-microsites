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
            <div className={`flex flex-col gap-[16px] items-center justify-center px-[24px] w-full animate-pulse ${className}`}>
                <div className="flex flex-col gap-[8px] items-center w-full">
                    <div className="w-[140px] h-[140px] rounded-full bg-[#232323] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]" />
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
        <div className={`flex flex-col gap-[16px] items-center justify-center px-[24px] w-full ${className}`}>
            <div className="flex flex-col gap-[8px] items-center w-full">
                <div className="relative w-[140px] h-[140px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 rounded-full border-[3px] border-[#232323] overflow-hidden">
                        <img
                            src={avatar || '/placeholder-avatar.jpg'}
                            alt={artisticName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute right-0 top-[8px]">
                        <img
                            src={BADGE_URL}
                            alt="Artist badge"
                            className="w-[30px] h-[28px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-[4px] w-full">
                    <h1
                        className="text-[#f6f6f6] text-[24px] font-semibold text-center w-full"
                        style={{ fontFamily: "'Borna', sans-serif" }}
                    >
                        {artisticName}
                    </h1>
                    <div className="flex gap-[4px] items-center justify-center w-full">
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica truncate">
                            {firstName} {lastName}
                        </span>
                        <div className="w-[3px] h-[3px] bg-[#939393] rounded-full shrink-0" />
                        <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                            {role}
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

export default ArtistProfile;
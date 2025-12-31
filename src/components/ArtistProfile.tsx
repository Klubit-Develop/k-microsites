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

const ArtistBadge = () => (
    <svg width="30" height="28" viewBox="0 0 30 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="badge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF336D" />
                <stop offset="100%" stopColor="#FF6B9D" />
            </linearGradient>
        </defs>
        <circle cx="15" cy="14" r="12" fill="url(#badge-gradient)" />
        <path d="M12 14L14 16L19 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

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
                    {/* Avatar skeleton */}
                    <div className="w-[140px] h-[140px] rounded-full bg-[#232323] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]" />
                    {/* Content skeleton */}
                    <div className="flex flex-col items-center justify-center py-[4px] w-full gap-2">
                        <div className="h-6 w-32 bg-[#232323] rounded" />
                        <div className="h-4 w-40 bg-[#232323] rounded" />
                    </div>
                </div>
                {/* LikesPill skeleton */}
                <div className="h-[42px] w-28 bg-[#232323] rounded-[25px]" />
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-[16px] items-center justify-center px-[24px] w-full ${className}`}>
            <div className="flex flex-col gap-[8px] items-center w-full">
                {/* Avatar with badge */}
                <div className="relative w-[140px] h-[140px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 rounded-full border-[3px] border-[#232323] overflow-hidden">
                        <img
                            src={avatar || '/placeholder-avatar.jpg'}
                            alt={artisticName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {/* Artist badge */}
                    <div className="absolute right-0 top-[8px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                        <ArtistBadge />
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col items-center justify-center py-[4px] w-full">
                    {/* Artistic name */}
                    <h1
                        className="text-[#f6f6f6] text-[24px] font-semibold text-center w-full"
                        style={{ fontFamily: "'Borna', sans-serif" }}
                    >
                        {artisticName}
                    </h1>
                    {/* Real name and role */}
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

            {/* Likes pill */}
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
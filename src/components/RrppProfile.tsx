interface RRPPProfileProps {
    firstName: string;
    lastName: string;
    username: string;
    avatar: string | null;
    isLoading?: boolean;
}

const RRPPBadge = () => (
    <svg width="30" height="28" viewBox="0 0 30 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="rrppBadgeGradient" x1="15" y1="0" x2="15" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6b7a8f" />
                <stop offset="50%" stopColor="#5b6779" />
                <stop offset="100%" stopColor="#4a5568" />
            </linearGradient>
        </defs>
        <path
            d="M15 0L28 7V21L15 28L2 21V7L15 0Z"
            fill="url(#rrppBadgeGradient)"
            stroke="#3d4852"
            strokeWidth="1"
        />
        <path
            d="M15 6L16.5 11.5H22L17.5 14.5L19 20L15 17L11 20L12.5 14.5L8 11.5H13.5L15 6Z"
            fill="#a0aec0"
            opacity="0.9"
        />
    </svg>
);

const InitialsAvatar = ({ firstName, lastName }: { firstName: string; lastName: string }) => {
    const firstInitial = firstName?.charAt(0) || '';
    const lastInitial = lastName?.charAt(0) || '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();

    return (
        <div className="w-full h-full rounded-full border-[3px] border-[#5b6779] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center">
            <span
                className="text-[#f6f6f6] text-[48px] font-semibold select-none"
                style={{ fontFamily: "'Borna', sans-serif" }}
            >
                {initials}
            </span>
        </div>
    );
};

const RrppProfile = ({
    firstName,
    lastName,
    username,
    avatar,
    isLoading = false,
}: RRPPProfileProps) => {
    const fullName = `${firstName} ${lastName}`;
    const hasAvatar = avatar && avatar.trim() !== '';

    if (isLoading) {
        return (
            <div className="flex flex-col gap-[8px] items-center justify-center px-[24px] py-0 rounded-[10px] w-full">
                {/* Avatar skeleton */}
                <div className="relative px-[6px]">
                    <div className="w-[140px] h-[140px] rounded-full bg-[#232323] animate-pulse border-[3px] border-[#232323]" />
                </div>
                {/* Content skeleton */}
                <div className="flex flex-col items-center justify-center py-[4px] w-full gap-2">
                    <div className="h-6 w-40 bg-[#232323] rounded animate-pulse" />
                    <div className="h-4 w-32 bg-[#232323] rounded animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[8px] items-center justify-center px-[24px] py-0 rounded-[10px] w-full">
            {/* Avatar with RRPP badge */}
            <div className="relative px-[6px] w-[152px]">
                <div className="relative w-[140px] h-[140px] mx-auto">
                    {hasAvatar ? (
                        <img
                            src={avatar}
                            alt={fullName}
                            className="w-full h-full object-cover rounded-full border-[3px] border-[#5b6779] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] opacity-90"
                        />
                    ) : (
                        <InitialsAvatar firstName={firstName} lastName={lastName} />
                    )}
                </div>
                {/* RRPP Badge - positioned top right */}
                <div className="absolute right-[15px] top-[8px] w-[30px] h-[28px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
                    <RRPPBadge />
                </div>
            </div>

            {/* Name and username */}
            <div className="flex flex-col items-center justify-center py-[4px] w-full">
                <h1
                    className="text-[#f6f6f6] text-[24px] font-semibold text-center w-full leading-normal"
                    style={{ fontFamily: "'Borna', sans-serif" }}
                >
                    {fullName}
                </h1>
                <div className="flex gap-[4px] items-center justify-center w-full">
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica truncate">
                        {username}
                    </span>
                    <div className="w-[3px] h-[3px] bg-[#939393] rounded-full shrink-0" />
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        RRPP
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RrppProfile;
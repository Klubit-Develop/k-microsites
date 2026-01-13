interface RRPPProfileProps {
    firstName: string;
    lastName: string;
    username: string;
    avatar: string | null;
    isLoading?: boolean;
}

const BADGE_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/badge-rrpp.png';

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
                <div className="relative px-[6px]">
                    <div className="w-[140px] h-[140px] rounded-full bg-[#232323] animate-pulse border-[3px] border-[#232323]" />
                </div>
                <div className="flex flex-col items-center justify-center py-[4px] w-full gap-2">
                    <div className="h-6 w-40 bg-[#232323] rounded animate-pulse" />
                    <div className="h-4 w-32 bg-[#232323] rounded animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[8px] items-center justify-center px-[24px] py-0 rounded-[10px] w-full">
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
                <div className="absolute right-[15px] top-[8px]">
                    <img
                        src={BADGE_URL}
                        alt="RRPP badge"
                        className="w-[30px] h-[28px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]"
                    />
                </div>
            </div>

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
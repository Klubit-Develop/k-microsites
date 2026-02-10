interface RRPPProfileProps {
    firstName: string;
    lastName: string;
    username: string;
    avatar: string | null;
    isLoading?: boolean;
    className?: string;
}

const BADGE_URL = 'https://klubit.fra1.cdn.digitaloceanspaces.com/badge-rrpp.png';

const InitialsAvatar = ({ firstName, lastName }: { firstName: string; lastName: string }) => {
    const firstInitial = firstName?.charAt(0) || '';
    const lastInitial = lastName?.charAt(0) || '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();

    return (
        <div className="w-full h-full rounded-[74.5px] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center">
            <span className="text-[#f6f6f6] text-[48px] font-semibold select-none font-borna">
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
    className = '',
}: RRPPProfileProps) => {
    const fullName = `${firstName} ${lastName}`;
    const hasAvatar = avatar && avatar.trim() !== '';

    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[8px] items-center justify-center px-[24px] relative rounded-[10px] w-full animate-pulse ${className}`}>
                <div className="flex items-center px-[6px]">
                    <div className="w-[140px] h-[140px] rounded-[74.5px] bg-[#232323] border-[3px] border-[#232323] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]" />
                </div>
                <div className="flex flex-col items-center justify-center py-[4px] w-full gap-2">
                    <div className="h-6 w-40 bg-[#232323] rounded" />
                    <div className="h-4 w-32 bg-[#232323] rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-[8px] items-center justify-center px-[24px] relative rounded-[10px] w-full ${className}`}>
            <div className="flex items-center px-[6px]">
                <div className="relative rounded-[74.5px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] w-[140px] h-[140px] border-[3px] border-[#232323] overflow-hidden">
                    {hasAvatar ? (
                        <img
                            src={avatar}
                            alt={fullName}
                            className="absolute inset-0 w-full h-full object-cover opacity-90 rounded-[74.5px]"
                        />
                    ) : (
                        <InitialsAvatar firstName={firstName} lastName={lastName} />
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-[4px] w-full">
                <p className="text-[#f6f6f6] text-[24px] font-semibold text-center leading-normal w-full font-borna">
                    {fullName}
                </p>
                <div className="flex gap-[4px] items-center justify-center w-full">
                    <span className="text-[#939393] text-[14px] font-normal leading-normal font-helvetica truncate overflow-hidden">
                        {username}
                    </span>
                    <div className="w-[3px] h-[3px] bg-[#939393] rounded-full shrink-0" />
                    <span className="text-[#939393] text-[14px] font-normal leading-normal font-helvetica whitespace-nowrap">
                        RRPP
                    </span>
                </div>
            </div>

            <div className="absolute flex gap-[10px] items-center justify-center left-1/2 -translate-x-1/2 top-0 w-[152px] px-[6px]">
                <div className="flex-1 aspect-square rounded-[74.5px] border-[4px] border-[#5b6779]" />
                <div className="absolute right-[15px] top-[8px] w-[30px] h-[28px]">
                    <img
                        src={BADGE_URL}
                        alt="RRPP badge"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>
            </div>
        </div>
    );
};

export default RrppProfile;
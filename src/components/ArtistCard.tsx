import { useNavigate } from '@tanstack/react-router';

interface Artist {
    id: string;
    artisticName: string;
    firstName: string;
    lastName: string;
    avatar: string;
    slug?: string;
    role?: string;
}

interface ArtistCardProps {
    artist: Artist;
    isLoading?: boolean;
    onClick?: () => void;
    className?: string;
}

const ArtistCard = ({
    artist,
    isLoading = false,
    onClick,
    className = '',
}: ArtistCardProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (artist.slug) {
            navigate({ to: `/artist/${artist.slug}` });
        }
    };

    if (isLoading) {
        return (
            <div className={`flex gap-[12px] items-center p-[12px] bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] w-full animate-pulse ${className}`}>
                <div className="w-[54px] h-[54px] shrink-0 rounded-full bg-[#232323]" />
                <div className="flex flex-col flex-1 gap-2">
                    <div className="h-5 w-32 bg-[#232323] rounded" />
                    <div className="h-4 w-24 bg-[#232323] rounded" />
                </div>
            </div>
        );
    }

    const isClickable = !!onClick || !!artist.slug;

    return (
        <div
            onClick={isClickable ? handleClick : undefined}
            className={`
                flex gap-[12px] items-center p-[12px] bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)] w-full
                ${isClickable ? 'cursor-pointer transition-colors hover:bg-[#1a1a1a]' : ''}
                ${className}
            `}
        >
            <div className="relative w-[54px] h-[54px] shrink-0">
                <img
                    src={artist.avatar || '/placeholder-avatar.jpg'}
                    alt={artist.artisticName}
                    className="w-full h-full object-cover rounded-full border-4 border-[#5b6779] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]"
                />
            </div>
            <div className="flex flex-col flex-1">
                <span className="text-[#f6f6f6] text-[16px] font-medium font-helvetica truncate">
                    {artist.artisticName}
                </span>
                <div className="flex gap-[4px] items-center">
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {artist.firstName} {artist.lastName}
                    </span>
                    <div className="w-[3px] h-[3px] bg-[#939393] rounded-full" />
                    <span className="text-[#939393] text-[14px] font-normal font-helvetica">
                        {artist.role || 'DJ'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ArtistCard;
export type { Artist };